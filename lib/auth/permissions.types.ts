export const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "moderate",
  "assign",
] as const;
export type Action = (typeof ACTIONS)[number];

export const RESOURCES = [
  "year",
  "subject",
  "topic",
  "lecture",
  "worksheet",
  "attempt",
  "comment",
  "report",
  "user",
  "role",
  "admin_dashboard",
  "analytics",
] as const;
export type Resource = (typeof RESOURCES)[number];

export type Permission = {
  resource: Resource;
  action: Action;
};

export type PermissionFlags = {
  canAccessAdmin: boolean;
  canCreateContent: boolean;
  canModerateComments: boolean;
  canManageRoles: boolean;
};
