"use client";

import { useEffect, useState } from "react";
import LessonCard from "@/components/LessonCard";
import { getProgress, updateProgress } from "@/lib/progress";
import { playNextSound, playPrevSound } from "@/lib/sound";
import { lessons } from "@/lib/timezones";

function clampIndex(index: number): number {
  if (index < 0) return 0;
  if (index > lessons.length - 1) return lessons.length - 1;
  return index;
}

export default function LearnPage() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Reading progress requires the browser (localStorage), so this must
    // run post-mount rather than during the lazy initial state to avoid a
    // server/client render mismatch.
    const stored = getProgress();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLessonIndex(clampIndex(stored.currentLessonIndex));
    setIsHydrated(true);
  }, []);

  const goToLesson = (nextIndex: number, dir: 1 | -1) => {
    const clamped = clampIndex(nextIndex);
    setDirection(dir);
    setLessonIndex(clamped);
    updateProgress({ currentLessonIndex: clamped });
  };

  const handleNext = () => {
    if (lessonIndex >= lessons.length - 1) return;
    playNextSound();
    goToLesson(lessonIndex + 1, 1);
  };

  const handlePrevious = () => {
    if (lessonIndex <= 0) return;
    playPrevSound();
    goToLesson(lessonIndex - 1, -1);
  };

  if (!isHydrated) {
    return null;
  }

  const currentLesson = lessons[lessonIndex];
  const isFirst = lessonIndex === 0;
  const isLast = lessonIndex === lessons.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-xs tracking-widest text-muted uppercase">
          Time, Space, and Context
        </p>
        <h1 className="mt-2 text-3xl font-bold">Learn the time zones</h1>
      </div>

      <p className="font-mono text-sm text-muted">
        Lesson {lessonIndex + 1} of {lessons.length}
      </p>

      <LessonCard lesson={currentLesson} direction={direction} />

      <div className="flex w-full max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirst}
          className="rounded-lg border border-surface-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-surface-border"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={isLast}
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
