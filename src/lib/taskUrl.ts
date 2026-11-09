/**
 * Task URL & Code Helper Utilities
 */

/**
 * Normalizes task code to standard uppercase trimmed format (e.g. " st-12 " -> "ST-12").
 */
export function normalizeTaskCode(rawCode?: string | null): string {
  if (!rawCode) return "";
  return rawCode.trim().toUpperCase();
}

/**
 * Validates whether string conforms to standard Jira/STsup code pattern (e.g. "ST-1", "CORE-42", "PRJ_1-99").
 */
export function isValidTaskCode(code?: string | null): boolean {
  if (!code) return false;
  const normalized = normalizeTaskCode(code);
  // Key consists of uppercase alphanumeric/underscore characters followed by a hyphen and a positive integer
  return /^[A-Z0-9_]+-\d+$/.test(normalized);
}

/**
 * Returns canonical relative path to the task browse route.
 */
export function getCanonicalTaskPath(code: string): string {
  return `/browse/${normalizeTaskCode(code)}`;
}

/**
 * Returns canonical full URL for a task code.
 */
export function getCanonicalTaskUrl(code: string, origin?: string): string {
  const path = getCanonicalTaskPath(code);
  if (!origin) return path;
  // Ensure no double slashes if origin ends with a slash
  const cleanOrigin = origin.replace(/\/+$/, "");
  return `${cleanOrigin}${path}`;
}
