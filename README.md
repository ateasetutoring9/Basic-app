# At Ease Learning

Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback, all in one place.

## Purpose

At Ease Learning delivers structured lectures and interactive worksheets for secondary school students (Years 7–12) at no cost. Students browse content by year level then subject, complete worksheets, and receive instant automated feedback. Progress is saved for signed-in users; worksheets are fully usable as a guest.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Auth & database | Supabase (email/password, `attempts` table) |
| Content | File-system markdown/JSON under `content/` |

## Folder layout

```
/
├── app/                        # Next.js App Router pages & layouts
│   ├── (auth)/                 # Login, signup, logout routes
│   ├── browse/                 # Year → subject → topic browsing
│   ├── learn/                  # Lecture viewer
│   ├── worksheet/              # Interactive worksheet
│   └── progress/               # Auth-required progress dashboard
├── components/
│   ├── auth/                   # LoginForm, SignupForm (client components)
│   ├── lecture/                # MarkdownContent, YouTubeFacade, SlidesViewer
│   └── ui/                     # Button, Input, Card, PageContainer
├── content/
│   └── {subject}/year-{N}/    # meta.json + lecture.md + worksheet.json per topic
├── images/
│   └── logo/                   # Site logo assets
├── lib/
│   ├── content/                # loader.ts, schemas.ts, types.ts
│   ├── supabase/               # client.ts, server.ts, database.types.ts
│   └── grading.ts              # Client-side worksheet grading logic
└── scripts/
    └── validate-content.ts     # Validates all content files against Zod schemas
```

## Getting started

```bash
cp .env.local.example .env.local   # add your Supabase keys
npm install
npm run dev                        # development server at http://localhost:3000
```

Without Supabase credentials, auth is silently skipped and all pages render in guest mode.

## Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm run content:check # Validate all content files against schemas
```

## Environment variables

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → your project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → your project → Settings → API → anon public key |

`.env.local` is listed in `.gitignore` — never commit real keys.

## Managing content

### Folder structure

Each topic is a folder under `content/{subject}/year-{N}/{slug}/`:

| File | Required | Purpose |
|------|----------|---------|
| `meta.json` | Yes | `title`, `description`, `orderIndex` |
| `lecture.md` | No | Frontmatter sets `format: text \| video \| slides` |
| `worksheet.json` | No | Questions (multiple-choice, numeric, fill-blank) |
| `slides.html` | When `format: slides` | Raw HTML rendered in a sandboxed iframe |

### Adding a topic

**1. Create the folder**

```
content/math/year-9/quadratic-equations/
```

**2. `meta.json`** (required)

```json
{
  "title": "Quadratic Equations",
  "description": "Solving quadratics by factoring, completing the square, and the formula.",
  "orderIndex": 4
}
```

`orderIndex` controls sort order within a year/subject — lower numbers appear first.

**3. `lecture.md`** (optional)

Text lecture:
```md
---
format: text
---

## Introduction
Your markdown content here...
```

YouTube video:
```md
---
format: video
youtubeId: dQw4w9WgXcQ
durationSeconds: 212
---
```

Slides (also requires a `slides.html` file in the same folder):
```md
---
format: slides
---
```

**4. `worksheet.json`** (optional)

```json
{
  "title": "Quadratic Equations Practice",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "prompt": "Which values satisfy x² - 5x + 6 = 0?",
      "options": ["x = 2 and x = 3", "x = 1 and x = 6", "x = -2 and x = -3"],
      "answer": "x = 2 and x = 3"
    },
    {
      "id": "q2",
      "type": "numeric",
      "prompt": "Solve: x² = 49. Enter the positive value of x.",
      "answer": 7
    },
    {
      "id": "q3",
      "type": "fill-blank",
      "prompt": "The quadratic formula is x = (-b ± √(b²-4ac)) / ___",
      "answer": "2a"
    }
  ]
}
```

### Updating existing content

Edit the files directly. Changes are reflected on the next page load in dev mode, or after the next `npm run build` for production.

### Validating content

Always run this after adding or editing content:

```bash
npm run content:check
```

It catches missing fields, bad JSON, and invalid question types before they reach production.

### Content editor (`/edit`)

A frontend-only editor for authoring topic content without touching the filesystem directly. No auth, no database — validates locally and copies file-ready JSON to the clipboard for manual pasting into `content/` folders.

**Files created**

| File | Purpose |
|---|---|
| `app/edit/page.tsx` | Route `/edit` — thin server shell |
| `app/edit/EditorClient.tsx` | Full 3-tab editor with validation, preview, Save, Copy JSON |
| `components/admin/QuestionEditor.tsx` | Shared question editor component (extracted from `WorksheetEditorClient`) |
| `components/lecture/MarkdownPreview.tsx` | Client-boundary re-export of `MarkdownContent` for use inside client trees |
| `components/admin/WorksheetEditorClient.tsx` | Modified — removed ~150 lines of duplicated question logic; now imports from `QuestionEditor` |

**How it works**

The editor has three tabs — **Topic**, **Lecture**, and **Worksheet** — each with an **Edit / Preview** toggle.

- **Topic tab** — fills in `meta.json`: subject, year level (7–12), slug, title, description, and order index. Preview shows how the topic card appears on the browse page.
- **Lecture tab** — choose a format (Markdown / YouTube / Slides HTML); only the relevant field is shown. Preview fires the real student-facing viewer (`MarkdownContent`, `YouTubeFacade`, or `SlidesViewer`) with the in-memory content.
- **Worksheet tab** — set a title and build a question list using the shared `QuestionEditor` component. Preview hands the constructed `Worksheet` object directly to `WorksheetClient` so you see exactly what students will see.
- **Save** — validates all tabs with Zod, then `console.log`s the full payload and shows a "Saved (stub)" toast. No persistence yet.
- **Copy JSON** — copies the active tab's file-ready JSON to clipboard (Topic → `meta.json`, Lecture → frontmatter/slides, Worksheet → `worksheet.json`).
- **Validation** — inline field errors appear on blur and on a failed save attempt; Save is disabled until all errors clear.

### Adding a new subject

1. Add its slug to the `Subject` union in `lib/content/types.ts`
2. Add a display entry to the `SUBJECT_CATALOGUE` array in `app/browse/[year]/page.tsx`
3. Add its label to the `SUBJECT_LABELS` objects in `app/learn/[subject]/[year]/[topic]/page.tsx` and `app/worksheet/[subject]/[year]/[topic]/page.tsx`
4. Create content folders under `content/{subject}/year-{N}/{slug}/`

## Deployment (Cloudflare Pages)

`npm run build` produces a fully static export in `/out`. No server runtime is required.

### One-time setup

1. Push the repo to GitHub.
2. In the Cloudflare dashboard → **Pages → Create project → Connect to GitHub** → select the repo.
3. Set build settings:

   | Setting | Value |
   |---|---|
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Deploy command | *(leave empty)* |

   > **Important:** Leave the Deploy command field blank. Cloudflare Pages deploys the output directory automatically after a successful build — no wrangler deploy command is needed when using the GitHub integration.

4. Add environment variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NODE_VERSION` | `20` |

5. Deploy. Cloudflare Pages will build and publish automatically on every push to `main`.

### Supabase URL configuration

After the first deployment, update Supabase so auth redirects work correctly:

1. Go to **Supabase dashboard → Authentication → URL Configuration**.
2. Set **Site URL** to your Pages URL (e.g. `https://at-ease-learning.pages.dev`).
3. Add the same URL to **Redirect URLs**.

### How static export and auth coexist

All auth state is determined client-side via the Supabase browser client:

- **Nav and home page** — show guest state in the initial HTML, then update after the browser checks the session (no flash for unauthenticated users; a brief update for authenticated users).
- **Progress page** — protected client-side; redirects to `/login` in the browser if no session is found.
- **Worksheets** — scores are saved to Supabase after the browser confirms the user is signed in. Guest users can complete worksheets but scores are not saved.

The `logout/route.ts` API route has been removed — `LogoutButton` calls `supabase.auth.signOut()` directly in the browser, which is sufficient.

### CI — GitHub Actions

`.github/workflows/validate.yml` runs on every pull request to `main`:

```
npm ci → npm run content:check → npm run lint → npm run build
```

No Supabase secrets are required in CI — auth is purely client-side, so the build succeeds without the env vars set.

## v3 schema migration

Full migration from the v1 schema (Supabase Auth, RLS, filesystem content) to the v3 schema (custom `users` table, no RLS, all content in Supabase DB). See `CLAUDE.md` and `supabase/README.md` for the complete architectural specification.

### Routing changes

| Before | After |
|--------|-------|
| `/learn/[subject]/[year]/[topic]` | `/learn/[syncId]` |
| `/worksheet/[subject]/[year]/[topic]` | `/worksheet/[syncId]` |
| Browse `[subject]` param = slug string | Browse `[subject]` param = `subject.syncId` (UUID) |
| Browse `[year]` param = number | Browse `[year]` param = `year.name` (e.g. `"year-7"`) |

### Files changed

| File | Change |
|------|--------|
| `app/learn/[syncId]/page.tsx` | **New** — replaces `[subject]/[year]/[topic]/page.tsx`; uses `getTopicBySyncId()` |
| `app/worksheet/[syncId]/page.tsx` | **New** — replaces `[subject]/[year]/[topic]/page.tsx`; uses `getTopicBySyncId()` |
| `app/browse/page.tsx` | Rewritten — derives year slots from `getActiveSubjects()` instead of a hardcoded array |
| `app/browse/[year]/page.tsx` | Rewritten — `[year]` is `year.name`; subjects fetched from DB, no hardcoded catalogue |
| `app/browse/[year]/[subject]/page.tsx` | Rewritten — `[subject]` is `subject.syncId`; topic links use `syncId` |
| `lib/content/types.ts` | Rewritten — v3 types: `Year`, `Subject` (with `year`), `Topic` (with `syncId`, `subject`, no `slug`/`year`/`orderIndex`) |
| `lib/content/loader.ts` | Rewritten — `getAllTopics()`, `getTopicBySyncId()`, `getActiveSubjects()` all query Supabase |
| `lib/supabase/database.types.ts` | Rewritten — v3 tables: `users`, `years`, `subjects`, `topics`, `lectures`, `worksheets`, `attempts`, `comments`, `reports` |
| `lib/supabase/client.ts` | Fixed import alias conflict; removed `supabase.auth.*` note |
| `lib/supabase/server.ts` | Rewritten — plain `createClient` with service role key; removed `@supabase/ssr` |
| `lib/auth/session.ts` | **New** — `getSession()`, `login()`, `signup()`, `logout()` helpers; calls `/api/auth/*` |
| `middleware.ts` | Stripped Supabase Auth session refresh; now a pass-through |
| `components/auth/LoginForm.tsx` | Replaced `supabase.auth.signInWithPassword` with `login()` from `lib/auth/session` |
| `components/auth/SignupForm.tsx` | Replaced `supabase.auth.signUp` with `signup()` from `lib/auth/session` |
| `components/LogoutButton.tsx` | Replaced `supabase.auth.signOut` with `logout()` from `lib/auth/session` |
| `components/NavAuth.tsx` | Replaced `supabase.auth.getUser` + `onAuthStateChange` with `getSession()` |
| `components/HomeAuth.tsx` | Same as NavAuth |
| `components/WorksheetClient.tsx` | Attempt save uses `getSession()` → `user.id` (number); no more `supabase.auth` |
| `components/ProgressClient.tsx` | Rewritten — v3 join structure (`attempts → worksheets → topics → subjects → years`); groups by `subjectName`/`yearDisplay`; Review links to `/learn/${syncId}` |
| `app/admin/worksheets/page.tsx` | Groups by `topic.subject.name` / `topic.subject.year.displayName`; edit links use `?syncId=` |
| `app/admin/worksheets/edit/EditWorksheetClient.tsx` | Looks up topics by `sync_id`; passes `topicId`/`topicSyncId` to editor |
| `components/admin/WorksheetEditorClient.tsx` | Props changed to `topicId`/`topicSyncId`; API calls updated |
| `app/api/admin/worksheet/route.ts` | Replaced filesystem writes with Supabase DB upsert/soft-delete |
| `app/api/auth/login/route.ts` | **New** — stub; implement credential validation against `users` table |
| `app/api/auth/signup/route.ts` | **New** — stub; implement user creation with hashed password |
| `app/api/auth/logout/route.ts` | **New** — stub; clears session cookie |
| `app/api/auth/me/route.ts` | **New** — stub; returns current user from session token |
| `app/edit/EditorClient.tsx` | Fixed preview `Worksheet` to use v3 type (`id: number`, `syncId`, `difficulty`) |
| `scripts/validate-content.ts` | Updated to use v3 `Topic` properties (`topic.subject.name`, `topic.syncId`) |
| `supabase/README.md` | Rewritten for v3 schema |
| `CLAUDE.md` | Rewritten for v3 schema |

### Environment variables

Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` for the server client (falls back to anon key if absent):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### What's still a stub

~~The `/api/auth/*` routes return `501 Not Implemented`.~~ Auth is now fully implemented — see below.

---

## Auth implementation

Replaces the stub `/api/auth/*` routes with a working credential-based auth system against the `users` table. No Supabase Auth — sessions are JWT cookies issued by the API.

### Packages added

| Package | Purpose |
|---------|---------|
| `bcryptjs` | Password hashing (cost 12); pure JS, edge-compatible |
| `jose` | JWT sign/verify using HMAC-SHA256; edge-compatible |
| `@types/bcryptjs` | TypeScript types for bcryptjs |

### Files changed

| File | Change |
|------|--------|
| `lib/auth/jwt.ts` | **New** — `signToken()`, `verifyToken()`, shared `COOKIE_NAME` and `COOKIE_OPTIONS` (HTTP-only, SameSite=Lax, 7-day expiry, `secure` in production) |
| `app/api/auth/signup/route.ts` | Implemented — checks for duplicate email, hashes password with bcrypt, inserts into `users`, returns signed JWT cookie |
| `app/api/auth/login/route.ts` | Implemented — fetches user by email, runs `bcrypt.compare` (always runs even when user not found to prevent timing enumeration), checks `locked_until`, increments `failed_login_attempts` on failure / resets on success, sets JWT cookie |
| `app/api/auth/me/route.ts` | Implemented — reads session cookie, verifies JWT, returns `{ id, syncId, email, isAdmin }` |
| `app/api/auth/logout/route.ts` | Implemented — deletes session cookie |

### Environment variable required

Add to `.env.local` (and to Cloudflare Pages environment variables before deploying):

```
JWT_SECRET=<long-random-string>
```

Falls back to a hardcoded dev string if unset — **must be set in production** or tokens can be forged.

---

## Polish pass — audit findings & fixes

| Area | Finding | Fix |
|------|---------|-----|
| **Loading states** | No `loading.tsx` files; dynamic pages (home, browse, progress) could flash blank content | Added `animate-pulse` skeleton loaders for home, browse, and progress routes |
| **Error boundary** | No `error.tsx` or `not-found.tsx`; errors and 404s showed raw Next.js defaults | Created `app/error.tsx` (Try again / Go home CTAs) and `app/not-found.tsx` (Browse topics CTA) |
| **Metadata** | Every tab showed the site name — no per-route titles or descriptions | Root layout uses `"%s — At Ease Learning"` template; all routes export `metadata` or `generateMetadata` |
| **Accessibility** | Two breadcrumb `<nav>` elements missing `aria-label`; `/` separators not hidden from screen readers; markdown `h2` rendered as `<h2>` same as `h1`, collapsing heading hierarchy | Added `aria-label="Breadcrumb"` and `aria-hidden="true"` on separators; fixed heading demotion (`h1`→`h2`, `h2`→`h3`, `h3`→`h4`) |
| **Performance** | `MarkdownContent` was a client component, shipping `react-markdown` + `remark-gfm` (~50 KB) to the browser unnecessarily | Removed `"use client"` — component is now server-only; libraries excluded from the client bundle |
| **Mobile (360 px)** | Progress stats grid (`grid-cols-3 p-5 text-3xl`) was too tight at narrow widths | Responsive padding (`p-3 sm:p-5`), font size (`text-2xl sm:text-3xl`), and gap (`gap-2 sm:gap-3`) |
| **Empty states** | All list views already handled empty states correctly | No changes needed |
| **Dev showcase** | `/dev-showcase` route was accessible in production | Deleted `app/dev-showcase/page.tsx` and `components/ui/_showcase.tsx` |
