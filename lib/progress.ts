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
}

const DEFAULT_PROGRESS: ProgressState = {
  currentLessonIndex: 0,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidProgressState(value: unknown): value is ProgressState {
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
    if (!isValidProgressState(parsed)) {
      return DEFAULT_PROGRESS;
    }

    return parsed;
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
