import { redirect, notFound } from "next/navigation";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Note" };

/** Legacy note URLs redirect into the related lesson player. */
export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const profile = await requireOnboardedProfile();
  const { noteId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("notes")
    .select("user_course_id, course_video_id")
    .eq("id", noteId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!data) notFound();

  if (data.course_video_id) {
    redirect(`/learn/${data.user_course_id}/${data.course_video_id}`);
  }

  redirect(`/library/${data.user_course_id}`);
}
