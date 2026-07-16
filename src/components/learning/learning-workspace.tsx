"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Menu,
} from "lucide-react";
import { saveProgressAction } from "@/actions/progress";
import {
  createTimestampNoteAction,
  deleteTimestampNoteAction,
  saveNoteAction,
} from "@/actions/notes";
import {
  YoutubePlayer,
  YT_STATE,
  type YTPlayer,
} from "@/components/learning/youtube-player";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PROGRESS_SAVE_INTERVAL_MS } from "@/lib/constants";
import { formatDuration, formatTimestamp } from "@/lib/youtube/duration";
import { cn } from "@/lib/utils";
import type {
  Course,
  CourseVideo,
  Note,
  TimestampNote,
  UserCourse,
  VideoProgress,
} from "@/types/database";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useT } from "@/i18n/locale-provider";

type LearningWorkspaceProps = {
  userCourse: UserCourse & { course: Course };
  videos: CourseVideo[];
  currentVideo: CourseVideo;
  progressMap: Record<string, VideoProgress>;
  note: Note | null;
  timestampNotes: TimestampNote[];
  resumeSeconds: number;
};

export function LearningWorkspace({
  userCourse,
  videos,
  currentVideo,
  progressMap,
  note,
  timestampNotes: initialTimestampNotes,
  resumeSeconds,
}: LearningWorkspaceProps) {
  const t = useT();
  const playerRef = useRef<YTPlayer | null>(null);
  const lastSavedRef = useRef(resumeSeconds);
  const lastTickRef = useRef<number | null>(null);
  const [timestampNotes, setTimestampNotes] = useState(initialTimestampNotes);
  const [stampText, setStampText] = useState("");
  const [noteId, setNoteId] = useState(note?.id ?? null);
  const [completed, setCompleted] = useState(
    Boolean(progressMap[currentVideo.id]?.is_completed),
  );
  const [courseProgress, setCourseProgress] = useState(
    Number(userCourse.progress_percentage),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentIndex = videos.findIndex((v) => v.id === currentVideo.id);
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const nextVideo =
    currentIndex >= 0 && currentIndex < videos.length - 1
      ? videos[currentIndex + 1]
      : null;

  const persistProgress = useCallback(
    async (opts?: {
      markCompleted?: boolean;
      unmarkCompleted?: boolean;
      forceTimestamp?: number;
    }) => {
      const player = playerRef.current;
      const timestamp =
        opts?.forceTimestamp ??
        (player ? Math.floor(player.getCurrentTime()) : lastSavedRef.current);

      const now = Date.now();
      const delta =
        lastTickRef.current != null
          ? Math.min(120, Math.max(0, Math.floor((now - lastTickRef.current) / 1000)))
          : 0;
      lastTickRef.current = now;

      const result = await saveProgressAction({
        userCourseId: userCourse.id,
        courseVideoId: currentVideo.id,
        lastTimestampSeconds: timestamp,
        watchedDeltaSeconds: delta,
        markCompleted: opts?.markCompleted,
        unmarkCompleted: opts?.unmarkCompleted,
      });

      if (result.completed != null) setCompleted(result.completed);
      if (result.progressPercentage != null) {
        setCourseProgress(result.progressPercentage);
      }
      lastSavedRef.current = timestamp;
      return result;
    },
    [userCourse.id, currentVideo.id],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      if (player.getPlayerState() === YT_STATE.PLAYING) {
        void persistProgress();
      }
    }, PROGRESS_SAVE_INTERVAL_MS);

    const onHide = () => {
      void persistProgress();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onHide();
    });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", onHide);
      void persistProgress();
    };
  }, [persistProgress]);

  const lessonList = useMemo(
    () => (
      <ol className="space-y-1">
        {videos.map((video, index) => {
          const done = progressMap[video.id]?.is_completed;
          const isCurrent = video.id === currentVideo.id;
          return (
            <li key={video.id}>
              <Link
                href={`/learn/${userCourse.id}/${video.id}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex min-h-12 items-start gap-2 rounded-xl px-2 py-2.5 text-sm transition",
                  isCurrent
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "hover:bg-muted/70",
                  !video.is_available && "opacity-60",
                )}
              >
                <span className="mt-0.5 text-muted-foreground">
                  {done ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug">
                    {index + 1}. {video.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {video.is_available
                      ? formatDuration(video.duration_seconds)
                      : t.common.unavailable}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    ),
    [videos, progressMap, currentVideo.id, userCourse.id, t.common.unavailable],
  );

  async function handleAddTimestampNote() {
    if (!stampText.trim()) return;
    const player = playerRef.current;
    const timestamp = player
      ? Math.floor(player.getCurrentTime())
      : lastSavedRef.current;
    const result = await createTimestampNoteAction({
      userCourseId: userCourse.id,
      courseVideoId: currentVideo.id,
      timestampSeconds: timestamp,
      content: stampText.trim(),
      noteId,
    });
    if (result.id) {
      setTimestampNotes((prev) => [
        ...prev,
        {
          id: result.id!,
          user_id: userCourse.user_id,
          note_id: noteId,
          user_course_id: userCourse.id,
          course_video_id: currentVideo.id,
          timestamp_seconds: timestamp,
          content: stampText.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setStampText("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/library/${userCourse.id}`}
            className="line-clamp-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {userCourse.course.title}
          </Link>
          <h1 className="font-heading text-xl tracking-tight text-balance sm:text-2xl">
            {currentVideo.title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className="min-h-10"
                  aria-label={t.learn.openLessons}
                />
              }
            >
              <Menu className="size-4" />
              {t.common.lessonsTitle}
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100%,22rem)] overflow-y-auto sm:max-w-sm"
            >
              <SheetHeader>
                <SheetTitle>{t.common.lessonsTitle}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 px-2 pb-6">{lessonList}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {currentVideo.is_available ? (
            <YoutubePlayer
              videoId={currentVideo.youtube_video_id}
              startSeconds={resumeSeconds}
              onReady={(player) => {
                playerRef.current = player;
                lastTickRef.current = Date.now();
              }}
              onStateChange={(state, player) => {
                playerRef.current = player;
                if (state === YT_STATE.PAUSED || state === YT_STATE.ENDED) {
                  void persistProgress().then((result) => {
                    if (
                      state === YT_STATE.ENDED &&
                      result.completed &&
                      nextVideo
                    ) {
                      // Soft suggestion after completion
                    }
                  });
                }
              }}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-center text-sm text-muted-foreground">
              {t.learn.videoUnavailable}
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-3">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t.learn.courseProgress}</span>
                <span>{Math.round(courseProgress)}%</span>
              </div>
              <Progress value={courseProgress} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant={completed ? "secondary" : "outline"}
                className="min-h-10 col-span-2 sm:col-span-1"
                onClick={() =>
                  void persistProgress({
                    markCompleted: !completed,
                    unmarkCompleted: completed,
                  })
                }
              >
                {completed ? t.common.completed : t.common.markComplete}
              </Button>
              {prevVideo ? (
                <Button
                  variant="ghost"
                  className="min-h-10"
                  render={
                    <Link href={`/learn/${userCourse.id}/${prevVideo.id}`} />
                  }
                >
                  <ChevronLeft className="size-4" />
                  {t.common.previous}
                </Button>
              ) : (
                <Button variant="ghost" className="min-h-10" disabled>
                  <ChevronLeft className="size-4" />
                  {t.common.previous}
                </Button>
              )}
              {nextVideo ? (
                <Button
                  className="min-h-10"
                  render={
                    <Link href={`/learn/${userCourse.id}/${nextVideo.id}`} />
                  }
                >
                  {t.common.next}
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button className="min-h-10" disabled>
                  {t.common.next}
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {completed && nextVideo ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              {t.learn.lessonComplete}{" "}
              <Link
                href={`/learn/${userCourse.id}/${nextVideo.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {t.learn.continueNext}
              </Link>
            </div>
          ) : null}

          <section className="space-y-2">
            <h2 className="font-heading text-xl">{t.learn.lessonNotes}</h2>
            <RichTextEditor
              initialJson={note?.content_json}
              onSave={async (payload) => {
                const result = await saveNoteAction({
                  noteId: noteId ?? undefined,
                  userCourseId: userCourse.id,
                  courseVideoId: currentVideo.id,
                  title: note?.title ?? currentVideo.title,
                  contentJson: payload.contentJson,
                  contentText: payload.contentText,
                  contentHtml: payload.contentHtml,
                });
                if (result.noteId) setNoteId(result.noteId);
                return !result.error;
              }}
            />
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl">{t.learn.timestampNotes}</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={stampText}
                onChange={(e) => setStampText(e.target.value)}
                placeholder={t.learn.stampPlaceholder}
                aria-label={t.learn.timestampNotes}
                className="min-h-10"
              />
              <Button
                type="button"
                className="min-h-10 shrink-0"
                onClick={() => void handleAddTimestampNote()}
              >
                {t.common.add}
              </Button>
            </div>
            <ul className="space-y-2">
              {timestampNotes.map((stamp) => (
                <li
                  key={stamp.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-sm"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 py-1 text-left"
                    onClick={() => {
                      playerRef.current?.seekTo(stamp.timestamp_seconds, true);
                      playerRef.current?.playVideo();
                    }}
                  >
                    <span className="font-medium text-primary">
                      {formatTimestamp(stamp.timestamp_seconds)}
                    </span>
                    <span className="mt-0.5 block break-words text-muted-foreground">
                      {stamp.content}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    className="min-h-10 shrink-0 px-3"
                    onClick={() => {
                      void deleteTimestampNoteAction(stamp.id).then(() => {
                        setTimestampNotes((prev) =>
                          prev.filter((n) => n.id !== stamp.id),
                        );
                      });
                    }}
                  >
                    {t.common.delete}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="hidden rounded-2xl border border-border/70 bg-card/60 p-3 lg:block">
          <h2 className="mb-3 px-2 font-heading text-lg">
            {t.common.lessonsTitle}
          </h2>
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            {lessonList}
          </div>
        </aside>
      </div>
    </div>
  );
}
