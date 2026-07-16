"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/actions/auth";
import { getT } from "@/i18n/server-t";
import { requireUser } from "@/lib/auth";
import { INTEREST_OPTIONS } from "@/lib/constants";
import { toUserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, usernameSchema } from "@/lib/validations/auth";

export async function completeOnboardingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const usernameResult = usernameSchema.safeParse({
    username: String(formData.get("username") ?? "")
      .toLowerCase()
      .trim(),
  });
  if (!usernameResult.success) {
    return {
      error: usernameResult.error.issues[0]?.message ?? "Invalid username.",
    };
  }

  const interests = formData
    .getAll("interests")
    .map(String)
    .filter((v) =>
      (INTEREST_OPTIONS as readonly string[]).includes(v),
    );

  const displayName = String(formData.get("displayName") ?? "").trim();
  const skipImport = formData.get("skip") === "1";

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: usernameResult.data.username,
      display_name: displayName || usernameResult.data.username,
      interests,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  const t = await getT();
  if (error) {
    if (error.code === "23505") {
      return { error: t.messages.usernameTaken };
    }
    return { error: toUserError(error, t.errors.generic) };
  }

  revalidatePath("/", "layout");
  if (skipImport) redirect("/dashboard");
  redirect("/library?import=1");
}

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name"),
    username: String(formData.get("username") ?? "")
      .toLowerCase()
      .trim(),
    bio: formData.get("bio") || null,
    website_url: formData.get("website_url") || null,
    is_public: formData.get("is_public") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  const t = await getT();
  if (error) {
    if (error.code === "23505") {
      return { error: t.messages.usernameTaken };
    }
    return { error: toUserError(error, t.errors.generic) };
  }

  revalidatePath("/settings/profile");
  revalidatePath(`/u/${parsed.data.username}`);
  return { success: t.messages.profileSaved };
}

export async function updatePrivacySettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_public: formData.get("is_public") === "on",
    })
    .eq("id", user.id);

  const t = await getT();
  if (error) {
    return { error: toUserError(error, t.errors.generic) };
  }
  revalidatePath("/settings/privacy");
  return { success: t.messages.privacyUpdated };
}

export async function updateNotificationSettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      notifications_enabled: formData.get("notifications_enabled") === "on",
      learning_reminders_enabled:
        formData.get("learning_reminders_enabled") === "on",
    })
    .eq("id", user.id);

  const t = await getT();
  if (error) {
    return { error: toUserError(error, t.errors.generic) };
  }
  revalidatePath("/settings/notifications");
  return { success: t.messages.notificationsSaved };
}

export async function checkUsernameAvailability(username: string) {
  const normalized = username.toLowerCase().trim();
  const parsed = usernameSchema.safeParse({ username: normalized });
  if (!parsed.success) {
    return { available: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .maybeSingle();

  return { available: !data, error: data ? "Username is taken." : undefined };
}
