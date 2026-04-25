import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, sync_id, email, password_hash, is_admin, locked_until, failed_login_attempts")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  // Use a constant-time comparison even when user is not found
  const hashToCompare = user?.password_hash ?? "$2b$12$invalidhashusedtopreventinenumerationattacks";
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !valid) {
    // Increment failed attempts if user exists
    if (user) {
      await supabase
        .from("users")
        .update({ failed_login_attempts: (user.failed_login_attempts ?? 0) + 1 })
        .eq("id", user.id);
    }
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return NextResponse.json({ error: "Account is temporarily locked. Try again later." }, { status: 403 });
  }

  // Reset failed attempts on successful login
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
    id: user.id,
    syncId: user.sync_id,
    email: user.email,
    isAdmin: user.is_admin,
  });

  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
