# At Ease Learning

Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback.

---

## Stack

| Layer | Detail |
|---|---|
| Framework | Next.js 15 (App Router), TypeScript |
| Styling | Tailwind CSS + CSS custom properties (design tokens in `app/_design-system.md`) |
| Icons | lucide-react |
| Database | Supabase (PostgreSQL) — no RLS, no Supabase Auth |
| Auth | Custom JWT (jose, HS256) in an HTTP-only `session` cookie, 7-day expiry |
| Passwords | bcryptjs, cost 12 |
| Validation | Zod |
| Markdown | react-markdown + remark-gfm |
| Email | Resend — transactional email (password reset) |
| Rate limiting | Upstash Redis + @upstash/ratelimit (sliding window) |

---

## Route Zone Architecture

The app uses Next.js route groups to split into three zones. Parenthesised folder names do not appear in URLs.

```
app/
├── (public)/          →  /               No navbar. No auth required.
├── (auth)/            →  /login          No navbar. Logged-in users → /dashboard.
│                         /signup
│                         /forgot-password
│                         /reset-password
└── (app)/             →  /dashboard      Navbar. Valid session required.
      ├── browse/          /browse/**
      ├── learn/           /learn/[syncId]
      ├── worksheet/       /worksheet/[syncId]
      ├── progress/        /progress/**
      ├── edit/            /edit
      ├── settings/        /settings
      │                    /settings/security
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
| `lib/auth/jwt.ts` | `signToken()`, `verifyToken()` — verifyToken also checks `password_changed_at` to invalidate pre-reset sessions |
| `lib/auth/requireAdmin.ts` | Edge-compatible guard — verifies JWT + `isAdmin`; returns 401 Response on failure |
| `lib/auth/policy.ts` | Auth constants: lockout thresholds + email verification expiry and resend cooldown |
| `lib/auth/tokens.ts` | Edge-compatible `generateToken()` / `hashToken()` via Web Crypto — used by password reset and email verification |
| `lib/auth/log-login-attempt.ts` | Fire-and-forget helper that inserts into `login_attempts`; never throws |
| `lib/auth/session.ts` | Client helpers: `getSession()`, `login()`, `signup()`, `logout()` |
| `lib/request-meta.ts` | Extracts `ipAddress` and `userAgent` from any `Request` object |
| `lib/rate-limit.ts` | Upstash sliding-window rate limiters: login (IP), forgot-password (IP + email), reset-password (IP) |
| `lib/email/client.ts` | Resend SDK singleton |
| `lib/email/send.ts` | `sendEmail()` — fire-and-forget wrapper that never throws |
| `lib/email/templates/password-reset.ts` | HTML + plain-text password reset email template |
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
| `WhatsFree` | 4 feature tiles with Lucide icons |
| `HowItWorks` | 4 numbered steps |
| `CurriculumCoverage` | AU exam board pill badges (VCE, HSC, QCE, ATAR, SACE, etc.) |
| `SampleQuestion` | Year 12 Maths Methods differentiation worked example |
| `MeetTutors` | 3 placeholder tutor cards with WWCC badge |
| `Pricing` | 3-column comparison: private tutoring / At Ease / online platforms |
| `Testimonials` | 3 placeholder student/parent quote cards |
| `TrustStrip` | Green accent strip (`bg-accent-soft`) — 4 trust signals with Lucide icons |
| `FounderNote` | Two-column founder's note with "MK" placeholder avatar |
| `FAQ` | 6 native `<details>`/`<summary>` accordions |
| `FinalCTA` | Green accent (`bg-accent-soft`), CTA → `/signup`, login link |
| `Footer` | Logo, nav links, copyright |

**Pending real content (marked `// TODO` in each file):**
- Founder photo and name — currently "MK" initials placeholder in `FounderNote`
- Tutor profiles — 3 placeholder cards in `MeetTutors` need real names, subjects, bios
- Student testimonials — 3 placeholder quotes in `Testimonials` need real feedback
- Founding spot count — hardcoded "247" in `FoundingBanner` and `FinalCTA`; replace with a live DB count once cohort tracking is implemented

**Conventions:**
- All 15 components are React Server Components — no `"use client"`, no client-side JS
- Icons use `lucide-react`
- Accent sections use `bg-accent-soft border-y border-border` (eucalypt green token, not indigo)
- Design tokens are documented in `app/_design-system.md`

---

## Content Hierarchy

```
years → subjects → topics → lecture (1:1) + worksheet (1:1) → attempts
```

---

## Dashboard (`/dashboard`)

The student dashboard is a streaming server-rendered page at `app/(app)/dashboard/`.

**Structure — thin page + section components:**

```
app/(app)/dashboard/
├── page.tsx                     Reads JWT, composes sections in Suspense
├── _lib/
│   ├── types.ts                 InProgressTopic, RecommendedTopic, DashboardSubject, RecentAttempt
│   └── loaders.ts               Supabase data loaders (one per section)
└── _components/
    ├── Greeting.tsx             Time-based greeting; name resolved from users.display_name
    ├── ContinueLearning.tsx     In-progress worksheets; onboarding empty state
    ├── Recommended.tsx          Latest published topics; hidden if empty
    ├── YourSubjects.tsx         All active subjects with topic counts
    └── RecentActivity.tsx       Last 3 attempts; hidden if empty
```

**Greeting name resolution:** `page.tsx` queries `users.display_name` for the logged-in user after verifying the JWT. Falls back to the email prefix for accounts created before the name field existed.

**Streaming:** Each section is wrapped in `<Suspense>` with a skeleton fallback. Sections stream in as their DB queries resolve.

**Error handling:** Each section catches its own errors and shows an inline message — no section failure crashes the page.

**Known limitations / TODOs in the code:**
- `getUserSubjects` returns all active subjects — no year or subject filtering until `year_id` and subject selection exist on the user model
- `getRecommendedTopics` returns the latest published topics — no year-level curation yet
- Greeting shows "All your subjects" — will show "Year X · Subject 1, Subject 2" once user model stores year and subject preferences
- Time-of-day greeting uses UTC+10 offset (AEST) — no per-user timezone support yet
- Name format is validated client-side only in the signup form; the API does not re-validate the format

---

## Browse (`/browse/**`)

Three nested server-rendered routes for content discovery.

**Route structure:**

```
/browse                           Year selector — grid of active year cards
/browse/[year]                    Subject grid (e.g. /browse/year-12)
/browse/[year]/[subject]          Topic list  (e.g. /browse/year-12/mathematical-methods)
```

**File structure:**

```
app/(app)/browse/
├── page.tsx                  Year selector
├── loading.tsx               Generic loading skeleton
├── _lib/
│   └── loaders.ts            getAllYears, getYearByName, getSubjectsForYear,
│                             getSubjectByYearAndSlug, getTopicsForSubject
├── _components/
│   ├── BreadcrumbNav.tsx     <nav aria-label="Breadcrumb"> with aria-current
│   └── TopicRow.tsx          Full-row link with attempt badge
├── [year]/
│   └── page.tsx              Subject grid with topic counts + preview titles
└── [year]/[subject]/
    └── page.tsx              Topic list with Attempted / Not started badges
```

**Slug conventions:**
- `[year]` = `years.name` (e.g. `year-12`, `year-7`)
- `[subject]` = subject name lowercased with spaces replaced by hyphens (e.g. `mathematical-methods`). Generated at query time by `toSubjectSlug()` in `loaders.ts` — no DB column needed.

**All three pages export `force-dynamic`** — SSR on every request so new content appears without a redeploy.

**Bad slugs** — unresolvable year or subject slugs call `notFound()`.

**Attempt status** — the topic list reads the session JWT for `userId` and marks each topic "✓ Attempted" or "Not started" based on whether the user has any attempt on that topic's worksheet.

---

## Learn (`/learn/[syncId]`)

Single dynamic route that renders a topic's lecture, worksheet CTA, and discussion.

**File structure:**

```
app/(app)/learn/
├── [syncId]/
│   └── page.tsx              Reads JWT, fetches topic+lecture+worksheet+comments
├── _lib/
│   ├── types.ts              LearnTopic, LearnLecture, WorksheetMeta, CommentNode
│   └── loaders.ts            getTopicWithLecture, getWorksheetMetaForTopic,
│                             getCommentCountForTopic, getCommentsForTopic
└── _components/
    ├── LectureContent.tsx    Dispatcher → format-specific renderer
    ├── TextLecture.tsx       react-markdown with 17px/1.7lh prose wrapper
    ├── VideoLecture.tsx      YouTubeFacade (privacy-enhanced, facade click-to-play)
    ├── SlidesLecture.tsx     SlidesViewer (postMessage navigation)
    ├── WorksheetCta.tsx      Accent CTA band; shows best score if user has attempts
    ├── Discussion.tsx        <details>/<summary> collapsed section
    ├── CommentThread.tsx     Depth-capped (3 levels) recursive comment tree
    └── CommentForm.tsx       Disabled form — TODO: wire to POST /api/comments
```

**Layout width:** `max-w-2xl` (680px) for text lectures; `max-w-5xl` for video/slides.

**Breadcrumb:** `Year 12 · Subject · Topic title` with `·` separators. Year and subject segments link back into browse. Subject link uses the same `toSubjectSlug()` convention as browse pages.

**Sub-line:** `~X min read` (word count ÷ 200) for text; `X min watch` (from `duration_seconds`) for video; `Slide deck` for slides.

**Unpublished states:**
- Lecture unpublished but worksheet published → "Lecture coming soon." + worksheet CTA shown.
- Both unpublished → "This topic is being prepared. Check back soon." No CTA.

**Worksheet CTA:** links to `/worksheet/[worksheet-sync-id]`. Copy changes to "Try again" + best score if the user has prior attempts.

**Discussion:** collapsed by default via `<details>`. Comment tree depth-capped at 3 levels — replies at depth 3+ are not rendered. Comment form is disabled pending `/api/comments` endpoint.

**TODO:** LaTeX support (remark-math + rehype-katex) once packages installed.

---

## Worksheet (`/worksheet/[syncId]`)

Single dynamic route for completing a worksheet. The `syncId` in the URL is the **worksheet's own `sync_id`**, not the topic's.

**File structure:**

```
app/(app)/worksheet/
├── [syncId]/
│   ├── page.tsx              Reads JWT, fetches worksheet + next topic, renders WorksheetClient
│   └── WorksheetClient.tsx   "use client" — three-phase state machine
├── _lib/
│   ├── types.ts              WorksheetData, NextTopic
│   ├── grading.ts            gradeAnswers() — essays excluded from score and total
│   └── loaders.ts            getWorksheetBySyncId, getNextTopicInSubject
└── _components/
    ├── ProgressBar.tsx       Question X of Y progress bar with aria-progressbar
    ├── QuestionInput.tsx     All 5 question type input UIs (mcq_single, mcq_multi, short_text, numeric, essay)
    ├── ReviewPanel.tsx       Answer summary list with per-question Edit buttons
    └── ResultsPanel.tsx      Score banner, per-question breakdown, retry/next-topic actions
```

**Three-phase flow:**

1. **Taking** — one question at a time; Previous/Next navigation; "Review →" on last question
2. **Review** — all Q+A pairs listed; amber warning for unanswered questions; "Edit" jumps back to any question; "Confirm & Submit" triggers grading
3. **Results** — score banner with label; per-question breakdown; Try Again / Back to Lecture / Next Topic or Browse Topics

**Grading:**
- Essays are excluded from both `score` and `total`; shown as "submitted for review" in results
- Score sent to `/api/attempts` is `autoGradedCorrect / autoGradedTotal`
- `correct` is `null` for essays in the results breakdown

**localStorage auto-save:**
- Key: `worksheet:<syncId>:draft`
- Draft restored on mount; saved on every answer change during taking phase
- Draft cleared on confirm & submit

**Breadcrumb:** `Year · Subject · Topic title · Worksheet` — all segments link into browse/learn hierarchy.

**Next topic:** `getNextTopicInSubject` queries the next published topic in the same subject (by `id > currentTopicId`). Shown as a CTA in results. Falls back to "Browse Topics" if none found.

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
| `/settings` | Settings hub — links to sub-sections |
| `/settings/security` | Recent sign-in activity — last 20 `login_attempts` rows for the current user; outcome label, relative time, masked IP, device hint |

---

## Login Hardening

The login route (`POST /api/auth/login`) enforces three layers of protection:

### 1. IP rate limiting
20 requests per IP per 15 minutes (`loginLimiter` in `lib/rate-limit.ts`). Degrades gracefully if Upstash Redis is unavailable — logs a warning and allows the request through so a Redis outage never breaks login.

### 2. Per-account lockout
Constants in `lib/auth/policy.ts`:

| Constant | Value |
|---|---|
| `MAX_FAILED_LOGIN_ATTEMPTS` | 5 |
| `LOCKOUT_DURATION_MINUTES` | 30 |
| `FAILED_ATTEMPT_RESET_WINDOW_HOURS` | 1 |

After 5 consecutive wrong passwords **within the last hour**, `locked_until` is set to `now + 30 minutes`. The lockout check runs **before** `bcrypt.compareSync` so attempts against a locked account don't increment the counter further.

**Reset-window logic:** before incrementing `failed_login_attempts`, the route checks the timestamp of the last failure row. If it is older than 1 hour, the counter resets to 0 — preventing failures from weeks ago from contributing to a new lockout.

**Lockout UX:** the API returns `{ errorCode: "account_locked" }`. `LoginForm` renders a distinct banner: *"Account temporarily locked — wait 30 minutes or [reset your password]."* The reset link goes to `/forgot-password`.

**Password reset clears lockout:** `POST /api/auth/reset-password` sets `failed_login_attempts = 0` and `locked_until = null` in the same DB update as the new password hash, so a locked user can regain access immediately.

### 3. Attempt logging
Every terminal path writes to `login_attempts` via `lib/auth/log-login-attempt.ts`.

| Outcome | When |
|---|---|
| `success` | Password correct, not locked |
| `wrong_password` | User found, password incorrect |
| `user_not_found` | No account for that email |
| `account_locked` | Locked — checked before bcrypt |
| `rate_limited` | IP rate limit exceeded |
| `email_not_verified` | Reserved — login is soft-block; this outcome is not yet triggered |
| `error` | Unhandled exception |

**Key rules:**
- Logging is fire-and-forget (`void logLoginAttempt(...)`) — never blocks the login response
- The helper never accepts a password parameter
- `user_agent` is capped at 500 chars before insert
- IP is read from `x-forwarded-for` → `x-real-ip` → `0.0.0.0`
- When email is not found, `bcrypt.compareSync` runs against a constant dummy hash to equalise response timing and prevent account enumeration

**Recent activity page (`/settings/security`):** shows the user's own last 20 attempts. IP is masked to two octets (e.g. `203.0.x.x`). User-agent is parsed into OS + browser family inline — no library.

---

## Email Verification

**Soft-block model** — unverified users can still log in and access all features. Verification is encouraged through a persistent banner, not enforced at login.

### Flow

1. User signs up → verification email sent fire-and-forget (never blocks signup response).
2. User clicks link → `GET /verify-email?token=<raw>` → page POSTs to `POST /api/auth/verify-email`.
3. On success: `email_verified_at` is set; banner disappears on next page load.
4. If email is missed: banner shows "Resend email" → `POST /api/auth/resend-verification`.

### API routes

| Route | Purpose |
|---|---|
| `POST /api/auth/verify-email` | Consume token, set `email_verified_at`; detects already-verified via session |
| `POST /api/auth/resend-verification` | Session-gated resend with 5-min server-side cooldown |

### Token security (same pattern as password reset)
- Raw token in URL, SHA-256 hex hash in `users.email_verification_token` — never stored raw.
- 24-hour expiry (`EMAIL_VERIFICATION_EXPIRY_HOURS` in `lib/auth/policy.ts`).
- Shared utilities in `lib/auth/tokens.ts` — `generateToken()` and `hashToken()`.

### Rate limits
- Verify: 10 req / 15 min per IP (`verifyEmailLimiter`)
- Resend: 3 req / 1 hr per user sync_id (`resendVerificationLimiter`)

Both degrade gracefully if Redis is unavailable.

### UI
- `app/(auth)/verify-email/page.tsx` — loading / success / error states; CTA adapts based on whether the user has an active session.
- `app/(app)/_components/EmailVerificationBanner.tsx` — full-width strip above the nav for unverified users; dismissable per page load; inline resend button with feedback states.
- `app/(app)/settings/security` — email address + verified/not-verified pill + resend button.

### Design decisions
- Login **does not** enforce `email_verified_at`. The `email_not_verified` log outcome is reserved for a future hard-block decision.
- Email send failures at signup are swallowed — the banner + resend is the recovery path.
- Verify endpoint does not issue a JWT — users who verify on a different device must sign in manually.

---

## Error Monitoring

**Sentry is configured on the `feature-testing` branch — not on `main`.** `@sentry/nextjs` v10 is incompatible with `@cloudflare/next-on-pages@1` (the current Cloudflare build adapter). Merging to `main` requires first migrating the adapter to [OpenNext](https://opennext.js.org/).

**Org:** `at-ease-tutoring` · **Project:** `prod` · **Region:** EU (`ingest.de.sentry.io`)

### Files

| File | Purpose |
|---|---|
| `instrumentation-client.ts` | Browser-side Sentry init; tunnel, scrubbing, `onRouterTransitionStart` |
| `sentry.server.config.ts` | Node.js runtime init; scrubbing, 4xx/redirect filtering |
| `sentry.edge.config.ts` | Edge runtime init; same scrubbing, no Node-only APIs |
| `instrumentation.ts` | `register()` loads the correct config per runtime; exports `onRequestError` |
| `lib/sentry/scrub.ts` | `scrubObject()` — redacts password, token, cookie, session, apikey fields recursively |
| `app/api/monitoring/route.ts` | Tunnel proxy — forwards browser events through the app domain to bypass ad blockers |
| `app/api/sentry-test/route.ts` | Throws a test error on GET — **remove or gate before public launch** |
| `next.config.mjs` | Wrapped with `withSentryConfig` |

### Privacy design

- User context: `Sentry.setUser({ id: session.syncId, segment: 'admin' | 'user' })` — `sync_id` only, no email or PII
- Cookie values are fully redacted in `beforeSend` (keys kept, values replaced with `[REDACTED]`)
- Session replay is disabled (`replaysSessionSampleRate: 0`) — privacy concern for under-18 users
- `NEXT_REDIRECT` and `NEXT_NOT_FOUND` control-flow errors are dropped before sending
- HTTP 401/403/404/429 responses are dropped on server and edge

### Required env vars

```
NEXT_PUBLIC_SENTRY_DSN=   # browser-side DSN
SENTRY_DSN=               # server/edge DSN (same value)
SENTRY_ENVIRONMENT=       # e.g. development / production
```

Optional (enables source map upload on build):

```
SENTRY_AUTH_TOKEN=        # Sentry → Settings → Auth Tokens
SENTRY_ORG=at-ease-tutoring
SENTRY_PROJECT=prod
```

### Constraint — `global-error.tsx`

`app/global-error.tsx` must never import from `@sentry/nextjs`. Importing the Sentry server SDK pulls in `@prisma/instrumentation` (Node.js-only) into the edge bundle and crashes every edge-rendered route. The current file is a plain error boundary with no Sentry dependency.

---

| `/admin` | Dashboard — live counts of content and users |
| `/admin/years` | CRUD year levels, toggle active |
| `/admin/subjects` | CRUD subjects, year filter |
| `/admin/topics` | CRUD topics (metadata), subject filter, publish toggle |
| `/admin/topics/[syncId]` | Topic detail — metadata, lecture editor, worksheet summary |
| `/admin/topics/[syncId]/worksheet` | Full worksheet editor (all 5 question types) |
| `/admin/users` | CRUD user accounts, admin flag toggle |

Admin API routes live under `/api/admin/` and use integer `id` for PATCH/DELETE, `sync_id` for GET-by-identity.

**Every `/api/admin/*` handler enforces auth directly** via `requireAdmin()` from `lib/auth/requireAdmin.ts`. It verifies the JWT and checks `isAdmin` — returning 401 if either fails. API routes bypass Next.js layouts, so the layout-level `isAdmin` check alone is not sufficient.

### Lecture publish flow

The topic detail page (`/admin/topics/[syncId]`) includes a full publish flow for lectures:

- **Status pill** — shows Draft/Published + relative time (e.g. "Draft · last saved 2 min ago")
- **Contextual buttons** — published state shows "Save changes" + "Unpublish"; draft state shows "Save and publish" + "Save draft"
- **Toast feedback** — shown after every action; publish toast includes a "View as student →" link
- **30-second auto-save** — fires for dirty drafts only; disabled while the lecture is published
- **Unpublish modal** — native `<dialog>` requiring explicit confirmation before unpublishing

`POST /api/admin/lectures` — upserts content, defaults to publishing, returns `{ ok: true, id }`.
`PATCH /api/admin/lectures` — publish-state toggle only; never touches content.

---

## Password Reset Flow

Users who forget their password use `/forgot-password` → `/reset-password?token=<raw>`.

**Route summary:**

| Route | Purpose |
|---|---|
| `GET /forgot-password` | Form — user enters their email |
| `POST /api/auth/forgot-password` | Generates token, stores SHA-256 hash in DB, sends email via Resend |
| `GET /reset-password?token=<raw>` | Form — user sets a new password |
| `POST /api/auth/reset-password` | Hashes token, validates against DB, updates `password_hash` + clears token + sets `password_changed_at` |

**Security design:**
- The raw token is sent in the email URL only; the database stores only the SHA-256 hex hash
- `/api/auth/forgot-password` always returns `{ ok: true }` regardless of whether the email exists, preventing email enumeration
- Token expiry is 1 hour (`password_reset_expires_at`)
- `password_changed_at` is set on every successful reset. `verifyToken()` in `lib/auth/jwt.ts` compares this against the JWT's `iat` — any session issued before the password change is immediately invalidated
- Rate limits: 10 requests/IP/hour on forgot-password; 3 requests/email/hour on forgot-password; 5 requests/IP/15 min on reset-password

**Required env vars:** `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_APP_URL`, `EMAIL_FROM` (optional), `EMAIL_REPLY_TO` (optional)

---

## Auth Flow

| Action | Redirect |
|---|---|
| Login / Signup success | `/dashboard` |
| Logout | `/login` |
| Password reset success | `/login?reset=success` (shows success banner) |
| Unauthenticated → app route | `/login` |
| Authenticated → `/login` or `/signup` | `/dashboard` |
| Authenticated but not admin → `/admin/**` | `/dashboard` |

**Auth is enforced in two places for admin API routes:**
1. `app/(app)/admin/layout.tsx` — blocks the browser UI for non-admins
2. `lib/auth/requireAdmin.ts` — blocks direct API calls (curl, fetch, etc.)

Login and signup responses expose only `syncId`, `email`, and `isAdmin` — the internal bigserial `id` is never returned to clients.

**Signup form** collects name, email, and password. Name is validated client-side (letters, spaces, hyphens, apostrophes, 2–100 chars) and stored as `users.display_name`. The field is optional in the API so existing integrations without it remain compatible.

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
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend) — required for password reset
RESEND_API_KEY=
EMAIL_FROM=noreply@ateasetutoring.com       # must be a verified domain in Resend
EMAIL_REPLY_TO=hello@ateasetutoring.com     # optional

# Rate limiting (Upstash Redis) — required for forgot-password and reset-password
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

`JWT_SECRET` falls back to a hardcoded dev string if unset — **must be set in production**.

**Local email testing:** Use the Resend sandbox domain (`@resend.dev`) or point `EMAIL_FROM` to `onboarding@resend.dev` for testing without domain verification. Resend only delivers to the owner's email in sandbox mode.

**Domain verification for production:** Go to Resend → Domains → Add domain → add the DNS records for `ateasetutoring.com`. Once verified, `EMAIL_FROM` can be set to any address on that domain.

---

## Cloudflare Deployment

The app is deployed to **Cloudflare Pages** using `@cloudflare/next-on-pages`. Dynamic routes (pages with DB access, auth, or cookies) declare `export const runtime = 'edge'`. Purely static pages use `export const dynamic = 'force-static'` instead.

**Root layout (`app/layout.tsx`) must NOT declare `runtime = 'edge'`.** If it does, the runtime propagates to all child routes and overrides `force-static`, forcing every page through the edge worker — including the landing page, which crashes. Only zone layouts (`app/(app)/layout.tsx`, `app/(auth)/layout.tsx`) and individual API route files declare `runtime = 'edge'`.

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
| `NEXT_PUBLIC_APP_URL` | Plain text | Your production URL, e.g. `https://ateasetutoring.com` |
| `RESEND_API_KEY` | **Secret** | Resend → API Keys |
| `EMAIL_FROM` | Plain text | `noreply@ateasetutoring.com` (must be verified domain in Resend) |
| `EMAIL_REPLY_TO` | Plain text | `hello@ateasetutoring.com` |
| `UPSTASH_REDIS_REST_URL` | Plain text | Upstash → Database → REST API → Endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret** | Upstash → Database → REST API → Token |

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
