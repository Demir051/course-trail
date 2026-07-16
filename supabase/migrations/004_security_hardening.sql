-- Tighten catalog + friendship mutation policies (defense in depth).

-- Courses: only enrolled users may update shared metadata (import/sync).
-- App enrolls the importer before updating an existing course.
drop policy if exists "Authenticated users can update course metadata" on public.courses;
create policy "Enrolled users can update course metadata"
  on public.courses for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_courses uc
      where uc.course_id = courses.id
        and uc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.user_courses uc
      where uc.course_id = courses.id
        and uc.user_id = auth.uid()
    )
  );

-- Course videos: same enrollment gate (covers upsert updates)
drop policy if exists "Authenticated users can update course videos" on public.course_videos;
create policy "Enrolled users can update course videos"
  on public.course_videos for update
  to authenticated
  using (
    exists (
      select 1
      from public.user_courses uc
      where uc.course_id = course_videos.course_id
        and uc.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.user_courses uc
      where uc.course_id = course_videos.course_id
        and uc.user_id = auth.uid()
    )
  );

-- Friendships: only the addressee may accept; no self-accept via client
drop policy if exists "Addressee can respond to requests" on public.friendships;

create policy "Addressee can accept pending requests"
  on public.friendships for update
  to authenticated
  using (
    auth.uid() = addressee_id
    and status = 'pending'
  )
  with check (
    auth.uid() = addressee_id
    and status = 'accepted'
  );

-- Friend requests only toward public, onboarded profiles
drop policy if exists "Users can send friend requests" on public.friendships;

create policy "Users can send friend requests to public profiles"
  on public.friendships for insert
  to authenticated
  with check (
    auth.uid() = requester_id
    and status = 'pending'
    and exists (
      select 1
      from public.profiles p
      where p.id = addressee_id
        and p.is_public = true
        and p.onboarding_completed = true
        and p.username is not null
    )
  );
