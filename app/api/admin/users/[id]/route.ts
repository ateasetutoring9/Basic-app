import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requirePermission } from "@/lib/auth/permissions";
import { ForbiddenError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

export const runtime = 'edge';

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "read", "admin_dashboard");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = createServerClient();

  const patch: UserUpdate = {};
  if (typeof body.email === "string") patch.email = body.email;
  if (body.display_name !== undefined) patch.display_name = (body.display_name as string) || null;

  if (typeof body.password === "string") {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    patch.password_hash = bcrypt.hashSync(body.password, 12);
  }

  // Role assignment — diff current user_roles against the requested role
  const roleSyncId = body.role_sync_id as string | undefined;
  if (roleSyncId !== undefined) {
    // Assigning roles requires the assign permission on the role resource
    try {
      await requirePermission(auth, "assign", "role");
    } catch (err) {
      if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      throw err;
    }

    let targetRoleId: number | null = null;
    let roleIsAdmin = false;

    if (roleSyncId !== "") {
      const { data: role } = await supabase
        .from("roles")
        .select("id, name")
        .eq("sync_id", roleSyncId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      targetRoleId = role.id;
      roleIsAdmin = role.name === "admin";
    }

    // Fetch all current active assignments for this user
    const { data: currentAssignments } = await supabase
      .from("user_roles")
      .select("id, role_id")
      .eq("user_id", id)
      .is("deleted_at", null);

    const currentRoleIds = new Set((currentAssignments ?? []).map((a) => a.role_id));

    // Soft-delete assignments that should no longer be active
    for (const assignment of currentAssignments ?? []) {
      if (targetRoleId === null || assignment.role_id !== targetRoleId) {
        await supabase
          .from("user_roles")
          .update({ deleted_at: new Date().toISOString(), deleted_by_id: auth.userId })
          .eq("id", assignment.id);
      }
    }

    // Insert a new assignment if the target role is not already active
    if (targetRoleId !== null && !currentRoleIds.has(targetRoleId)) {
      await supabase
        .from("user_roles")
        .insert({ user_id: id, role_id: targetRoleId, created_by_id: auth.userId });
    }

    // SYNC: users.is_admin mirrors whether the user has the admin role.
    // This sync exists during the RBAC transition (phase 3) so existing
    // is_admin-gated routes continue to work for users granted admin via
    // the new role system. Remove when phase 4 retires the is_admin column.
    patch.is_admin = roleIsAdmin;
  }

  // Guard against no-op requests when no role change and no field change
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id, sync_id, email, display_name, is_admin, created_at, email_verified_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;
  try {
    await requirePermission(auth, "read", "admin_dashboard");
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  if (auth.userId === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 403 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
