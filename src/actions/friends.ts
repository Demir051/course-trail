"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";
import { getT } from "@/i18n/server-t";
import { requireOnboardedProfile } from "@/lib/auth";
import { toUserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Friendship } from "@/types/database";

const FRIEND_REQUEST_LIMIT_PER_HOUR = 30;

async function loadTargetProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, is_public")
    .eq("id", userId)
    .maybeSingle();
  return data as { id: string; username: string | null; is_public: boolean } | null;
}

async function findFriendship(a: string, b: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`,
    )
    .maybeSingle();
  return data as Friendship | null;
}

function revalidateSocial(usernames: Array<string | null | undefined>) {
  revalidatePath("/friends");
  for (const username of usernames) {
    if (username) revalidatePath(`/u/${username}`);
  }
}

async function assertFriendRequestRateLimit(userId: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .eq("requester_id", userId)
    .gte("created_at", since);

  if ((count ?? 0) >= FRIEND_REQUEST_LIMIT_PER_HOUR) {
    throw new Error("You are sending requests too quickly. Please wait a bit.");
  }
}

export async function sendFriendRequestAction(
  targetUserId: string,
): Promise<ActionResult> {
  const me = await requireOnboardedProfile();
  if (me.id === targetUserId) {
    return { error: "You cannot add yourself." };
  }

  const target = await loadTargetProfile(targetUserId);
  if (!target?.username) return { error: "We could not find that person." };
  if (!target.is_public) {
    return { error: "You can only add friends from public profiles." };
  }

  const existing = await findFriendship(me.id, targetUserId);
  if (existing?.status === "accepted") {
    return { error: "You are already friends." };
  }
  if (existing?.status === "pending") {
    return { error: "A friend request is already waiting." };
  }

  try {
    await assertFriendRequestRateLimit(me.id);
  } catch (e) {
    return { error: toUserError(e, "Please wait before sending more requests.") };
  }

  const supabase = await createClient();

  // Declined rows are normally deleted; if one remains, replace via delete+insert
  if (existing) {
    await supabase.from("friendships").delete().eq("id", existing.id);
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: me.id,
    addressee_id: targetUserId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A friend request is already waiting." };
    }
    return {
      error: toUserError(error, "Could not send the friend request."),
    };
  }

  revalidateSocial([me.username, target.username]);
  return { success: (await getT()).messages.friendSent };
}

export async function acceptFriendRequestAction(
  friendshipId: string,
): Promise<ActionResult> {
  const me = await requireOnboardedProfile();
  const supabase = await createClient();

  const { data: friendship, error: loadError } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .maybeSingle();

  if (loadError) {
    return {
      error: toUserError(loadError, "Could not load that friend request."),
    };
  }
  const row = friendship as Friendship | null;
  if (!row || row.status !== "pending") {
    return { error: "That friend request is no longer available." };
  }
  if (row.addressee_id !== me.id) {
    return { error: "You cannot accept this request." };
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId);

  if (error) {
    return {
      error: toUserError(error, "Could not accept the friend request."),
    };
  }

  const other = await loadTargetProfile(row.requester_id);
  revalidateSocial([me.username, other?.username]);
  return { success: (await getT()).messages.friendAccepted };
}

export async function declineFriendRequestAction(
  friendshipId: string,
): Promise<ActionResult> {
  const me = await requireOnboardedProfile();
  const supabase = await createClient();

  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .maybeSingle();

  const row = friendship as Friendship | null;
  if (!row || row.status !== "pending") {
    return { error: "That friend request is no longer available." };
  }
  if (row.addressee_id !== me.id) {
    return { error: "You cannot decline this request." };
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    return {
      error: toUserError(error, "Could not decline the friend request."),
    };
  }

  const other = await loadTargetProfile(row.requester_id);
  revalidateSocial([me.username, other?.username]);
  return { success: (await getT()).messages.friendDeclined };
}

export async function cancelFriendRequestAction(
  friendshipId: string,
): Promise<ActionResult> {
  const me = await requireOnboardedProfile();
  const supabase = await createClient();

  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .maybeSingle();

  const row = friendship as Friendship | null;
  if (!row || row.status !== "pending") {
    return { error: "That friend request is no longer available." };
  }
  if (row.requester_id !== me.id) {
    return { error: "You cannot cancel this request." };
  }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    return {
      error: toUserError(error, "Could not cancel the friend request."),
    };
  }

  const other = await loadTargetProfile(row.addressee_id);
  revalidateSocial([me.username, other?.username]);
  return { success: (await getT()).messages.friendCancelled };
}

export async function removeFriendAction(
  friendshipId: string,
): Promise<ActionResult> {
  const me = await requireOnboardedProfile();
  const supabase = await createClient();

  const { data: friendship } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .maybeSingle();

  const row = friendship as Friendship | null;
  if (!row || row.status !== "accepted") {
    return { error: "That friendship is no longer available." };
  }
  if (row.requester_id !== me.id && row.addressee_id !== me.id) {
    return { error: "You cannot change this friendship." };
  }

  const otherId =
    row.requester_id === me.id ? row.addressee_id : row.requester_id;

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    return { error: toUserError(error, "Could not remove this friend.") };
  }

  const other = await loadTargetProfile(otherId);
  revalidateSocial([me.username, other?.username]);
  return { success: (await getT()).messages.friendRemoved };
}
