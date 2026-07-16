"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FriendActions } from "@/components/social/friend-actions";
import { useT } from "@/i18n/locale-provider";
import type { FriendRelation } from "@/types/database";

export function PersonCard({
  person,
  relation,
  actionSlot,
}: {
  person: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  relation?: FriendRelation;
  actionSlot?: ReactNode;
}) {
  const t = useT();
  const href = person.username ? `/u/${person.username}` : "#";
  const name = person.display_name ?? person.username ?? t.common.learner;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card/60 p-4">
      <Link
        href={href}
        className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted"
      >
        {person.avatar_url ? (
          <Image
            src={person.avatar_url}
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <Link
            href={href}
            className="font-medium underline-offset-4 hover:underline"
          >
            {name}
          </Link>
          {person.username ? (
            <p className="text-sm text-muted-foreground">@{person.username}</p>
          ) : null}
          {person.bio ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {person.bio}
            </p>
          ) : null}
        </div>
        {actionSlot}
        {relation ? (
          <FriendActions targetUserId={person.id} relation={relation} />
        ) : null}
      </div>
    </div>
  );
}
