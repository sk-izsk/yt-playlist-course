import type { LessonRow } from "@/shared/types";

export interface PlanDay {
  index: number;
  lessons: LessonRow[];
  totalSec: number;
  done: boolean;
}

/**
 * Greedy split: fill each day up to the budget; a lesson longer than the budget gets its own day.
 * ponytail: ignores partial watching — a 40m lesson in a 30m day still counts as one day.
 */
export const splitIntoDays = (lessons: LessonRow[], minutesPerDay: number): PlanDay[] => {
  const budget = minutesPerDay * 60;
  const days: PlanDay[] = [];
  let cur: LessonRow[] = [];
  let sum = 0;

  const flush = () => {
    if (!cur.length) return;
    days.push({ index: days.length, lessons: cur, totalSec: sum, done: cur.every((l) => l.completed) });
    cur = [];
    sum = 0;
  };

  for (const l of lessons) {
    if (cur.length && sum + l.durationSec > budget) flush();
    cur.push(l);
    sum += l.durationSec;
  }
  flush();
  return days;
};

/** "Today" = the first day with unfinished lessons. */
export const todayIndex = (days: PlanDay[]) => {
  const i = days.findIndex((d) => !d.done);
  return i === -1 ? Math.max(0, days.length - 1) : i;
};
