import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";
import { forgotPasswordByEmailLimiter, forgotPasswordByIpLimiter } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";

export const runtime = "edge";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// SHA-256 hex digest using Web Crypto (edge-compatible)
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 32 random bytes as base64url (edge-compatible, no padding)
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

const OK = NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const meta = getRequestMeta(req);

  // --- Rate limit by IP first (cheapest check) ---
  const { success: ipOk } = await forgotPasswordByIpLimiter.limit(meta.ipAddress);
  if (!ipOk) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  // --- Validate body ---
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = parsed.email.toLowerCase().trim();

  // --- Rate limit by email ---
  const { success: emailOk } = await forgotPasswordByEmailLimiter.limit(email);
  if (!emailOk) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  // Always do the hash work regardless of user existence to prevent timing attacks
  const dummyToken = generateToken();
  await sha256Hex(dummyToken);

  // --- Lookup user ---
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, display_name")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    // No account — return success anyway (don't reveal account existence)
    return OK;
  }

  // --- Generate and store token ---
  const rawToken = generateToken();
  const hashedToken = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await supabase
    .from("users")
    .update({
      password_reset_token: hashedToken,
      password_reset_expires_at: expiresAt,
    })
    .eq("id", user.id);

  // --- Send email ---
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  const { subject, html, text } = passwordResetEmail({
    resetUrl,
    firstName: user.display_name ?? undefined,
  });

  await sendEmail({ to: user.email, subject, html, text });

  return OK;
}
