import { headers } from "next/headers";

/**
 * Origin for auth redirects: prefer the request host so local and Vercel
 * each get the right callback URL even if NEXT_PUBLIC_SITE_URL is stale.
 */
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

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
