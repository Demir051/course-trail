"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import type { Profile } from "@/types/database";

export function SiteHeader({
  profile,
  variant = "marketing",
}: {
  profile?: Profile | null;
  variant?: "marketing" | "app";
}) {
  const t = useT();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-1.5">
          <MobileNav profile={profile} variant={variant} />
          <Link
            href={profile ? "/dashboard" : "/"}
            className="flex min-w-0 items-center gap-2 font-heading text-base font-semibold tracking-tight sm:text-lg"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="size-4" aria-hidden />
            </span>
            <span className="truncate">{t.brand}</span>
          </Link>
        </div>

        {variant === "app" && profile ? (
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              {t.nav.dashboard}
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/library" />}>
              {t.nav.library}
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/notes" />}>
              {t.nav.notes}
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/discover" />}>
              {t.nav.discover}
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/friends" />}>
              {t.nav.friends}
            </Button>
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/#features" className="hover:text-foreground">
              {t.nav.features}
            </Link>
            <Link href="/#privacy" className="hover:text-foreground">
              {t.nav.privacy}
            </Link>
            <Link href="/discover" className="hover:text-foreground">
              {t.nav.discover}
            </Link>
            <Link href="/#faq" className="hover:text-foreground">
              {t.nav.faq}
            </Link>
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                render={<Link href="/login" />}
              >
                {t.nav.login}
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                <span className="sm:hidden">{t.nav.getStarted}</span>
                <span className="hidden sm:inline">{t.nav.getStarted}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
