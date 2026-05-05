# At Ease Learning

Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback.

---

## Stack

| Layer | Detail |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
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

## Landing Page (`/`)

The public landing page lives at `app/(public)/page.tsx` — a thin server-component composition file. Section components are co-located in `app/(public)/_components/` (underscore prefix keeps them out of Next.js routing).

| Component | Purpose |
|---|---|
| `Header` | Logo + Log in / Sign up free nav links |
| `FoundingBanner` | Indigo accent strip — hardcoded "247 founding spots" |
| `Hero` | Eyebrow, h1, primary CTA → `/signup`, secondary → `/browse` |
| `WhatsFree` | 4 feature tiles with inline SVG icons |
| `HowItWorks` | 4 numbered steps |
| `CurriculumCoverage` | AU exam board pill badges (VCE, HSC, QCE, ATAR, SACE, etc.) |
| `SampleQuestion` | Year 12 Maths Methods differentiation worked example |
| `MeetTutors` | 3 placeholder tutor cards with WWCC badge |
| `Pricing` | 3-column comparison: private tutoring / At Ease / online platforms |
| `Testimonials` | 3 placeholder student/parent quote cards |
| `TrustStrip` | Indigo accent strip — 4 trust signals |
| `FounderNote` | Two-column founder's note with "MK" placeholder avatar |
| `FAQ` | 6 native `<details>`/`<summary>` accordions |
| `FinalCTA` | Indigo accent, CTA → `/signup`, login link |
| `Footer` | Logo, nav links, copyright |

**Pending real content (marked `// TODO` in each file):**
- Founder photo and name — currently "MK" initials placeholder in `FounderNote`
- Tutor profiles — 3 placeholder cards in `MeetTutors` need real names, subjects, bios
- Student testimonials — 3 placeholder quotes in `Testimonials` need real feedback
- Founding spot count — hardcoded "247" in `FoundingBanner` and `FinalCTA`; replace with a live DB count once cohort tracking is implemented

**Conventions:**
- All 15 components are React Server Components — no `"use client"`, no client-side JS
- All icons are inline SVG — no external icon library
- Accent sections use `bg-indigo-50 border-y border-indigo-100`

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

---

## Cloudflare Deployment

The app is deployed to **Cloudflare Pages** using `@cloudflare/next-on-pages`. All routes use `export const runtime = 'edge'` so they run on Cloudflare's edge network.

### Cloudflare Pages — Dashboard Settings

In **Workers & Pages → your project → Settings → Build**:

| Setting | Value |
|---|---|
| **Build command** | `npx @cloudflare/next-on-pages@1` |
| **Build output directory** | `.vercel/output/static` |

In **Settings → Functions**:

| Setting | Value |
|---|---|
| **Compatibility flag** | `nodejs_compat` |

### Environment Variables

Set these under **Settings → Environment Variables** for both **Production** and **Preview** environments:

| Variable | Type | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Plain text | Supabase → Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain text | Supabase → Project → Settings → API → `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Supabase → Project → Settings → API → `service_role` key |
| `JWT_SECRET` | **Secret** | A random 48-character string — generate once, never change |

`NEXT_PUBLIC_*` variables are inlined at build time, so they must be present when Cloudflare runs the build (set them as **Build** variables, not just runtime).

### Generating a JWT_SECRET

```powershell
# Run once in PowerShell, copy the output
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | % {[char]$_})
```

Or use any password manager's random string generator — 48+ characters, mixed case and numbers.

### Wrangler config

`wrangler.jsonc` at the project root is already configured:

```jsonc
{
  "name": "basic-app",
  "compatibility_date": "2026-04-22",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": ".vercel/output/static"
}
```

### Deploying changes

Cloudflare Pages is connected to GitHub. Every push to `main` triggers an automatic build and deploy:

```bash
git push origin main
```

No manual deploy command is needed.

### Note on local build tools

`@cloudflare/next-on-pages` depends on `workerd`, which does not support Windows ARM64. The build runs in Cloudflare's Linux x64 environment — you do not need to run it locally. Use `npm run build` (standard Next.js build) for local verification.
