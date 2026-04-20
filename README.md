# LearnFree

Free, high-quality education for Year 7–12 students.

## Purpose

LearnFree delivers structured lectures and interactive worksheets for secondary school students (Years 7–12) at no cost. Students can browse content by year and subject, complete worksheets, and receive instant automated feedback.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, static export) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend / Auth | Supabase (to be wired up) |
| Deployment | Any static host (Vercel, Netlify, GitHub Pages) |

## Folder Layout

```
/
├── app/                    # Next.js App Router pages & layouts
├── components/             # Shared React components
├── content/
│   └── math/
│       └── year-9/         # Lecture MDX + worksheet JSON files
├── lib/
│   ├── supabase.ts         # Supabase client (to be added)
│   ├── content-loader.ts   # Reads /content files at build time (to be added)
│   └── grading.ts          # Worksheet answer grading logic (to be added)
├── public/                 # Static assets
├── next.config.mjs         # Static export config
└── tailwind.config.ts      # Tailwind theme
```

## Adding New Content

1. Create a folder under `/content/<subject>/<year>/`, e.g. `/content/math/year-10/`.
2. Add a lecture file (e.g. `algebra-intro.mdx`) and an optional worksheet file (e.g. `algebra-intro-worksheet.json`).
3. The content loader in `lib/content-loader.ts` will pick them up automatically at build time.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials.

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → your project → **Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → your project → **Settings → API → anon public** key |

`.env.local` is already listed in `.gitignore` — never commit real keys.

## Getting Started

```bash
cp .env.local.example .env.local   # add your Supabase keys
npm install
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm start        # serve production build
```
