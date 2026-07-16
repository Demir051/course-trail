"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/config";

export function AppProviders({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <ThemeProvider>
      <LocaleProvider initialLocale={initialLocale}>
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </TooltipProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
