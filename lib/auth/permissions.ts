import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/errors";
import type { SessionPayload } from "@/lib/auth/jwt";
import type { Action, Resource, Permission, PermissionFlags } from "./permissions.types";

/**
 * Load all active permissions for a user via three sequential indexed queries.
 * Wrapped in React.cache for per-request deduplication — every userCan() call
 * in the same request hits the DB exactly once regardless of how many checks run.
 */
export const getUserPermissions = cache(
  async (userId: number): Promise<Permission[]> => {
    const supabase = createServerClient();

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (!userRoles?.length) return [];

    const roleIds = userRoles.map((r) => r.role_id);

    const { data: rolePerms } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .in("role_id", roleIds)
      .is("deleted_at", null);

    if (!rolePerms?.length) return [];

    const permissionIds = [...new Set(rolePerms.map((rp) => rp.permission_id))];

    const { data: permissions } = await supabase
      .from("permissions")
      .select("resource, action")
      .in("id", permissionIds)
      .is("deleted_at", null);

    return (permissions ?? []) as Permission[];
  }
);

export async function userCan(
  user: SessionPayload,
  action: Action,
  resource: Resource
): Promise<boolean> {
  const permissions = await getUserPermissions(user.userId);
  return permissions.some((p) => p.resource === resource && p.action === action);
}

export async function requirePermission(
  user: SessionPayload,
  action: Action,
  resource: Resource
): Promise<void> {
  const allowed = await userCan(user, action, resource);
  if (!allowed) {
    throw new ForbiddenError(`Missing permission: ${action} on ${resource}`);
  }
}

type Ownable = {
  user_id?: number | null;
  created_by_id?: number | null;
};

/**
 * Checks permission first, then verifies the caller owns the resource.
 * Admins bypass the ownership check — they can act on any resource they
 * have permission for. This bypass will be removed in Phase 4 when is_admin
 * is retired.
 *
 * Ownership is resolved by looking for user_id then falling back to
 * created_by_id. Resources that use a non-standard owner field must use
 * requirePermission() directly and handle ownership in the route.
 */
export async function requirePermissionAndOwnership(
  user: SessionPayload,
  action: Action,
  resource: Resource,
  resourceData: Ownable
): Promise<void> {
  await requirePermission(user, action, resource);

  if (user.isAdmin) return;

  const ownerId = resourceData.user_id ?? resourceData.created_by_id;
  if (ownerId == null) {
    throw new ForbiddenError(`Cannot determine ownership of ${resource}`);
  }
  if (ownerId !== user.userId) {
    throw new ForbiddenError(`Not owner of ${resource}`);
  }
}

export async function computePermissionFlags(
  user: SessionPayload
): Promise<PermissionFlags> {
  const [canAccessAdmin, canCreateContent, canModerateComments, canManageRoles] =
    await Promise.all([
      userCan(user, "read", "admin_dashboard"),
      userCan(user, "create", "topic"),
      userCan(user, "moderate", "comment"),
      userCan(user, "assign", "role"),
    ]);

  return { canAccessAdmin, canCreateContent, canModerateComments, canManageRoles };
}
