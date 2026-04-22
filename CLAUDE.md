# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js, port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run content:check  # Validate all content files against schemas (runs scripts/validate-content.ts)
```

No test suite exists yet.

## Environment

Copy `.env.local.example` to `.env.local`. Requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without these set, auth is silently skipped and all pages still render (guest mode).

## Architecture

**LearnFree** is a Next.js 14 App Router app targeting Year 7–12 students. It has three main concerns: content loading, worksheet grading, and Supabase-backed progress tracking.

### Content system

All educational content lives under `content/{subject}/year-{N}/{slug}/` as flat files:

| File | Required | Purpose |
|------|----------|---------|
| `meta.json` | Yes | `title`, `description`, `orderIndex` |
| `lecture.md` | No | Frontmatter sets `format: text \| video \| slides` |
| `worksheet.json` | No | Question array (multiple-choice, numeric, fill-blank) |
| `slides.html` | When format=slides | Raw HTML injected into an iframe |

`lib/content/loader.ts` walks the filesystem at request time (server components only). `lib/content/schemas.ts` validates every file with Zod on load — a bad file throws loudly rather than silently rendering wrong data. `lib/content/types.ts` is the single source of truth for all TypeScript types.

Topic IDs are `{subject}-year{N}-{slug}` and are used as `worksheet_id` in Supabase.

### Data flow

- **Server components** (`app/learn/…`, `app/worksheet/…`, `app/browse/…`) call `getTopic()` / `getAllTopics()` directly — no API routes needed for content.
- **Worksheet grading** is 100% client-side in `components/WorksheetClient.tsx` via `lib/grading.ts`. Results are saved to Supabase in a fire-and-forget insert after the user already sees their score.
- **Auth** is checked on the server and only `userId: string | null` is passed down to client components — client components never call `supabase.auth.getUser()`.
- **Progress page** (`app/progress/page.tsx`) redirects to `/login` if unauthenticated, then fetches the `attempts` table and all topics in parallel.

### Supabase

One table: `attempts` (id, user_id, subject, year, topic_slug, worksheet_id, score, total, created_at). Attempts are immutable — no update/delete policy exists. Types are in `lib/supabase/database.types.ts`.

Two client factories: `lib/supabase/server.ts` (for Server Components / Route Handlers) and `lib/supabase/client.ts` (for Client Components).

### Routing

```
/                          → Home
/browse                    → Subject list
/browse/[subject]          → Year list for subject
/browse/[subject]/[year]   → Topic list for year
/learn/[subject]/[year]/[topic]      → Lecture view (statically generated)
/worksheet/[subject]/[year]/[topic]  → Worksheet (statically generated)
/progress                  → Auth-required progress dashboard
/(auth)/login|signup|logout
```

`dynamicParams = false` on learn and worksheet pages — only topics with actual content get generated.

### Shell files (app-level)

- `app/error.tsx` — client-side error boundary with "Try again" + "Go home" CTAs.
- `app/not-found.tsx` — global 404 with "Browse topics" CTA.
- `app/loading.tsx`, `app/browse/loading.tsx`, `app/progress/loading.tsx` — `animate-pulse` skeletons shown while dynamic pages fetch data.

### Auth components

Login/signup pages are thin server components that export `metadata` and render form components from `components/auth/LoginForm.tsx` and `components/auth/SignupForm.tsx` (which hold the `"use client"` logic). This pattern is required because `metadata` exports are not allowed in client components.

**All runtime auth state is client-side** (required for `output: 'export'`):
- `components/NavAuth.tsx` — client component; renders in `TopNav`. Checks session on mount via the browser Supabase client. Shows guest nav by default; updates to authenticated nav after session check.
- `components/HomeAuth.tsx` — same pattern for the home page CTA.
- `components/ProgressClient.tsx` — checks auth and fetches attempts entirely in the browser. `app/progress/page.tsx` is a thin server wrapper that pre-fetches topic titles from the filesystem and passes them as a prop.
- `WorksheetClient` — checks auth client-side on submit only (when saving an attempt). No `userId` prop from the server.
- The `app/(auth)/logout/route.ts` handler has been deleted — `LogoutButton` calls `supabase.auth.signOut()` in the browser directly.

Do not add `import { cookies } from "next/headers"` or `createClient` from `lib/supabase/server.ts` to any server component — this will break the static build.

### Metadata

Root layout uses a title template `"%s — LearnFree"`. Every route exports `metadata` or `generateMetadata` — static pages use `export const metadata`, dynamic-param pages (subject, year, topic) use `generateMetadata` to read the actual title/description.

### MarkdownContent

`components/lecture/MarkdownContent.tsx` is a **server component** (no `"use client"`). Keeping it server-side excludes `react-markdown` and `remark-gfm` from the client bundle. Do not add hooks or browser APIs to this file. Heading levels are demoted: md `h1`→`<h2>`, `h2`→`<h3>`, `h3`→`<h4>` to preserve the page's single `<h1>`.

### Styling

Tailwind with CSS custom properties. Design tokens (use these, not raw colours):
- `text-fg`, `text-muted`, `text-error`
- `bg-primary`, `hover:bg-primary-hover`
- `border-border`

Minimum touch target: `min-h-[44px]` on all interactive elements.

### Adding a new subject

1. Add the subject slug to `Subject` union in `lib/content/types.ts`
2. Create `content/{subject}/year-{N}/{slug}/` folders with `meta.json` + optional `lecture.md` / `worksheet.json`
3. Add a display entry to the `CATALOGUE` array in `app/browse/page.tsx`
