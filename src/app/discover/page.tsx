import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentProfile } from "@/lib/auth";
import { DISCOVER_PLAYLIST_IDS } from "@/lib/catalog";
import { MIN_PUBLIC_RATINGS } from "@/lib/constants";
import { getRequestLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/youtube/duration";
import type { Course } from "@/types/database";

export const metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const profile = await getCurrentProfile();
  const t = getDictionary(await getRequestLocale());
  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select("*")
    .in("youtube_playlist_id", [...DISCOVER_PLAYLIST_IDS])
    .order("title", { ascending: true });

  const courses = (data ?? []) as Course[];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} variant={profile ? "app" : "marketing"} />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="font-heading text-3xl tracking-tight">
            {t.discover.title}
          </h1>
          <p className="mt-1 text-muted-foreground">{t.discover.subtitle}</p>
        </div>

        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.discover.empty}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition hover:border-primary/30"
              >
                <div className="relative aspect-video bg-muted">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <h2 className="font-heading text-lg leading-snug">
                    {course.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {course.youtube_channel_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {course.video_count} {t.common.lessons} ·{" "}
                    {formatDuration(course.total_duration_seconds)}
                    {course.rating_count >= MIN_PUBLIC_RATINGS &&
                    course.average_rating
                      ? ` · ${course.average_rating}★`
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
