"use client";

import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const options: Array<{ locale: Locale; labelKey: "en" | "tr"; short: string }> =
  [
    { locale: "tr", labelKey: "tr", short: "TR" },
    { locale: "en", labelKey: "en", short: "EN" },
  ];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t, pending } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-card/70 p-0.5",
        className,
      )}
      role="group"
      aria-label={t.language.label}
    >
      {options.map((option) => {
        const active = locale === option.locale;
        return (
          <button
            key={option.locale}
            type="button"
            disabled={pending}
            aria-pressed={active}
            aria-label={t.language[option.labelKey]}
            onClick={() => setLocale(option.locale)}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-medium transition sm:h-7 sm:min-w-0",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
