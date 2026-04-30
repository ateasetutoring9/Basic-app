# At Ease Learning

Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback.

---

## Stack

| Layer | Detail |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Supabase (PostgreSQL) — no RLS, no Supabase Auth |
| Auth | Custom JWT (jose, HS256) in an HTTP-only `session` cookie, 7-day expiry |
| Passwords | bcryptjs, cost 12 |
| Validation | Zod |
| Markdown | react-markdown + remark-gfm |

---

## Route Zone Architecture

The app uses Next.js route groups to split into three zones. Parenthesised folder names do not appear in URLs.

```
app/
├── (public)/          →  /               No navbar. No auth required.
├── (auth)/            →  /login          No navbar. Logged-in users → /dashboard.
│                         /signup
└── (app)/             →  /dashboard      Navbar. Valid session required.
      ├── browse/          /browse/**
      ├── learn/           /learn/[syncId]
      ├── worksheet/       /worksheet/[syncId]
      ├── progress/        /progress/**
      ├── edit/            /edit
      └── admin/           /admin/**
```

**Auth enforcement is layered:**

1. `middleware.ts` — edge check, cookie presence only. Redirects unauthenticated requests to app routes → `/login`, and authenticated requests to `/login`/`/signup` → `/dashboard`.
2. `app/(app)/layout.tsx` — server component, full JWT verification. Redirects to `/login` if the token is missing, invalid, or expired.
3. `app/(app)/admin/layout.tsx` — additionally enforces `isAdmin`. Redirects non-admins to `/dashboard`.

---

## Key Files

| File | Purpose |
|---|---|
| `middleware.ts` | Edge auth gate — cookie presence check |
| `app/(app)/layout.tsx` | App-zone layout — JWT verification + TopNav |
| `app/(app)/admin/layout.tsx` | Admin sidebar + isAdmin check |
| `lib/auth/jwt.ts` | `signToken()`, `verifyToken()`, `COOKIE_NAME`, `COOKIE_OPTIONS` |
| `lib/auth/session.ts` | Client helpers: `getSession()`, `login()`, `signup()`, `logout()` |
| `lib/supabase/server.ts` | `createServerClient()` — service role key, server-only |
| `lib/supabase/database.types.ts` | Generated Supabase types |
| `lib/content/loader.ts` | `getAllTopics()`, `getTopicBySyncId()` etc. (published-only) |
| `lib/content/schemas.ts` | Zod schemas for all 5 question types |
| `lib/grading.ts` | Pure grading logic for all question types |
| `components/TopNav.tsx` | Site navbar (rendered by `(app)/layout.tsx` only) |
| `components/NavAuth.tsx` | Auth-aware nav items; re-fetches session on every route change via `usePathname` |

---

## Content Hierarchy

```
years → subjects → topics → lecture (1:1) + worksheet (1:1) → attempts
```

---

## Database Conventions

- **Dual-key:** every table has `id` (bigserial, internal FKs only) and `sync_id` (uuid, used in all URLs and API responses). Never expose `id` to clients.
- **Soft delete:** every table has `deleted_at`. Never hard-delete — set `deleted_at = now()`.
- **`updated_at` is trigger-managed.** Never set it manually.
- **History tables** (`*_history`) are append-only audit logs written by triggers. Never write to them from application code.
- **No RLS.** Auth is enforced in the API layer, not the database.

---

## Question Types

Stored in `worksheets.questions` JSONB, validated in `lib/content/schemas.ts`:

| Type | Auto-graded | Notes |
|---|---|---|
| `mcq_single` | Yes | `options[]`, `answer` (zero-based index) |
| `mcq_multi` | Yes | `options[]`, `answers[]` (all indices must match) |
| `short_text` | Yes | `acceptedAnswers[]`, optional `caseSensitive` |
| `numeric` | Yes | `answer`, optional `tolerance` and `unit` |
| `essay` | No | Free text, never counted correct |

---

## Admin

`/admin/**` requires `users.is_admin = true` — the only access-control flag in the system.

| Route | Purpose |
|---|---|
| `/admin` | Dashboard — live counts of content and users |
| `/admin/years` | CRUD year levels, toggle active |
| `/admin/subjects` | CRUD subjects, year filter |
| `/admin/topics` | CRUD topics (metadata), subject filter, publish toggle |
| `/admin/topics/[syncId]` | Topic detail — metadata, lecture editor, worksheet summary |
| `/admin/topics/[syncId]/worksheet` | Full worksheet editor (all 5 question types) |
| `/admin/users` | CRUD user accounts, admin flag toggle |

Admin API routes live under `/api/admin/` and use integer `id` for PATCH/DELETE, `sync_id` for GET-by-identity.

---

## Auth Flow

| Action | Redirect |
|---|---|
| Login / Signup success | `/dashboard` |
| Logout | `/login` |
| Unauthenticated → app route | `/login` |
| Authenticated → `/login` or `/signup` | `/dashboard` |
| Authenticated but not admin → `/admin/**` | `/dashboard` |

---

## Local Development

```bash
npm install
npm run dev
```

Required `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```

`JWT_SECRET` falls back to a hardcoded dev string if unset — **must be set in production**.
