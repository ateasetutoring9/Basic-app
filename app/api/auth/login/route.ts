import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";
import { logLoginAttempt } from "@/lib/auth/log-login-attempt";
import { getRequestMeta } from "@/lib/request-meta";

export const runtime = 'edge';

export async function POST(req: Request) {
  const meta = getRequestMeta(req);

  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase().trim();
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, sync_id, email, password_hash, is_admin, locked_until, failed_login_attempts")
    .eq("email", normalizedEmail)
    .is("deleted_at", null)
    .maybeSingle();

  // Constant-time comparison even when user is not found (prevents timing-based enumeration)
  const hashToCompare = user?.password_hash ?? "$2b$12$invalidhashusedtopreventinenumerationattacks";
  const valid = bcrypt.compareSync(password, hashToCompare);

  // Path: user not found
  if (!user) {
    void logLoginAttempt({
      emailAttempted: normalizedEmail,
      outcome: "user_not_found",
      userId: null,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Path: wrong password
  if (!valid) {
    await supabase
      .from("users")
      .update({ failed_login_attempts: (user.failed_login_attempts ?? 0) + 1 })
      .eq("id", user.id);
    void logLoginAttempt({
      emailAttempted: normalizedEmail,
      outcome: "wrong_password",
      userId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Path: account locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    void logLoginAttempt({
      emailAttempted: normalizedEmail,
      outcome: "account_locked",
      userId: user.id,
      failureDetail: `Locked until ${user.locked_until}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    return NextResponse.json({ error: "Account is temporarily locked. Try again later." }, { status: 403 });
  }

  // Path: success
  await supabase
    .from("users")
    .update({ failed_login_attempts: 0 })
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
}
