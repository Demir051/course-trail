import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { FriendActions } from "@/components/social/friend-actions";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/i18n/dictionaries";
import { getCurrentProfile } from "@/lib/auth";
import { isSafeHttpUrl } from "@/lib/errors";
import { getFriendRelation } from "@/lib/friends";
import { getRequestLocale } from "@/lib/locale-server";
import { isEnrollmentPubliclyVisible, toPublicUserCourse } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/youtube/duration";
import type { Course, Friendship, Profile, UserCourse } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await getCurrentProfile();
  const t = getDictionary(await getRequestLocale());
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, website_url, created_at, is_public",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const typedProfile = profile as Pick<
    Profile,
    | "id"
    | "username"
    | "display_name"
    | "avatar_url"
    | "bio"
    | "website_url"
    | "created_at"
    | "is_public"
  >;

  let friendship: Friendship | null = null;
  if (viewer && viewer.id !== typedProfile.id) {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${viewer.id},addressee_id.eq.${typedProfile.id}),and(requester_id.eq.${typedProfile.id},addressee_id.eq.${viewer.id})`,
      )
      .maybeSingle();
    friendship = data as Friendship | null;
  }

  const relation = getFriendRelation(viewer?.id, typedProfile.id, friendship);
  const canView =
    typedProfile.is_public ||
    viewer?.id === typedProfile.id ||
    relation.kind === "friends" ||
    relation.kind === "incoming" ||
    relation.kind === "outgoing";

  if (!canView) {
    notFound();
  }

  // Intentionally omit current_video_id and current_timestamp_seconds
  const { data: enrollments } = await supabase
    .from("user_courses")
    .select(
      `
      id,
      status,
      visibility,
      rating,
      progress_percentage,
      completed_lesson_count,
      completed_at,
      created_at,
      course:courses (
        id,
        title,
        thumbnail_url,
        youtube_channel_name,
        video_count,
        total_duration_seconds
      )
    `,
    )
    .eq("user_id", typedProfile.id)
    .eq("is_archived", false);

  const publicCourses = ((enrollments ?? []) as unknown as Array<
    UserCourse & { course: Course }
  >)
    .filter((uc) =>
      isEnrollmentPubliclyVisible({
        visibility: uc.visibility,
        status: uc.status,
      }),
    )
    .map((uc) => toPublicUserCourse(uc));

  const completed = publicCourses.filter((c) => c.status === "completed");
  const learning = publicCourses.filter((c) => c.status === "in_progress");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={viewer} variant={viewer ? "app" : "marketing"} />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative size-20 overflow-hidden rounded-2xl bg-muted">
            {typedProfile.avatar_url ? (
              <Image
                src={typedProfile.avatar_url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xl font-semibold">
                {(typedProfile.display_name ?? typedProfile.username ?? "?")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-2">
              <h1 className="font-heading text-3xl tracking-tight">
                {typedProfile.display_name ?? typedProfile.username}
              </h1>
              <p className="text-muted-foreground">@{typedProfile.username}</p>
              {typedProfile.bio ? (
                <p className="max-w-2xl text-sm leading-relaxed">
                  {typedProfile.bio}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  {t.profilePage.joined}{" "}
                  {new Date(typedProfile.created_at).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </span>
                {typedProfile.website_url &&
                isSafeHttpUrl(typedProfile.website_url) ? (
                  <a
                    href={typedProfile.website_url}
                    className="underline-offset-4 hover:underline"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t.common.website}
                  </a>
                ) : null}
                {!typedProfile.is_public ? (
                  <Badge variant="secondary">{t.common.private}</Badge>
                ) : null}
              </div>
            </div>
            {viewer ? (
              <FriendActions
                targetUserId={typedProfile.id}
                relation={relation}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link
                  href={`/login?next=/u/${typedProfile.username}`}
                  className="underline-offset-4 hover:underline"
                >
                  {t.nav.login}
                </Link>{" "}
                {t.friends.loginToAdd}
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">
              {t.profilePage.publicCourses}
            </div>
            <div className="font-heading text-2xl">{publicCourses.length}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">
              {t.profilePage.completed}
            </div>
            <div className="font-heading text-2xl">{completed.length}</div>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">
              {t.profilePage.currentlyLearning}
            </div>
            <div className="font-heading text-2xl">{learning.length}</div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-2xl">{t.profilePage.courses}</h2>
          {publicCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.profilePage.noPublic}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {publicCourses.map((uc) => (
                <Link
                  key={uc.id}
                  href={`/courses/${uc.course?.id}`}
                  className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 transition hover:border-primary/30"
                >
                  <div className="relative aspect-video bg-muted">
                    {uc.course?.thumbnail_url ? (
                      <Image
                        src={uc.course.thumbnail_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 100vw, 50vw"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="min-w-0 font-medium leading-snug">
                        {uc.course?.title}
                      </h3>
                      <Badge variant="secondary" className="w-fit shrink-0">
                        {t.status[uc.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uc.course?.youtube_channel_name} ·{" "}
                      {formatDuration(uc.course?.total_duration_seconds ?? 0)}
                    </p>
                    {uc.rating ? (
                      <p className="text-xs">
                        {t.profilePage.rated.replace("{n}", String(uc.rating))}
                      </p>
                    ) : null}
                    {/* Never show exact timestamp or current lesson */}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
