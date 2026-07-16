/**
 * Curated Discover catalog. Only these playlists appear on /discover.
 * User imports stay in the library and never join this list automatically.
 */
export const DISCOVER_PLAYLIST_IDS = [
  "PLxzHjEHY01H8zPoaYhJgIaJ4Kw1yUYeGQ",
  "PLwP4ObPL5GY940XhCtAykxLxLEOKCu0nT",
  "PLKnjBHu2xXNPmFMvGKVHA_ijjrgUyNIXr",
  "PLld6WWpFK1nEhFvvYi5ts-_JoUL3wF3zz",
  "PL4cUxeGkcC9gC88BEo9czgyS72A3doDeM",
] as const;

export type DiscoverPlaylistId = (typeof DISCOVER_PLAYLIST_IDS)[number];

export function isDiscoverPlaylist(playlistId: string): boolean {
  return (DISCOVER_PLAYLIST_IDS as readonly string[]).includes(playlistId);
}
