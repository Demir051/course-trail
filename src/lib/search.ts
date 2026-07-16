/** Sanitize free-text before building PostgREST `.or()` / `.ilike` filters. */
export function sanitizeSearchTerm(value: string | null | undefined, max = 48) {
  return (value ?? "")
    .trim()
    .replace(/[%_,.()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, max);
}
