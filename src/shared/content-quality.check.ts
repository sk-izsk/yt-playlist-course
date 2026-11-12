// Self-check for the notes quality guard: `bunx tsx src/shared/content-quality.check.ts`
import assert from "node:assert/strict";
import type { LessonContent } from "./content-schema";
import { qualityIssues } from "./content-quality";

const ctx = {
  startSec: 0,
  endSec: 1000,
  segmentStarts: [0, 120, 200, 333, 400, 517, 600, 742, 800, 901],
  otherSummaries: [],
  otherAnswerOrders: [],
};
const has = (issues: string[], word: string) => issues.some((i) => i.includes(word));
const q = (answerIndex: number, options: string[], atSec?: number) => ({
  question: "Why?",
  options,
  answerIndex,
  atSec,
});
const points = (ts: number[]) =>
  `Hook.\n\n## Important points\n${ts.map((t, i) => `- **T${i}**: idea number ${i} [x](#t=${t})`).join("\n")}`;

const good: LessonContent = {
  kind: "core",
  summary: points([120, 333, 517, 742]),
  practice: [],
  quiz: [
    q(1, ["no", "yes it is", "nope"], 120),
    q(2, ["a much longer wrong one", "b", "c"], 333),
    q(0, ["right", "wrong", "wrong too"], 901),
  ],
};
assert.deepEqual(qualityIssues(good, ctx), []);

// Template output: all answers at A, longest always right, grid timestamps, options copied from bullets.
const lazy: LessonContent = {
  ...good,
  summary: points([200, 400, 600, 800]),
  quiz: [q(0, ["idea number 0", "b", "c"]), q(0, ["idea number 1", "x", "y"]), q(0, ["idea number 2", "z", "w"])],
};
const issues = qualityIssues(lazy, ctx);
assert.ok(has(issues, "every correct answer"), "same answer position");
assert.ok(has(issues, "longest"), "longest option always right");
assert.ok(has(issues, "grid"), "timestamps on a grid");
assert.ok(has(issues, "copied"), "options copied from bullets");

assert.ok(has(qualityIssues(good, { ...ctx, endSec: 500 }), "outside"), "timestamp past the end");
assert.ok(has(qualityIssues(good, { ...ctx, segmentStarts: [0] }), "no transcript line"), "unmatched timestamp");
const filler = "\n\nFirst identify the inputs, then check each intermediate result before trusting the final answer.";
const withFiller = { ...good, summary: good.summary + filler };
assert.ok(has(qualityIssues(withFiller, { ...ctx, otherSummaries: [filler] }), "another lesson"), "reused sentence");
assert.ok(has(qualityIssues(good, { ...ctx, otherAnswerOrders: ["1,2,0", "1,2,0"] }), "answer order"), "reused order");
assert.deepEqual(qualityIssues(good, { ...ctx, otherAnswerOrders: ["1,2,0"] }), []); // one reuse is chance
// 4+ questions: the longest option may be right in at most half of them.
const rightIsLongest = q(0, ["the right answer, written out in full", "wrong", "wrong too", "nope"]);
const rightIsShort = q(0, ["right", "a wrong answer that is much longer", "wrong too", "nope"]);
const four = (longCount: number) => ({
  ...good,
  quiz: [0, 1, 2, 3].map((i) => (i < longCount ? rightIsLongest : rightIsShort)),
});
assert.ok(has(qualityIssues(four(3), ctx), "longest in 3 of 4"), "3 of 4 longest fails");
assert.ok(!has(qualityIssues(four(2), ctx), "longest"), "2 of 4 longest passes");
assert.deepEqual(qualityIssues({ ...lazy, kind: "light" }, ctx), []); // light lessons are exempt
console.log("content-quality ok");
