import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { resetPasswordLimiter } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";

export const runtime = "edge";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const meta = getRequestMeta(req);

  const { success: ipOk } = await resetPasswordLimiter.limit(meta.ipAddress);
  if (!ipOk) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const hashedToken = await sha256Hex(parsed.token);
  const now = new Date().toISOString();

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("password_reset_token", hashedToken)
    .gt("password_reset_expires_at", now)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync(parsed.newPassword, 12);

  // Clear lockout state alongside the password update — the user has proven
  // they own the email address, so any lockout from failed attempts is lifted.
  await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires_at: null,
      password_changed_at: now,
      failed_login_attempts: 0,
      locked_until: null,
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
