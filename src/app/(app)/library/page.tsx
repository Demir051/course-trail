import { CourseCard } from "@/components/courses/course-card";
import { ImportPlaylistForm } from "@/components/courses/import-playlist-form";
import { LibraryFilters } from "@/components/courses/library-filters";
import { TranslatedHeading } from "@/components/layout/translated-heading";
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
import { collectUserTags } from "@/lib/tags";
import { createClient } from "@/lib/supabase/server";
import type { Course, CourseStatus, UserCourse } from "@/types/database";

export const metadata = { title: "Library" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    import?: string;
    tag?: string;
  }>;
}) {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  const params = await searchParams;
  const supabase = await createClient();

  const { data: tagRows } = await supabase
    .from("user_courses")
    .select("personal_tags")
    .eq("user_id", profile.id);

  const knownTags = collectUserTags(tagRows ?? []);

  let query = supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("user_id", profile.id)
    .eq("is_archived", false);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status as CourseStatus);
  }

  if (params.tag) {
    query = query.contains("personal_tags", [params.tag]);
  }

  const sort = params.sort ?? "recently_opened";
  if (sort === "recently_added") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "progress") {
    query = query.order("progress_percentage", { ascending: false });
  } else if (sort === "alphabetical") {
    // Sorted client-side after join
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("last_opened_at", {
      ascending: false,
      nullsFirst: false,
    });
  }

  const { data } = await query;
  let courses = (data ?? []) as Array<UserCourse & { course: Course }>;

  if (params.q) {
    const q = params.q.toLowerCase();
    courses = courses.filter(
      (uc) =>
        uc.course.title.toLowerCase().includes(q) ||
        (uc.course.youtube_channel_name ?? "").toLowerCase().includes(q) ||
        uc.personal_tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  if (sort === "alphabetical") {
    courses = [...courses].sort((a, b) =>
      a.course.title.localeCompare(b.course.title),
    );
  }

  return (
    <div className="space-y-8">
      <TranslatedHeading section="library" />

      {(params.import === "1" || courses.length === 0) && (
        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {t.library.importTitle}
            </CardTitle>
            <CardDescription>{t.library.importBody}</CardDescription>
          </CardHeader>
          <CardContent>
            <ImportPlaylistForm autoFocus={params.import === "1"} />
          </CardContent>
        </Card>
      )}

      <LibraryFilters
        q={params.q}
        status={params.status}
        sort={params.sort}
        tag={params.tag}
        knownTags={knownTags}
      />

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.library.noMatch}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((uc) => (
            <CourseCard key={uc.id} userCourse={uc} />
          ))}
        </div>
      )}
    </div>
  );
}
