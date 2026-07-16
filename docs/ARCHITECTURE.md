# CourseTrail Architecture

## Overview

CourseTrail is a privacy-first learning tracker for YouTube playlists. Global course metadata is reusable; every learner keeps a private enrollment with progress, notes, and visibility settings.

## Stack

- **Next.js App Router** — SSR pages, Server Actions, route handlers
- **Supabase Auth + Postgres + RLS** — identity and secure data access
- **YouTube Data API v3** — playlist import (server-only API key)
- **YouTube IFrame Player API** — watch position / player state in the browser
- **Tiptap** — rich lesson notes with debounced autosave
- **Zod** — validation at action boundaries
- **shadcn/ui + Tailwind** — UI system with light/dark themes

## Domain model

```
auth.users 1—1 profiles
courses 1—n course_videos
profiles 1—n user_courses n—1 courses
user_courses 1—n video_progress
user_courses 1—n notes
notes / videos 1—n timestamp_notes
```

**Global:** `courses`, `course_videos` (public metadata)  
**Private by default:** `user_courses` progress fields, `video_progress`, `notes`, `timestamp_notes`, `learning_days`, `notifications`

## Privacy rules

1. Exact `current_video_id` and `current_timestamp_seconds` never appear on public profiles or public API payloads.
2. Notes and timestamp notes are owner-only via RLS.
3. Public profile course lists use a stripped select (`PUBLIC_USER_COURSE_SELECT` / `toPublicUserCourse`).
4. Activity is private unless explicitly marked public (Phase 2 social).
5. Aggregates on discover pages (`learner_count`, `completion_count`, ratings) never identify individuals.

## Main user flows

1. **Register → verify email → onboarding username → import playlist**
2. **Library → course detail → Continue → learn page**
3. **Watch → autosave progress → resume timestamp**
4. **Write notes / timestamp notes → private search**
5. **Opt a course into public profile visibility**

## Folder structure

```
src/
  app/                 # routes (marketing, auth, app, public)
  actions/             # server actions
  components/          # UI by domain
  lib/                 # supabase, youtube, progress, privacy, validations
  types/               # shared TypeScript models
supabase/
  migrations/          # schema + RLS
  seed.sql             # catalog seed
scripts/seed.ts        # demo users + enrollments
```

## Implementation phases

### Phase 1 (this MVP)

Auth, profiles, onboarding, playlist import, library, course detail, learn page with resume + notes, public profile privacy, discover catalog, RLS, tests for critical logic.

### Phase 2

Reviews UI polish, public collections editor, advanced search, playlist sync jobs, notifications delivery.

### Phase 3

Browser extension, AI note tools (optional service interface), analytics, multi-platform import, mobile.

## Security notes

- YouTube API key is server-only (`server-only` module + env).
- Imports are rate-limited per user hour.
- Rich text HTML is sanitized with DOMPurify before persistence.
- Middleware protects dashboard routes; actions re-check `auth.uid()` ownership.
