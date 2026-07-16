export const APP_NAME = "CourseTrail";
export const APP_TAGLINE = "Track what you learn. Continue where you stopped.";

export const COMPLETION_THRESHOLD = 0.9;
export const PROGRESS_SAVE_INTERVAL_MS = 10_000;
export const NOTES_AUTOSAVE_DEBOUNCE_MS = 1_200;
export const IMPORT_RATE_LIMIT_PER_HOUR = 20;
export const MIN_PUBLIC_RATINGS = 3;

export const COURSE_STATUS_LABELS = {
  want_to_learn: "Want to Learn",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
  dropped: "Dropped",
} as const;

export const COURSE_VISIBILITY_LABELS = {
  private: "Private",
  public: "Visible on profile",
  public_on_completion: "Visible after completion",
} as const;

export const INTEREST_OPTIONS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "Design",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Mobile",
  "Product",
  "Career",
] as const;

export const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;
