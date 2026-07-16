import type { Friendship, FriendRelation } from "@/types/database";

export function getFriendRelation(
  viewerId: string | null | undefined,
  profileId: string,
  friendship: Pick<
    Friendship,
    "id" | "requester_id" | "addressee_id" | "status"
  > | null,
): FriendRelation {
  if (!viewerId) return { kind: "none" };
  if (viewerId === profileId) return { kind: "self" };
  if (!friendship) return { kind: "none" };

  if (friendship.status === "accepted") {
    return { kind: "friends", friendshipId: friendship.id };
  }

  if (friendship.status === "pending") {
    if (friendship.requester_id === viewerId) {
      return { kind: "outgoing", friendshipId: friendship.id };
    }
    if (friendship.addressee_id === viewerId) {
      return { kind: "incoming", friendshipId: friendship.id };
    }
  }

  return { kind: "none" };
}

export type FriendProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
};

export function otherPartyId(
  friendship: Pick<Friendship, "requester_id" | "addressee_id">,
  viewerId: string,
) {
  return friendship.requester_id === viewerId
    ? friendship.addressee_id
    : friendship.requester_id;
}
