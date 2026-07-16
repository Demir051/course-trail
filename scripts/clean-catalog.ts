/**
 * Remove Discover courses that are not in the curated keep-list.
 * Usage: npm run db:clean-catalog
 */
import { createClient } from "@supabase/supabase-js";
import { DISCOVER_PLAYLIST_IDS } from "../src/lib/catalog";

const KEEP = new Set<string>(DISCOVER_PLAYLIST_IDS);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: courses, error } = await admin
    .from("courses")
    .select("id, title, youtube_playlist_id");

  if (error) throw error;

  const toDelete = (courses ?? []).filter(
    (c) => !KEEP.has(c.youtube_playlist_id),
  );

  if (toDelete.length === 0) {
    console.log("Nothing to delete. Catalog already clean.");
    return;
  }

  console.log(`Deleting ${toDelete.length} old course(s)…\n`);

  for (const course of toDelete) {
    // Clear FK references that don't cascade from courses
    await admin.from("activities").delete().eq("course_id", course.id);
    await admin.from("reviews").delete().eq("course_id", course.id);

    const { error: delError } = await admin
      .from("courses")
      .delete()
      .eq("id", course.id);

    if (delError) {
      console.error(`  failed: ${course.title}`, delError.message);
    } else {
      console.log(`  deleted: ${course.title}`);
    }
  }

  const { data: remaining } = await admin
    .from("courses")
    .select("title, youtube_playlist_id")
    .order("title");

  console.log("\nRemaining catalog:");
  for (const c of remaining ?? []) {
    console.log(`  • ${c.title}`);
  }
}

void main();
