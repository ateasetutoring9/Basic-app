# Database

Postgres 15+ (hosted on Supabase). This is the source of truth for all
content, users, and progress data.

---

## Design principles

**No RLS, no Supabase Auth.**
Frontend clients never hit the DB directly. All queries go through the API
layer. The API enforces authentication and authorisation — the DB trusts
whatever the API sends.

**Dual-key pattern.**
Every table has two identifiers:
- `id` — `bigserial`, internal. Used for all FK joins inside the DB.
- `sync_id` — `uuid`, external. Used in all API responses and client URLs.

Never expose `id` to clients. Never use `sync_id` as a FK target.

**Soft delete.**
Every table has `deleted_at timestamptz`. Setting it is the only way to delete
a row. Hard `DELETE` statements should never appear in application code. All
reads filter `WHERE deleted_at IS NULL` unless auditing.

**`updated_at` is trigger-managed.**
A `touch_updated_at` trigger fires `BEFORE UPDATE` on every table. Never set
`updated_at` manually.

**History tables are append-only audit logs.**
Every main table has a `<name>_history` mirror. Triggers write a snapshot on
every insert, update, and delete. Application code must never write to history
tables directly.

---

## Tables

### Main tables

| Table | Purpose |
|---|---|
| `users` | Registered students and admins; owns auth credentials |
| `years` | Year-level lookup (Year 7 – Year 12) |
| `subjects` | Subject per year level (~24 rows: 4 subjects × 6 years) |
| `topics` | A unit of study within a subject |
| `lectures` | One lecture per topic; JSONB content keyed by `format` |
| `worksheets` | One worksheet per topic; JSONB questions array |
| `attempts` | A student's worksheet submission |
| `comments` | Threaded per-topic discussion |
| `reports` | User-submitted flags on content or comments |

### History tables (audit log)

| Table | Mirrors |
|---|---|
| `users_history` | `users` |
| `years_history` | `years` |
| `subjects_history` | `subjects` |
| `topics_history` | `topics` |
| `lectures_history` | `lectures` |
| `worksheets_history` | `worksheets` |
| `attempts_history` | `attempts` |
| `comments_history` | `comments` |
| `reports_history` | `reports` |

History tables have no FK constraints, no check constraints, and no unique
constraints. They are pure audit records. Do not modify them.

---

## Content hierarchy

```
years
  └─ subjects    (year_id FK)
       └─ topics  (subject_id FK)
            ├─ lectures    (topic_id FK, unique)
            └─ worksheets  (topic_id FK, unique)
                 └─ attempts  (worksheet_id FK)
```

Each topic has at most one lecture and one worksheet — enforced by
`UNIQUE (topic_id)` on both tables. A topic's year level is derived by joining
`topics → subjects → years`; there is no `year_level` column on `topics`.

---

## Lecture content shapes

The `lectures.content` column is JSONB. Its shape depends on `lectures.format`:

| `format` | JSONB keys |
|---|---|
| `text` | `{ "markdown": "..." }` |
| `video` | `{ "youtube_id": "...", "duration_seconds": 300 }` |
| `slides` | `{ "html": "..." }` |

The DB does not enforce the shape — the API validates before insert/update.

---

## Worksheet questions

`worksheets.questions` is a JSONB array of question objects. Question structure
is defined and validated in the API layer. `attempts.answers` is a JSONB object
keyed by question id; scoring is computed by the API, not the DB.

---

## Auth and passwords

`users.password_hash` stores a bcrypt or argon2 hash. The API hashes passwords
before the row reaches the DB. Plaintext passwords must never appear in SQL,
logs, or application error messages.

`users.password_reset_token` and `users.password_reset_expires_at` are stored
on the `users` row itself. When a reset is completed, clear both fields.

> **Warning:** `users_history` mirrors all user columns including
> `password_hash` and `password_reset_token`. Anyone with read access to
> `users_history` can read every credential hash that ever existed.

---

## History / audit system

Every main table has a corresponding trigger:

```
users_history_capture()   → after insert or update or delete on users
years_history_capture()   → after insert or update or delete on years
...and so on for all 9 tables
```

On `INSERT` or `UPDATE`, the trigger snapshots `NEW`. On `DELETE`, it snapshots
`OLD`. Each history row records:

- `<parent>_id` — the source row's `id`
- All columns from the parent row at the time of the operation
- `operation` — `'insert'` | `'update'` | `'delete'`
- `changed_at` — timestamp of the operation

History rows are permanent. There is no `deleted_at` on history tables.

---

## Migrations

| File | Description |
|---|---|
| `migrations/0001_init.sql` | v1 schema — Supabase Auth, RLS (retired) |
| `migrations/0002_add_created_by_to_lectures_worksheets.sql` | Adds `created_by` to lectures and worksheets (v1 patch) |

The active schema is `schema_v3.sql` at the repo root. Apply it to a fresh
Supabase project via the SQL Editor.

Never edit existing migration files. Add schema changes as new numbered files
(`0003_...sql`, etc.). Every migration must be safe to apply on top of the
previous state.

---

## Initial setup

1. Create a new Supabase project.
2. Open **SQL Editor**, paste and run `schema_v3.sql`.
3. Verify all tables exist:
   ```sql
   select table_name
   from information_schema.tables
   where table_schema = 'public'
   order by table_name;
   ```
   You should see 9 main tables and 9 `_history` tables (18 total).
4. Verify the dual-key and audit columns are present on all main tables:
   ```sql
   select table_name, column_name
   from information_schema.columns
   where table_schema = 'public'
     and column_name in ('id', 'sync_id', 'created_at', 'updated_at', 'deleted_at')
     and table_name not like '%_history'
   order by table_name, column_name;
   ```
5. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

---

## Adding a new table — checklist

Every new table must have:

- [ ] `id bigserial primary key`
- [ ] `sync_id uuid not null unique default gen_random_uuid()`
- [ ] `created_at`, `updated_at`, `deleted_at` columns
- [ ] `touch_updated_at` trigger (`BEFORE UPDATE`)
- [ ] `<name>_history` mirror table — no FK, check, or unique constraints
- [ ] `<name>_history_capture()` trigger function
- [ ] History trigger (`AFTER INSERT OR UPDATE OR DELETE`)
- [ ] FKs target `id` (bigserial), never `sync_id`
