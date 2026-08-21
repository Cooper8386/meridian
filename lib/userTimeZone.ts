import { lessons } from "@/lib/timezones";

/**
 * Detects the browser's IANA time zone. This is the fallback used
 * whenever the user hasn't set an explicit override (see
 * ProgressState.timeZoneOverride in lib/progress.ts).
 *
 * Practice mode uses this to generate conversion prompts against the
 * user's own time zone.
 */
export function detectBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Lists IANA time zones for the override picker on /progress.
 * `Intl.supportedValuesOf` isn't guaranteed everywhere (older engines),
 * so this falls back to the zones already used by the 24 lessons plus
 * UTC — a smaller but always-available list.
 */
export function listAvailableTimeZones(): string[] {
  try {
    const supported = Intl.supportedValuesOf("timeZone");
    if (supported.length > 0) {
      return supported;
    }
  } catch {
    // Fall through to the curated fallback below.
  }

  const fallback = new Set(["Etc/UTC", ...lessons.map((lesson) => lesson.timeZone)]);
  return Array.from(fallback).sort();
}
