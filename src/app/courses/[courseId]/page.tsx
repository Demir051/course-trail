import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddCourseButton } from "@/components/courses/add-course-button";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary } from "@/i18n/dictionaries";
import { MIN_PUBLIC_RATINGS } from "@/lib/constants";
import { getCurrentProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/youtube/duration";
import type { Course, CourseVideo } from "@/types/database";

export const metadata = { title: "Course" };

export default async function PublicCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await getCurrentProfile();
  const t = getDictionary(await getRequestLocale());
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle();

  if (!course) notFound();
  const typed = course as Course;

  const { data: videos } = await supabase
    .from("course_videos")
    .select("id, title, duration_seconds, playlist_position, is_available, thumbnail_url")
    .eq("course_id", courseId)
    .order("playlist_position", { ascending: true });

  let enrollmentId: string | null = null;
  if (profile) {
    const { data: enrollment } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", profile.id)
      .eq("course_id", courseId)
      .maybeSingle();
    enrollmentId = enrollment?.id ?? null;
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} variant={profile ? "app" : "marketing"} />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted md:aspect-[4/3]">
            {typed.thumbnail_url ? (
              <Image
                src={typed.thumbnail_url}
                alt=""
                fill
                sizes="(max-width:768px) 100vw, 240px"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
          <div className="min-w-0 space-y-3">
            <h1 className="font-heading text-2xl tracking-tight text-balance sm:text-3xl">
              {typed.title}
            </h1>
            <p className="text-muted-foreground">
              {typed.youtube_channel_name} · {typed.video_count}{" "}
              {t.common.lessons} ·{" "}
              {formatDuration(typed.total_duration_seconds)}
            </p>
            <p className="text-sm text-muted-foreground">
              {typed.learner_count} {t.discover.learnersOn} ·{" "}
              {typed.completion_count} {t.discover.completed}
              {typed.rating_count >= MIN_PUBLIC_RATINGS && typed.average_rating
                ? ` · ${typed.average_rating} ${t.discover.averageRating} (${typed.rating_count})`
                : ""}
            </p>
            {typed.description ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {typed.description}
              </p>
            ) : null}
            {profile ? (
              enrollmentId ? (
                <Link
                  href={`/library/${enrollmentId}`}
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                >
                  {t.discover.openInLibrary}
                </Link>
              ) : (
                <AddCourseButton courseId={typed.id} />
              )
            ) : (
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
              >
                {t.discover.signUpToAdd}
              </Link>
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-2xl">{t.common.lessonsTitle}</h2>
          <ol className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card/50">
            {((videos ?? []) as CourseVideo[]).map((video) => (
              <li key={video.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-sm text-muted-foreground">
                  {video.playlist_position}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {video.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {video.is_available
                    ? formatDuration(video.duration_seconds)
                    : t.common.unavailable}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
