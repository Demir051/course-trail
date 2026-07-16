"use client";

import Link from "next/link";
import { LogOut, Settings, Users, UserRound } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/i18n/locale-provider";
import type { Profile } from "@/types/database";

export function UserMenu({ profile }: { profile: Profile }) {
  const t = useT();
  const initials =
    profile.display_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    profile.username?.slice(0, 2).toUpperCase() ||
    "CT";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Open account menu"
          />
        }
      >
        <Avatar className="size-8">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt="" />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-zinc-50">
                {profile.display_name ?? t.common.learner}
              </span>
              {profile.username ? (
                <span className="text-xs text-zinc-400">
                  @{profile.username}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {profile.username ? (
            <DropdownMenuItem
              render={<Link href={`/u/${profile.username}`} />}
              nativeButton={false}
            >
              <UserRound className="size-4" />
              {t.nav.publicProfile}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            render={<Link href="/friends" />}
            nativeButton={false}
          >
            <Users className="size-4" />
            {t.nav.friends}
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/settings/profile" />}
            nativeButton={false}
          >
            <Settings className="size-4" />
            {t.nav.settings}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              void signOutAction();
            }}
          >
            <LogOut className="size-4" />
            {t.nav.logOut}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
