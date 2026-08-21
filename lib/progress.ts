/**
 * Progress module — the single place that reads and writes user progress.
 *
 * v1 backend: localStorage, unkeyed (single anonymous local user).
 * Planned v2 backend: Supabase, keyed by authenticated user id.
 *
 * No component or page may touch localStorage directly. Everything goes
 * through getProgress() / saveProgress() so the storage backend can be
 * swapped for Supabase later without changing any call site.
 */

const STORAGE_KEY = "meridian:progress:v1";

export interface ProgressState {
  currentLessonIndex: number;
  /**
   * IANA time zone the user has explicitly chosen, overriding the
   * browser-detected one from lib/userTimeZone.ts. null means "use the
   * detected time zone." Not surfaced in any settings UI yet — Practice
   * mode will need it, so the storage is in place ahead of that UI.
   */
  timeZoneOverride: string | null;
}

const DEFAULT_PROGRESS: ProgressState = {
  currentLessonIndex: 0,
  timeZoneOverride: null,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function hasValidLessonIndex(value: unknown): value is { currentLessonIndex: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "currentLessonIndex" in value &&
    typeof (value as { currentLessonIndex: unknown }).currentLessonIndex ===
      "number"
  );
}

export function getProgress(): ProgressState {
  if (!isBrowser()) {
    return DEFAULT_PROGRESS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PROGRESS;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!hasValidLessonIndex(parsed)) {
      return DEFAULT_PROGRESS;
    }

    // Merge over defaults so fields added after a user's first visit
    // (e.g. timeZoneOverride) come back populated instead of undefined.
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(state: ProgressState): void {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (e.g. private browsing quota). Fail silently.
  }
}

export function updateProgress(
  partial: Partial<ProgressState>,
): ProgressState {
  const next = { ...getProgress(), ...partial };
  saveProgress(next);
  return next;
}
