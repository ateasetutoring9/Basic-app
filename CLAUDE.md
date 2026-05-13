# CLAUDE.md

## System Overview

A K-12 education platform targeting years 7–12. Content is organised as a
hierarchy: **years → subjects → topics → lecture + worksheet**. Students browse
topics, read or watch a lecture, then attempt a worksheet. Results (attempts),
discussion (comments), and moderation (reports) live alongside content.

All database access goes through an **API layer** — frontend clients never hit
the DB directly. Authentication and authorisation are enforced entirely in the
API. RLS is disabled; there are no Supabase Auth users.

---

## Architectural Principles

**Dual-key pattern — `id` internal, `sync_id` external**
Every table has:
- `id` — `bigserial` primary key. Used for all FK joins inside the DB. Never
  exposed to API clients.
- `sync_id` — `uuid`, externally visible. Used in all API responses, URLs, and
  client-side references.

**Auth lives in the API, not the DB**
Frontend users authenticate against the API; the API owns session management.
There is no RLS, no Supabase Auth, no `auth.users`. The DB just stores
`password_hash`. The API validates credentials and issues tokens.

**Soft delete everywhere**
Every table has `deleted_at timestamptz`. Set it to soft-delete a row — never
run a hard `DELETE`. All reads must filter `WHERE deleted_at IS NULL` unless
explicitly auditing.

**`updated_at` is trigger-managed**
A `touch_updated_at` trigger fires `BEFORE UPDATE` on every main table. Never
set `updated_at` manually in application code.

**History tables are append-only audit logs**
Every main table has a `<name>_history` mirror populated by triggers on insert,
update, and delete. Application code must never write to or modify history
tables.

**Single authorisation flag (transitional)**
`users.is_admin` is the active enforcement mechanism during RBAC Phase 2 and 3.
It will be retired in Phase 4 once all routes are migrated to the permission
helpers. The full RBAC system (roles, permissions, code helpers) is built but
not yet enforced at the route level — see the **RBAC** section below.

**Passwords never touch logs**
The API hashes passwords (bcrypt or argon2) before inserting. Plaintext
passwords must never appear in logs, query strings, or error messages.

---

## Table Reference

### `users`
Registered students and admins.

| Column | Notes |
|---|---|
| `email` | `citext` — case-insensitive unique |
| `display_name` | user's name as entered at signup; shown in the dashboard greeting; nullable for accounts created before this field existed |
| `password_hash` | bcrypt/argon2 hash; API sets this, never plaintext |
| `email_verified_at` | null until email confirmed |
| `password_reset_token` | SHA-256 hex hash of the raw token; raw token is sent in the email URL only |
| `password_reset_expires_at` | 1-hour expiry; must be checked alongside the token |
| `password_changed_at` | set to `now()` on every successful password reset; `verifyToken()` uses this to invalidate pre-reset JWTs |
| `failed_login_attempts` | incremented on bad password; reset on success |
| `locked_until` | set when attempts exceeded |
| `is_admin` | single auth flag; default false |

Referenced by: `topics.created_by_id/updated_by_id`, `lectures.created_by_id/updated_by_id`,
`worksheets.created_by_id/updated_by_id`, `attempts.user_id`, `comments.user_id`,
`reports.reporter_id/resolved_by`, `user_roles.user_id`, `roles.created_by_id`.

---

### `years`
Lookup table for school year levels.

| Column | Notes |
|---|---|
| `name` | machine identifier, e.g. `"year-7"` |
| `display_name` | human label, e.g. `"Year 7"` |
| `is_active` | false hides the year from browsing |

Referenced by: `subjects.year_id`.

---

### `subjects`
One row per subject per year level (~24 rows for 4 subjects × 6 years).

| Column | Notes |
|---|---|
| `year_id` | FK → `years.id` |
| `name` | e.g. `"Mathematics"` |
| `display_order` | controls sort order within a year |
| `is_active` | false hides the subject |

Referenced by: `topics.subject_id`.

---

### `topics`
A discrete unit of study within a subject.

| Column | Notes |
|---|---|
| `subject_id` | FK → `subjects.id` |
| `title` | display name |
| `thumbnail_url` | optional preview image URL |
| `is_published` | false = draft, hidden from students |
| `published_at` | timestamp of first publish |
| `created_by_id / updated_by_id` | FK → `users.id`; null if system-inserted |

Topics have no `year_level` column — year context comes from
`topic.subject_id → subjects.year_id`.

Referenced by: `lectures.topic_id`, `worksheets.topic_id`, `comments.topic_id`,
`reports.entity_id` (polymorphic).

---

### `lectures`
One lecture per topic. `UNIQUE (topic_id)` enforces the 1:1.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id`; unique |
| `title` | lecture title |
| `format` | `'text'` \| `'video'` \| `'slides'` |
| `content` | JSONB — shape depends on `format` (see below) |
| `is_published` | independent of topic publish state |
| `published_at` | timestamp of first publish |
| `created_by_id / updated_by_id` | FK → `users.id` |

**Content shapes by format:**
- `text` → `{"markdown": "..."}`
- `video` → `{"youtube_id": "...", "duration_seconds": 300}`
- `slides` → `{"html": "..."}`

The DB does not validate JSONB content shape. The API must validate before
insert/update.

---

### `worksheets`
One worksheet per topic. `UNIQUE (topic_id)` enforces the 1:1.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id`; unique |
| `title` | worksheet title |
| `questions` | JSONB array of question objects |
| `difficulty` | `int` 1–5 (check constraint in DB) |
| `is_published` | independent of topic publish state |
| `published_at` | timestamp of first publish |
| `created_by_id / updated_by_id` | FK → `users.id` |

Question structure is defined and validated in the API layer, not the DB.

**Question types** (stored in `questions` JSONB, validated in `lib/content/schemas.ts`):

| `type` | Auto-graded | Key fields |
|--------|------------|------------|
| `mcq_single` | Yes | `options: string[]`, `answer: number` (zero-based index) |
| `mcq_multi` | Yes | `options: string[]`, `answers: number[]` (all must match) |
| `short_text` | Yes | `acceptedAnswers: string[]`, `caseSensitive?: boolean` |
| `numeric` | Yes | `answer: number`, `tolerance?: number`, `unit?: string` |
| `essay` | No | `hint?: string` — free text, never counted correct |

Do not use the old types `multiple-choice`, `fill-blank` — they no longer exist.

---

### `login_attempts`
Append-only audit log of every login attempt. No `updated_at`, no history mirror.

| Column | Notes |
|---|---|
| `user_id` | Nullable FK → `users.id`; null when email not found |
| `email_attempted` | `citext` — the email that was submitted |
| `outcome` | `success` \| `wrong_password` \| `user_not_found` \| `account_locked` \| `email_not_verified` \| `rate_limited` \| `error` |
| `failure_detail` | Optional context (e.g. "Locked until \<timestamp>") |
| `ip_address` | `inet` — source IP extracted from `x-forwarded-for` → `x-real-ip` → `0.0.0.0` |
| `user_agent` | Capped at 500 chars before insert |
| `attempted_at` | Timestamp of the attempt |

**Rules:**
- Written by `lib/auth/log-login-attempt.ts` via fire-and-forget (`void logLoginAttempt(...)`) — failures never block the login response.
- Never log the password — the helper's signature does not accept one.
- `user_not_found` rows have `user_id = null`; they are filtered out of the user-facing recent activity page.
- No `updated_at` column. No history mirror. Soft-delete with `deleted_at` only.

---

### `attempts`
A student's worksheet submission.

| Column | Notes |
|---|---|
| `user_id` | FK → `users.id` |
| `worksheet_id` | FK → `worksheets.id` |
| `score` | correct answers (≥ 0 check) |
| `total` | total questions (> 0 check) |
| `answers` | JSONB map of question id → student answer |
| `worksheet_history_id` | FK → `worksheets_history.id`; records exact worksheet version answered |

Attempts are effectively immutable once submitted. Do not expose an edit
endpoint. Soft-delete only.

---

### `comments`
Threaded discussion attached to topics.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id` |
| `user_id` | FK → `users.id` |
| `parent_comment_id` | self-referencing FK; null for top-level |
| `body` | 1–4000 characters (check constraint) |
| `is_hidden` | admin moderation flag |

Nesting depth is unlimited at the DB level. Enforce a depth cap in the API
when fetching comment trees — unbounded recursion is expensive.

---

### `reports`
User-submitted flags on content or comments.

| Column | Notes |
|---|---|
| `reporter_id` | FK → `users.id` |
| `entity_type` | `'topic'` \| `'lecture'` \| `'worksheet'` \| `'comment'` |
| `entity_id` | `bigint` — the `id` of the reported row |
| `reason` | `'incorrect'` \| `'inappropriate'` \| `'spam'` \| `'other'` |
| `status` | `'open'` \| `'resolved'` \| `'dismissed'` |
| `resolved_by` | FK → `users.id`; null until actioned |

`entity_id` has no DB-level FK (polymorphic). The API must verify the
referenced entity exists before inserting a report.

---

### `roles`
Reference table for access-control roles. System roles are seeded by migration and must not be deleted.

| Column | Notes |
|---|---|
| `name` | Machine identifier: `student`, `tutor`, `admin`, `parent` |
| `display_name` | Human label |
| `is_system_role` | True for the 4 seeded roles; custom roles will be false |
| `is_default_for_signup` | Exactly one role may be true — `student` |
| `created_by_id / updated_by_id / deleted_by_id` | FK → `users.id`; null for system-seeded rows |

History: none (reference data, not security-sensitive assignments).

---

### `user_roles`
Assignment of a role to a user. Each user gets exactly one row at signup (the default-for-signup role). History is tracked in `user_roles_history`.

| Column | Notes |
|---|---|
| `user_id` | FK → `users.id` |
| `role_id` | FK → `roles.id` |
| `deleted_at` | Soft-delete to revoke a role assignment |

Unique partial index on `(user_id, role_id) WHERE deleted_at IS NULL` prevents duplicate live assignments.

---

### `permissions`
All valid `(resource, action)` pairs the application knows about. New permissions require a migration.

| Column | Notes |
|---|---|
| `resource` | One of the `RESOURCES` array values in `lib/auth/permissions.types.ts` |
| `action` | One of the `ACTIONS` values: `read`, `create`, `update`, `delete`, `approve`, `moderate`, `assign` |
| `description` | Human-readable label for the admin UI |

Check constraint: `action IN ('read','create','update','delete','approve','moderate','assign')`.
Unique constraint: `(resource, action)`.

---

### `role_permissions`
Many-to-many join between roles and permissions. History is tracked in `role_permissions_history`.

| Column | Notes |
|---|---|
| `role_id` | FK → `roles.id` |
| `permission_id` | FK → `permissions.id` |
| `deleted_at` | Soft-delete to revoke a permission from a role |

---

## Content Hierarchy

```
years          (6 rows)
  └─ subjects  (~4 per year = ~24 rows)
       └─ topics
            ├─ lecture    (1:1, unique topic_id)
            └─ worksheet  (1:1, unique topic_id)
                 └─ attempts  (N per user)
```

A topic belongs to a subject; the year is derived by joining through the
subject. There is no `year_level` or `slug` on topics directly.

Lecture content is a JSONB blob with a `format` discriminator. Worksheet
questions are a JSONB array. Both are validated by the API, not the DB.
Attempt answers are a separate JSONB blob keyed by question id; scoring is
computed by the API.

---

## History / Audit System

Every main table has a `<name>_history` mirror:

`users_history`, `years_history`, `subjects_history`, `topics_history`,
`lectures_history`, `worksheets_history`, `attempts_history`,
`comments_history`, `reports_history`

**Structure of each history table:**
- `id bigserial primary key` — own PK
- `<parent>_id bigint not null` — source row's `id`
- All columns from the parent, mirrored
- `operation text not null` — `'insert'` | `'update'` | `'delete'`
- `changed_at timestamptz not null default now()`
- **No foreign keys. No check constraints. No unique constraints.**

**How it works:**
Each `<name>_history_capture()` trigger function fires `AFTER INSERT OR UPDATE
OR DELETE`. On `DELETE` it snapshots `OLD`; otherwise it snapshots `NEW`.

**Rules:**
- Application code must never `INSERT`, `UPDATE`, or `DELETE` from history tables.
- History rows are permanent — no `deleted_at`, no soft delete.
- `users_history` stores `password_hash` and reset tokens. Anyone with read
  access to this table can read every credential that ever existed. Restrict
  access accordingly.

---

## Route Groups — Zone Architecture

The app is split into three Next.js App Router route groups. Route groups use
parentheses and do not appear in URLs.

| Zone | Folder | Navbar | Auth required |
|---|---|---|---|
| Public | `app/(public)/` | No | No |
| Auth | `app/(auth)/` | No | No (logged-in users redirected to `/dashboard`) |
| App | `app/(app)/` | Yes | Yes — layout redirects to `/login` if session invalid |

**`app/(public)/`** — landing page only (`/`). No navbar. Visible to anyone.

**`app/(auth)/`** — `/login`, `/signup`, `/forgot-password`, `/reset-password`. No navbar, centered form layout.
Middleware redirects logged-in users to `/dashboard` before the page renders.

**`app/(app)/`** — all authenticated routes: `/dashboard`, `/browse`, `/learn`,
`/worksheet`, `/progress`, `/admin`, `/edit`. Layout (`app/(app)/layout.tsx`)
verifies the JWT server-side and redirects to `/login` if missing or invalid.
Renders `TopNav` for all app-zone pages.

**Middleware** (`middleware.ts`) — fast cookie-presence check only. Does not
verify the JWT (that happens in the layout). Redirects:
- Unauthenticated requests to any app-zone path → `/login`
- Authenticated requests to `/login` or `/signup` → `/dashboard`

---

## Auth & Sessions

Sessions use a JWT stored in an HTTP-only cookie named `session` (7-day expiry, HS256).

- **`lib/auth/jwt.ts`** — `signToken()`, `verifyToken()`, `COOKIE_NAME`, `COOKIE_OPTIONS`. `verifyToken()` additionally queries `users.password_changed_at` and returns `null` if the JWT's `iat` is older than the last password change, immediately invalidating pre-reset sessions.
- **`lib/auth/session.ts`** — client-side helpers: `getSession()`, `login()`, `signup()`, `logout()` — all call `/api/auth/*`
- **`/api/auth/me`** — re-fetches `is_admin` from the DB on every call; re-issues the cookie if it has changed. Also computes `PermissionFlags` via `computePermissionFlags()` and includes them in the response as `permissions`. Do not trust the JWT's cached `isAdmin` alone.
- **Login/signup responses** — return only `syncId`, `email`, and `isAdmin`. The internal bigserial `id` is never sent to clients.
- **Signup** — `POST /api/auth/signup` accepts `{ email, password, displayName? }`. `displayName` is stored as `users.display_name`; it is optional so existing integrations without the field still work. The signup form (`components/auth/SignupForm.tsx`) validates name format (letters, spaces, hyphens, apostrophes, 2–100 chars) and email format client-side before submitting.
- **Login hardening** — `POST /api/auth/login` enforces three layers of protection in order:
  1. **IP rate limit** (`loginLimiter` — 20 req / 15 min, Upstash sliding window). Degrades gracefully if Redis is unavailable — logs a warning and allows the request through so a Redis outage never breaks login.
  2. **Per-account lockout** — after `MAX_FAILED_LOGIN_ATTEMPTS` (5) consecutive wrong passwords within `FAILED_ATTEMPT_RESET_WINDOW_HOURS` (1 h), sets `locked_until = now + LOCKOUT_DURATION_MINUTES` (30 min). Constants live in `lib/auth/policy.ts`. Lockout is checked **before** `bcrypt.compareSync` so a locked account's attempts never increment the counter further.
  3. **Reset-window logic** — before incrementing `failed_login_attempts`, the route queries the last failure row for that user. If it is older than 1 hour, the counter resets to 0 first, preventing stale failures from contributing to new lockouts.
  - **Dummy bcrypt** — when the email is not found, `bcrypt.compareSync` runs against a constant dummy hash to equalise response timing and prevent account enumeration.
  - **Lockout UX** — the API returns `{ errorCode: "account_locked" }` (401). `LoginForm` detects this and renders a distinct banner: "Account temporarily locked — wait 30 minutes or reset your password." The reset link goes to `/forgot-password`.
  - **Password reset clears lockout** — `POST /api/auth/reset-password` clears `failed_login_attempts = 0` and `locked_until = null` in the same DB update as the new password hash, so a locked user can regain access immediately via password reset.
  - **bcrypt in Edge Runtime** — use `bcrypt.compareSync` (synchronous). The async `bcrypt.compare` uses `setImmediate` which is not available in the Edge Runtime.
  - **Do not import `@sentry/nextjs` in edge API routes** — it uses Node.js APIs not available in the Edge Runtime. Errors in edge routes are captured automatically via `onRequestError` in `instrumentation.ts`.
- **Login attempt logging** — `lib/auth/log-login-attempt.ts` writes to `login_attempts` at every terminal path in the login route. Called with `void` so it never blocks the response. The login route separates `user_not_found` (no user row) from `wrong_password` (user found, bad password) so each gets the correct outcome in the log.
- **`lib/request-meta.ts`** — call `getRequestMeta(request)` to extract `{ ipAddress, userAgent }` from any `Request`. Used by the login route; reuse for any future auth route that needs to log.
- **Email verification** — soft-block model. Unverified users can still log in and use the app; they see a persistent banner prompting them to verify. See the **Email Verification** section below for full details.
- **App layout** (`app/(app)/layout.tsx`) — server component that verifies the JWT and redirects to `/login` if the session is missing or invalid. This is the primary auth gate for all app-zone routes.
- **Admin layout** (`app/(app)/admin/layout.tsx`) — additionally checks `isAdmin`; redirects to `/dashboard` if the user is authenticated but not an admin. Individual admin pages need no extra check.
- **Nav** — `NavAuth` calls `getSession()` on every pathname change (via `usePathname` in its `useEffect` dep array) so the admin cog appears immediately after login without requiring a hard refresh.
- **Login** → redirects to `/dashboard`. **Logout** → clears cookie and redirects to `/login`.
- **Password reset** → `/forgot-password` → email with raw token → `/reset-password?token=<raw>` → `/login?reset=success`.

---

## Password Reset Flow

**Routes:**
- `POST /api/auth/forgot-password` — accepts `{ email }`. Generates a 32-byte base64url token using Web Crypto (`crypto.getRandomValues`), stores its SHA-256 hex hash in `users.password_reset_token` with `password_reset_expires_at = now() + 1 hour`, and sends the raw token in the reset URL via Resend. Always returns `{ ok: true }` regardless of whether the email exists — never reveal account existence.
- `POST /api/auth/reset-password` — accepts `{ token, newPassword }`. Hashes the token with SHA-256, looks up the user where the hash matches and expiry is in the future, bcrypt-hashes the new password (cost 12), updates `password_hash`, clears `password_reset_token`/`password_reset_expires_at`, and sets `password_changed_at = now()`. Does **not** issue a new JWT — user must log in again.

**Token security model:**
- Raw token never touches the database. Only the SHA-256 hex hash is stored.
- `verifyToken()` invalidates any JWT with `iat < password_changed_at`, so all existing sessions are logged out on password change.
- The forgot-password route hashes a dummy token and does the DB lookup regardless of whether the email exists, so response time is constant.

**Rate limits (`lib/rate-limit.ts` — Upstash sliding window):**
- Login by IP: 20 req / 15 min (degrades gracefully if Redis unavailable)
- Forgot-password by IP: 10 req / 1 hour
- Forgot-password by email: 3 req / 1 hour
- Reset-password by IP: 5 req / 15 min

**Email infrastructure:**
- `lib/email/client.ts` — Resend SDK singleton; throws at startup if `RESEND_API_KEY` is missing.
- `lib/email/send.ts` — `sendEmail({ to, subject, html, text })`. Wraps Resend in try/catch and never throws — a send failure must never propagate to the HTTP response.
- `lib/email/templates/password-reset.ts` — `passwordResetEmail({ resetUrl, firstName? })` returns `{ subject, html, text }`. Inline styles only (email client compatibility). No exclamation marks. Subject: `Reset your At Ease Learning password`.

**Required env vars:** `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_APP_URL` (used to construct the reset URL — strip trailing slash before appending).

**UI pages (auth zone, no session required):**
- `app/(auth)/forgot-password/page.tsx` + `components/auth/ForgotPasswordForm.tsx` — email form; transitions to "check your email" in-place after submit without a redirect.
- `app/(auth)/reset-password/page.tsx` + `components/auth/ResetPasswordForm.tsx` — reads `?token` from searchParams (calls `notFound()` if missing); two password fields with show/hide toggles; client-side match validation before submit.
- Login page (`app/(auth)/login/page.tsx`) reads `?reset=success` and passes `resetSuccess` to `LoginForm`, which shows a success banner. "Forgot password?" link appears below the password field.

---

## Email Verification

**Soft-block model** — unverified users can log in and use all existing features. Verification is encouraged via a persistent banner, not enforced at login.

### Token pattern (same as password reset)
- `lib/auth/tokens.ts` — `generateToken()` returns `{ raw, hash }`. Raw token goes in the URL; SHA-256 hex hash is stored in `users.email_verification_token`. Never store the raw token in the DB.
- Token expiry: `EMAIL_VERIFICATION_EXPIRY_HOURS` (24 h), defined in `lib/auth/policy.ts`.
- Resend cooldown: `EMAIL_VERIFICATION_RESEND_COOLDOWN_MINUTES` (5 min), enforced server-side via `users.email_verification_sent_at`.

### DB columns (on `users`)
| Column | Notes |
|---|---|
| `email_verified_at` | `null` until verified; set by `POST /api/auth/verify-email` |
| `email_verification_token` | SHA-256 hex hash of the raw token; cleared on verification |
| `email_verification_expires_at` | 24-hour expiry |
| `email_verification_sent_at` | timestamp of last send; used for cooldown enforcement |

### API routes
- **`POST /api/auth/signup`** — after creating the user and issuing the JWT, generates a token, stores the hash, and sends the verification email fire-and-forget (`void`). Email failures never break signup.
- **`POST /api/auth/verify-email`** — accepts `{ token }`. Hashes it, looks up the matching user (token match + not expired + not deleted), sets `email_verified_at = now()`, clears token fields. Rate-limited by IP (10 req / 15 min). If the token is invalid but the session user is already verified, returns `{ ok: true, alreadyVerified: true }` instead of an error.
- **`POST /api/auth/resend-verification`** — session-required. Rate-limited per user sync_id (3 req / 1 hr via Upstash) plus server-side 5-min cooldown via `email_verification_sent_at`. Generates a fresh token and sends a new email.

### UI
- **`app/(auth)/verify-email/page.tsx`** — client component in the auth zone (inherits card layout). Three states: loading spinner → success (CTA to dashboard or login depending on session) → expired/invalid error. Detects already-verified via `/api/auth/me`.
- **`app/(app)/_components/EmailVerificationBanner.tsx`** — full-width `bg-accent-soft` strip rendered above `<TopNav>` in `app/(app)/layout.tsx`. Reads `email_verified_at` from DB in the layout server component and passes `isVerified` as a prop. Resend button cycles: idle → Sending… → Email sent / Please wait / Couldn't send → idle (resets after 5 s). Dismiss button hides the banner for the current page session only (no DB write).
- **`app/(app)/settings/security`** — `EmailStatusSection` shows the user's email address with a "Verified" or "Not verified" pill, plus a resend button for unverified accounts.

### Email template
`lib/email/templates/email-verification.ts` — `emailVerificationEmail({ verifyUrl, firstName? })`. Subject: `"Verify your email for At Ease Learning"`. Inline styles matching `password-reset.ts` exactly.

### Rate limits (`lib/rate-limit.ts`)
- `verifyEmailLimiter` — 10 req / 15 min per IP
- `resendVerificationLimiter` — 3 req / 1 hr per user sync_id

Both limiters degrade gracefully (warn + allow through) if Redis is unavailable.

### Design decisions
- **Soft block** — the login route does NOT enforce `email_verified_at`. The `email_not_verified` outcome in `login_attempts` is dead code until a future decision to hard-block is made.
- **Fire-and-forget send** — email failures at signup never fail the signup response. The banner + resend flow is the recovery path.
- **No auto-login after verify** — the verify endpoint sets `email_verified_at` only; it does not issue or refresh a JWT. If the user clicks the link from a different device, they see a "Sign in" CTA.
- **Future gate** — when paid features ship (e.g. tutoring booking), those endpoints should check `email_verified_at IS NOT NULL` and return a clear error + resend prompt. Update the banner copy at that point to name the gated feature.

---

## RBAC (Phase 2 — code helpers built, routes not yet migrated)

The RBAC system lives in `lib/auth/permissions.ts`. It is additive — all existing `is_admin` checks remain active and unchanged. Phase 3 will migrate individual routes to use the helpers; Phase 4 will retire `is_admin`.

### Types (`lib/auth/permissions.types.ts`)

```ts
ACTIONS  = ['read','create','update','delete','approve','moderate','assign']
RESOURCES = ['year','subject','topic','lecture','worksheet','attempt',
             'comment','report','user','role','admin_dashboard','analytics']

type Permission = { resource: Resource; action: Action };
type PermissionFlags = {
  canAccessAdmin: boolean;      // read on admin_dashboard
  canCreateContent: boolean;    // create on topic
  canModerateComments: boolean; // moderate on comment
  canManageRoles: boolean;      // assign on role
};
```

### Core helpers (`lib/auth/permissions.ts`)

**`getUserPermissions(userId)`** — loads all active `(resource, action)` pairs for a user via three indexed queries (user_roles → role_permissions → permissions). Wrapped in `React.cache()` for per-request deduplication — the DB is hit once per request no matter how many `userCan()` calls appear.

**`userCan(user, action, resource)`** — returns `boolean`. Always use this for conditional UI logic.

**`requirePermission(user, action, resource)`** — throws `ForbiddenError` (403) if the check fails. Use in API route handlers.

**`requirePermissionAndOwnership(user, action, resource, resourceData)`** — permission check + ownership check. Ownership is resolved by looking for `resourceData.user_id` then `resourceData.created_by_id`. Admins (`user.isAdmin === true`) bypass the ownership check and are only subject to the permission check.

**`computePermissionFlags(user)`** — computes the four `PermissionFlags` booleans in parallel. Called by `/api/auth/me` to include pre-computed flags in every session response.

### Error class (`lib/errors.ts`)

`ForbiddenError` extends `Error` with `status: 403` and `name: 'ForbiddenError'`. Thrown by `requirePermission` and `requirePermissionAndOwnership`. The error message (e.g. `"Missing permission: delete on topic"`) is for internal logs/Sentry only — clients receive a generic 403 response.

### Session response

`/api/auth/me` now returns:
```json
{ "id": 1, "syncId": "...", "email": "...", "isAdmin": false, "permissions": { "canAccessAdmin": false, "canCreateContent": false, "canModerateComments": false, "canManageRoles": false } }
```

`lib/auth/session.ts` `SessionUser` type includes `permissions: PermissionFlags`. These flags are for **UI affordance only** — every server action must still call `requirePermission` independently.

### Tests

`lib/auth/permissions.test.ts` — 13 tests covering all helpers. Run with `npm test`. `React.cache()` is mocked as the identity function in the Vitest Node environment (no React renderer); per-request deduplication must be verified manually.

### Ownership convention

The ownership check looks for `user_id` first, then `created_by_id`. Resources that use neither field must call `requirePermission()` directly. When the `scope` column is eventually added to `role_permissions`, `requirePermissionAndOwnership` becomes redundant — the DB handles ownership in the query.

### Adding a new permission

1. Migration: `INSERT INTO permissions (resource, action, description) VALUES (...)`.
2. Migration: `INSERT INTO role_permissions (role_id, permission_id) ...` for each role that should have it.
3. If the resource or action string is new, add it to `RESOURCES` or `ACTIONS` in `lib/auth/permissions.types.ts`.
4. Call `requirePermission()` in the route handler.

---

## Admin vs Public API behaviour

- `GET /api/admin/topics` — returns **all** non-deleted topics (published + draft). The public loader `getAllTopics()` filters `is_published = true` — do not use it in admin contexts.
- Browse pages (`/browse`, `/browse/[year]`, `/browse/[year]/[subject]`) are `force-dynamic` — server-rendered on every request so new DB content appears immediately without a redeploy.

### Admin API auth guard

**`lib/auth/requireAdmin.ts`** — every handler in every `/api/admin/*` route must call this as its first line:

```ts
const auth = await requireAdmin();
if (auth instanceof Response) return auth;
```

It reads the session cookie, verifies the JWT, and checks `isAdmin`. Returns a `401 Response` on any failure. The `auth` object carries `{ userId, syncId, email }` for use within the handler (e.g. the self-delete check in `users/[id]` uses `auth.userId`).

**Why both layout and API guard?** Next.js layouts only run when a browser navigates to a page — they do not intercept direct API calls (curl, fetch from another origin, Postman). Without the API-level guard, any unauthenticated request to `/api/admin/users` can read all emails, and a POST can create admin accounts. The layout check alone is not sufficient.

**Do not add new `/api/admin/*` routes without calling `requireAdmin()` at the top of every handler.**

### Lecture publish flow (`/admin/topics/[syncId]`)

The `LectureSection` component in `app/(app)/admin/topics/[syncId]/page.tsx` manages lecture state locally (never calls `onSaved()` after lecture operations, preventing form reset race conditions).

**`POST /api/admin/lectures`** — upserts the lecture for a given `topicId`. Defaults `is_published = true` unless the caller explicitly passes `is_published: false`. Sets `published_at` on first publish only — never overwrites it. Returns `{ ok: true, id: number }` so the client can store the integer ID immediately after creation.

**`PATCH /api/admin/lectures`** — publish-state toggle only. Body: `{ id: number; is_published: boolean }`. Never touches `title`, `format`, or `content`. Sets `published_at` when publishing for the first time; never clears it on unpublish.

**Status pill** — shows Draft/Published + relative time (last saved / last updated / just now). Dot indicator: green for published, muted for draft.

**Contextual buttons:**
- Published state: "Save changes" (POST with `is_published: true`) + "Unpublish" (opens modal)
- Draft state: "Save and publish" (POST with `is_published: true`) + "Save draft" (POST with `is_published: false`)

**Auto-save** — fires every 30 seconds for drafts only (`isDirtyRef && !isPublishedRef`). Uses inline ref sync pattern (`titleRef.current = title` in render body) to avoid stale closures without extra `useEffect` calls.

**Toast feedback** — shown after every save/publish/unpublish action. Publish toast includes a "View as student →" link to the topic's learn page.

**Unpublish modal** — native `<dialog>` element; opened via `dialogRef.current?.showModal()` in `useEffect`. Requires explicit confirmation before unpublishing.

**`published_at` lifecycle** — set once on first publish. Preserved across all subsequent saves, unpublish, and republish cycles. Never cleared by the API.

---

## Landing Page

The public landing page (`/`) is a fully static server-rendered page. `app/(public)/page.tsx` is a thin composition file — all content lives in section components under `app/(public)/_components/`. The underscore prefix prevents Next.js from treating files in that directory as routes.

**Sections (in render order):**
`Header` → `FoundingBanner` → `Hero` → `WhatsFree` → `HowItWorks` → `CurriculumCoverage` → `SampleQuestion` → `MeetTutors` → `Pricing` → `Testimonials` → `TrustStrip` → `FounderNote` → `FAQ` → `FinalCTA` → `Footer`

**Pending real content — each marked `// TODO` in the component file:**
- `FounderNote` — placeholder initials "MK"; replace with real founder photo and name once available
- `MeetTutors` — 3 placeholder cards; replace with real tutor profiles once tutors are onboarded
- `Testimonials` — 3 placeholder quotes; replace with real student feedback once collected
- `FoundingBanner`, `FinalCTA` — spot count hardcoded "247"; wire to a live DB count when founding cohort tracking is implemented

**Conventions for this page:**
- All 15 components are React Server Components — no `"use client"`, no client JS
- Icons use `lucide-react` (installed) — no inline SVG
- Accent sections: `bg-accent-soft border-y border-border`
- All CTAs use `<Link href="/signup">` or `<Link href="/login">` — no router needed
- FAQ uses native `<details>`/`<summary>` — no JS, fully accessible, Tailwind `group-open:` for the chevron animation
- `app/(public)/page.tsx` uses `export const dynamic = 'force-static'` (not `runtime = 'edge'`) — the page has no dynamic content so it is pre-rendered as a static HTML file at build time. Cloudflare Pages serves it directly without going through the edge worker. This is why the public layout also omits `runtime = 'edge'`.
- **Do not add `runtime = 'edge'` to `app/(public)/page.tsx` or `app/(public)/layout.tsx`.** Doing so makes the page edge-rendered. The edge worker crashes when SSR-ing the landing page (large component tree + lucide-react at module scope), and Next.js will warn that `runtime = 'edge'` is incompatible with `force-static`.

**Design system:** Token reference is in `app/_design-system.md`. CSS custom properties are defined in `app/globals.css` under `:root`. Tailwind extends them via `tailwind.config.ts`. Key tokens: `--accent` (eucalypt green `#2D5F4C`), `--font-display` (Fraunces), `--font-body` (Inter). Type scale utilities (`.text-hero`, `.text-section-title`, etc.) are in `@layer utilities` using `clamp()`.

---

## Dashboard (`/dashboard`)

The student dashboard at `app/(app)/dashboard/page.tsx` is a thin async server component that reads the JWT and composes Suspense-wrapped section components. All data fetching is in `app/(app)/dashboard/_lib/loaders.ts`.

**Greeting name resolution:** The page queries `users.display_name` for the logged-in user immediately after verifying the JWT. If `display_name` is null (accounts created before the field existed), it falls back to the email prefix (the part before `@`).

**Loader pattern** — each loader follows the same shape:
1. Query attempts/topics/subjects/years in sequential Supabase calls (PostgREST joins are used where safe; worksheets are always fetched by `topic_id` separately to avoid broken FK joins).
2. Build `Map` lookups to join in application code.
3. Return typed results; catch all errors and return `[]` so sections degrade gracefully.

**Section components** (`_components/`) are all async server components. Each exports:
- A default async component that fetches its own data and renders.
- A `*Skeleton` named export used as the Suspense fallback in `page.tsx`.

**Heading hierarchy:**
- Greeting (`<h2>`) — identification, not the primary page purpose.
- "Continue learning" / "Let's get you started" (`<h1>`) — primary page heading.
- All other section headings (`<h2>`).

**Known gaps (marked TODO in source):**
- No year level on the user model — `getUserSubjects` returns all active subjects; `getRecommendedTopics` ignores year filtering.
- No subject selection on the user model — "Your subjects" shows all subjects.
- Greeting shows "All your subjects" placeholder until user model gains `year_id` and subject preferences.
- Time-of-day greeting uses UTC+10 offset — no per-user timezone.
- `display_name` is not validated server-side in the signup route beyond being a non-empty string — the format check (letters/spaces/hyphens/apostrophes) is client-side only.

---

## Learn (`/learn/[syncId]`)

Single `force-dynamic` SSR route. All data fetching is in `app/(app)/learn/_lib/loaders.ts`. Components are in `app/(app)/learn/_components/`.

**Route param:** `syncId` = topic's `sync_id` (uuid). `getTopicWithLecture` returns null for unpublished or soft-deleted topics → `notFound()`.

**Loaders:**

| Loader | Notes |
|---|---|
| `getTopicWithLecture(syncId)` | Topic + lecture + subject + year. Null if not found/deleted/unpublished. Lecture may be unpublished (check `lecture.isPublished`). |
| `getWorksheetMetaForTopic(topicId, userId?)` | Returns `WorksheetMeta \| null`. Includes `bestAttempt` when `userId` provided. |
| `getCommentCountForTopic(topicId)` | Count of non-hidden, non-deleted comments. |
| `getCommentsForTopic(topicId)` | Flat fetch ordered by `id`, tree-built in application code. |

**Unpublished content rules:**
- Topic unpublished → `notFound()`
- Lecture unpublished, worksheet published → show "Lecture coming soon." + worksheet CTA
- Both unpublished → show "This topic is being prepared. Check back soon."

**Layout width:** `max-w-2xl` for text; `max-w-5xl` for video/slides.

**Subject slug in breadcrumb:** computed with `toSubjectSlug(subject.name)` (same function as browse pages — inline in the page file, not imported).

**Worksheet CTA:** links to `/worksheet/[worksheet.syncId]` (the worksheet's own `sync_id`, not the topic's).

**Comment tree:** built in application code from a flat ordered-by-id result. `CommentThread` renders up to 3 depth levels (0, 1, 2); replies of a depth-2 comment are not rendered. Reply button is disabled pending the comment POST endpoint.

**TODO:** install `remark-math` + `rehype-katex` and pass to `MarkdownContent` for LaTeX support in text lectures.

---

## Worksheet (`/worksheet/[syncId]`)

Single `force-dynamic` SSR route. The `syncId` param is the **worksheet's own `sync_id`** — not the topic's. All data fetching is in `app/(app)/worksheet/_lib/loaders.ts`. The interactive client is in `app/(app)/worksheet/[syncId]/WorksheetClient.tsx`. Shared components live in `app/(app)/worksheet/_components/`.

**Loaders:**

| Loader | Notes |
|---|---|
| `getWorksheetBySyncId(syncId)` | Worksheet + questions + topic + subject + year. Null if not found, deleted, or not published. |
| `getNextTopicInSubject(subjectId, topicId)` | First published topic in the same subject with `id > currentTopicId`, ordered by `id`. |

**Three-phase state machine (in `WorksheetClient`):**

1. **taking** — one question at a time; `ProgressBar`; Previous/Next; "Review →" on the last question moves to review.
2. **review** — all Q+A pairs in `ReviewPanel`; amber warning for unanswered auto-graded questions; per-question Edit button jumps back to a specific question; "Confirm & Submit" grades and submits.
3. **results** — score banner, per-question breakdown (`ResultsPanel`); Try Again / Back to Lecture / Next Topic (or Browse Topics if no next topic).

**Grading (`_lib/grading.ts` — `gradeAnswers`):**
- Essays: `correct = null`, excluded from `score` and `total`
- `score` = correct auto-graded answers; `total` = count of auto-graded questions
- These values are sent to `POST /api/attempts` (`worksheetId` is the integer `id`, not `sync_id`)

**localStorage draft:**
- Key: `worksheet:<syncId>:draft`
- Restored from localStorage on mount; saved on every answer change during taking phase
- Cleared on confirm & submit

**`WorksheetData` type:** contains `id` (integer, for the `/api/attempts` POST), `syncId`, `title`, `questions`, `difficulty`, and nested `topic` (with `topic.id` for `getNextTopicInSubject` and `topic.syncId` for the Back to Lecture link). Never expose `id` in URLs.

**Breadcrumb:** `Year · Subject · Topic · Worksheet` — all segments are links. Year links to `/browse/[yearName]`, Subject to `/browse/[yearName]/[subjectSlug]`, Topic to `/learn/[topicSyncId]`.

---

## Browse (`/browse/**`)

Three `force-dynamic` SSR routes. All data fetching is in `app/(app)/browse/_lib/loaders.ts`. Shared components live in `app/(app)/browse/_components/`.

**Slug conventions:**
- `[year]` = `years.name` (e.g. `year-12`)
- `[subject]` = subject name slugified: lowercase + spaces → hyphens (e.g. `mathematical-methods`). No DB column — derived at query time by `toSubjectSlug()`. `getSubjectByYearAndSlug` fetches all active subjects for the year and finds the first whose slugified name matches. If two subjects in the same year slug to the same value (not expected), the first result wins.

**Loaders (`_lib/loaders.ts`):**

| Loader | Queries | Notes |
|---|---|---|
| `getAllYears()` | 2 | Years + subject count per year |
| `getYearByName(yearName)` | 1 | Returns null if not found or inactive |
| `getSubjectsForYear(yearId)` | 2 | Subjects + topic counts + first 3 topic titles as preview |
| `getSubjectByYearAndSlug(yearId, slug)` | 1 | Fetches all subjects for the year, slug-matches in application code |
| `getTopicsForSubject(subjectId, userId)` | 4 | Topics → worksheets + lectures (parallel) → attempts |

All loaders catch all errors and return `[]` or `null` so pages degrade gracefully.

**Components:**
- `BreadcrumbNav` — `<nav aria-label="Breadcrumb">` with ordered list. Last crumb has no `href` and receives `aria-current="page"`.
- `TopicRow` — full-row `<Link>` to `/learn/[syncId]`. Status badge uses `aria-label` for screen readers: `"You have attempted this topic"` / `"You have not started this topic"`.

**Bad slugs:** year and subject pages call `notFound()` from `next/navigation` when the slug doesn't resolve.

**Heading hierarchy:** one `<h1>` per page (the year display name or subject name). Breadcrumb is above the `<h1>`.

**TODO:** topics in `getTopicsForSubject` are ordered by `created_at` ascending (assumes content is added in teaching order). Add a `display_order` column to `topics` for explicit ordering.

---

## Settings (`/settings/**`)

`/settings` is a placeholder hub page. Currently it has one sub-section.

### `/settings/security` — Recent activity

Shows the current user's last 20 login attempts from `login_attempts`.

**File structure:**
```
app/(app)/settings/
├── page.tsx                        Settings hub (placeholder)
└── security/
    ├── page.tsx                    Recent activity — async server component
    └── _lib/
        ├── loaders.ts              getRecentLoginAttempts(userId, limit?)
        └── user-agent.ts           parseUserAgent(ua) → { os, browser }
```

**Loader (`getRecentLoginAttempts`):**
- Queries `login_attempts` where `user_id = userId` and `outcome != 'user_not_found'` and `deleted_at is null`, ordered by `attempted_at desc`, limit 20.
- Masks IP to first two octets (e.g. `203.0.x.x`) — never exposes raw IP.
- Parses user-agent inline into `{ os, browser }` — no library.
- Returns only `syncId`, `attemptedAt`, `outcome`, `ipMasked`, `device` — never raw `id`, `ip_address`, or `user_agent`.

**UA parser (`parseUserAgent`):** inline regex — OS: macOS / Windows / iOS / Android / Linux / Unknown; Browser: Edge / Chrome / Firefox / Safari / Other. Edge is checked before Chrome (Edge's UA contains "Chrome").

**Page:** reads JWT to get `userId`, calls loader, renders a bordered card list. Outcome dot: green for `success`, red for failures, none for `error`. Time: relative under 7 days, absolute beyond. Empty state rendered when no rows.

---

## Error Monitoring (Sentry)

**Sentry is configured on `feature-testing` only — not on `main`.** `@sentry/nextjs` v10 is incompatible with `@cloudflare/next-on-pages@1`: the webpack plugin produces a fatal "A duplicated identifier has been detected in the same function file" build error. Do not merge the Sentry config to `main` until the build adapter is migrated to [OpenNext](https://opennext.js.org/).

**Org:** `at-ease-tutoring` · **Project:** `prod` · **Region:** EU (`ingest.de.sentry.io`)

### Files

| File | Purpose |
|---|---|
| `instrumentation-client.ts` | Browser-side `Sentry.init()`; exports `onRouterTransitionStart`; tunnel set to `/monitoring` |
| `sentry.server.config.ts` | Node.js runtime `Sentry.init()`; `beforeSend` scrubbing + 4xx/redirect filtering |
| `sentry.edge.config.ts` | Edge runtime `Sentry.init()`; same scrubbing, no Node-only APIs |
| `instrumentation.ts` | `register()` dynamically imports the correct config per `NEXT_RUNTIME`; exports `onRequestError` |
| `lib/sentry/scrub.ts` | `scrubObject()` — recursively redacts password, token, cookie, session, apikey fields |
| `app/api/monitoring/route.ts` | Tunnel proxy — forwards browser events via the app domain to bypass ad blockers |
| `app/api/sentry-test/route.ts` | Throws a test error on `GET` — **remove or gate before public launch** |
| `next.config.mjs` | Wrapped with `withSentryConfig` (`silent`, `widenClientFileUpload`, `hideSourceMaps`) |
| `app/(app)/layout.tsx` | Calls `Sentry.setUser({ id: session.syncId, segment: 'admin' \| 'user' })` after JWT verification |

### Privacy design

- **User identity:** `sync_id` only — never email or any other PII
- **Cookies:** values fully redacted in `beforeSend`; only keys are kept
- **Session replay:** disabled (`replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`) — privacy concern for under-18 users
- **Control-flow errors dropped:** `NEXT_REDIRECT` and `NEXT_NOT_FOUND` return `null` in `beforeSend`
- **Expected HTTP codes dropped on server/edge:** 401, 403, 404, 429

### Required env vars

```
NEXT_PUBLIC_SENTRY_DSN=   # browser-visible DSN (inlined at build time)
SENTRY_DSN=               # server/edge DSN (same value, not public)
SENTRY_ENVIRONMENT=       # e.g. development | production
```

Optional — enables source map upload during `npm run build`:

```
SENTRY_AUTH_TOKEN=        # Sentry → Settings → Auth Tokens → create with project:releases scope
SENTRY_ORG=at-ease-tutoring
SENTRY_PROJECT=prod
```

### `global-error.tsx` constraint

`app/global-error.tsx` must **never** import from `@sentry/nextjs` server SDK. Doing so pulls in `@prisma/instrumentation` (which uses dynamic `require`) into the edge bundle, crashing every edge-rendered route across the entire app. The current `global-error.tsx` is a plain error boundary with no Sentry dependency.

### Re-integrating Sentry on `main`

Cloudflare now recommends [OpenNext](https://opennext.js.org/) over `@cloudflare/next-on-pages`. Migrating the build adapter is the required prerequisite. Do not attempt to add Sentry to `main` while `@cloudflare/next-on-pages` is in use.

---

## Cloudflare Deployment

The app is deployed to **Cloudflare Pages** using `@cloudflare/next-on-pages`.

**Build tool:** `npx @cloudflare/next-on-pages@1`
**Output dir:** `.vercel/output/static`
**Wrangler config:** `wrangler.jsonc` at root with `pages_build_output_dir` and `nodejs_compat` flag.

### Edge runtime rules

Dynamic routes (pages, layouts, API routes) that perform server-side work must declare `export const runtime = 'edge'` — without this, Next.js tries to pre-render at build time and crashes because Supabase env vars are not available.

**Critical constraint — do NOT put `runtime = 'edge'` in `app/layout.tsx` (the root layout).** The root layout's runtime propagates to all child routes. If it is `'edge'`, Next.js treats every child route as edge-rendered and `dynamic = 'force-static'` is silently ignored, preventing static generation. The root layout has no runtime declaration.

**Where to declare `runtime = 'edge'`:**
- `app/(app)/layout.tsx` — authenticates all app-zone routes
- `app/(auth)/layout.tsx` — serves the login/signup zone
- Every `/api/**` route file individually
- `middleware.ts` is edge by default (no declaration needed)

**Purely static pages** (no async data, no cookies): use `export const dynamic = 'force-static'` instead of `runtime = 'edge'`. Next.js pre-renders these as static HTML at build time; `next-on-pages` emits them as static files and Cloudflare Pages serves them without invoking the edge worker. The landing page (`app/(public)/page.tsx`) uses this pattern.

**Checking route types:** `npm run build` outputs `○` for static (pre-rendered) and `ƒ` for dynamic (edge-rendered). The landing page should always show `○ /`. If it shows `ƒ /`, the edge runtime is bleeding in from a parent layout.

### Next.js 15 async APIs — required pattern

The app is on Next.js 15. Two APIs became async and must be awaited:

**`cookies()` from `next/headers`** — in every server component and API route that reads the session cookie:
```ts
// WRONG (Next.js 14):
const token = cookies().get(COOKIE_NAME)?.value;

// CORRECT (Next.js 15):
const token = (await cookies()).get(COOKIE_NAME)?.value;
```

**`params` in dynamic routes** — server pages and API route handlers now receive `params` as a Promise:
```ts
// WRONG (Next.js 14):
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);

// CORRECT (Next.js 15):
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
```

**Exception:** client components using the `useParams()` hook are NOT affected — `useParams()` is synchronous and unchanged.

### Edge runtime compatibility

- `react-markdown` uses React hooks internally — any page/component that uses it must be `'use client'` when the page has `runtime = 'edge'`. (`components/lecture/MarkdownContent.tsx` already has `'use client'`.)
- `workerd` (required by `@cloudflare/next-on-pages`) does not run on Windows ARM64. Use `npm run build` for local verification; the Cloudflare build environment (Linux x64) handles the full `@cloudflare/next-on-pages` build.

---

## What NOT To Do

- **Don't expose `id` to API clients.** All external references use `sync_id`. Login/signup responses must not include the bigserial `id`.
- **Don't add `/api/admin/*` routes without calling `requireAdmin()`.** The admin layout does not protect direct API calls.
- **Don't write to `_history` tables.** Triggers handle it.
- **Don't enable RLS or write Supabase policies.** Auth is in the API layer.
- **Don't hard-delete rows.** Set `deleted_at`.
- **Don't manually set `updated_at`.** The trigger does it.
- **Don't store or log plaintext passwords or reset tokens.** The DB stores only the SHA-256 hash of the reset token; the raw token exists only in the email and in transit.
- **Don't throw from `sendEmail()`.** Email-send failures must be swallowed — a Resend outage should never fail a password reset request or expose internals.
- **Don't issue a JWT after `POST /api/auth/reset-password`.** The user must log in manually. Issuing a session automatically would bypass any MFA or account-lock logic added later.
- **Don't add columns without updating the history table and its trigger function.**
- **Don't create new tables without the full standard pattern** (see checklist below).
- **Don't put `runtime = 'edge'` in `app/layout.tsx` (the root layout).** It propagates to all child routes and breaks `dynamic = 'force-static'` on static pages, causing them to crash in the edge worker.
- **Don't import `@sentry/nextjs` from `app/global-error.tsx`.** It pulls the Sentry server SDK (and its Node.js-only `@prisma/instrumentation` dependency) into the edge bundle, crashing every edge-rendered route.

---

## Adding a New Table — Checklist

- [ ] `id bigserial primary key`
- [ ] `sync_id uuid not null unique default gen_random_uuid()`
- [ ] `created_at timestamptz not null default now()`
- [ ] `updated_at timestamptz not null default now()`
- [ ] `deleted_at timestamptz`
- [ ] `touch_updated_at` trigger (`BEFORE UPDATE`)
- [ ] `<name>_history` mirror table — no FK, no check, no unique constraints
- [ ] `<name>_history_capture()` trigger function
- [ ] History trigger (`AFTER INSERT OR UPDATE OR DELETE`)
- [ ] All FKs reference `id` (bigserial), never `sync_id`

---

## Known Gaps

- **History tables grow unboundedly.** No archival, partitioning, or TTL is
  implemented.
- **No question bank.** Questions are embedded in `worksheets.questions` JSONB
  and cannot be reused or queried individually across worksheets.
- **No progress tracking.** Beyond raw attempt rows there is no completion
  state, streaks, or learning paths.
- **Unlimited comment nesting.** `parent_comment_id` allows arbitrary depth;
  the API must enforce a cap.
- **Polymorphic `reports.entity_id` has no DB-level FK.** The API must validate
  entity existence.
- **No session/token tables.** Session management and refresh tokens belong in the API layer or a future migration. Rate limiting is handled by Upstash Redis.
- **`attempts` indices are not partial.** Soft-deleted attempts are included in
  index scans. Add `WHERE deleted_at IS NULL` partial indices if
  soft-deleted rows become numerous.
