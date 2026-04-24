# Database

Supabase (Postgres 15+) is the source of truth for all content, users, and progress.

## Migrations

| File | Description |
|------|-------------|
| `migrations/0001_init.sql` | Initial schema — all tables, triggers, RLS policies |

To apply a migration: open the Supabase dashboard → **SQL Editor** → paste and run the file.

Never edit `0001_init.sql`. Add schema changes as new numbered migration files (`0002_...sql`, etc.).

---

## Schema overview

| Table | Purpose |
|-------|---------|
| `profiles` | One row per auth user; `is_editor` gates content writes |
| `subjects` | Subject catalogue (math, science, english, social-studies) |
| `topics` | A topic within a subject/year — the top-level content unit |
| `lectures` | One lecture per topic; JSONB `content` keyed by `format` |
| `worksheets` | One worksheet per topic; JSONB `questions` array |
| `attempts` | Immutable worksheet attempt records per user |
| `comments` | Threaded per-topic comments |
| `reports` | User-submitted content reports |
| `content_versions` | Append-only audit log — written by trigger, never manually |

### Conventions

- **Soft delete everywhere** — every table has `deleted_at timestamptz`. No hard deletes. Filter `deleted_at is null` on all reads.
- **`updated_at` auto-touch** — a `before update` trigger maintains `updated_at` on every table.
- **Audit trail** — inserts/updates/deletes on `topics`, `lectures`, and `worksheets` are automatically captured in `content_versions` by trigger. Never write to that table manually.
- **RLS on every table** — content writes require `profiles.is_editor = true`, checked via `public.is_editor()`. Don't duplicate this logic.

### Lecture `content` JSONB shapes

| `format` | JSONB keys |
|----------|-----------|
| `text` | `{ "markdown": "..." }` |
| `video` | `{ "youtube_id": "...", "duration_seconds": 300 }` |
| `slides` | `{ "html": "..." }` |

### Worksheet `questions` JSONB shape

Array of objects where `type` is one of `multiple_choice`, `numeric`, or `fill_blank`.

---

## Initial setup

1. Create a new Supabase project.
2. Open **SQL Editor** and run `migrations/0001_init.sql`.
3. Verify the schema:
   ```sql
   select table_name, column_name
   from information_schema.columns
   where table_schema = 'public'
     and column_name in ('deleted_at', 'updated_at')
   order by table_name, column_name;
   ```
   Both columns should appear for all 9 tables.
4. In **Table Editor → profiles**, find your user row and set `is_editor = true` to unlock content editor flows in the app.
5. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

---

## Files changed during filesystem → DB migration

| File | Change |
|------|--------|
| `supabase/migrations/0001_init.sql` | Created — full schema |
| `lib/content/types.ts` | `Subject` expanded to all four subjects |
| `lib/supabase/database.types.ts` | Rewritten — all 9 tables typed |
| `lib/content/loader.ts` | Rewritten — queries Supabase instead of filesystem |
| `components/WorksheetClient.tsx` | Attempt insert updated for new `attempts` schema |
| `components/ProgressClient.tsx` | Rewritten — joins `attempts → worksheets → topics`; removed `titleMap` prop |
| `app/progress/page.tsx` | Simplified — no longer calls `getAllTopics()` at build time |
| `.gitignore` | Added `/content` with retirement comment |
| `package.json` | Removed `gray-matter` dependency |

After verifying that DB content renders correctly, delete the `/content` folder from the repo.
