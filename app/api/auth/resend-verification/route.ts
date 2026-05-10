import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { generateToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { emailVerificationEmail } from "@/lib/email/templates/email-verification";
import { resendVerificationLimiter } from "@/lib/rate-limit";
import {
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MINUTES,
} from "@/lib/auth/policy";

export const runtime = "edge";

export async function POST() {
  // Require a valid session
  const sessionToken = (await cookies()).get(COOKIE_NAME)?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit per user (keyed by sync_id — abuse vector is the user, not the IP)
  try {
    const { success } = await resendVerificationLimiter.limit(session.syncId);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }
  } catch {
    console.warn("[resend-verification] rate limiter unavailable");
  }

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, display_name, email_verified_at, email_verification_sent_at")
    .eq("id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  if (user.email_verified_at) {
    return NextResponse.json({ ok: true, message: "Already verified" });
  }

  // Enforce server-side cooldown
  if (user.email_verification_sent_at) {
    const cooldownMs = EMAIL_VERIFICATION_RESEND_COOLDOWN_MINUTES * 60 * 1000;
    const sentAt = new Date(user.email_verification_sent_at).getTime();
    const elapsed = Date.now() - sentAt;
    if (elapsed < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return NextResponse.json(
        {
          ok: false,
          error: "Please wait a few minutes before requesting another email.",
          retryAfterSeconds,
        },
        { status: 429 }
      );
    }
  }

  const { raw, hash } = await generateToken();
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("users")
    .update({
      email_verification_token: hash,
      email_verification_expires_at: expiresAt,
      email_verification_sent_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const verifyUrl = `${appUrl}/verify-email?token=${raw}`;
  const { subject, html, text } = emailVerificationEmail({
    verifyUrl,
    firstName: user.display_name ?? undefined,
  });

  void sendEmail({ to: user.email, subject, html, text });

  return NextResponse.json({ ok: true });
}
