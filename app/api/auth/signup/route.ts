import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";

export const runtime = 'edge';

export async function POST(req: Request) {
  let email: string, password: string;

  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Check for existing account
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (lookupError) {
    console.error("[signup] DB lookup error:", lookupError.message, lookupError.details);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error: insertError } = await supabase
    .from("users")
    .insert({ email, password_hash })
    .select("id, sync_id, email, is_admin")
    .single();

  if (insertError || !user) {
    console.error("[signup] DB insert error:", insertError?.message, insertError?.details);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

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
  }, { status: 201 });

  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
