"use client";

import { motion } from "framer-motion";
import type { PracticeQuestion } from "@/lib/practice";

interface PracticeQuestionCardProps {
  question: PracticeQuestion;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

const DIFFICULTY_LABEL: Record<PracticeQuestion["difficulty"], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

function optionClassName(
  option: string,
  question: PracticeQuestion,
  selectedAnswer: string | null,
): string {
  const base =
    "rounded-lg border px-4 py-3 text-left font-mono text-sm font-semibold transition-colors";

  if (selectedAnswer === null) {
    return `${base} border-surface-border text-foreground hover:border-foreground cursor-pointer`;
  }

  const isCorrectOption = option === question.correctAnswer;
  const isSelectedOption = option === selectedAnswer;

  if (isCorrectOption) {
    return `${base} border-accent bg-accent/10 text-accent`;
  }
  if (isSelectedOption) {
    return `${base} border-red-500 bg-red-500/10 text-red-400`;
  }
  return `${base} border-surface-border text-muted opacity-60`;
}

export default function PracticeQuestionCard({
  question,
  selectedAnswer,
  onSelect,
}: PracticeQuestionCardProps) {
  return (
    <div className="w-full max-w-2xl">
      {/*
       * Deliberately NOT AnimatePresence/mode="wait" here: Practice mode
       * lets the user answer and advance as fast as they like, and
       * AnimatePresence's coordinated exit-then-enter gets stuck if a new
       * `key` arrives before the previous exit finishes (the same failure
       * mode noted on Globe's city-label hover animation, see
       * components/Globe.tsx). A plain keyed motion.div still gets its
       * `initial`/`animate` entrance transition on every mount — it just
       * doesn't wait for anything to exit first.
       */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex flex-col gap-6 rounded-2xl border border-surface-border bg-surface p-8"
      >
        <p className="text-xs tracking-widest text-muted uppercase">
          {DIFFICULTY_LABEL[question.difficulty]}
        </p>

        <p className="font-display text-2xl font-bold text-balance">
          {question.prompt}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={selectedAnswer !== null}
              onClick={() => onSelect(option)}
              className={optionClassName(option, question, selectedAnswer)}
            >
              {option}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
