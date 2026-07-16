"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  declineFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/actions/friends";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import type { FriendRelation } from "@/types/database";

export function FriendActions({
  targetUserId,
  relation,
}: {
  targetUserId: string;
  relation: FriendRelation;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (relation.kind === "self") return null;

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {relation.kind === "none" ? (
          <Button
            className="min-h-10"
            disabled={pending}
            onClick={() => run(() => sendFriendRequestAction(targetUserId))}
          >
            {pending ? t.common.loading : t.friends.addFriend}
          </Button>
        ) : null}

        {relation.kind === "outgoing" ? (
          <>
            <Button className="min-h-10" variant="secondary" disabled>
              {t.friends.requestSent}
            </Button>
            <Button
              className="min-h-10"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => cancelFriendRequestAction(relation.friendshipId))
              }
            >
              {t.friends.cancelRequest}
            </Button>
          </>
        ) : null}

        {relation.kind === "incoming" ? (
          <>
            <Button
              className="min-h-10"
              disabled={pending}
              onClick={() =>
                run(() => acceptFriendRequestAction(relation.friendshipId))
              }
            >
              {t.friends.accept}
            </Button>
            <Button
              className="min-h-10"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => declineFriendRequestAction(relation.friendshipId))
              }
            >
              {t.friends.decline}
            </Button>
          </>
        ) : null}

        {relation.kind === "friends" ? (
          <>
            <Button className="min-h-10" variant="secondary" disabled>
              {t.friends.friends}
            </Button>
            <Button
              className="min-h-10"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(() => removeFriendAction(relation.friendshipId))
              }
            >
              {t.friends.removeFriend}
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
