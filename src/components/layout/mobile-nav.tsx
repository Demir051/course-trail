"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";

export function MobileNav({
  profile,
  variant,
}: {
  profile?: Profile | null;
  variant: "marketing" | "app";
}) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const appLinks = [
    { href: "/dashboard", label: t.nav.dashboard },
    { href: "/library", label: t.nav.library },
    { href: "/notes", label: t.nav.notes },
    { href: "/discover", label: t.nav.discover },
    { href: "/friends", label: t.nav.friends },
  ];

  const marketingLinks = [
    { href: "/#features", label: t.nav.features },
    { href: "/#privacy", label: t.nav.privacy },
    { href: "/discover", label: t.nav.discover },
    { href: "/#faq", label: t.nav.faq },
  ];

  const links = variant === "app" && profile ? appLinks : marketingLinks;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={t.nav.menu}
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100%,20rem)] gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b border-border/60 px-4 py-4 text-left">
          <SheetTitle className="font-heading text-lg">{t.brand}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label={t.nav.menu}>
          {links.map((link) => {
            const active =
              link.href.startsWith("/#")
                ? false
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-3 text-base font-medium transition",
                  active
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {variant === "app" && profile?.username ? (
            <Link
              href={`/u/${profile.username}`}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            >
              {t.nav.publicProfile}
            </Link>
          ) : null}
          {variant === "app" && profile ? (
            <Link
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            >
              {t.nav.settings}
            </Link>
          ) : null}
        </nav>
        <div className="mt-auto space-y-3 border-t border-border/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          {!profile ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                render={<Link href="/login" onClick={() => setOpen(false)} />}
              >
                {t.nav.login}
              </Button>
              <Button
                className="min-h-11"
                render={<Link href="/register" onClick={() => setOpen(false)} />}
              >
                {t.nav.getStarted}
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
