-- Only curated courses appear on Discover. User imports stay private to library.

alter table public.courses
  add column if not exists listed_in_discover boolean not null default false;

create index if not exists courses_listed_in_discover_idx
  on public.courses (listed_in_discover)
  where listed_in_discover = true;

-- Mark the current curated catalog
update public.courses
set listed_in_discover = true
where youtube_playlist_id in (
  'PLxzHjEHY01H8zPoaYhJgIaJ4Kw1yUYeGQ',
  'PLwP4ObPL5GY940XhCtAykxLxLEOKCu0nT',
  'PLKnjBHu2xXNPmFMvGKVHA_ijjrgUyNIXr',
  'PLld6WWpFK1nEhFvvYi5ts-_JoUL3wF3zz',
  'PL4cUxeGkcC9gC88BEo9czgyS72A3doDeM'
);

-- Everything else stays off Discover
update public.courses
set listed_in_discover = false
where youtube_playlist_id not in (
  'PLxzHjEHY01H8zPoaYhJgIaJ4Kw1yUYeGQ',
  'PLwP4ObPL5GY940XhCtAykxLxLEOKCu0nT',
  'PLKnjBHu2xXNPmFMvGKVHA_ijjrgUyNIXr',
  'PLld6WWpFK1nEhFvvYi5ts-_JoUL3wF3zz',
  'PL4cUxeGkcC9gC88BEo9czgyS72A3doDeM'
);
