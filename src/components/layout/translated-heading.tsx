"use client";

import { useT } from "@/i18n/locale-provider";
import type { Dictionary } from "@/i18n/dictionaries";

type Path = "dashboard" | "library";

export function TranslatedHeading({
  section,
  name,
}: {
  section: Path;
  name?: string | null;
}) {
  const t = useT();
  if (section === "dashboard") {
    return (
      <div>
        <h1 className="font-heading text-3xl tracking-tight">
          {t.dashboard.title}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">{t.dashboard.subtitle}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl tracking-tight">{t.library.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.library.subtitle}</p>
    </div>
  );
}

export function TranslatedStatLabel({
  keyName,
}: {
  keyName: keyof Dictionary["dashboard"];
}) {
  const t = useT();
  return <>{t.dashboard[keyName]}</>;
}
