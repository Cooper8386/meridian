/**
 * Practice mode question generation.
 *
 * Pure computation only — no localStorage here (that stays in
 * lib/progress.ts). Every question is built against a single `now` so a
 * question's "given" time and its correct answer always describe the same
 * instant, using the same offset/formatting helpers the Learn mode lesson
 * cards use (lib/timezones.ts).
 */

import {
  formatTimeInZone,
  getOffsetLabel,
  lessons,
  type TimeZoneLesson,
} from "@/lib/timezones";

export type QuestionType = "local-vs-other" | "random-pair" | "zone-to-utc";
export type Difficulty = "easy" | "medium" | "hard";

export interface PracticeQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

interface ZoneInfo {
  timeZone: string;
  city: string;
  country: string;
  abbreviation: string;
}

const QUESTION_TYPES: QuestionType[] = [
  "local-vs-other",
  "random-pair",
  "zone-to-utc",
];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// Multiples of 30 minutes within +/-2 hours, excluding 0 (the correct answer).
const TIME_SHIFT_MINUTES = [-120, -90, -60, -30, 30, 60, 90, 120];
const SYNTHETIC_OFFSET_SHIFT_MINUTES = [60, -60, 30, -30, 90, -90];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomDistinct<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function lessonToZoneInfo(lesson: TimeZoneLesson): ZoneInfo {
  return {
    timeZone: lesson.timeZone,
    city: lesson.city,
    country: lesson.country,
    abbreviation: lesson.abbreviation,
  };
}

// Derives a human label from the IANA zone id itself (e.g.
// "Asia/Kuala_Lumpur" -> "Kuala Lumpur") since the user's own zone has no
// curated city/country entry the way the 24 lessons do.
function parseZoneLocationLabel(timeZone: string): string {
  const segments = timeZone.split("/");
  const last = segments[segments.length - 1] ?? timeZone;
  return last.replace(/_/g, " ");
}

function getLiveAbbreviation(timeZone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    const tzPart = parts.find((part) => part.type === "timeZoneName");
    return tzPart?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

function buildLocalZoneInfo(timeZone: string, date: Date): ZoneInfo {
  return {
    timeZone,
    city: parseZoneLocationLabel(timeZone),
    country: "",
    abbreviation: getLiveAbbreviation(timeZone, date),
  };
}

// The single place difficulty is applied, so every question type behaves
// consistently: easy shows city/country + zone, medium only the zone,
// hard only city/country.
function describeZone(zone: ZoneInfo, difficulty: Difficulty): string {
  const location = zone.country ? `${zone.city}, ${zone.country}` : zone.city;
  switch (difficulty) {
    case "easy":
      return `${location} (${zone.abbreviation})`;
    case "medium":
      return zone.abbreviation;
    case "hard":
      return location;
  }
}

function shiftClockTime(time: string, deltaMinutes: number): string {
  const [hoursStr, minutesStr] = time.split(":");
  const totalMinutes =
    (((Number(hoursStr) * 60 + Number(minutesStr) + deltaMinutes) % 1440) +
      1440) %
    1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildTimeOptions(correctTime: string): string[] {
  const distractors: string[] = [];
  for (const delta of shuffle(TIME_SHIFT_MINUTES)) {
    if (distractors.length >= 3) break;
    const candidate = shiftClockTime(correctTime, delta);
    if (candidate !== correctTime && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }
  return shuffle([correctTime, ...distractors]);
}

function shiftOffsetLabel(offset: string, deltaMinutes: number): string | null {
  const match = offset.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  const totalMinutes =
    sign * (Number(match[2]) * 60 + Number(match[3])) + deltaMinutes;
  const candidateSign = totalMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const minutes = String(absMinutes % 60).padStart(2, "0");
  return `UTC${candidateSign}${hours}:${minutes}`;
}

function buildOffsetOptions(
  correctOffset: string,
  pool: ZoneInfo[],
  now: Date,
): string[] {
  const distractors: string[] = [];

  for (const zone of shuffle(pool)) {
    if (distractors.length >= 3) break;
    const offset = getOffsetLabel(zone.timeZone, now);
    if (offset !== correctOffset && !distractors.includes(offset)) {
      distractors.push(offset);
    }
  }

  // Pool offsets may not yield 3 unique values (many zones share an
  // offset) — pad out with synthetic shifts of the correct answer.
  for (const delta of shuffle(SYNTHETIC_OFFSET_SHIFT_MINUTES)) {
    if (distractors.length >= 3) break;
    const candidate = shiftOffsetLabel(correctOffset, delta);
    if (candidate && candidate !== correctOffset && !distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }

  return shuffle([correctOffset, ...distractors]);
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildConversionQuestion(
  type: "local-vs-other" | "random-pair",
  difficulty: Difficulty,
  localTimeZone: string,
  now: Date,
): PracticeQuestion {
  let given: ZoneInfo;
  let asked: ZoneInfo;

  if (type === "local-vs-other") {
    const local = buildLocalZoneInfo(localTimeZone, now);
    const otherLessons = lessons.filter(
      (lesson) => lesson.timeZone !== localTimeZone,
    );
    const other = lessonToZoneInfo(pickRandom(otherLessons));
    [given, asked] = Math.random() < 0.5 ? [local, other] : [other, local];
  } else {
    const [first, second] = pickRandomDistinct(lessons, 2).map(
      lessonToZoneInfo,
    );
    given = first;
    asked = second;
  }

  const givenTime = formatTimeInZone(given.timeZone, now);
  const correctAnswer = formatTimeInZone(asked.timeZone, now);

  return {
    id: makeId(),
    type,
    difficulty,
    prompt: `If it's ${givenTime} in ${describeZone(given, difficulty)}, what time is it in ${describeZone(asked, difficulty)}?`,
    options: buildTimeOptions(correctAnswer),
    correctAnswer,
  };
}

function buildZoneToUtcQuestion(
  difficulty: Difficulty,
  localTimeZone: string,
  now: Date,
): PracticeQuestion {
  const pool: ZoneInfo[] = [
    buildLocalZoneInfo(localTimeZone, now),
    ...lessons.map(lessonToZoneInfo),
  ];
  const subject = pickRandom(pool);
  const correctAnswer = getOffsetLabel(subject.timeZone, now);
  const distractorPool = pool.filter(
    (zone) => zone.timeZone !== subject.timeZone,
  );

  return {
    id: makeId(),
    type: "zone-to-utc",
    difficulty,
    prompt: `What is the UTC offset for ${describeZone(subject, difficulty)}?`,
    options: buildOffsetOptions(correctAnswer, distractorPool, now),
    correctAnswer,
  };
}

export function generatePracticeQuestion(
  localTimeZone: string,
): PracticeQuestion {
  const type = pickRandom(QUESTION_TYPES);
  const difficulty = pickRandom(DIFFICULTIES);
  const now = new Date();

  if (type === "zone-to-utc") {
    return buildZoneToUtcQuestion(difficulty, localTimeZone, now);
  }
  return buildConversionQuestion(type, difficulty, localTimeZone, now);
}
