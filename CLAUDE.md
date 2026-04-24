# Project: LearnFree (free education app for Year 7-12)

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS, static export
- Supabase (Postgres 15+) for auth, content, and progress
- Cloudflare Pages for hosting (free tier)
- YouTube embeds for video lectures (free bandwidth)

## Content source of truth
The Supabase database is the source of truth for all content. The /content folder has been retired. Do NOT add file-based content loaders. New lectures/worksheets/topics go in the DB via the editor UI or a seed script.

## Key conventions
- Soft delete everywhere: every table has `deleted_at timestamptz`. No hard deletes. Filter `deleted_at is null` on all reads.
- Every table has `updated_at timestamptz`, auto-maintained by triggers.
- Full audit trail: inserts/updates/deletes on topics/lectures/worksheets write to `content_versions` automatically. Never write to that table manually.
- RLS is on for every table. Writes to content tables require `profiles.is_editor = true`. Check `public.is_editor()` in policies; don't duplicate the logic.
- Lecture content is JSONB with a `format` discriminator: 'text' ({markdown}), 'video' ({youtube_id, duration_seconds}), 'slides' ({html}).
- Worksheet questions are a JSONB array of {type, prompt, ...} where type is 'multiple_choice' | 'numeric' | 'fill_blank'.
- Attempts are effectively immutable: RLS only allows the author to soft-delete, not edit.
- Editor promotion is manual: flip `profiles.is_editor` in the Supabase dashboard. No self-serve path.

## Schema location
The canonical schema lives at /supabase/migrations/0001_init.sql. Treat this file as authoritative; if you need to change the schema, write a new numbered migration, don't edit 0001.

## Directory layout
- /app                  Next.js routes
- /components           Shared UI components
- /components/ui        Button, Card, Input, PageContainer (reuse, do not duplicate)
- /lib/supabase         Supabase clients (client + server)
- /lib/content          Content loader functions (DB-backed)
- /lib/content/types.ts Zod schemas + TS types for content
- /lib/actions          Server actions for content writes
- /supabase/migrations  SQL migrations in numbered order

## Things not to do
- Do not re-introduce filesystem content loading.
- Do not add rich-text editors or new UI libraries without asking.
- Do not write to content_versions directly.
- Do not hard-delete from any table.
- Do not expose is_editor toggling to end users.

## Commands
```bash
npm run dev    # Start dev server (Next.js, port 3000)
npm run build  # Production build
npm run lint   # ESLint
```

## Environment
Copy `.env.local.example` to `.env.local`. Requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Styling
Tailwind with CSS custom properties. Design tokens (use these, not raw colours):
- `text-fg`, `text-muted`, `text-error`
- `bg-primary`, `hover:bg-primary-hover`
- `border-border`

Minimum touch target: `min-h-[44px]` on all interactive elements.
