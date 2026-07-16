import Link from "next/link";
import { CourseCard } from "@/components/courses/course-card";
import { ImportPlaylistForm } from "@/components/courses/import-playlist-form";
import {
  TranslatedHeading,
  TranslatedStatLabel,
} from "@/components/layout/translated-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/youtube/duration";
import type { Course, Note, UserCourse } from "@/types/database";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  const supabase = await createClient();

  const { data: continueCourses } = await supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("user_id", profile.id)
    .eq("is_archived", false)
    .in("status", ["in_progress", "paused", "want_to_learn"])
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .limit(4);

  const { data: recentNotes } = await supabase
    .from("notes")
    .select("id, title, content_text, updated_at, user_course_id, course_video_id")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { count: completedLessons } = await supabase
    .from("video_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("is_completed", true);

  const { count: completedCourses } = await supabase
    .from("user_courses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "completed");

  const { data: learningDays } = await supabase
    .from("learning_days")
    .select("activity_date, watched_seconds")
    .eq("user_id", profile.id)
    .order("activity_date", { ascending: false })
    .limit(30);

  const totalWatched = (learningDays ?? []).reduce(
    (sum, day) => sum + day.watched_seconds,
    0,
  );

  let streak = 0;
  const daySet = new Set((learningDays ?? []).map((d) => d.activity_date));
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!daySet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const courses = (continueCourses ?? []) as Array<
    UserCourse & { course: Course }
  >;
  const notes = (recentNotes ?? []) as Note[];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <TranslatedHeading section="dashboard" name={profile.display_name} />
        <Button
          className="min-h-11 w-full sm:w-auto"
          render={<Link href="/library?import=1" />}
        >
          {t.common.importPlaylist}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-sky-500/20 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardDescription>
              <TranslatedStatLabel keyName="completedLessons" />
            </CardDescription>
            <CardTitle className="font-heading text-2xl text-sky-800 dark:text-sky-200">
              {completedLessons ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription>
              <TranslatedStatLabel keyName="completedCourses" />
            </CardDescription>
            <CardTitle className="font-heading text-2xl text-emerald-800 dark:text-emerald-200">
              {completedCourses ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-teal-500/20 bg-teal-500/5">
          <CardHeader className="pb-2">
            <CardDescription>
              <TranslatedStatLabel keyName="learningTime" />
            </CardDescription>
            <CardTitle className="font-heading text-2xl text-teal-800 dark:text-teal-200">
              {formatDuration(totalWatched)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription>
              <TranslatedStatLabel keyName="streak" />
            </CardDescription>
            <CardTitle className="font-heading text-2xl text-amber-800 dark:text-amber-200">
              {streak}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl">{t.dashboard.continueLearning}</h2>
          <Button variant="ghost" size="sm" render={<Link href="/library" />}>
            {t.common.viewLibrary}
          </Button>
        </div>
        {courses.length === 0 ? (
          <Card className="border-dashed border-border/70 bg-card/50">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                {t.dashboard.emptyTitle}
              </CardTitle>
              <CardDescription>{t.dashboard.emptyBody}</CardDescription>
            </CardHeader>
            <CardContent>
              <ImportPlaylistForm />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((uc) => (
              <CourseCard key={uc.id} userCourse={uc} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl">{t.dashboard.recentNotes}</h2>
          <Button variant="ghost" size="sm" render={<Link href="/notes" />}>
            {t.common.allNotes}
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.dashboard.notesEmpty}
          </p>
        ) : (
          <div className="grid gap-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={
                  note.course_video_id
                    ? `/learn/${note.user_course_id}/${note.course_video_id}`
                    : `/library/${note.user_course_id}`
                }
                className="rounded-xl border border-border/70 bg-card/60 px-4 py-3 transition hover:border-primary/30"
              >
                <div className="font-medium">
                  {note.title || t.common.untitledNote}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {note.content_text || t.common.emptyNote}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
