"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimeZoneLesson } from "@/lib/timezones";

interface LessonCardProps {
  lesson: TimeZoneLesson;
  direction: 1 | -1;
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
    <div className="relative min-h-[22rem] w-full max-w-xl overflow-hidden">
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
            <h2 className="mt-2 text-3xl font-bold">{lesson.city}</h2>
            <p className="mt-1 font-mono text-sm text-muted">
              {lesson.timeZone}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-4xl font-bold text-accent tabular-nums">
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
