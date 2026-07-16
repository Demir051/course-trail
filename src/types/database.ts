export type CourseStatus =
  | "want_to_learn"
  | "in_progress"
  | "paused"
  | "completed"
  | "dropped";

export type CourseVisibility =
  | "private"
  | "public"
  | "public_on_completion";

export type CollectionVisibility = "private" | "public" | "unlisted";
export type ReviewVisibility = "private" | "public";
export type ActivityVisibility = "private" | "public";

export type ActivityType =
  | "started_course"
  | "completed_course"
  | "completed_lesson"
  | "added_course"
  | "wrote_review"
  | "created_collection";

export type NotificationType =
  | "playlist_updated"
  | "video_added"
  | "video_available"
  | "learning_reminder"
  | "course_completed"
  | "friend_request"
  | "friend_accepted";

export type FriendshipStatus = "pending" | "accepted" | "declined";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  interests: string[];
  onboarding_completed: boolean;
  is_public: boolean;
  notifications_enabled: boolean;
  learning_reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  youtube_playlist_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
  video_count: number;
  total_duration_seconds: number;
  tags: string[];
  learner_count: number;
  completion_count: number;
  average_rating: number | null;
  rating_count: number;
  listed_in_discover?: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseVideo {
  id: string;
  course_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  playlist_position: number;
  published_at: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourse {
  id: string;
  user_id: string;
  course_id: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  rating: number | null;
  personal_tags: string[];
  course_notes_json: Record<string, unknown> | null;
  course_notes_text: string | null;
  is_archived: boolean;
  started_at: string | null;
  completed_at: string | null;
  last_opened_at: string | null;
  current_video_id: string | null;
  current_timestamp_seconds: number;
  progress_percentage: number;
  completed_lesson_count: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  user_course_id: string;
  course_video_id: string;
  watched_seconds: number;
  last_timestamp_seconds: number;
  completion_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  user_course_id: string;
  course_video_id: string | null;
  title: string | null;
  content_json: Record<string, unknown>;
  content_text: string;
  content_html: string | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimestampNote {
  id: string;
  user_id: string;
  note_id: string | null;
  user_course_id: string;
  course_video_id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  icon: string | null;
  visibility: CollectionVisibility;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  course_id: string;
  user_course_id: string | null;
  rating: number;
  content: string | null;
  visibility: ReviewVisibility;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Safe public enrollment shape — never includes timestamps or current video. */
export interface PublicUserCourse {
  id: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  rating: number | null;
  progress_percentage: number;
  completed_lesson_count: number;
  completed_at: string | null;
  created_at: string;
  course: Pick<
    Course,
    | "id"
    | "title"
    | "thumbnail_url"
    | "youtube_channel_name"
    | "video_count"
    | "total_duration_seconds"
  >;
}

export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

/** Relation of the viewer toward another profile. */
export type FriendRelation =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "friends"; friendshipId: string }
  | { kind: "outgoing"; friendshipId: string }
  | { kind: "incoming"; friendshipId: string };
