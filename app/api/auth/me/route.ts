import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth/jwt";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  // Re-fetch is_admin from DB so changes take effect without requiring re-login
  const supabase = createServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", payload.userId)
    .is("deleted_at", null)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const isAdmin = user.is_admin;

  const res = NextResponse.json({
    id: payload.userId,
    syncId: payload.syncId,
    email: payload.email,
    isAdmin,
  });

  // Re-issue the cookie if is_admin has changed so the JWT stays in sync
  if (isAdmin !== payload.isAdmin) {
    const refreshed = await signToken({ ...payload, isAdmin });
    res.cookies.set(COOKIE_NAME, refreshed, COOKIE_OPTIONS);
  }

  return res;
}
