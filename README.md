# LearnFree

Free, high-quality education for Year 7–12 students — lectures, worksheets, and instant feedback, all in one place.

## Purpose

LearnFree delivers structured lectures and interactive worksheets for secondary school students (Years 7–12) at no cost. Students can browse content by year and subject, complete worksheets, and receive instant automated feedback. Progress is saved for signed-in users; worksheets are fully usable as a guest.

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
│   ├── browse/                 # Subject → year → topic browsing
│   ├── learn/                  # Lecture viewer
│   ├── worksheet/              # Interactive worksheet
│   └── progress/               # Auth-required progress dashboard
├── components/
│   ├── auth/                   # LoginForm, SignupForm (client components)
│   ├── lecture/                # MarkdownContent, YouTubeFacade, SlidesViewer
│   └── ui/                     # Button, Input, Card, PageContainer
├── content/
│   └── math/year-9/            # meta.json + lecture.md + worksheet.json per topic
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

## Adding new content

Each topic is a folder under `content/{subject}/year-{N}/{slug}/`:

| File | Required | Purpose |
|------|----------|---------|
| `meta.json` | Yes | `title`, `description`, `orderIndex` |
| `lecture.md` | No | Frontmatter sets `format: text \| video \| slides` |
| `worksheet.json` | No | Questions (multiple-choice, numeric, fill-blank) |
| `slides.html` | When `format: slides` | Raw HTML rendered in a sandboxed iframe |

Run `npm run content:check` after adding files to validate them against the schemas.

To add a new subject: add its slug to the `Subject` union in `lib/content/types.ts` and add a display entry to the `CATALOGUE` array in `app/browse/page.tsx`.

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
2. Set **Site URL** to your Pages URL (e.g. `https://learnfree.pages.dev`).
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

## Polish pass — audit findings & fixes

| Area | Finding | Fix |
|------|---------|-----|
| **Loading states** | No `loading.tsx` files; dynamic pages (home, browse, progress) could flash blank content | Added `animate-pulse` skeleton loaders for home, browse, and progress routes |
| **Error boundary** | No `error.tsx` or `not-found.tsx`; errors and 404s showed raw Next.js defaults | Created `app/error.tsx` (Try again / Go home CTAs) and `app/not-found.tsx` (Browse topics CTA) |
| **Metadata** | Every tab showed "LearnFree" — no per-route titles or descriptions | Root layout uses `"%s — LearnFree"` template; all 9 routes export `metadata` or `generateMetadata` |
| **Accessibility** | Two breadcrumb `<nav>` elements missing `aria-label`; `/` separators not hidden from screen readers; markdown `h2` rendered as `<h2>` same as `h1`, collapsing heading hierarchy | Added `aria-label="Breadcrumb"` and `aria-hidden="true"` on separators; fixed heading demotion (`h1`→`h2`, `h2`→`h3`, `h3`→`h4`) |
| **Performance** | `MarkdownContent` was a client component, shipping `react-markdown` + `remark-gfm` (~50 KB) to the browser unnecessarily | Removed `"use client"` — component is now server-only; libraries excluded from the client bundle |
| **Mobile (360 px)** | Progress stats grid (`grid-cols-3 p-5 text-3xl`) was too tight at narrow widths | Responsive padding (`p-3 sm:p-5`), font size (`text-2xl sm:text-3xl`), and gap (`gap-2 sm:gap-3`) |
| **Empty states** | All list views already handled empty states correctly | No changes needed |
| **Dev showcase** | `/dev-showcase` route was accessible in production | Deleted `app/dev-showcase/page.tsx` and `components/ui/_showcase.tsx` |
