-- CourseTrail RLS policies
-- Principle: private by default; public reads never expose exact progress/timestamps/notes.

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_videos enable row level security;
alter table public.user_courses enable row level security;
alter table public.video_progress enable row level security;
alter table public.notes enable row level security;
alter table public.timestamp_notes enable row level security;
alter table public.collections enable row level security;
alter table public.collection_courses enable row level security;
alter table public.reviews enable row level security;
alter table public.activities enable row level security;
alter table public.notifications enable row level security;
alter table public.learning_days enable row level security;
alter table public.import_rate_limits enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- Courses (global metadata is public)
create policy "Courses are publicly readable"
  on public.courses for select
  using (true);

create policy "Authenticated users can insert courses"
  on public.courses for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update course metadata"
  on public.courses for update
  to authenticated
  using (true)
  with check (true);

-- Course videos (public metadata)
create policy "Course videos are publicly readable"
  on public.course_videos for select
  using (true);

create policy "Authenticated users can insert course videos"
  on public.course_videos for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update course videos"
  on public.course_videos for update
  to authenticated
  using (true)
  with check (true);

-- User courses
-- Owners see everything. Public viewers see only opted-in enrollments,
-- and applications must never select private timestamp columns for public pages.
create policy "Owners can manage their enrollments"
  on public.user_courses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can view opted-in enrollments"
  on public.user_courses for select
  using (
    public.is_user_course_public(user_courses)
    and exists (
      select 1 from public.profiles p
      where p.id = user_courses.user_id and p.is_public = true
    )
  );

-- Video progress: owner only (never public)
create policy "Owners manage video progress"
  on public.video_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notes: owner only
create policy "Owners manage notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Timestamp notes: owner only
create policy "Owners manage timestamp notes"
  on public.timestamp_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Collections
create policy "Owners manage collections"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can view public or unlisted collections"
  on public.collections for select
  using (
    visibility in ('public', 'unlisted')
    or auth.uid() = user_id
  );

-- Collection courses
create policy "Owners manage collection courses"
  on public.collection_courses for all
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

create policy "Anyone can view courses in public/unlisted collections"
  on public.collection_courses for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id
        and (c.visibility in ('public', 'unlisted') or c.user_id = auth.uid())
    )
  );

-- Reviews
create policy "Owners manage reviews"
  on public.reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can read public reviews"
  on public.reviews for select
  using (visibility = 'public' or auth.uid() = user_id);

-- Activities
create policy "Owners manage activities"
  on public.activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can read public activities"
  on public.activities for select
  using (visibility = 'public' or auth.uid() = user_id);

-- Notifications: owner only
create policy "Owners manage notifications"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Learning days: owner only
create policy "Owners manage learning days"
  on public.learning_days for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Import rate limits: owner only
create policy "Owners manage import rate limits"
  on public.import_rate_limits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow authenticated users to refresh aggregate course stats
grant execute on function public.refresh_course_stats(uuid) to authenticated;

-- Storage bucket for avatars (run in Supabase dashboard or via storage API)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
