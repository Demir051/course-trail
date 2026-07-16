"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";
import { getT } from "@/i18n/server-t";
import { requireUser } from "@/lib/auth";
import { IMPORT_RATE_LIMIT_PER_HOUR } from "@/lib/constants";
import { toUserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  importPlaylistSchema,
  updateUserCourseSchema,
} from "@/lib/validations/course";
import {
  fetchPlaylistItems,
  fetchPlaylistMeta,
  fetchVideoMeta,
  type YoutubePlaylistItem,
  type YoutubePlaylistMeta,
} from "@/lib/youtube/api";
import {
  parseSingleVideoCourseKey,
  parseYoutubeInput,
  singleVideoCourseKey,
} from "@/lib/youtube/parse-input";

async function assertImportRateLimit(userId: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("import_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("imported_at", since);

  if ((count ?? 0) >= IMPORT_RATE_LIMIT_PER_HOUR) {
    throw new Error(
      "Import limit reached. Try again in about an hour.",
    );
  }
}

export async function importPlaylistAction(
  _prev: ActionResult & { userCourseId?: string },
  formData: FormData,
): Promise<ActionResult & { userCourseId?: string }> {
  const user = await requireUser();
  const parsed = importPlaylistSchema.safeParse({
    input: formData.get("input"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the playlist link.",
    };
  }

  const source = parseYoutubeInput(parsed.data.input);
  if (!source.ok) return { error: source.error };

  try {
    await assertImportRateLimit(user.id);
  } catch (e) {
    return {
      error: toUserError(
        e,
        "Import limit reached. Try again in about an hour.",
      ),
    };
  }

  const supabase = await createClient();

  try {
    let meta: YoutubePlaylistMeta;
    let items: YoutubePlaylistItem[];

    if (source.kind === "playlist") {
      meta = await fetchPlaylistMeta(source.playlistId);
      items = await fetchPlaylistItems(source.playlistId);
    } else {
      const video = await fetchVideoMeta(source.videoId);
      if (!video.isAvailable) {
        return { error: "This video is private or unavailable." };
      }
      meta = {
        id: singleVideoCourseKey(video.id),
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        itemCount: 1,
      };
      items = [
        {
          youtubeVideoId: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          position: 1,
          publishedAt: video.publishedAt,
          isAvailable: video.isAvailable,
          durationSeconds: video.durationSeconds,
          channelTitle: video.channelTitle,
        },
      ];
    }

    if (items.length === 0) {
      return { error: "This playlist has no videos to import." };
    }

    const totalDuration = items.reduce(
      (sum, item) => sum + item.durationSeconds,
      0,
    );

    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("youtube_playlist_id", meta.id)
      .maybeSingle();

    let courseId = existing?.id as string | undefined;

    if (!courseId) {
      const { data: created, error: createError } = await supabase
        .from("courses")
        .insert({
          youtube_playlist_id: meta.id,
          title: meta.title,
          description: meta.description,
          thumbnail_url: meta.thumbnailUrl,
          youtube_channel_id: meta.channelId,
          youtube_channel_name: meta.channelTitle,
          video_count: items.length,
          total_duration_seconds: totalDuration,
          last_synced_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError || !created) {
        return {
          error: toUserError(createError, "Could not create this course."),
        };
      }
      courseId = created.id;

      const { error: videosError } = await supabase.from("course_videos").insert(
        items.map((item) => ({
          course_id: courseId,
          youtube_video_id: item.youtubeVideoId,
          title: item.title,
          description: item.description,
          thumbnail_url: item.thumbnailUrl,
          duration_seconds: item.durationSeconds,
          playlist_position: item.position,
          published_at: item.publishedAt,
          is_available: item.isAvailable,
        })),
      );

      if (videosError) {
        return {
          error: toUserError(videosError, "Could not import videos."),
        };
      }
    }

    // Enroll before updating shared metadata (RLS requires enrollment).
    const { data: enrollment, error: enrollError } = await supabase
      .from("user_courses")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          status: "want_to_learn",
          visibility: "private",
          last_opened_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" },
      )
      .select("id")
      .single();

    if (enrollError || !enrollment) {
      return {
        error: toUserError(
          enrollError,
          "Could not add this course to your library.",
        ),
      };
    }

    if (existing?.id) {
      await supabase
        .from("courses")
        .update({
          title: meta.title,
          description: meta.description,
          thumbnail_url: meta.thumbnailUrl,
          youtube_channel_id: meta.channelId,
          youtube_channel_name: meta.channelTitle,
          video_count: items.length,
          total_duration_seconds: totalDuration,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", courseId);

      for (const item of items) {
        await supabase.from("course_videos").upsert(
          {
            course_id: courseId,
            youtube_video_id: item.youtubeVideoId,
            title: item.title,
            description: item.description,
            thumbnail_url: item.thumbnailUrl,
            duration_seconds: item.durationSeconds,
            playlist_position: item.position,
            published_at: item.publishedAt,
            is_available: item.isAvailable,
          },
          { onConflict: "course_id,youtube_video_id" },
        );
      }
    }

    await supabase.from("import_rate_limits").insert({ user_id: user.id });
    await supabase.from("activities").insert({
      user_id: user.id,
      activity_type: "added_course",
      course_id: courseId,
      visibility: "private",
      metadata: { title: meta.title },
    });

    await supabase.rpc("refresh_course_stats", { p_course_id: courseId });

    revalidatePath("/library");
    revalidatePath("/dashboard");
    revalidatePath("/discover");
    return {
      success: (await getT()).messages.courseImported,
      userCourseId: enrollment.id,
    };
  } catch (e) {
    return {
      error: toUserError(e, "Could not import. Please try again."),
    };
  }
}

export async function updateUserCourseAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateUserCourseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Could not update this course.",
    };
  }

  const supabase = await createClient();
  const { userCourseId, ...updates } = parsed.data;

  const payload: Record<string, unknown> = { ...updates };
  if (updates.status === "completed") {
    payload.completed_at = new Date().toISOString();
    payload.progress_percentage = 100;
  }
  if (updates.status === "in_progress" && !updates.status) {
    payload.started_at = new Date().toISOString();
  }
  if (updates.status === "in_progress") {
    payload.started_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("user_courses")
    .update(payload)
    .eq("id", userCourseId)
    .eq("user_id", user.id)
    .select("id, course_id, status")
    .maybeSingle();

  if (error) {
    return { error: toUserError(error, "Could not update this course.") };
  }
  if (!data) return { error: "Course not found." };

  if (data.status === "completed") {
    await supabase.from("activities").insert({
      user_id: user.id,
      activity_type: "completed_course",
      course_id: data.course_id,
      visibility: "private",
    });
  }

  await supabase.rpc("refresh_course_stats", { p_course_id: data.course_id });

  revalidatePath("/library");
  revalidatePath(`/library/${userCourseId}`);
  revalidatePath("/dashboard");
  return { success: (await getT()).messages.courseUpdated };
}

export async function removeUserCourseAction(
  userCourseId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_courses")
    .delete()
    .eq("id", userCourseId)
    .eq("user_id", user.id)
    .select("course_id")
    .maybeSingle();

  if (error) {
    return { error: toUserError(error, "Could not remove this course.") };
  }
  if (!data) return { error: "Course not found." };

  await supabase.rpc("refresh_course_stats", { p_course_id: data.course_id });
  revalidatePath("/library");
  revalidatePath("/dashboard");
  return { success: (await getT()).messages.courseRemoved };
}

export async function addExistingCourseAction(
  courseId: string,
): Promise<ActionResult & { userCourseId?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_courses")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        status: "want_to_learn",
        visibility: "private",
        last_opened_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    return { error: toUserError(error, "Could not add this course.") };
  }

  await supabase.rpc("refresh_course_stats", { p_course_id: courseId });
  revalidatePath("/library");
  return {
    success: (await getT()).messages.courseAdded,
    userCourseId: data.id,
  };
}

export async function syncPlaylistAction(
  courseId: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("id, course:courses(id, youtube_playlist_id)")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) return { error: "You can only sync courses in your library." };

  const course = enrollment.course as unknown as {
    id: string;
    youtube_playlist_id: string;
  } | null;
  if (!course) return { error: "Course not found." };

  try {
    let meta: YoutubePlaylistMeta;
    let items: YoutubePlaylistItem[];

    const videoId = parseSingleVideoCourseKey(course.youtube_playlist_id);
    if (videoId) {
      const video = await fetchVideoMeta(videoId);
      meta = {
        id: course.youtube_playlist_id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        channelId: video.channelId,
        channelTitle: video.channelTitle,
        itemCount: 1,
      };
      items = [
        {
          youtubeVideoId: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnailUrl,
          position: 1,
          publishedAt: video.publishedAt,
          isAvailable: video.isAvailable,
          durationSeconds: video.durationSeconds,
          channelTitle: video.channelTitle,
        },
      ];
    } else {
      meta = await fetchPlaylistMeta(course.youtube_playlist_id);
      items = await fetchPlaylistItems(course.youtube_playlist_id);
    }

    const totalDuration = items.reduce((s, i) => s + i.durationSeconds, 0);

    await supabase
      .from("courses")
      .update({
        title: meta.title,
        description: meta.description,
        thumbnail_url: meta.thumbnailUrl,
        youtube_channel_name: meta.channelTitle,
        video_count: items.length,
        total_duration_seconds: totalDuration,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    const { data: existingVideos } = await supabase
      .from("course_videos")
      .select("id, youtube_video_id")
      .eq("course_id", courseId);

    const incomingIds = new Set(items.map((i) => i.youtubeVideoId));

    for (const item of items) {
      await supabase.from("course_videos").upsert(
        {
          course_id: courseId,
          youtube_video_id: item.youtubeVideoId,
          title: item.title,
          description: item.description,
          thumbnail_url: item.thumbnailUrl,
          duration_seconds: item.durationSeconds,
          playlist_position: item.position,
          published_at: item.publishedAt,
          is_available: item.isAvailable,
        },
        { onConflict: "course_id,youtube_video_id" },
      );
    }

    for (const video of existingVideos ?? []) {
      if (!incomingIds.has(video.youtube_video_id)) {
        await supabase
          .from("course_videos")
          .update({ is_available: false })
          .eq("id", video.id);
      }
    }

    revalidatePath(`/library`);
    revalidatePath(`/courses/${courseId}`);
    return { success: (await getT()).messages.playlistSynced };
  } catch (e) {
    return {
      error: toUserError(e, "Could not sync. Please try again."),
    };
  }
}
