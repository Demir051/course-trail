import { notFound } from "next/navigation";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Collection, Course, UserCourse } from "@/types/database";

export const metadata = { title: "Collection" };

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const profile = await requireOnboardedProfile();
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!collection) notFound();
  const typed = collection as Collection;

  const { data: items } = await supabase
    .from("collection_courses")
    .select(
      `
      position,
      user_course:user_courses (
        id,
        status,
        course:courses (id, title, youtube_channel_name, thumbnail_url)
      )
    `,
    )
    .eq("collection_id", typed.id)
    .order("position", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">{typed.title}</h1>
        {typed.description ? (
          <p className="mt-2 text-muted-foreground">{typed.description}</p>
        ) : null}
      </div>
      <ol className="space-y-2">
        {(items ?? []).map((item) => {
          const uc = item.user_course as unknown as UserCourse & {
            course: Course;
          };
          return (
            <li
              key={`${typed.id}-${item.position}`}
              className="rounded-xl border border-border/70 bg-card/60 px-4 py-3"
            >
              <div className="font-medium">{uc.course?.title}</div>
              <div className="text-sm text-muted-foreground">
                {uc.course?.youtube_channel_name}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
