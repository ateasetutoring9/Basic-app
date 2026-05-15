import { describe, it, expect, vi, beforeEach } from "vitest";

// React.cache() is a per-request memoization primitive tied to the React
// request context. Vitest runs in a plain Node environment with no React
// renderer, so cache() is not available. We replace it with the identity
// function so the logic under test runs normally (one DB call per test).
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn };
});

// ─── Mock the Supabase server client ────────────────────────────────────────

type MockRow = Record<string, unknown>;

// The Supabase client uses a fluent builder pattern:
//   supabase.from('t').select('col').eq('k', v).is('x', null)  → awaitable
// Each chained method must return the builder itself; the builder must also
// be awaitable (i.e. thenable) so `await builder` works.
function makeQueryBuilder(data: MockRow[] | null) {
  const result = { data, error: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    in: () => builder,
    then: (
      resolve: (v: typeof result) => unknown,
      reject?: (e: unknown) => unknown
    ) => Promise.resolve(result).then(resolve, reject),
    catch: (reject: (e: unknown) => unknown) =>
      Promise.resolve(result).catch(reject),
  };
  return builder;
}

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: mockFrom }),
}));

// ─── Import all modules after mocks are declared ─────────────────────────────
// Static imports keep class identity consistent — instanceof checks work
// correctly. We reset only mock *data* (not modules) in beforeEach.

import { ForbiddenError } from "@/lib/errors";
import {
  getUserPermissions,
  userCan,
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/auth/permissions";

// ─── Seed data mirroring what the DB returns for each role ───────────────────

const STUDENT_PERMISSIONS: MockRow[] = [
  { resource: "year", action: "read" },
  { resource: "subject", action: "read" },
  { resource: "topic", action: "read" },
  { resource: "lecture", action: "read" },
  { resource: "worksheet", action: "read" },
  { resource: "attempt", action: "create" },
  { resource: "attempt", action: "read" },
  { resource: "attempt", action: "update" },
  { resource: "comment", action: "create" },
  { resource: "comment", action: "read" },
  { resource: "comment", action: "update" },
  { resource: "comment", action: "delete" },
  { resource: "report", action: "create" },
  { resource: "user", action: "read" },
  { resource: "user", action: "update" },
  { resource: "user", action: "delete" },
];

const ADMIN_PERMISSIONS: MockRow[] = [
  ...STUDENT_PERMISSIONS,
  { resource: "topic", action: "create" },
  { resource: "topic", action: "update" },
  { resource: "topic", action: "delete" },
  { resource: "lecture", action: "create" },
  { resource: "lecture", action: "update" },
  { resource: "lecture", action: "delete" },
  { resource: "worksheet", action: "create" },
  { resource: "worksheet", action: "update" },
  { resource: "worksheet", action: "delete" },
  { resource: "comment", action: "moderate" },
  { resource: "report", action: "read" },
  { resource: "report", action: "approve" },
  { resource: "role", action: "read" },
  { resource: "role", action: "create" },
  { resource: "role", action: "update" },
  { resource: "role", action: "delete" },
  { resource: "role", action: "assign" },
  { resource: "admin_dashboard", action: "read" },
  { resource: "analytics", action: "read" },
];

function setupMockFor(
  userRoles: MockRow[],
  rolePerms: MockRow[],
  permissions: MockRow[]
) {
  mockFrom.mockImplementation((table: string) => {
    const data =
      table === "user_roles"
        ? userRoles
        : table === "role_permissions"
        ? rolePerms
        : table === "permissions"
        ? permissions
        : [];
    return makeQueryBuilder(data);
  });
}

const STUDENT_SESSION = {
  userId: 1,
  syncId: "student-sync",
  email: "student@example.com",
  isAdmin: false,
};

const ADMIN_SESSION = {
  userId: 2,
  syncId: "admin-sync",
  email: "admin@example.com",
  isAdmin: true,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("getUserPermissions", () => {
  beforeEach(() => mockFrom.mockReset());

  it("returns empty array for a user with no roles", async () => {
    setupMockFor([], [], []);
    expect(await getUserPermissions(99)).toEqual([]);
  });

  it("returns student permissions for a student user", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      STUDENT_PERMISSIONS.map((_, i) => ({ permission_id: i + 1 })),
      STUDENT_PERMISSIONS
    );
    const result = await getUserPermissions(1);
    expect(result.length).toBe(STUDENT_PERMISSIONS.length);
    expect(result).toContainEqual({ resource: "topic", action: "read" });
    expect(result).not.toContainEqual({ resource: "topic", action: "create" });
  });

  it("returns admin permissions for an admin user", async () => {
    setupMockFor(
      [{ role_id: 3 }],
      ADMIN_PERMISSIONS.map((_, i) => ({ permission_id: i + 1 })),
      ADMIN_PERMISSIONS
    );
    const result = await getUserPermissions(2);
    expect(result).toContainEqual({ resource: "admin_dashboard", action: "read" });
    expect(result).toContainEqual({ resource: "role", action: "assign" });
  });

  it("deduplicates when user has multiple roles granting the same permission", async () => {
    // Both roles grant (year, read) — permission_id 1 appears twice in role_permissions
    setupMockFor(
      [{ role_id: 1 }, { role_id: 3 }],
      [{ permission_id: 1 }, { permission_id: 1 }, { permission_id: 2 }],
      [
        { resource: "year", action: "read" },
        { resource: "subject", action: "read" },
      ]
    );
    const result = await getUserPermissions(1);
    const yearRead = result.filter(
      (p) => p.resource === "year" && p.action === "read"
    );
    expect(yearRead).toHaveLength(1);
  });
});

// NOTE: React.cache() per-request deduplication is not testable in Vitest's
// Node environment (no React renderer context). Verify manually: add a
// console.log inside getUserPermissions, call userCan() 5 times for the
// same user in one request, and confirm the log fires exactly once.

describe("userCan", () => {
  beforeEach(() => mockFrom.mockReset());

  it("returns true when permission is granted", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "topic", action: "read" }]
    );
    expect(await userCan(STUDENT_SESSION, "read", "topic")).toBe(true);
  });

  it("returns false when permission is not granted", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "topic", action: "read" }]
    );
    expect(await userCan(STUDENT_SESSION, "create", "topic")).toBe(false);
  });
});

describe("requirePermission", () => {
  beforeEach(() => mockFrom.mockReset());

  it("throws ForbiddenError when permission is missing", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "topic", action: "read" }]
    );
    await expect(
      requirePermission(STUDENT_SESSION, "delete", "topic")
    ).rejects.toThrow(ForbiddenError);
  });

  it("resolves without throwing when permission is granted", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "topic", action: "read" }]
    );
    await expect(
      requirePermission(STUDENT_SESSION, "read", "topic")
    ).resolves.toBeUndefined();
  });
});

describe("requirePermissionAndOwnership", () => {
  beforeEach(() => mockFrom.mockReset());

  it("passes when user owns the resource via user_id", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "comment", action: "delete" }]
    );
    await expect(
      requirePermissionAndOwnership(STUDENT_SESSION, "delete", "comment", {
        user_id: STUDENT_SESSION.userId,
      })
    ).resolves.toBeUndefined();
  });

  it("passes when user owns via created_by_id fallback", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "comment", action: "delete" }]
    );
    await expect(
      requirePermissionAndOwnership(STUDENT_SESSION, "delete", "comment", {
        user_id: null,
        created_by_id: STUDENT_SESSION.userId,
      })
    ).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when user does not own the resource", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "comment", action: "delete" }]
    );
    await expect(
      requirePermissionAndOwnership(STUDENT_SESSION, "delete", "comment", {
        user_id: 999,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it("passes for admin even when they do not own the resource", async () => {
    setupMockFor(
      [{ role_id: 3 }],
      ADMIN_PERMISSIONS.map((_, i) => ({ permission_id: i + 1 })),
      ADMIN_PERMISSIONS
    );
    await expect(
      requirePermissionAndOwnership(ADMIN_SESSION, "delete", "comment", {
        user_id: 999,
      })
    ).resolves.toBeUndefined();
  });

  it("throws ForbiddenError when owner cannot be determined (both fields null)", async () => {
    setupMockFor(
      [{ role_id: 1 }],
      [{ permission_id: 1 }],
      [{ resource: "comment", action: "delete" }]
    );
    await expect(
      requirePermissionAndOwnership(STUDENT_SESSION, "delete", "comment", {
        user_id: null,
        created_by_id: null,
      })
    ).rejects.toThrow(ForbiddenError);
  });
});
