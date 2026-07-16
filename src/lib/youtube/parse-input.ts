const PLAYLIST_ID_RE = /^[a-zA-Z0-9_-]{13,64}$/;
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export type YoutubeSource =
  | { ok: true; kind: "playlist"; playlistId: string }
  | { ok: true; kind: "video"; videoId: string }
  | { ok: false; error: string };

/** Stored on courses.youtube_playlist_id for single-video imports. */
export function singleVideoCourseKey(videoId: string) {
  return `v:${videoId}`;
}

export function parseSingleVideoCourseKey(
  courseKey: string,
): string | null {
  if (courseKey.startsWith("v:") && VIDEO_ID_RE.test(courseKey.slice(2))) {
    return courseKey.slice(2);
  }
  return null;
}

/**
 * Accepts playlist URLs, watch URLs (with or without list=), youtu.be,
 * shorts, bare playlist IDs, or bare 11-char video IDs.
 * Prefer playlist when both `list` and `v` are present.
 */
export function parseYoutubeInput(input: string): YoutubeSource {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Paste a YouTube playlist or video URL.",
    };
  }

  if (!trimmed.includes("://") && !trimmed.includes("/")) {
    if (PLAYLIST_ID_RE.test(trimmed) && trimmed.startsWith("PL")) {
      return { ok: true, kind: "playlist", playlistId: trimmed };
    }
    if (PLAYLIST_ID_RE.test(trimmed) && /^[A-Z]{2}/.test(trimmed)) {
      // UU / OL / RD-style playlist ids
      return { ok: true, kind: "playlist", playlistId: trimmed };
    }
    if (VIDEO_ID_RE.test(trimmed)) {
      return { ok: true, kind: "video", videoId: trimmed };
    }
    if (PLAYLIST_ID_RE.test(trimmed)) {
      return { ok: true, kind: "playlist", playlistId: trimmed };
    }
    return {
      ok: false,
      error: "That does not look like a valid YouTube URL or ID.",
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      ok: false,
      error: "That does not look like a valid YouTube URL or ID.",
    };
  }

  const host = url.hostname.replace(/^www\./, "");
  const allowedHosts = [
    "youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
  ];
  if (!allowedHosts.includes(host)) {
    return { ok: false, error: "URL must be a YouTube link." };
  }

  const list = url.searchParams.get("list");
  if (list && PLAYLIST_ID_RE.test(list)) {
    return { ok: true, kind: "playlist", playlistId: list };
  }

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
    if (id && VIDEO_ID_RE.test(id)) {
      return { ok: true, kind: "video", videoId: id };
    }
  }

  const v = url.searchParams.get("v");
  if (v && VIDEO_ID_RE.test(v)) {
    return { ok: true, kind: "video", videoId: v };
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const shortsIdx = parts.indexOf("shorts");
  if (shortsIdx >= 0 && parts[shortsIdx + 1] && VIDEO_ID_RE.test(parts[shortsIdx + 1])) {
    return { ok: true, kind: "video", videoId: parts[shortsIdx + 1] };
  }
  const embedIdx = parts.indexOf("embed");
  if (embedIdx >= 0 && parts[embedIdx + 1] && VIDEO_ID_RE.test(parts[embedIdx + 1])) {
    return { ok: true, kind: "video", videoId: parts[embedIdx + 1] };
  }
  const liveIdx = parts.indexOf("live");
  if (liveIdx >= 0 && parts[liveIdx + 1] && VIDEO_ID_RE.test(parts[liveIdx + 1])) {
    return { ok: true, kind: "video", videoId: parts[liveIdx + 1] };
  }

  return {
    ok: false,
    error:
      "Could not find a playlist or video. Use a playlist link, watch link, or youtu.be URL.",
  };
}

/** @deprecated Prefer parseYoutubeInput */
export function parsePlaylistInput(input: string) {
  const result = parseYoutubeInput(input);
  if (!result.ok) return result;
  if (result.kind === "playlist") {
    return { ok: true as const, playlistId: result.playlistId };
  }
  return {
    ok: false as const,
    error: "That looks like a single video. Use a playlist URL, or import it as a video.",
  };
}

export function isValidPlaylistId(id: string): boolean {
  return PLAYLIST_ID_RE.test(id);
}
