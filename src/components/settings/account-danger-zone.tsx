"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteAccountAction,
  exportAccountDataAction,
} from "@/actions/account";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";

export function AccountDangerZone() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border border-destructive/30 bg-card/60 p-5">
      <div>
        <h2 className="font-heading text-xl">{t.settings.yourData}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.settings.exportBody}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await exportAccountDataAction();
              if (result.error || !result.data) {
                toast.error(result.error ?? t.settings.exportFailed);
                return;
              }
              const blob = new Blob([result.data], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `coursetrail-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(t.settings.exportDone);
            })
          }
        >
          {t.settings.exportBtn}
        </Button>
        {!confirmDelete ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            {t.settings.deleteBtn}
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(() => void deleteAccountAction())}
          >
            {t.settings.confirmDelete}
          </Button>
        )}
      </div>
    </div>
  );
}
