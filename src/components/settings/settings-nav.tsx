"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const t = useT();
  const pathname = usePathname();

  const items = [
    { href: "/settings/profile", label: t.settingsNav.profile },
    { href: "/settings/privacy", label: t.settingsNav.privacy },
    { href: "/settings/notifications", label: t.settingsNav.notifications },
  ];

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      aria-label={t.nav.settings}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/70 text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
