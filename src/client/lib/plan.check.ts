// Self-check for the day planner: `bunx tsx src/client/lib/plan.check.ts`
import assert from "node:assert/strict";
import type { LessonRow } from "@/shared/types";
import { splitIntoDays, todayIndex } from "./plan";

const mk = (min: number, completed = false) => ({ durationSec: min * 60, completed }) as LessonRow;

const days = splitIntoDays([mk(20, true), mk(25), mk(30), mk(90), mk(10)], 60);
assert.deepEqual(
  days.map((d) => d.lessons.length),
  [2, 1, 1, 1],
); // 20+25 | 30 | 90 alone | 10
assert.equal(todayIndex(days), 0); // day 1 still has an unfinished lesson
assert.equal(todayIndex(splitIntoDays([mk(10, true)], 60)), 0); // all done → last day
console.log("plan ok");
