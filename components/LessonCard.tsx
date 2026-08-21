"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimeZoneLesson } from "@/lib/timezones";

interface LessonCardProps {
  lesson: TimeZoneLesson;
  direction: 1 | -1;
}

function abbreviationSizeClass(abbreviation: string): string {
  if (abbreviation.length <= 4) return "text-6xl sm:text-7xl";
  if (abbreviation.length <= 8) return "text-4xl sm:text-5xl";
  return "text-3xl sm:text-4xl";
}

const variants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export default function LessonCard({ lesson, direction }: LessonCardProps) {
  return (
    <div className="relative min-h-[28rem] w-full max-w-xl overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={lesson.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-8"
        >
          <div>
            <p className="text-xs tracking-widest text-muted uppercase">
              {lesson.country}
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">
              {lesson.city}
            </h2>
            <p className="mt-1 font-mono text-sm text-muted">
              {lesson.timeZone}
            </p>

            <p
              className={`mt-4 font-display leading-none font-bold tracking-tight break-words ${abbreviationSizeClass(lesson.abbreviation)}`}
            >
              {lesson.abbreviation}
            </p>
          </div>

          <div className="mt-6">
            <p className="font-mono text-3xl font-bold text-accent tabular-nums sm:text-4xl">
              {lesson.utcOffset}
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground/90">
              {lesson.explanation}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
