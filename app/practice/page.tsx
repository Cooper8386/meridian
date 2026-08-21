"use client";

import { useEffect, useState } from "react";
import PracticeQuestionCard from "@/components/PracticeQuestionCard";
import { generatePracticeQuestion, type PracticeQuestion } from "@/lib/practice";
import { getProgress, updateProgress } from "@/lib/progress";
import { detectBrowserTimeZone } from "@/lib/userTimeZone";

export default function PracticePage() {
  const [localTimeZone, setLocalTimeZone] = useState<string | null>(null);
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  useEffect(() => {
    // Reading progress/detecting the browser's zone requires the browser,
    // so this must run post-mount rather than during the lazy initial
    // state, to avoid a server/client render mismatch.
    const progress = getProgress();
    const zone = progress.timeZoneOverride ?? detectBrowserTimeZone();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalTimeZone(zone);
    setQuestion(generatePracticeQuestion(zone));
  }, []);

  const handleSelect = (answer: string) => {
    if (!question || selectedAnswer !== null) return;

    const isCorrect = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    setSessionTotal((prev) => prev + 1);

    const nextStreak = isCorrect ? sessionStreak + 1 : 0;
    setSessionStreak(nextStreak);
    if (isCorrect) {
      setSessionCorrect((prev) => prev + 1);
    }

    const current = getProgress();
    updateProgress({
      practiceTotalAnswered: current.practiceTotalAnswered + 1,
      practiceTotalCorrect: current.practiceTotalCorrect + (isCorrect ? 1 : 0),
      practiceBestStreak: Math.max(current.practiceBestStreak, nextStreak),
    });
  };

  const handleNext = () => {
    if (!localTimeZone) return;
    setSelectedAnswer(null);
    setQuestion(generatePracticeQuestion(localTimeZone));
  };

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-xs tracking-widest text-muted uppercase">
          Time zone conversion drills
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">
          Practice mode
        </h1>
      </div>

      <div className="flex items-center gap-6 font-mono text-sm text-muted">
        <span>
          Streak <span className="font-bold text-accent">{sessionStreak}</span>
        </span>
        <span>
          {sessionCorrect}/{sessionTotal} this session
        </span>
      </div>

      <PracticeQuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        onSelect={handleSelect}
      />

      <button
        type="button"
        onClick={handleNext}
        disabled={selectedAnswer === null}
        className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next question
      </button>
    </div>
  );
}
