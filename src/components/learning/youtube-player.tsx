"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
  loadVideoById: (opts: { videoId: string; startSeconds?: number }) => void;
};

type YoutubePlayerProps = {
  videoId: string;
  startSeconds?: number;
  onReady?: (player: YTPlayer) => void;
  onStateChange?: (state: number, player: YTPlayer) => void;
  className?: string;
};

let apiLoading: Promise<void> | null = null;

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoading) return apiLoading;

  apiLoading = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);
  });

  return apiLoading;
}

export function YoutubePlayer({
  videoId,
  startSeconds = 0,
  onReady,
  onStateChange,
  className,
}: YoutubePlayerProps) {
  const containerId = useRef(
    `yt-player-${Math.random().toString(36).slice(2)}`,
  );
  const playerRef = useRef<YTPlayer | null>(null);
  const callbacks = useRef({ onReady, onStateChange });
  callbacks.current = { onReady, onStateChange };

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await loadYoutubeApi();
      if (cancelled || !window.YT) return;

      if (playerRef.current) {
        playerRef.current.loadVideoById({
          videoId,
          startSeconds,
        });
        return;
      }

      playerRef.current = new window.YT.Player(containerId.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.floor(startSeconds),
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            callbacks.current.onReady?.(event.target);
          },
          onStateChange: (event) => {
            callbacks.current.onStateChange?.(event.data, event.target);
          },
        },
      });
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [videoId, startSeconds]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className={className}>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        <div id={containerId.current} className="absolute inset-0 size-full" />
      </div>
    </div>
  );
}

export const YT_STATE = {
  PLAYING: 1,
  PAUSED: 2,
  ENDED: 0,
} as const;
