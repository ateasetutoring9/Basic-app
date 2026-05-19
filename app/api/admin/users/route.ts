import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";

export const runtime = 'edge';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "read", "admin_dashboard");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const supabase = createServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, sync_id, email, display_name, is_admin, created_at, email_verified_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!users?.length) return NextResponse.json([]);

  // Fetch active role assignments for all users in a single query, then merge
  const userIds = users.map((u) => u.id);
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("user_id, roles(sync_id, name, display_name)")
    .in("user_id", userIds)
    .is("deleted_at", null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roleByUserId = new Map<number, { sync_id: string; name: string; display_name: string }>();
  for (const ur of userRoles ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = Array.isArray((ur as any).roles) ? (ur as any).roles[0] : (ur as any).roles;
    if (role && !roleByUserId.has(ur.user_id)) {
      roleByUserId.set(ur.user_id, {
        sync_id: role.sync_id,
        name: role.name,
        display_name: role.display_name,
      });
    }
  }

  const result = users.map((u) => ({ ...u, role: roleByUserId.get(u.id) ?? null }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "create", "user");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  let email: string, password: string, role_sync_id: string | undefined, display_name: string | null;
  try {
    ({ email, password, role_sync_id, display_name = null } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Resolve role if provided
  let roleId: number | null = null;
  let isAdmin = false;
  if (role_sync_id) {
    const { data: role } = await supabase
      .from("roles")
      .select("id, name")
      .eq("sync_id", role_sync_id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    roleId = role.id;
    isAdmin = role.name === "admin";
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const password_hash = bcrypt.hashSync(password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash, is_admin: isAdmin, display_name: display_name || null })
    .select("id, sync_id, email, display_name, is_admin, created_at, email_verified_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Assign role if provided
  if (roleId !== null && data) {
    await supabase
      .from("user_roles")
      .insert({ user_id: data.id, role_id: roleId, created_by_id: auth.userId });
  }

  return NextResponse.json({ ...data, role: roleId ? { sync_id: role_sync_id } : null }, { status: 201 });
}
