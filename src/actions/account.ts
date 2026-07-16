"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/actions/auth";
import { getT } from "@/i18n/server-t";
import { requireUser } from "@/lib/auth";
import { toUserError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Export the signed-in user's courses, progress, and notes as JSON. */
export async function exportAccountDataAction(): Promise<
  ActionResult & { data?: string }
> {
  const user = await requireUser();
  const supabase = await createClient();

  const [profile, courses, progress, notes, stamps] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("user_courses")
      .select("*, course:courses(title, youtube_playlist_id)")
      .eq("user_id", user.id),
    supabase.from("video_progress").select("*").eq("user_id", user.id),
    supabase.from("notes").select("*").eq("user_id", user.id),
    supabase.from("timestamp_notes").select("*").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    user_courses: courses.data,
    video_progress: progress.data,
    notes: notes.data,
    timestamp_notes: stamps.data,
  };

  return {
    success: (await getT()).messages.exportReady,
    data: JSON.stringify(payload, null, 2),
  };
}

/** Permanently delete the signed-in account and cascaded personal data. */
export async function deleteAccountAction(): Promise<ActionResult> {
  const user = await requireUser();

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return {
        error: toUserError(
          error,
          "Could not delete your account. Please try again.",
        ),
      };
    }
  } catch {
    return {
      error: "Could not delete your account. Please try again later.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
