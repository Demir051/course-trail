/**
 * Development seed script.
 * Requires SUPABASE_SERVICE_ROLE_KEY and a running project with migrations applied.
 *
 * Usage: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  {
    email: "maya@coursetrail.dev",
    password: "password123",
    username: "maya_codes",
    display_name: "Maya Chen",
    bio: "Frontend engineer learning in public—progress stays private.",
    interests: ["Frontend", "Design"],
  },
  {
    email: "jordan@coursetrail.dev",
    password: "password123",
    username: "jordan_ds",
    display_name: "Jordan Lee",
    bio: "Data structures by day, UI systems by night.",
    interests: ["Data Science", "Computer Science"],
  },
  {
    email: "sam@coursetrail.dev",
    password: "password123",
    username: "sam_builds",
    display_name: "Sam Okonkwo",
    bio: "Shipping TypeScript apps and finishing the courses I start.",
    interests: ["Full Stack", "TypeScript"],
  },
] as const;

async function ensureUser(user: (typeof demoUsers)[number]) {
  const { data: listed } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed.users.find((u) => u.email === user.email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { display_name: user.display_name },
  });
  if (error || !data.user) {
    throw error ?? new Error(`Could not create ${user.email}`);
  }
  return data.user.id;
}

async function main() {
  console.log("Seeding CourseTrail demo data…");

  // Apply SQL seed for courses/videos if present
  try {
    const sql = readFileSync(
      resolve(process.cwd(), "supabase/seed.sql"),
      "utf8",
    );
    // Prefer running seed.sql via Supabase SQL editor / CLI.
    // Here we upsert course rows through the API for portability.
    console.log(
      "Tip: also run supabase/seed.sql in the SQL editor for full course catalog.",
    );
    void sql;
  } catch {
    // optional
  }

  const userIds: string[] = [];
  for (const user of demoUsers) {
    const id = await ensureUser(user);
    userIds.push(id);
    await admin.from("profiles").upsert({
      id,
      username: user.username,
      display_name: user.display_name,
      bio: user.bio,
      interests: user.interests,
      onboarding_completed: true,
      is_public: true,
    });
  }

  const { data: courses } = await admin.from("courses").select("id, title");
  if (!courses?.length) {
    console.warn(
      "No courses found. Run supabase/seed.sql first, then re-run this script.",
    );
    return;
  }

  const [maya, jordan, sam] = userIds;
  const react = courses.find((c) => c.title.includes("React"));
  const algo = courses.find((c) => c.title.includes("Algorithms"));
  const design = courses.find((c) => c.title.includes("UI Design"));
  const ts = courses.find((c) => c.title.includes("TypeScript"));

  async function enroll(
    userId: string,
    courseId: string | undefined,
    patch: Record<string, unknown>,
  ) {
    if (!courseId) return null;
    const { data, error } = await admin
      .from("user_courses")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          visibility: "private",
          ...patch,
        },
        { onConflict: "user_id,course_id" },
      )
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  const mayaReact = await enroll(maya, react?.id, {
    status: "in_progress",
    visibility: "public",
    progress_percentage: 40,
    completed_lesson_count: 2,
    personal_tags: ["react", "weekend"],
    last_opened_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
  });

  await enroll(maya, design?.id, {
    status: "completed",
    visibility: "public",
    progress_percentage: 100,
    completed_lesson_count: 4,
    rating: 4,
    completed_at: new Date().toISOString(),
  });

  await enroll(jordan, algo?.id, {
    status: "in_progress",
    visibility: "public_on_completion",
    progress_percentage: 25,
    completed_lesson_count: 1,
    personal_tags: ["algorithms"],
  });

  await enroll(sam, ts?.id, {
    status: "want_to_learn",
    visibility: "private",
    progress_percentage: 0,
    completed_lesson_count: 0,
  });

  if (mayaReact && react) {
    const { data: videos } = await admin
      .from("course_videos")
      .select("id, title")
      .eq("course_id", react.id)
      .order("playlist_position");

    if (videos?.[0]) {
      await admin.from("video_progress").upsert(
        {
          user_id: maya,
          user_course_id: mayaReact,
          course_video_id: videos[0].id,
          watched_seconds: 1200,
          last_timestamp_seconds: 420,
          completion_percentage: 66,
          is_completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_course_id,course_video_id" },
      );

      await admin.from("user_courses").update({
        current_video_id: videos[1]?.id ?? videos[0].id,
        current_timestamp_seconds: 130,
      }).eq("id", mayaReact);

      const { data: note } = await admin
        .from("notes")
        .insert({
          user_id: maya,
          user_course_id: mayaReact,
          course_video_id: videos[0].id,
          title: "React mental models",
          content_json: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Key takeaways" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: "State should live as close as possible to where it is used.",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          content_text:
            "Key takeaways\nState should live as close as possible to where it is used.",
          is_pinned: true,
          tags: ["react"],
        })
        .select("id")
        .single();

      if (note && videos[1]) {
        await admin.from("timestamp_notes").insert({
          user_id: maya,
          note_id: note.id,
          user_course_id: mayaReact,
          course_video_id: videos[1].id,
          timestamp_seconds: 272,
          content: "Explanation of derived state vs stored state",
        });
      }
    }

    await admin.from("collections").upsert(
      {
        user_id: maya,
        title: "Frontend Development",
        description: "Courses shaping my UI craft this year.",
        visibility: "public",
        slug: "frontend-development",
      },
      { onConflict: "user_id,slug" },
    );

    await admin.from("collections").upsert(
      {
        user_id: maya,
        title: "Private deep work",
        description: "Only for me.",
        visibility: "private",
        slug: "private-deep-work",
      },
      { onConflict: "user_id,slug" },
    );

    if (react.id) {
      await admin.from("reviews").upsert(
        {
          user_id: maya,
          course_id: react.id,
          user_course_id: mayaReact,
          rating: 5,
          content:
            "Clear pacing and practical examples. Perfect for rebuilding React confidence.",
          visibility: "public",
          contains_spoilers: false,
        },
        { onConflict: "user_id,course_id" },
      );
    }
  }

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  for (const user of demoUsers) {
    console.log(`  ${user.email} (@${user.username})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
