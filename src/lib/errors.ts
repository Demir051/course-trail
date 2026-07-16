/**
 * Map backend / vendor errors to plain, non-technical user copy.
 * Never surface codes, stack traces, or infrastructure details.
 */

const AUTH_PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /invalid login credentials|invalid email or password/i,
    message: "Email or password is incorrect.",
  },
  {
    test: /email not confirmed/i,
    message: "Please confirm your email before signing in.",
  },
  {
    test: /user already registered|already been registered/i,
    message: "An account with this email already exists.",
  },
  {
    test: /password should be at least|weak password/i,
    message: "Choose a stronger password (at least 8 characters).",
  },
  {
    test: /rate limit|too many requests|over_request_rate_limit/i,
    message: "Too many attempts. Please wait a moment and try again.",
  },
  {
    test: /provider is not enabled|unsupported provider/i,
    message: "Google sign-in is unavailable right now. Use email instead.",
  },
  {
    test: /same password|different from the old/i,
    message: "Choose a password you have not used before.",
  },
  {
    test: /network|fetch failed|failed to fetch/i,
    message: "Connection problem. Check your internet and try again.",
  },
];

const GENERIC_PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /duplicate key|unique constraint|23505/i,
    message: "That value is already in use.",
  },
  {
    test: /foreign key|23503/i,
    message: "Something related to this item is missing.",
  },
  {
    test: /permission|row-level security|rls|42501|not authorized|jwt/i,
    message: "You do not have permission to do that.",
  },
  {
    test: /not found|pgrst116|0 rows/i,
    message: "We could not find that item.",
  },
  {
    test: /youtube|quota|api key|API_KEY/i,
    message: "We could not reach YouTube right now. Try again later.",
  },
  {
    test: /rate limit|too many/i,
    message: "You are doing that too quickly. Please wait and try again.",
  },
];

/** Known login `?error=` codes → friendly text. */
export const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Sign-in failed. Please try again.",
  auth_callback_failed: "Sign-in failed. Please try again.",
  google_unavailable:
    "Google sign-in is unavailable right now. Use email instead.",
};

export function loginErrorMessage(code: string | undefined | null): string | null {
  if (!code) return null;
  if (LOGIN_ERROR_MESSAGES[code]) return LOGIN_ERROR_MESSAGES[code];
  // Ignore free-text / injected query params
  if (/^[a-z0-9_-]{1,64}$/i.test(code)) {
    return "Something went wrong. Please try again.";
  }
  return null;
}

export function toUserError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const raw =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  if (!raw) return fallback;

  for (const { test, message } of AUTH_PATTERNS) {
    if (test.test(raw)) return message;
  }
  for (const { test, message } of GENERIC_PATTERNS) {
    if (test.test(raw)) return message;
  }

  // Already-friendly app messages (short, no infra jargon)
  if (
    raw.length <= 120 &&
    !/supabase|postgres|postgrest|stack|exception|sql|token|secret|key=/i.test(
      raw,
    )
  ) {
    return raw;
  }

  return fallback;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
