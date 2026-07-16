-- CourseTrail Phase 1 schema
-- Privacy-first: private progress/notes by default; public surfaces are opt-in.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- Enums
create type course_status as enum (
  'want_to_learn',
  'in_progress',
  'paused',
  'completed',
  'dropped'
);

create type course_visibility as enum (
  'private',
  'public',
  'public_on_completion'
);

create type collection_visibility as enum (
  'private',
  'public',
  'unlisted'
);

create type review_visibility as enum (
  'private',
  'public'
);

create type activity_visibility as enum (
  'private',
  'public'
);

create type activity_type as enum (
  'started_course',
  'completed_course',
  'completed_lesson',
  'added_course',
  'wrote_review',
  'created_collection'
);

create type notification_type as enum (
  'playlist_updated',
  'video_added',
  'video_available',
  'learning_reminder',
  'course_completed'
);

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  website_url text,
  interests text[] not null default '{}',
  onboarding_completed boolean not null default false,
  is_public boolean not null default true,
  notifications_enabled boolean not null default true,
  learning_reminders_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (
    username is null
    or (
      username ~ '^[a-z0-9_]{3,24}$'
    )
  )
);

create index profiles_username_idx on public.profiles (username);
create index profiles_username_trgm_idx on public.profiles using gin (username gin_trgm_ops);

-- Global reusable course metadata (YouTube playlist)
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  youtube_playlist_id text not null unique,
  title text not null,
  description text,
  thumbnail_url text,
  youtube_channel_id text,
  youtube_channel_name text,
  video_count integer not null default 0,
  total_duration_seconds integer not null default 0,
  tags text[] not null default '{}',
  learner_count integer not null default 0,
  completion_count integer not null default 0,
  average_rating numeric(3,2),
  rating_count integer not null default 0,
  last_synced_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(youtube_channel_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index courses_search_idx on public.courses using gin (search_vector);
create index courses_channel_idx on public.courses (youtube_channel_name);
create index courses_created_at_idx on public.courses (created_at desc);
create index courses_learner_count_idx on public.courses (learner_count desc);

-- Ordered videos belonging to a course
create table public.course_videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  description text,
  thumbnail_url text,
  duration_seconds integer not null default 0,
  playlist_position integer not null,
  published_at timestamptz,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, youtube_video_id),
  unique (course_id, playlist_position)
);

create index course_videos_course_position_idx
  on public.course_videos (course_id, playlist_position);

-- Private enrollment / progress per user
create table public.user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status course_status not null default 'want_to_learn',
  visibility course_visibility not null default 'private',
  rating smallint check (rating is null or (rating >= 1 and rating <= 5)),
  personal_tags text[] not null default '{}',
  course_notes_json jsonb,
  course_notes_text text,
  is_archived boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  last_opened_at timestamptz,
  current_video_id uuid references public.course_videos (id) on delete set null,
  current_timestamp_seconds integer not null default 0 check (current_timestamp_seconds >= 0),
  progress_percentage numeric(5,2) not null default 0
    check (progress_percentage >= 0 and progress_percentage <= 100),
  completed_lesson_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index user_courses_user_status_idx on public.user_courses (user_id, status);
create index user_courses_user_last_opened_idx on public.user_courses (user_id, last_opened_at desc nulls last);
create index user_courses_course_id_idx on public.user_courses (course_id);
create index user_courses_visibility_idx on public.user_courses (visibility) where visibility <> 'private';

-- Per-lesson private progress
create table public.video_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_course_id uuid not null references public.user_courses (id) on delete cascade,
  course_video_id uuid not null references public.course_videos (id) on delete cascade,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  last_timestamp_seconds integer not null default 0 check (last_timestamp_seconds >= 0),
  completion_percentage numeric(5,2) not null default 0
    check (completion_percentage >= 0 and completion_percentage <= 100),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_course_id, course_video_id)
);

create index video_progress_user_idx on public.video_progress (user_id);
create index video_progress_user_course_idx on public.video_progress (user_course_id);

-- Private rich-text notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_course_id uuid not null references public.user_courses (id) on delete cascade,
  course_video_id uuid references public.course_videos (id) on delete set null,
  title text,
  content_json jsonb not null default '{}'::jsonb,
  content_text text not null default '',
  content_html text,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content_text, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_idx on public.notes (user_id, updated_at desc);
create index notes_user_course_idx on public.notes (user_course_id);
create index notes_search_idx on public.notes using gin (search_vector);

-- Timestamp-linked note snippets
create table public.timestamp_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_id uuid references public.notes (id) on delete set null,
  user_course_id uuid not null references public.user_courses (id) on delete cascade,
  course_video_id uuid not null references public.course_videos (id) on delete cascade,
  timestamp_seconds integer not null check (timestamp_seconds >= 0),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index timestamp_notes_video_idx
  on public.timestamp_notes (course_video_id, timestamp_seconds);
create index timestamp_notes_user_course_idx
  on public.timestamp_notes (user_course_id);

-- Collections
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  icon text,
  visibility collection_visibility not null default 'private',
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index collections_visibility_idx
  on public.collections (visibility) where visibility = 'public';

create table public.collection_courses (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  user_course_id uuid not null references public.user_courses (id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (collection_id, user_course_id),
  unique (collection_id, position)
);

-- Reviews / ratings
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_course_id uuid references public.user_courses (id) on delete set null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  content text check (content is null or char_length(content) <= 5000),
  visibility review_visibility not null default 'private',
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index reviews_course_public_idx
  on public.reviews (course_id, created_at desc)
  where visibility = 'public';

-- Activity feed (private by default)
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_type activity_type not null,
  course_id uuid references public.courses (id) on delete set null,
  course_video_id uuid references public.course_videos (id) on delete set null,
  visibility activity_visibility not null default 'private',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_user_created_idx on public.activities (user_id, created_at desc);
create index activities_public_idx
  on public.activities (created_at desc)
  where visibility = 'public';

-- In-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where is_read = false;

-- Learning streaks / daily activity (private)
create table public.learning_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  activity_date date not null,
  watched_seconds integer not null default 0,
  lessons_completed integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

-- Import rate limiting helper
create table public.import_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  imported_at timestamptz not null default now()
);

create index import_rate_limits_user_time_idx
  on public.import_rate_limits (user_id, imported_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger course_videos_updated_at before update on public.course_videos
  for each row execute function public.set_updated_at();
create trigger user_courses_updated_at before update on public.user_courses
  for each row execute function public.set_updated_at();
create trigger video_progress_updated_at before update on public.video_progress
  for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger timestamp_notes_updated_at before update on public.timestamp_notes
  for each row execute function public.set_updated_at();
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();
create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is a user_course publicly visible on a profile?
create or replace function public.is_user_course_public(uc public.user_courses)
returns boolean
language sql
stable
as $$
  select
    case
      when uc.visibility = 'public' then true
      when uc.visibility = 'public_on_completion' and uc.status = 'completed' then true
      else false
    end;
$$;

-- Recalculate course aggregates (safe public stats only)
create or replace function public.refresh_course_stats(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.courses c
  set
    learner_count = (
      select count(*) from public.user_courses uc where uc.course_id = p_course_id and not uc.is_archived
    ),
    completion_count = (
      select count(*) from public.user_courses uc
      where uc.course_id = p_course_id and uc.status = 'completed'
    ),
    average_rating = (
      select round(avg(r.rating)::numeric, 2)
      from public.reviews r
      where r.course_id = p_course_id and r.visibility = 'public'
    ),
    rating_count = (
      select count(*) from public.reviews r
      where r.course_id = p_course_id and r.visibility = 'public'
    ),
    updated_at = now()
  where c.id = p_course_id;
end;
$$;
