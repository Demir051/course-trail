"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  removeUserCourseAction,
  syncPlaylistAction,
  updateUserCourseAction,
} from "@/actions/courses";
import { TagPicker } from "@/components/courses/tag-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { useT } from "@/i18n/locale-provider";
import type { CourseStatus, CourseVisibility, UserCourse } from "@/types/database";
import { useRouter } from "next/navigation";

export function CourseSettings({
  userCourse,
  courseId,
  knownTags = [],
}: {
  userCourse: UserCourse;
  courseId: string;
  knownTags?: string[];
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tags, setTags] = useState(userCourse.personal_tags);
  const [status, setStatus] = useState(userCourse.status);
  const [visibility, setVisibility] = useState(userCourse.visibility);
  const [rating, setRating] = useState(
    userCourse.rating != null ? String(userCourse.rating) : "none",
  );

  function update(payload: Parameters<typeof updateUserCourseAction>[0]) {
    startTransition(async () => {
      const result = await updateUserCourseAction(payload);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? t.common.updated);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="status">{t.library.status}</Label>
          <FormSelect
            id="status"
            value={status}
            disabled={pending}
            onValueChange={(value) => {
              setStatus(value as CourseStatus);
              update({
                userCourseId: userCourse.id,
                status: value as CourseStatus,
              });
            }}
            options={[
              { value: "want_to_learn", label: t.status.want_to_learn },
              { value: "in_progress", label: t.status.in_progress },
              { value: "paused", label: t.status.paused },
              { value: "completed", label: t.status.completed },
              { value: "dropped", label: t.status.dropped },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="visibility">{t.library.profileVisibility}</Label>
          <FormSelect
            id="visibility"
            value={visibility}
            disabled={pending}
            onValueChange={(value) => {
              setVisibility(value as CourseVisibility);
              update({
                userCourseId: userCourse.id,
                visibility: value as CourseVisibility,
              });
            }}
            options={[
              { value: "private", label: t.visibility.private },
              { value: "public", label: t.visibility.public },
              {
                value: "public_on_completion",
                label: t.visibility.public_on_completion,
              },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rating">{t.library.yourRating}</Label>
          <FormSelect
            id="rating"
            value={rating}
            disabled={pending}
            onValueChange={(value) => {
              setRating(value);
              update({
                userCourseId: userCourse.id,
                rating: value === "none" ? null : Number(value),
              });
            }}
            options={[
              { value: "none", label: t.library.noRating },
              { value: "1", label: t.library.stars.replace("{n}", "1") },
              { value: "2", label: t.library.stars.replace("{n}", "2") },
              { value: "3", label: t.library.stars.replace("{n}", "3") },
              { value: "4", label: t.library.stars.replace("{n}", "4") },
              { value: "5", label: t.library.stars.replace("{n}", "5") },
            ]}
          />
        </div>

        <TagPicker
          value={tags}
          knownTags={knownTags}
          disabled={pending}
          label={t.library.personalTags}
          onChange={(next) => {
            setTags(next);
            update({
              userCourseId: userCourse.id,
              personal_tags: next,
            });
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await syncPlaylistAction(courseId);
              if (result.error) toast.error(result.error);
              else {
                toast.success(result.success);
                router.refresh();
              }
            })
          }
        >
          {t.common.syncPlaylist}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            update({ userCourseId: userCourse.id, is_archived: true })
          }
        >
          {t.common.archive}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await removeUserCourseAction(userCourse.id);
              if (result.error) toast.error(result.error);
              else {
                toast.success(result.success);
                router.push("/library");
              }
            })
          }
        >
          {t.common.remove}
        </Button>
      </div>
    </div>
  );
}
