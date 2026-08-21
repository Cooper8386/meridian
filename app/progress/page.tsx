"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProgress, updateProgress, type ProgressState } from "@/lib/progress";
import { lessons } from "@/lib/timezones";
import { detectBrowserTimeZone, listAvailableTimeZones } from "@/lib/userTimeZone";

const AUTO_DETECT_VALUE = "auto";

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [detectedZone, setDetectedZone] = useState<string | null>(null);
  const [timeZoneOptions, setTimeZoneOptions] = useState<string[]>([]);

  useEffect(() => {
    // Reading progress/detecting the browser's zone requires the browser,
    // so this must run post-mount rather than during the lazy initial
    // state, to avoid a server/client render mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(getProgress());
    setDetectedZone(detectBrowserTimeZone());
    setTimeZoneOptions(listAvailableTimeZones());
  }, []);

  const handleTimeZoneChange = (value: string) => {
    const timeZoneOverride = value === AUTO_DETECT_VALUE ? null : value;
    setProgress(updateProgress({ timeZoneOverride }));
  };

  const total = lessons.length;
  const completed = progress === null ? 0 : progress.currentLessonIndex;
  const percent = Math.round((completed / total) * 100);

  const accuracy =
    progress && progress.practiceTotalAnswered > 0
      ? Math.round(
          (progress.practiceTotalCorrect / progress.practiceTotalAnswered) * 100,
        )
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-12 px-6 py-24 text-center">
      <div className="flex w-full flex-col items-center gap-6">
        <p className="text-xs tracking-widest text-muted uppercase">
          Learn Progress
        </p>
        <h1 className="text-3xl font-bold">
          {progress === null
            ? "Loading..."
            : `Lesson ${completed + 1} of ${total}`}
        </h1>

        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <Link
          href="/learn"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Continue learning
        </Link>
      </div>

      <div className="flex w-full flex-col items-center gap-6 border-t border-surface-border pt-12">
        <p className="text-xs tracking-widest text-muted uppercase">
          Practice Stats
        </p>

        <div className="grid w-full max-w-md grid-cols-3 gap-4 font-mono">
          <div className="rounded-lg border border-surface-border p-4">
            <p className="text-2xl font-bold text-accent">
              {progress?.practiceBestStreak ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">Best streak</p>
          </div>
          <div className="rounded-lg border border-surface-border p-4">
            <p className="text-2xl font-bold text-accent">
              {accuracy === null ? "—" : `${accuracy}%`}
            </p>
            <p className="mt-1 text-xs text-muted">Accuracy</p>
          </div>
          <div className="rounded-lg border border-surface-border p-4">
            <p className="text-2xl font-bold text-accent">
              {progress?.practiceTotalAnswered ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">Answered</p>
          </div>
        </div>

        <Link
          href="/practice"
          className="rounded-lg border border-surface-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground"
        >
          Go to Practice mode
        </Link>
      </div>

      <div className="flex w-full flex-col items-center gap-3 border-t border-surface-border pt-12">
        <p className="text-xs tracking-widest text-muted uppercase">
          Your Time Zone
        </p>
        <p className="max-w-sm text-sm text-muted">
          Used for Practice mode questions that compare your local time to
          other zones. Auto-detected as{" "}
          <span className="font-mono text-foreground/80">
            {detectedZone ?? "..."}
          </span>{" "}
          unless overridden below.
        </p>

        <select
          value={progress?.timeZoneOverride ?? AUTO_DETECT_VALUE}
          onChange={(event) => handleTimeZoneChange(event.target.value)}
          disabled={progress === null}
          className="w-full max-w-sm rounded-lg border border-surface-border bg-surface px-4 py-3 font-mono text-sm text-foreground"
        >
          <option value={AUTO_DETECT_VALUE}>
            Auto-detect ({detectedZone ?? "..."})
          </option>
          {timeZoneOptions.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      <p className="text-sm text-muted">
        Progress is currently stored on this device only.
      </p>
    </div>
  );
}
