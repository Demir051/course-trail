import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Notes" };

type NoteRow = {
  id: string;
  title: string | null;
  content_text: string;
  is_pinned: boolean;
  user_course_id: string;
  course_video_id: string | null;
  course_videos: { title: string | null } | null;
  user_courses: {
    courses: { title: string | null } | null;
  } | null;
};

function noteHref(note: NoteRow) {
  if (note.course_video_id) {
    return `/learn/${note.user_course_id}/${note.course_video_id}`;
  }
  return `/library/${note.user_course_id}`;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select(
      `
      id,
      title,
      content_text,
      is_pinned,
      user_course_id,
      course_video_id,
      course_videos ( title ),
      user_courses ( courses ( title ) )
    `,
    )
    .eq("user_id", profile.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  const { data } = await query;
  const notes = (data ?? []) as unknown as NoteRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">
          {t.notesPage.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{t.notesPage.subtitle}</p>
      </div>
      <form className="max-w-md">
        <label htmlFor="q" className="sr-only">
          {t.notesPage.searchLabel}
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={t.notesPage.searchPlaceholder}
          className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
        />
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.notesPage.empty}</p>
      ) : (
        <div className="grid gap-3">
          {notes.map((note) => {
            const courseTitle = note.user_courses?.courses?.title;
            const videoTitle = note.course_videos?.title;
            return (
              <Link
                key={note.id}
                href={noteHref(note)}
                className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 transition hover:border-primary/30"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">
                    {note.title || t.common.untitledNote}
                  </h2>
                  {note.is_pinned ? (
                    <span className="text-xs text-primary">
                      {t.common.pinned}
                    </span>
                  ) : null}
                </div>
                {(courseTitle || videoTitle) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[courseTitle, videoTitle].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {note.content_text || t.common.emptyNote}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
