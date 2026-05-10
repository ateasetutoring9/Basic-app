import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";
import { logLoginAttempt } from "@/lib/auth/log-login-attempt";
import { getRequestMeta } from "@/lib/request-meta";
import { loginLimiter } from "@/lib/rate-limit";
import {
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  FAILED_ATTEMPT_RESET_WINDOW_HOURS,
} from "@/lib/auth/policy";

export const runtime = "edge";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// SECURITY: do not remove — equalises timing between found/not-found user paths
// to prevent account enumeration via response time differences.
const DUMMY_BCRYPT_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8sLeJxPKa5R8F7qzFS2";

export async function POST(req: Request) {
  const meta = getRequestMeta(req);
  const supabase = createServerClient();

  try {
    // 1. Parse and validate body
    let rawEmail = "";
    let parsed: z.infer<typeof schema>;
    try {
      const body = await req.json();
      rawEmail =
        typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
      parsed = schema.parse(body);
    } catch {
      void logLoginAttempt({
        emailAttempted: rawEmail,
        outcome: "error",
        failureDetail: "invalid_request_body",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return NextResponse.json(
        { ok: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    const normalizedEmail = parsed.email.toLowerCase().trim();

    // 2. Rate limit by IP
    const { success: ipOk } = await loginLimiter.limit(meta.ipAddress);
    if (!ipOk) {
      void logLoginAttempt({
        emailAttempted: normalizedEmail,
        outcome: "rate_limited",
        userId: null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }

    // 3. Look up user
    const { data: user } = await supabase
      .from("users")
      .select(
        "id, sync_id, email, password_hash, is_admin, failed_login_attempts, locked_until, email_verified_at"
      )
      .eq("email", normalizedEmail)
      .is("deleted_at", null)
      .maybeSingle();

    // 4. User not found — run dummy bcrypt to equalise response timing
    if (!user) {
      await bcrypt.compare(parsed.password, DUMMY_BCRYPT_HASH);
      void logLoginAttempt({
        emailAttempted: normalizedEmail,
        outcome: "user_not_found",
        userId: null,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 5. Lockout check — must happen BEFORE password comparison so a locked
    //    account's wrong-password attempts don't further increment the counter.
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      void logLoginAttempt({
        emailAttempted: normalizedEmail,
        outcome: "account_locked",
        userId: user.id,
        failureDetail: `Locked until ${user.locked_until}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      // Return the same message as wrong password — do not reveal lockout status,
      // which would let an attacker enumerate locked vs unlocked accounts.
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 6. Email verification
    // TODO: un-gate this branch when email verification ships
    // if (!user.email_verified_at) {
    //   void logLoginAttempt({ emailAttempted: normalizedEmail, outcome: "email_not_verified", userId: user.id, ipAddress: meta.ipAddress, userAgent: meta.userAgent });
    //   return NextResponse.json({ ok: false, error: "Please verify your email before signing in." }, { status: 403 });
    // }

    // 7. Password comparison
    const valid = await bcrypt.compare(parsed.password, user.password_hash);

    if (!valid) {
      // Determine the current effective failed-attempt count.
      // If the last failure was outside the reset window, treat counter as 0 —
      // otherwise a user who failed 4 times last month could be locked out by
      // a single mistake today.
      const resetWindowMs = FAILED_ATTEMPT_RESET_WINDOW_HOURS * 60 * 60 * 1000;
      const { data: lastFailure } = await supabase
        .from("login_attempts")
        .select("attempted_at")
        .eq("user_id", user.id)
        .in("outcome", ["wrong_password", "account_locked"])
        .is("deleted_at", null)
        .order("attempted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const withinWindow =
        !!lastFailure &&
        Date.now() - new Date(lastFailure.attempted_at).getTime() <= resetWindowMs;

      const effectiveFailed = withinWindow ? (user.failed_login_attempts ?? 0) : 0;
      const newFailed = effectiveFailed + 1;

      // TODO: wrap in transaction for stricter concurrency — two simultaneous
      // wrong-password requests can both read failed_login_attempts=4 and both
      // write 5 instead of one writing 5 and one writing 6. Acceptable at MVP.
      //
      // Do NOT reset failed_login_attempts when setting locked_until. Leaving it
      // means the next attempt after lockout expires triggers another lockout
      // immediately rather than giving a fresh 5-attempt window.
      if (newFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
        const lockUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
        ).toISOString();
        await supabase
          .from("users")
          .update({ failed_login_attempts: newFailed, locked_until: lockUntil })
          .eq("id", user.id);
      } else {
        await supabase
          .from("users")
          .update({ failed_login_attempts: newFailed })
          .eq("id", user.id);
      }

      void logLoginAttempt({
        emailAttempted: normalizedEmail,
        outcome: "wrong_password",
        userId: user.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 8. Success — reset all lockout state
    await supabase
      .from("users")
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq("id", user.id);

    const token = await signToken({
      userId: user.id,
      syncId: user.sync_id,
      email: user.email,
      isAdmin: user.is_admin,
    });

    const res = NextResponse.json({
      syncId: user.sync_id,
      email: user.email,
      isAdmin: user.is_admin,
    });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    void logLoginAttempt({
      emailAttempted: normalizedEmail,
      outcome: "success",
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return res;
  } catch (err) {
    Sentry.captureException(err);
    void logLoginAttempt({
      emailAttempted: "",
      outcome: "error",
      failureDetail:
        err instanceof Error ? err.message.slice(0, 200) : "unknown",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
