"use client";

import Image from "next/image";
import Link from "next/link";
import { CourseProgress } from "@/components/courses/course-progress";
import { StatusBadge } from "@/components/courses/status-badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import { formatDuration } from "@/lib/youtube/duration";
import type { Course, UserCourse } from "@/types/database";

type CourseCardProps = {
  userCourse: UserCourse & { course: Course };
};

export function CourseCard({ userCourse }: CourseCardProps) {
  const t = useT();
  const course = userCourse.course;
  const continueHref = userCourse.current_video_id
    ? `/learn/${userCourse.id}/${userCourse.current_video_id}`
    : `/library/${userCourse.id}`;
  const pct = Math.round(Number(userCourse.progress_percentage));

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
      <Link
        href={`/library/${userCourse.id}`}
        className="relative block aspect-video overflow-hidden"
      >
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
            —
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={userCourse.status} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="font-heading text-lg leading-snug">
            <Link
              href={`/library/${userCourse.id}`}
              className="hover:underline"
            >
              {course.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">
            {course.youtube_channel_name ?? "YouTube"}
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {userCourse.completed_lesson_count}/{course.video_count}{" "}
              {t.common.lessons}
            </span>
            <span className="tabular-nums font-medium text-foreground">
              {pct}%
            </span>
          </div>
          <CourseProgress value={pct} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-muted-foreground">
            {formatDuration(course.total_duration_seconds)} {t.common.total}
          </span>
          <Button size="sm" render={<Link href={continueHref} />}>
            {t.common.continue}
          </Button>
        </div>
      </div>
    </article>
  );
}
