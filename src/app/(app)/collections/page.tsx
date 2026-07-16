import Link from "next/link";
import { requireOnboardedProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Collection } from "@/types/database";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const profile = await requireOnboardedProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false });

  const collections = (data ?? []) as Collection[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-tight">Collections</h1>
        <p className="mt-1 text-muted-foreground">
          Group courses into private, unlisted, or public shelves. Full editing
          lands in Phase 2—your data model is ready now.
        </p>
      </div>
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No collections yet. Seed data or Phase 2 UI will populate this view.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="rounded-2xl border border-border/70 bg-card/60 p-4 transition hover:border-primary/30"
            >
              <h2 className="font-heading text-xl">{collection.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {collection.description || "No description"}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                {collection.visibility}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
