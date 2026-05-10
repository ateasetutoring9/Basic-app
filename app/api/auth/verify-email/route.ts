import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { hashToken } from "@/lib/auth/tokens";
import { verifyEmailLimiter } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";

export const runtime = "edge";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: Request) {
  const meta = getRequestMeta(req);

  // Rate limit by IP — loose, this is low-risk
  try {
    const { success } = await verifyEmailLimiter.limit(meta.ipAddress);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try again shortly." },
        { status: 429 }
      );
    }
  } catch {
    // Redis unavailable — allow through
    console.warn("[verify-email] rate limiter unavailable");
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0].message, code: "invalid_token" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "Invalid request", code: "invalid_token" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const hashedToken = await hashToken(parsed.token);
  const now = new Date().toISOString();

  const { data: user } = await supabase
    .from("users")
    .select("id, email_verified_at")
    .eq("email_verification_token", hashedToken)
    .gt("email_verification_expires_at", now)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    // Special case: check if the current session user is already verified —
    // they may have clicked an old link after verifying via a different one.
    try {
      const sessionToken = (await cookies()).get(COOKIE_NAME)?.value;
      if (sessionToken) {
        const session = await verifyToken(sessionToken);
        if (session) {
          const { data: sessionUser } = await supabase
            .from("users")
            .select("email_verified_at")
            .eq("id", session.userId)
            .is("deleted_at", null)
            .maybeSingle();
          if (sessionUser?.email_verified_at) {
            return NextResponse.json({ ok: true, alreadyVerified: true });
          }
        }
      }
    } catch {
      // Session check failed — fall through to standard error
    }

    return NextResponse.json(
      { ok: false, error: "Invalid or expired link", code: "invalid_token" },
      { status: 400 }
    );
  }

  if (user.email_verified_at) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await supabase
    .from("users")
    .update({
      email_verified_at: now,
      email_verification_token: null,
      email_verification_expires_at: null,
    })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
