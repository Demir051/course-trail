/**
 * Import curated playlists into the Discover catalog (courses + videos).
 * Usage: npm run db:seed-catalog
 */
import { createClient } from "@supabase/supabase-js";
import { DISCOVER_PLAYLIST_IDS } from "../src/lib/catalog";

const PLAYLISTS = [...DISCOVER_PLAYLIST_IDS];

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const youtubeKey = process.env.YOUTUBE_API_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!youtubeKey) {
  console.error("Missing YOUTUBE_API_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseDurationIso8601(iso: string): number {
  const match =
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso) ??
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return 0;
  if (match[0].startsWith("PT")) {
    const h = Number(match[1] ?? 0);
    const m = Number(match[2] ?? 0);
    const s = Number(match[3] ?? 0);
    return h * 3600 + m * 60 + s;
  }
  const d = Number(match[1] ?? 0);
  const h = Number(match[2] ?? 0);
  const m = Number(match[3] ?? 0);
  const s = Number(match[4] ?? 0);
  return d * 86400 + h * 3600 + m * 60 + s;
}

function pickThumbnail(
  thumbs?: Record<string, { url?: string }>,
): string | null {
  return (
    thumbs?.maxres?.url ??
    thumbs?.standard?.url ??
    thumbs?.high?.url ??
    thumbs?.medium?.url ??
    thumbs?.default?.url ??
    null
  );
}

async function youtubeFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const endpoint = new URL(`${YOUTUBE_API}/${path}`);
  endpoint.searchParams.set("key", youtubeKey!);
  Object.entries(params).forEach(([k, v]) => endpoint.searchParams.set(k, v));
  const res = await fetch(endpoint);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? `YouTube API ${res.status}`);
  }
  return (await res.json()) as T;
}

async function fetchPlaylistMeta(playlistId: string) {
  const data = await youtubeFetch<{
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        description?: string;
        channelId?: string;
        channelTitle?: string;
        thumbnails?: Record<string, { url?: string }>;
      };
    }>;
  }>("playlists", {
    part: "snippet,contentDetails",
    id: playlistId,
    maxResults: "1",
  });

  const item = data.items?.[0];
  if (!item?.snippet) throw new Error("Playlist not found");

  return {
    id: item.id,
    title: item.snippet.title ?? "Untitled playlist",
    description: item.snippet.description ?? "",
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    channelId: item.snippet.channelId ?? null,
    channelTitle: item.snippet.channelTitle ?? null,
  };
}

async function fetchPlaylistItems(playlistId: string) {
  const items: Array<{
    youtubeVideoId: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    position: number;
    publishedAt: string | null;
    isAvailable: boolean;
    durationSeconds: number;
  }> = [];

  let pageToken: string | undefined;
  do {
    const params: Record<string, string> = {
      part: "snippet,status",
      playlistId,
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await youtubeFetch<{
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          position?: number;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: Record<string, { url?: string }>;
        };
        status?: { privacyStatus?: string };
      }>;
    }>("playlistItems", params);

    for (const raw of data.items ?? []) {
      const videoId = raw.snippet?.resourceId?.videoId;
      const title = raw.snippet?.title ?? "Untitled video";
      const unavailable =
        !videoId ||
        title === "Private video" ||
        title === "Deleted video";

      items.push({
        youtubeVideoId:
          videoId ?? `unavailable-${raw.snippet?.position ?? items.length}`,
        title,
        description: raw.snippet?.description ?? "",
        thumbnailUrl: pickThumbnail(raw.snippet?.thumbnails),
        position: (raw.snippet?.position ?? items.length) + 1,
        publishedAt: raw.snippet?.publishedAt ?? null,
        isAvailable: !unavailable && raw.status?.privacyStatus !== "private",
        durationSeconds: 0,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  const realIds = items
    .filter((i) => i.isAvailable && !i.youtubeVideoId.startsWith("unavailable-"))
    .map((i) => i.youtubeVideoId);

  for (let i = 0; i < realIds.length; i += 50) {
    const chunk = realIds.slice(i, i + 50);
    const data = await youtubeFetch<{
      items?: Array<{
        id: string;
        contentDetails?: { duration?: string };
        status?: { privacyStatus?: string; uploadStatus?: string };
      }>;
    }>("videos", {
      part: "contentDetails,status",
      id: chunk.join(","),
    });

    const map = new Map(
      (data.items ?? []).map((item) => {
        const privacy = item.status?.privacyStatus;
        const upload = item.status?.uploadStatus;
        const available =
          privacy !== "private" &&
          upload !== "deleted" &&
          upload !== "failed";
        return [
          item.id,
          {
            durationSeconds: parseDurationIso8601(
              item.contentDetails?.duration ?? "PT0S",
            ),
            isAvailable: available,
          },
        ] as const;
      }),
    );

    for (const item of items) {
      const meta = map.get(item.youtubeVideoId);
      if (meta) {
        item.durationSeconds = meta.durationSeconds;
        item.isAvailable = item.isAvailable && meta.isAvailable;
      }
    }
  }

  return items;
}

async function importPlaylist(playlistId: string) {
  console.log(`→ Fetching ${playlistId}…`);
  const meta = await fetchPlaylistMeta(playlistId);
  const items = await fetchPlaylistItems(playlistId);

  if (items.length === 0) {
    console.warn(`  skip: no videos for ${meta.title}`);
    return;
  }

  const totalDuration = items.reduce((s, i) => s + i.durationSeconds, 0);

  const { data: existing } = await admin
    .from("courses")
    .select("id")
    .eq("youtube_playlist_id", meta.id)
    .maybeSingle();

  let courseId = existing?.id as string | undefined;

  if (!courseId) {
    const { data: created, error } = await admin
      .from("courses")
      .insert({
        youtube_playlist_id: meta.id,
        title: meta.title,
        description: meta.description,
        thumbnail_url: meta.thumbnailUrl,
        youtube_channel_id: meta.channelId,
        youtube_channel_name: meta.channelTitle,
        video_count: items.length,
        total_duration_seconds: totalDuration,
        learner_count: 1,
        last_synced_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !created) {
      throw error ?? new Error(`Could not create course for ${meta.title}`);
    }
    courseId = created.id;
    console.log(`  created: ${meta.title} (${items.length} videos)`);
  } else {
    await admin
      .from("courses")
      .update({
        title: meta.title,
        description: meta.description,
        thumbnail_url: meta.thumbnailUrl,
        youtube_channel_id: meta.channelId,
        youtube_channel_name: meta.channelTitle,
        video_count: items.length,
        total_duration_seconds: totalDuration,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", courseId);
    console.log(`  updated: ${meta.title} (${items.length} videos)`);
  }

  // Optional flag from migration 005 — ignore if column missing
  await admin
    .from("courses")
    .update({ listed_in_discover: true })
    .eq("id", courseId);

  for (const item of items) {
    const { error } = await admin.from("course_videos").upsert(
      {
        course_id: courseId,
        youtube_video_id: item.youtubeVideoId,
        title: item.title,
        description: item.description,
        thumbnail_url: item.thumbnailUrl,
        duration_seconds: item.durationSeconds,
        playlist_position: item.position,
        published_at: item.publishedAt,
        is_available: item.isAvailable,
      },
      { onConflict: "course_id,youtube_video_id" },
    );
    if (error) {
      console.warn(`  video upsert failed: ${item.title}`, error.message);
    }
  }

  await admin.rpc("refresh_course_stats", { p_course_id: courseId });
}

async function main() {
  console.log("Seeding Discover catalog playlists…\n");
  for (const id of PLAYLISTS) {
    try {
      await importPlaylist(id);
    } catch (e) {
      console.error(`  failed ${id}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log("\nDone. Open /discover to browse.");
}

void main();
