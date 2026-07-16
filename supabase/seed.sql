-- Development seed data (no real private user data).
-- Requires auth.users rows first. Prefer `npm run db:seed` which creates users via the Admin API.
-- This SQL seeds course metadata that the app seed script can enroll users into.

insert into public.courses (
  id,
  youtube_playlist_id,
  title,
  description,
  thumbnail_url,
  youtube_channel_id,
  youtube_channel_name,
  video_count,
  total_duration_seconds,
  tags,
  learner_count,
  completion_count,
  average_rating,
  rating_count,
  last_synced_at
) values
(
  '11111111-1111-1111-1111-111111111111',
  'PLillGF-RfqbY3c2r0htUuBb_ROVY9aUw9',
  'React Front to Back',
  'A practical React course covering components, hooks, routing, and full-stack patterns for modern web apps.',
  'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
  'UC29ju8bIPH5as8OGnQzwJyA',
  'Traversy Media',
  5,
  12600,
  array['react', 'javascript', 'frontend'],
  3,
  1,
  4.50,
  2,
  now()
),
(
  '22222222-2222-2222-2222-222222222222',
  'PLWKjhJtqVAbmGw5fN5BQlwuOYsZyYt91V',
  'JavaScript Algorithms and Data Structures',
  'Build a strong foundation in algorithms and data structures with clear, practical JavaScript examples.',
  'https://i.ytimg.com/vi/t2CEgPsws3U/hqdefault.jpg',
  'UC8butISFwT-Wl7EV0hUK0BQ',
  'freeCodeCamp.org',
  4,
  28800,
  array['javascript', 'algorithms', 'computer-science'],
  2,
  0,
  5.00,
  1,
  now()
),
(
  '33333333-3333-3333-3333-333333333333',
  'PLXDU_eVOJTx7QHLShNqIXL1Cgbxj7Bn1z',
  'UI Design Fundamentals',
  'Learn visual hierarchy, spacing, typography, and interface composition for calm, usable product design.',
  'https://i.ytimg.com/vi/c9Wg6Cb_YlU/hqdefault.jpg',
  'UC7T8roytE8I6aAa6KvEdJ4A',
  'DesignCourse',
  4,
  8400,
  array['design', 'ui', 'ux'],
  2,
  1,
  4.00,
  1,
  now()
),
(
  '44444444-4444-4444-4444-444444444444',
  'PLrhzvIcii6GNjpARdnO4ueQfwcNNveGmQ',
  'TypeScript for Professionals',
  'Move from JavaScript to confident TypeScript with types, generics, narrowing, and practical app patterns.',
  'https://i.ytimg.com/vi/30LWjhZzgKw/hqdefault.jpg',
  'UCW5YeuERMmlnqo4oq8vwUpg',
  'The Net Ninja',
  5,
  10800,
  array['typescript', 'javascript'],
  1,
  0,
  null,
  0,
  now()
)
on conflict (youtube_playlist_id) do nothing;

-- Course videos for React Front to Back
insert into public.course_videos (
  id, course_id, youtube_video_id, title, description, thumbnail_url,
  duration_seconds, playlist_position, published_at, is_available
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '11111111-1111-1111-1111-111111111111',
  'w7ejDZ8SWv8',
  'React JS Crash Course',
  'Core React concepts: components, props, state, and hooks.',
  'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg',
  6300, 1, '2021-01-18', true
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  '11111111-1111-1111-1111-111111111111',
  '0ZJgIjIuY7U',
  'React Router Crash Course',
  'Client-side routing patterns for multi-page React apps.',
  'https://i.ytimg.com/vi/0ZJgIjIuY7U/hqdefault.jpg',
  1800, 2, '2021-03-10', true
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  '11111111-1111-1111-1111-111111111111',
  'LlvBep_urxw',
  'React Query / TanStack Query Intro',
  'Server state, caching, and data fetching patterns.',
  'https://i.ytimg.com/vi/LlvBep_urxw/hqdefault.jpg',
  2100, 3, '2022-05-12', true
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
  '11111111-1111-1111-1111-111111111111',
  'a_7Z7C_JCyo',
  'Context API & State Patterns',
  'When to use context, reducers, and local state.',
  'https://i.ytimg.com/vi/a_7Z7C_JCyo/hqdefault.jpg',
  1500, 4, '2022-08-01', true
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
  '11111111-1111-1111-1111-111111111111',
  'RvYYCgs5zkk',
  'Deploying a React App',
  'Build output, environment variables, and hosting basics.',
  'https://i.ytimg.com/vi/RvYYCgs5zkk/hqdefault.jpg',
  900, 5, '2023-01-20', true
)
on conflict (course_id, youtube_video_id) do nothing;

-- Algorithms course videos
insert into public.course_videos (
  id, course_id, youtube_video_id, title, description, thumbnail_url,
  duration_seconds, playlist_position, published_at, is_available
) values
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '22222222-2222-2222-2222-222222222222',
  't2CEgPsws3U',
  'Data Structures Easy to Advanced',
  'Arrays, linked lists, stacks, queues, and trees.',
  'https://i.ytimg.com/vi/t2CEgPsws3U/hqdefault.jpg',
  28800, 1, '2019-09-01', true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
  '22222222-2222-2222-2222-222222222222',
  '8hly31xKli0',
  'Algorithms and Data Structures – Full Course',
  'Searching, sorting, and complexity analysis.',
  'https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg',
  18000, 2, '2020-06-15', true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
  '22222222-2222-2222-2222-222222222222',
  'RBSGKlAvoiM',
  'Big O Notation',
  'How to reason about runtime and memory.',
  'https://i.ytimg.com/vi/RBSGKlAvoiM/hqdefault.jpg',
  2400, 3, '2018-04-02', true
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
  '22222222-2222-2222-2222-222222222222',
  'PkZNo7MFNFg',
  'Recursion Explained',
  'Base cases, call stacks, and common pitfalls.',
  'https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg',
  1800, 4, '2021-11-11', false
)
on conflict (course_id, youtube_video_id) do nothing;

-- Design course videos
insert into public.course_videos (
  id, course_id, youtube_video_id, title, description, thumbnail_url,
  duration_seconds, playlist_position, published_at, is_available
) values
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  '33333333-3333-3333-3333-333333333333',
  'c9Wg6Cb_YlU',
  'UI Design Theory',
  'Hierarchy, contrast, and visual rhythm.',
  'https://i.ytimg.com/vi/c9Wg6Cb_YlU/hqdefault.jpg',
  2400, 1, '2020-02-10', true
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc2',
  '33333333-3333-3333-3333-333333333333',
  'aFoq8s0v6Sg',
  'Spacing Systems',
  'Consistent spacing scales for product UI.',
  'https://i.ytimg.com/vi/aFoq8s0v6Sg/hqdefault.jpg',
  1800, 2, '2020-05-22', true
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc3',
  '33333333-3333-3333-3333-333333333333',
  'YqQyJ9v6vQY',
  'Typography for Interfaces',
  'Type scales, pairing, and readability.',
  'https://i.ytimg.com/vi/YqQyJ9v6vQY/hqdefault.jpg',
  2100, 3, '2021-01-08', true
),
(
  'cccccccc-cccc-cccc-cccc-ccccccccccc4',
  '33333333-3333-3333-3333-333333333333',
  'FTFaQWZBqQ8',
  'Color and Accessibility',
  'Contrast ratios and calm palettes.',
  'https://i.ytimg.com/vi/FTFaQWZBqQ8/hqdefault.jpg',
  2100, 4, '2021-07-19', true
)
on conflict (course_id, youtube_video_id) do nothing;

-- TypeScript course videos
insert into public.course_videos (
  id, course_id, youtube_video_id, title, description, thumbnail_url,
  duration_seconds, playlist_position, published_at, is_available
) values
(
  'dddddddd-dddd-dddd-dddd-ddddddddddd1',
  '44444444-4444-4444-4444-444444444444',
  '30LWjhZzgKw',
  'TypeScript Crash Course',
  'Types, interfaces, and tooling setup.',
  'https://i.ytimg.com/vi/30LWjhZzgKw/hqdefault.jpg',
  5400, 1, '2021-09-01', true
),
(
  'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  '44444444-4444-4444-4444-444444444444',
  'zQnADk_2f1w',
  'Generics in Practice',
  'Reusable typed utilities and components.',
  'https://i.ytimg.com/vi/zQnADk_2f1w/hqdefault.jpg',
  1500, 2, '2022-02-14', true
),
(
  'dddddddd-dddd-dddd-dddd-ddddddddddd3',
  '44444444-4444-4444-4444-444444444444',
  '3L9vQxV0vQY',
  'Narrowing and Control Flow',
  'Discriminated unions and type guards.',
  'https://i.ytimg.com/vi/3L9vQxV0vQY/hqdefault.jpg',
  1200, 3, '2022-06-03', true
),
(
  'dddddddd-dddd-dddd-dddd-ddddddddddd4',
  '44444444-4444-4444-4444-444444444444',
  '1jRXz2b1Q1Y',
  'Typing APIs and Forms',
  'Zod-friendly TypeScript patterns.',
  'https://i.ytimg.com/vi/1jRXz2b1Q1Y/hqdefault.jpg',
  1800, 4, '2023-03-21', true
),
(
  'dddddddd-dddd-dddd-dddd-ddddddddddd5',
  '44444444-4444-4444-4444-444444444444',
  '2kRYx1vZ2QY',
  'Migrating a JS Codebase',
  'Incremental adoption strategies.',
  'https://i.ytimg.com/vi/2kRYx1vZ2QY/hqdefault.jpg',
  900, 5, '2023-08-09', true
)
on conflict (course_id, youtube_video_id) do nothing;
