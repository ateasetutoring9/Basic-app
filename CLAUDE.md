# CLAUDE.md

## System Overview

A K-12 education platform targeting years 7–12. Content is organised as a
hierarchy: **years → subjects → topics → lecture + worksheet**. Students browse
topics, read or watch a lecture, then attempt a worksheet. Results (attempts),
discussion (comments), and moderation (reports) live alongside content.

All database access goes through an **API layer** — frontend clients never hit
the DB directly. Authentication and authorisation are enforced entirely in the
API. RLS is disabled; there are no Supabase Auth users.

---

## Architectural Principles

**Dual-key pattern — `id` internal, `sync_id` external**
Every table has:
- `id` — `bigserial` primary key. Used for all FK joins inside the DB. Never
  exposed to API clients.
- `sync_id` — `uuid`, externally visible. Used in all API responses, URLs, and
  client-side references.

**Auth lives in the API, not the DB**
Frontend users authenticate against the API; the API owns session management.
There is no RLS, no Supabase Auth, no `auth.users`. The DB just stores
`password_hash`. The API validates credentials and issues tokens.

**Soft delete everywhere**
Every table has `deleted_at timestamptz`. Set it to soft-delete a row — never
run a hard `DELETE`. All reads must filter `WHERE deleted_at IS NULL` unless
explicitly auditing.

**`updated_at` is trigger-managed**
A `touch_updated_at` trigger fires `BEFORE UPDATE` on every main table. Never
set `updated_at` manually in application code.

**History tables are append-only audit logs**
Every main table has a `<name>_history` mirror populated by triggers on insert,
update, and delete. Application code must never write to or modify history
tables.

**Single authorisation flag**
`users.is_admin` is the only access-control flag. Admins can access the admin
dashboard and edit content. There is no role hierarchy beyond `true / false`.

**Passwords never touch logs**
The API hashes passwords (bcrypt or argon2) before inserting. Plaintext
passwords must never appear in logs, query strings, or error messages.

---

## Table Reference

### `users`
Registered students and admins.

| Column | Notes |
|---|---|
| `email` | `citext` — case-insensitive unique |
| `password_hash` | bcrypt/argon2 hash; API sets this, never plaintext |
| `email_verified_at` | null until email confirmed |
| `password_reset_token` | short-lived token; check `password_reset_expires_at` |
| `failed_login_attempts` | incremented on bad password; reset on success |
| `locked_until` | set when attempts exceeded |
| `is_admin` | single auth flag; default false |

Referenced by: `topics.created_by/updated_by`, `lectures.created_by/updated_by`,
`worksheets.created_by/updated_by`, `attempts.user_id`, `comments.user_id`,
`reports.reporter_id/resolved_by`.

---

### `years`
Lookup table for school year levels.

| Column | Notes |
|---|---|
| `name` | machine identifier, e.g. `"year-7"` |
| `display_name` | human label, e.g. `"Year 7"` |
| `is_active` | false hides the year from browsing |

Referenced by: `subjects.year_id`.

---

### `subjects`
One row per subject per year level (~24 rows for 4 subjects × 6 years).

| Column | Notes |
|---|---|
| `year_id` | FK → `years.id` |
| `name` | e.g. `"Mathematics"` |
| `display_order` | controls sort order within a year |
| `is_active` | false hides the subject |

Referenced by: `topics.subject_id`.

---

### `topics`
A discrete unit of study within a subject.

| Column | Notes |
|---|---|
| `subject_id` | FK → `subjects.id` |
| `title` | display name |
| `thumbnail_url` | optional preview image URL |
| `is_published` | false = draft, hidden from students |
| `published_at` | timestamp of first publish |
| `created_by / updated_by` | FK → `users.id`; null if system-inserted |

Topics have no `year_level` column — year context comes from
`topic.subject_id → subjects.year_id`.

Referenced by: `lectures.topic_id`, `worksheets.topic_id`, `comments.topic_id`,
`reports.entity_id` (polymorphic).

---

### `lectures`
One lecture per topic. `UNIQUE (topic_id)` enforces the 1:1.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id`; unique |
| `title` | lecture title |
| `format` | `'text'` \| `'video'` \| `'slides'` |
| `content` | JSONB — shape depends on `format` (see below) |
| `is_published` | independent of topic publish state |
| `published_at` | timestamp of first publish |
| `created_by / updated_by` | FK → `users.id` |

**Content shapes by format:**
- `text` → `{"markdown": "..."}`
- `video` → `{"youtube_id": "...", "duration_seconds": 300}`
- `slides` → `{"html": "..."}`

The DB does not validate JSONB content shape. The API must validate before
insert/update.

---

### `worksheets`
One worksheet per topic. `UNIQUE (topic_id)` enforces the 1:1.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id`; unique |
| `title` | worksheet title |
| `questions` | JSONB array of question objects |
| `difficulty` | `int` 1–5 (check constraint in DB) |
| `is_published` | independent of topic publish state |
| `published_at` | timestamp of first publish |
| `created_by / updated_by` | FK → `users.id` |

Question structure is defined and validated in the API layer, not the DB.

---

### `attempts`
A student's worksheet submission.

| Column | Notes |
|---|---|
| `user_id` | FK → `users.id` |
| `worksheet_id` | FK → `worksheets.id` |
| `score` | correct answers (≥ 0 check) |
| `total` | total questions (> 0 check) |
| `answers` | JSONB map of question id → student answer |

Attempts are effectively immutable once submitted. Do not expose an edit
endpoint. Soft-delete only.

---

### `comments`
Threaded discussion attached to topics.

| Column | Notes |
|---|---|
| `topic_id` | FK → `topics.id` |
| `user_id` | FK → `users.id` |
| `parent_comment_id` | self-referencing FK; null for top-level |
| `body` | 1–4000 characters (check constraint) |
| `is_hidden` | admin moderation flag |

Nesting depth is unlimited at the DB level. Enforce a depth cap in the API
when fetching comment trees — unbounded recursion is expensive.

---

### `reports`
User-submitted flags on content or comments.

| Column | Notes |
|---|---|
| `reporter_id` | FK → `users.id` |
| `entity_type` | `'topic'` \| `'lecture'` \| `'worksheet'` \| `'comment'` |
| `entity_id` | `bigint` — the `id` of the reported row |
| `reason` | `'incorrect'` \| `'inappropriate'` \| `'spam'` \| `'other'` |
| `status` | `'open'` \| `'resolved'` \| `'dismissed'` |
| `resolved_by` | FK → `users.id`; null until actioned |

`entity_id` has no DB-level FK (polymorphic). The API must verify the
referenced entity exists before inserting a report.

---

## Content Hierarchy

```
years          (6 rows)
  └─ subjects  (~4 per year = ~24 rows)
       └─ topics
            ├─ lecture    (1:1, unique topic_id)
            └─ worksheet  (1:1, unique topic_id)
                 └─ attempts  (N per user)
```

A topic belongs to a subject; the year is derived by joining through the
subject. There is no `year_level` or `slug` on topics directly.

Lecture content is a JSONB blob with a `format` discriminator. Worksheet
questions are a JSONB array. Both are validated by the API, not the DB.
Attempt answers are a separate JSONB blob keyed by question id; scoring is
computed by the API.

---

## History / Audit System

Every main table has a `<name>_history` mirror:

`users_history`, `years_history`, `subjects_history`, `topics_history`,
`lectures_history`, `worksheets_history`, `attempts_history`,
`comments_history`, `reports_history`

**Structure of each history table:**
- `id bigserial primary key` — own PK
- `<parent>_id bigint not null` — source row's `id`
- All columns from the parent, mirrored
- `operation text not null` — `'insert'` | `'update'` | `'delete'`
- `changed_at timestamptz not null default now()`
- **No foreign keys. No check constraints. No unique constraints.**

**How it works:**
Each `<name>_history_capture()` trigger function fires `AFTER INSERT OR UPDATE
OR DELETE`. On `DELETE` it snapshots `OLD`; otherwise it snapshots `NEW`.

**Rules:**
- Application code must never `INSERT`, `UPDATE`, or `DELETE` from history tables.
- History rows are permanent — no `deleted_at`, no soft delete.
- `users_history` stores `password_hash` and reset tokens. Anyone with read
  access to this table can read every credential that ever existed. Restrict
  access accordingly.

---

## What NOT To Do

- **Don't expose `id` to API clients.** All external references use `sync_id`.
- **Don't write to `_history` tables.** Triggers handle it.
- **Don't enable RLS or write Supabase policies.** Auth is in the API layer.
- **Don't hard-delete rows.** Set `deleted_at`.
- **Don't manually set `updated_at`.** The trigger does it.
- **Don't store or log plaintext passwords or reset tokens.**
- **Don't add columns without updating the history table and its trigger function.**
- **Don't create new tables without the full standard pattern** (see checklist below).

---

## Adding a New Table — Checklist

- [ ] `id bigserial primary key`
- [ ] `sync_id uuid not null unique default gen_random_uuid()`
- [ ] `created_at timestamptz not null default now()`
- [ ] `updated_at timestamptz not null default now()`
- [ ] `deleted_at timestamptz`
- [ ] `touch_updated_at` trigger (`BEFORE UPDATE`)
- [ ] `<name>_history` mirror table — no FK, no check, no unique constraints
- [ ] `<name>_history_capture()` trigger function
- [ ] History trigger (`AFTER INSERT OR UPDATE OR DELETE`)
- [ ] All FKs reference `id` (bigserial), never `sync_id`

---

## Known Gaps

- **History tables grow unboundedly.** No archival, partitioning, or TTL is
  implemented.
- **No question bank.** Questions are embedded in `worksheets.questions` JSONB
  and cannot be reused or queried individually across worksheets.
- **No progress tracking.** Beyond raw attempt rows there is no completion
  state, streaks, or learning paths.
- **Unlimited comment nesting.** `parent_comment_id` allows arbitrary depth;
  the API must enforce a cap.
- **Polymorphic `reports.entity_id` has no DB-level FK.** The API must validate
  entity existence.
- **No session/token tables.** Session management, refresh tokens, and rate
  limiting belong in the API layer or a future migration.
- **`attempts` indices are not partial.** Soft-deleted attempts are included in
  index scans. Add `WHERE deleted_at IS NULL` partial indices if
  soft-deleted rows become numerous.
