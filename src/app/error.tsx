"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-3xl tracking-tight">
        {t.errors.pageTitle}
      </h1>
      <p className="text-muted-foreground">{t.errors.pageBody}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t.errors.tryAgain}</Button>
        <Button variant="outline" render={<a href="/dashboard" />}>
          {t.nav.dashboard}
        </Button>
      </div>
    </div>
  );
}
