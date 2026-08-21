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

/**
 * Dispatched on `window` after every successful save. NavBar is a
 * persistent layout component (mounted once, not remounted on client-side
 * navigation) that reads progress in a mount-only effect — without this
 * event, changes made on /progress (e.g. the time zone override) wouldn't
 * show up in the nav clock until a full page reload.
 */
export const PROGRESS_UPDATED_EVENT = "meridian:progress-updated";

export interface ProgressState {
  currentLessonIndex: number;
  /**
   * IANA time zone the user has explicitly chosen, overriding the
   * browser-detected one from lib/userTimeZone.ts. null means "use the
   * detected time zone." Set via the picker on /progress.
   */
  timeZoneOverride: string | null;
  /** Best-ever correct streak in Practice mode. */
  practiceBestStreak: number;
  /** Lifetime count of Practice mode questions answered. */
  practiceTotalAnswered: number;
  /** Lifetime count of Practice mode questions answered correctly. */
  practiceTotalCorrect: number;
}

const DEFAULT_PROGRESS: ProgressState = {
  currentLessonIndex: 0,
  timeZoneOverride: null,
  practiceBestStreak: 0,
  practiceTotalAnswered: 0,
  practiceTotalCorrect: 0,
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
    window.dispatchEvent(new CustomEvent(PROGRESS_UPDATED_EVENT));
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
