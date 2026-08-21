"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProgress } from "@/lib/progress";
import { lessons } from "@/lib/timezones";

export default function ProgressPage() {
  const [lessonIndex, setLessonIndex] = useState<number | null>(null);

  useEffect(() => {
    // Reading progress requires the browser (localStorage), so this must
    // run post-mount rather than during the lazy initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLessonIndex(getProgress().currentLessonIndex);
  }, []);

  const total = lessons.length;
  const completed = lessonIndex === null ? 0 : lessonIndex;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-6 py-24 text-center">
      <p className="text-xs tracking-widest text-muted uppercase">
        Your Progress
      </p>
      <h1 className="text-3xl font-bold">
        {lessonIndex === null
          ? "Loading..."
          : `Lesson ${lessonIndex + 1} of ${total}`}
      </h1>

      <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-muted">
        Progress is currently stored on this device only.
      </p>

      <Link
        href="/learn"
        className="mt-4 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
      >
        Continue learning
      </Link>
    </div>
  );
}
