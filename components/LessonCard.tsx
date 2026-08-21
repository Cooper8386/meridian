"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatTimeInZone, type TimeZoneLesson } from "@/lib/timezones";

interface LessonCardProps {
  lesson: TimeZoneLesson;
  direction: 1 | -1;
}

function abbreviationSizeClass(abbreviation: string): string {
  if (abbreviation.length <= 4) return "text-7xl sm:text-8xl";
  if (abbreviation.length <= 8) return "text-5xl sm:text-6xl";
  return "text-4xl sm:text-5xl";
}

function offsetSizeClass(offset: string): string {
  if (offset.length <= 10) return "text-4xl sm:text-5xl";
  if (offset.length <= 18) return "text-3xl sm:text-4xl";
  return "text-2xl sm:text-3xl";
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
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Sets the initial reading post-mount to avoid a server/client render
    // mismatch, then subscribes to a ticking interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[34rem] w-full max-w-3xl overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={lesson.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-10"
        >
          <div>
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs tracking-widest text-muted uppercase">
                  {lesson.country}
                </p>
                <h2 className="mt-2 font-display text-4xl font-bold">
                  {lesson.city}
                </h2>
                <p className="mt-1 font-mono text-sm text-muted">
                  {lesson.timeZone}
                </p>
              </div>

              <div className="shrink-0 rounded-lg border border-surface-border px-3 py-2 text-right">
                <p className="text-[10px] tracking-widest text-muted uppercase">
                  Right now
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {now ? formatTimeInZone(lesson.timeZone, now) : "--:--"}
                </p>
              </div>
            </div>

            <p
              className={`mt-6 font-display leading-none font-bold tracking-tight break-words ${abbreviationSizeClass(lesson.abbreviation)}`}
            >
              {lesson.abbreviation}
            </p>
          </div>

          <div className="mt-6">
            <p
              className={`font-mono font-bold text-accent tabular-nums ${offsetSizeClass(lesson.utcOffset)}`}
            >
              {lesson.utcOffset}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/90">
              {lesson.explanation}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
