import "server-only";

import { parseDurationIso8601 } from "@/lib/youtube/duration";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

function getApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new YouTubeApiError(
      "We could not reach YouTube right now. Try again later.",
    );
  }
  return key;
}

async function youtubeFetch<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${YOUTUBE_API}/${path}`);
  url.searchParams.set("key", getApiKey());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new YouTubeApiError(
      "We could not reach YouTube right now. Try again later.",
      res.status,
    );
  }

  return (await res.json()) as T;
}

export interface YoutubePlaylistMeta {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  channelId: string | null;
  channelTitle: string | null;
  itemCount: number;
}

export interface YoutubePlaylistItem {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  position: number;
  publishedAt: string | null;
  isAvailable: boolean;
  durationSeconds: number;
  channelTitle: string | null;
}

interface PlaylistListResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      channelId?: string;
      channelTitle?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { itemCount?: number };
  }>;
}

interface PlaylistItemsResponse {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      position?: number;
      publishedAt?: string;
      resourceId?: { videoId?: string };
      thumbnails?: Record<string, { url?: string }>;
    };
    status?: { privacyStatus?: string };
  }>;
}

interface VideosListResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title?: string;
      description?: string;
      channelId?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { duration?: string };
    status?: { privacyStatus?: string; uploadStatus?: string };
  }>;
}

export interface YoutubeVideoMeta {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  channelId: string | null;
  channelTitle: string | null;
  durationSeconds: number;
  publishedAt: string | null;
  isAvailable: boolean;
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

export async function fetchPlaylistMeta(
  playlistId: string,
): Promise<YoutubePlaylistMeta> {
  const data = await youtubeFetch<PlaylistListResponse>("playlists", {
    part: "snippet,contentDetails",
    id: playlistId,
    maxResults: "1",
  });

  const item = data.items?.[0];
  if (!item?.snippet) {
    throw new YouTubeApiError(
      "Playlist not found. It may be private or deleted.",
      404,
    );
  }

  return {
    id: item.id,
    title: item.snippet.title ?? "Untitled playlist",
    description: item.snippet.description ?? "",
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    channelId: item.snippet.channelId ?? null,
    channelTitle: item.snippet.channelTitle ?? null,
    itemCount: item.contentDetails?.itemCount ?? 0,
  };
}

async function fetchVideoDurations(videoIds: string[]) {
  const map = new Map<string, { durationSeconds: number; isAvailable: boolean }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    if (chunk.length === 0) continue;
    const data = await youtubeFetch<VideosListResponse>("videos", {
      part: "contentDetails,status",
      id: chunk.join(","),
    });
    for (const item of data.items ?? []) {
      const privacy = item.status?.privacyStatus;
      const upload = item.status?.uploadStatus;
      const available =
        privacy !== "private" &&
        privacy !== "privacyStatusUnspecified" &&
        upload !== "deleted" &&
        upload !== "failed";
      map.set(item.id, {
        durationSeconds: parseDurationIso8601(
          item.contentDetails?.duration ?? "PT0S",
        ),
        isAvailable: available,
      });
    }
  }
  return map;
}

export async function fetchVideoMeta(
  videoId: string,
): Promise<YoutubeVideoMeta> {
  const data = await youtubeFetch<VideosListResponse>("videos", {
    part: "snippet,contentDetails,status",
    id: videoId,
  });

  const item = data.items?.[0];
  if (!item?.snippet) {
    throw new YouTubeApiError(
      "Video not found. It may be private or deleted.",
      404,
    );
  }

  const privacy = item.status?.privacyStatus;
  const upload = item.status?.uploadStatus;
  const available =
    privacy !== "private" &&
    privacy !== "privacyStatusUnspecified" &&
    upload !== "deleted" &&
    upload !== "failed";

  return {
    id: item.id,
    title: item.snippet.title ?? "Untitled video",
    description: item.snippet.description ?? "",
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    channelId: item.snippet.channelId ?? null,
    channelTitle: item.snippet.channelTitle ?? null,
    durationSeconds: parseDurationIso8601(
      item.contentDetails?.duration ?? "PT0S",
    ),
    publishedAt: item.snippet.publishedAt ?? null,
    isAvailable: available,
  };
}

export async function fetchPlaylistItems(
  playlistId: string,
): Promise<YoutubePlaylistItem[]> {
  const items: YoutubePlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      part: "snippet,status",
      playlistId,
      maxResults: "50",
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await youtubeFetch<PlaylistItemsResponse>(
      "playlistItems",
      params,
    );

    for (const raw of data.items ?? []) {
      const videoId = raw.snippet?.resourceId?.videoId;
      const title = raw.snippet?.title ?? "Untitled video";
      const unavailableTitle =
        title === "Private video" ||
        title === "Deleted video" ||
        !videoId;

      items.push({
        youtubeVideoId: videoId ?? `unavailable-${raw.snippet?.position ?? items.length}`,
        title,
        description: raw.snippet?.description ?? "",
        thumbnailUrl: pickThumbnail(raw.snippet?.thumbnails),
        position: (raw.snippet?.position ?? items.length) + 1,
        publishedAt: raw.snippet?.publishedAt ?? null,
        isAvailable: !unavailableTitle && raw.status?.privacyStatus !== "private",
        durationSeconds: 0,
        channelTitle: raw.snippet?.channelTitle ?? null,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  const realIds = items
    .filter((i) => i.isAvailable && !i.youtubeVideoId.startsWith("unavailable-"))
    .map((i) => i.youtubeVideoId);

  const durations = await fetchVideoDurations(realIds);

  return items.map((item) => {
    const meta = durations.get(item.youtubeVideoId);
    if (!meta) {
      return {
        ...item,
        isAvailable: item.isAvailable && !item.youtubeVideoId.startsWith("unavailable-"),
      };
    }
    return {
      ...item,
      durationSeconds: meta.durationSeconds,
      isAvailable: item.isAvailable && meta.isAvailable,
    };
  });
}
