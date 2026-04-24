-- =============================================================================
-- Education App Schema (v2)
-- Target: Supabase (Postgres 15+)
-- Scope: content, users/profiles, progress, comments, reports, full versioning
-- Language: English only
-- RLS: write permissions gated on profiles.is_editor
-- Soft delete: UNIFORM. Every table has deleted_at; no hard deletes expected.
-- Updated_at: UNIFORM. Every table has updated_at, auto-touched on update.
-- =============================================================================
-- Run this ONCE on a fresh Supabase project via the SQL editor.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  is_editor     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- subjects
-- -----------------------------------------------------------------------------
create table if not exists public.subjects (
  slug          text primary key,
  name          text not null,
  description   text,
  display_order int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

insert into public.subjects (slug, name, display_order) values
  ('math',           'Mathematics',     1),
  ('science',        'Science',         2),
  ('english',        'English',         3),
  ('social-studies', 'Social Studies',  4)
on conflict (slug) do nothing;


-- -----------------------------------------------------------------------------
-- topics
-- -----------------------------------------------------------------------------
create table if not exists public.topics (
  id            uuid primary key default gen_random_uuid(),
  subject_slug  text not null references public.subjects(slug) on delete restrict,
  year_level    int  not null check (year_level between 7 and 12),
  slug          text not null,
  title         text not null,
  description   text,
  order_index   int  not null default 0,
  is_published  boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  updated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (subject_slug, year_level, slug)
);

create index if not exists topics_browse_idx
  on public.topics (subject_slug, year_level, order_index)
  where deleted_at is null and is_published = true;

create index if not exists topics_author_idx
  on public.topics (created_by, updated_at desc);


-- -----------------------------------------------------------------------------
-- lectures
--   text:   { "markdown": "..." }
--   video:  { "youtube_id": "...", "duration_seconds": 300 }
--   slides: { "html": "..." }
-- -----------------------------------------------------------------------------
create table if not exists public.lectures (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null unique references public.topics(id),
  format      text not null check (format in ('text', 'video', 'slides')),
  content     jsonb not null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);


-- -----------------------------------------------------------------------------
-- worksheets
-- -----------------------------------------------------------------------------
create table if not exists public.worksheets (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null unique references public.topics(id),
  title       text not null,
  questions   jsonb not null,
  updated_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);


-- -----------------------------------------------------------------------------
-- attempts
-- -----------------------------------------------------------------------------
create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id),
  worksheet_id  uuid not null references public.worksheets(id),
  score         int  not null check (score >= 0),
  total         int  not null check (total > 0),
  answers       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists attempts_user_recent_idx
  on public.attempts (user_id, created_at desc)
  where deleted_at is null;

create index if not exists attempts_user_worksheet_idx
  on public.attempts (user_id, worksheet_id)
  where deleted_at is null;


-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id                uuid primary key default gen_random_uuid(),
  topic_id          uuid not null references public.topics(id),
  user_id           uuid not null references public.profiles(id),
  parent_comment_id uuid references public.comments(id),
  body              text not null check (length(body) between 1 and 4000),
  is_hidden         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists comments_topic_idx
  on public.comments (topic_id, created_at)
  where deleted_at is null and is_hidden = false;

create index if not exists comments_user_idx
  on public.comments (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id),
  entity_type   text not null check (entity_type in ('topic','lecture','worksheet','comment')),
  entity_id     uuid not null,
  reason        text not null check (reason in ('incorrect','inappropriate','spam','other')),
  details       text,
  status        text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by   uuid references public.profiles(id) on delete set null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists reports_queue_idx
  on public.reports (status, created_at)
  where deleted_at is null;

create index if not exists reports_target_idx
  on public.reports (entity_type, entity_id);


-- -----------------------------------------------------------------------------
-- content_versions
-- Append-only audit log in practice (no write policies granted below), but
-- has deleted_at for schema uniformity. RLS prevents setting it via API.
-- -----------------------------------------------------------------------------
create table if not exists public.content_versions (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('topic','lecture','worksheet')),
  entity_id   uuid not null,
  operation   text not null check (operation in ('insert','update','delete')),
  snapshot    jsonb not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists versions_entity_idx
  on public.content_versions (entity_type, entity_id, created_at desc)
  where deleted_at is null;

create index if not exists versions_author_idx
  on public.content_versions (changed_by, created_at desc);


-- -----------------------------------------------------------------------------
-- Version-capture trigger
-- Fires on insert/update/delete of topics/lectures/worksheets.
-- Soft-delete (deleted_at null -> not null) is recorded as operation='delete'.
-- -----------------------------------------------------------------------------
create or replace function public.capture_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type text := TG_ARGV[0];
  v_entity_id   uuid;
  v_snapshot    jsonb;
  v_operation   text;
  v_actor       uuid;
begin
  if (tg_op = 'INSERT') then
    v_entity_id := new.id;
    v_snapshot  := to_jsonb(new);
    v_operation := 'insert';
    v_actor     := coalesce(new.created_by, new.updated_by);
  elsif (tg_op = 'UPDATE') then
    v_entity_id := new.id;
    v_snapshot  := to_jsonb(new);
    if old.deleted_at is null and new.deleted_at is not null then
      v_operation := 'delete';
    else
      v_operation := 'update';
    end if;
    v_actor     := new.updated_by;
  elsif (tg_op = 'DELETE') then
    v_entity_id := old.id;
    v_snapshot  := to_jsonb(old);
    v_operation := 'delete';
    v_actor     := old.updated_by;
  end if;

  insert into public.content_versions (entity_type, entity_id, operation, snapshot, changed_by)
  values (v_entity_type, v_entity_id, v_operation, v_snapshot, v_actor);

  if (tg_op = 'DELETE') then return old; else return new; end if;
end;
$$;

drop trigger if exists topics_version on public.topics;
create trigger topics_version
  after insert or update or delete on public.topics
  for each row execute function public.capture_version('topic');

drop trigger if exists lectures_version on public.lectures;
create trigger lectures_version
  after insert or update or delete on public.lectures
  for each row execute function public.capture_version('lecture');

drop trigger if exists worksheets_version on public.worksheets;
create trigger worksheets_version
  after insert or update or delete on public.worksheets
  for each row execute function public.capture_version('worksheet');


-- -----------------------------------------------------------------------------
-- updated_at auto-touch on every table
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch   on public.profiles;
drop trigger if exists subjects_touch   on public.subjects;
drop trigger if exists topics_touch     on public.topics;
drop trigger if exists lectures_touch   on public.lectures;
drop trigger if exists worksheets_touch on public.worksheets;
drop trigger if exists attempts_touch   on public.attempts;
drop trigger if exists comments_touch   on public.comments;
drop trigger if exists reports_touch    on public.reports;
drop trigger if exists versions_touch   on public.content_versions;

create trigger profiles_touch   before update on public.profiles         for each row execute function public.touch_updated_at();
create trigger subjects_touch   before update on public.subjects         for each row execute function public.touch_updated_at();
create trigger topics_touch     before update on public.topics           for each row execute function public.touch_updated_at();
create trigger lectures_touch   before update on public.lectures         for each row execute function public.touch_updated_at();
create trigger worksheets_touch before update on public.worksheets       for each row execute function public.touch_updated_at();
create trigger attempts_touch   before update on public.attempts         for each row execute function public.touch_updated_at();
create trigger comments_touch   before update on public.comments         for each row execute function public.touch_updated_at();
create trigger reports_touch    before update on public.reports          for each row execute function public.touch_updated_at();
create trigger versions_touch   before update on public.content_versions for each row execute function public.touch_updated_at();


-- -----------------------------------------------------------------------------
-- Helper: is_editor()
-- -----------------------------------------------------------------------------
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_editor from public.profiles
      where id = auth.uid() and deleted_at is null),
    false
  );
$$;


-- =============================================================================
-- Row Level Security
-- =============================================================================

-- profiles -------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_public_select on public.profiles
  for select using (deleted_at is null);

create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id and deleted_at is null)
  with check (
    auth.uid() = id
    and is_editor = (select is_editor from public.profiles where id = auth.uid())
  );


-- subjects -------------------------------------------------------------------
alter table public.subjects enable row level security;

create policy subjects_public_select on public.subjects
  for select using (deleted_at is null);

create policy subjects_editor_write on public.subjects
  for all using (public.is_editor())
  with check (public.is_editor());


-- topics ---------------------------------------------------------------------
alter table public.topics enable row level security;

create policy topics_public_select on public.topics
  for select using (deleted_at is null and is_published = true);

create policy topics_editor_select_all on public.topics
  for select using (public.is_editor());

create policy topics_editor_write on public.topics
  for all using (public.is_editor())
  with check (public.is_editor());


-- lectures -------------------------------------------------------------------
alter table public.lectures enable row level security;

create policy lectures_public_select on public.lectures
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.topics t
      where t.id = lectures.topic_id
        and t.deleted_at is null
        and t.is_published = true
    )
  );

create policy lectures_editor_select_all on public.lectures
  for select using (public.is_editor());

create policy lectures_editor_write on public.lectures
  for all using (public.is_editor())
  with check (public.is_editor());


-- worksheets -----------------------------------------------------------------
alter table public.worksheets enable row level security;

create policy worksheets_public_select on public.worksheets
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.topics t
      where t.id = worksheets.topic_id
        and t.deleted_at is null
        and t.is_published = true
    )
  );

create policy worksheets_editor_select_all on public.worksheets
  for select using (public.is_editor());

create policy worksheets_editor_write on public.worksheets
  for all using (public.is_editor())
  with check (public.is_editor());


-- attempts -------------------------------------------------------------------
-- Row data is immutable; only the author can soft-delete.
alter table public.attempts enable row level security;

create policy attempts_self_select on public.attempts
  for select using (auth.uid() = user_id and deleted_at is null);

create policy attempts_self_insert on public.attempts
  for insert with check (auth.uid() = user_id);

create policy attempts_self_soft_delete on public.attempts
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and deleted_at is not null);


-- comments -------------------------------------------------------------------
alter table public.comments enable row level security;

create policy comments_public_select on public.comments
  for select using (deleted_at is null and is_hidden = false);

create policy comments_author_select on public.comments
  for select using (auth.uid() = user_id and deleted_at is null);

create policy comments_editor_select on public.comments
  for select using (public.is_editor());

create policy comments_auth_insert on public.comments
  for insert with check (auth.uid() = user_id);

create policy comments_author_update on public.comments
  for update using (auth.uid() = user_id and deleted_at is null)
  with check (auth.uid() = user_id);

create policy comments_editor_moderate on public.comments
  for update using (public.is_editor())
  with check (public.is_editor());


-- reports --------------------------------------------------------------------
alter table public.reports enable row level security;

create policy reports_self_insert on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy reports_self_select on public.reports
  for select using (auth.uid() = reporter_id and deleted_at is null);

create policy reports_editor_select on public.reports
  for select using (public.is_editor());

create policy reports_editor_update on public.reports
  for update using (public.is_editor())
  with check (public.is_editor());


-- content_versions -----------------------------------------------------------
-- Only the trigger writes (triggers bypass RLS when the table owner runs them).
-- No write policy is granted to any user, so the audit log is tamper-resistant.
alter table public.content_versions enable row level security;

create policy versions_editor_select on public.content_versions
  for select using (public.is_editor() and deleted_at is null);


-- =============================================================================
-- Done.
-- After running: Table Editor -> profiles -> set is_editor = true on your own
-- row to unlock the editor flows in the app.
-- =============================================================================
