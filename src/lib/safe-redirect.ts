/**
 * Allow only same-site relative paths. Rejects protocol-relative (`//evil.com`)
 * and backslash tricks.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;

  let path = value.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://")) return fallback;
  if (path.includes("\\")) return fallback;
  if (/[\x00-\x1f\x7f]/.test(path)) return fallback;

  return path;
}
