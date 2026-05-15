# RBAC Permission Helpers

Server-only utilities for enforcing role-based access control. These helpers
are never imported into client bundles.

## Overview

Permissions are stored in four DB tables: `roles`, `user_roles`, `permissions`,
`role_permissions`. Each user is assigned one or more roles; each role grants a
set of `(resource, action)` pairs. The helpers in `lib/auth/permissions.ts`
load those pairs and evaluate them against the current request.

## Core helpers

### `getUserPermissions(userId)`

Loads all active `(resource, action)` pairs for a user via three indexed DB
queries. Wrapped in `React.cache()` for per-request deduplication — no matter
how many `userCan()` calls appear in a single request, the DB is hit once.

### `userCan(user, action, resource) → boolean`

Returns `true` if the user holds the given permission.

```ts
if (await userCan(session, "create", "topic")) {
  // show "New topic" button
}
```

### `requirePermission(user, action, resource)`

Throws `ForbiddenError` (status 403) if the permission is missing. Use inside
API route handlers after verifying the session.

```ts
await requirePermission(session, "update", "worksheet");
// continues only if user can update worksheets
```

### `requirePermissionAndOwnership(user, action, resource, resourceData)`

Combines a permission check with an ownership check. Passes only when both
conditions are true. Admins bypass the ownership check (they can act on any
resource they hold the permission for).

```ts
await requirePermissionAndOwnership(session, "delete", "comment", { user_id: comment.userId });
```

**Ownership resolution** — looks for `user_id` first, then falls back to
`created_by_id`. Resources that use a non-standard owner field must use
`requirePermission()` directly and handle ownership separately.

**Admin bypass** — `user.isAdmin === true` skips the ownership check. This
is intentional and will be removed in Phase 4 when `is_admin` is retired.

### `computePermissionFlags(user) → PermissionFlags`

Computes the boolean flags returned by `/api/auth/me`. Used for frontend UI
affordances only — the server still calls `requirePermission` on every action.

## Adding a new permission

1. Run a migration inserting the `(resource, action)` row into `permissions`.
2. Run another migration adding `role_permissions` rows for roles that should
   have it.
3. If the resource or action is new, add it to `RESOURCES` or `ACTIONS` in
   `lib/auth/permissions.types.ts`.
4. Use `requirePermission()` in the relevant API route handler.

## Relationship to `is_admin`

The `is_admin` flag remains active during Phase 2 and 3. All existing admin
checks (`requireAdmin()`, layout guards) are unchanged. Phase 4 will retire
`is_admin` after every route is migrated to the permission helpers.

## Design doc

See `rbac-design-spec.md` for the full rationale, deferred decisions (scope
column, custom roles UI), and the Phase 3 migration plan.
