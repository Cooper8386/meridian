/**
 * Detects the browser's IANA time zone. This is the fallback used
 * whenever the user hasn't set an explicit override (see
 * ProgressState.timeZoneOverride in lib/progress.ts).
 *
 * Practice mode (not yet built) will need to know the user's own time
 * zone to generate conversion prompts; this detection is wired up now so
 * that storage and UI can build on top of it later.
 */
export function detectBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}
