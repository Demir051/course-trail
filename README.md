# CourseTrail

**Track what you learn. Continue where you stopped.**

CourseTrail is a privacy-first learning progress platform for YouTube courses and educational playlists. Import a playlist, resume from the exact lesson and timestamp, keep rich private notes, and optionally share selected courses on a public profile.

## Features (Phase 1 MVP)

- Email/password auth, Google OAuth option, password reset, email verification callback
- Username onboarding and editable public profile
- YouTube playlist **or single video** import (playlist URL, watch URL, youtu.be, or ID)
- Personal library with status, tags, search, sort, archive/remove
- Distraction-focused learning page with YouTube IFrame Player
- Autosaved progress + resume timestamp
- Configurable auto-complete threshold (90%)
- Tiptap rich notes with save state + timestamp notes that seek the player
- Private-by-default progress with RLS
- Public profile at `/u/[username]` without leaking exact timestamps
- Discover catalog with aggregated (non-private) stats
- Light/dark theme, responsive layout

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Tiptap · YouTube Data API v3 · Zod · Vitest

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy **Project URL** and **anon key** into `.env.local`.
3. Copy the **service role key** for seeding only.
4. In the SQL editor, run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_friendships.sql`
   - `supabase/migrations/004_security_hardening.sql`
   - `supabase/migrations/005_discover_catalog_flag.sql`
   - `supabase/seed.sql`
5. Auth settings:
   - Enable Email provider
   - (Optional) Enable Google provider
   - Add redirect URL: `http://localhost:3000/auth/callback`

### 3. YouTube Data API

1. Create a Google Cloud project.
2. Enable **YouTube Data API v3**.
3. Create an API key and set `YOUTUBE_API_KEY` in `.env.local` (server-only).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Seed demo users (optional)

```bash
npm run db:seed
```

Demo accounts (password `password123`):

- `maya@coursetrail.dev` (@maya_codes)
- `jordan@coursetrail.dev` (@jordan_ds)
- `sam@coursetrail.dev` (@sam_builds)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run db:seed` | Seed demo users/enrollments |
| `npm run db:seed-catalog` | Import curated playlists into Discover |
| `npm run lint` | ESLint |

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/login` `/register` | Auth |
| `/onboarding` | Username + interests |
| `/dashboard` | Continue learning |
| `/library` | Personal course shelf |
| `/library/[userCourseId]` | Course detail + lessons |
| `/learn/[userCourseId]/[videoId]` | Player + notes |
| `/notes` | Private notes search |
| `/discover` | Public course catalog |
| `/courses/[courseId]` | Public course page |
| `/u/[username]` | Public profile |
| `/settings/*` | Profile, privacy, notifications |

## Privacy principles

- Exact lesson position and timestamps are **always private**
- Notes are **always private by default**
- Public profiles never expose “resume at mm:ss”
- Users control per-course visibility: private / public / public on completion
- RLS enforces owner-only access on private tables

## Deploy (Vercel)

1. Push the repo and import into Vercel.
2. Set the same environment variables as `.env.example`.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Add the production `/auth/callback` URL in Supabase Auth settings.

## Docs

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for schema, RLS, folder structure, and phased roadmap.

## License

Private / unlicensed unless otherwise specified by the repository owner.
