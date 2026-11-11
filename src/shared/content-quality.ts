import type { LessonContent } from "./content-schema";

/** What the checker needs to know about the lesson, besides the content itself. */
export interface QualityContext {
  /** Absolute video seconds the lesson covers (chapters of one long video have a window). */
  startSec: number;
  endSec: number;
  /** Start second of every transcript line; empty when there is no transcript. */
  segmentStarts: number[];
  /** Summaries already saved for the other lessons of the same course. */
  otherSummaries: string[];
  /** Correct-answer order of each other lesson's quiz, e.g. "2,0,3,1". */
  otherAnswerOrders: string[];
}

const TS = /\(#t=(\d+)\)/g;
const GRIDS = [0.2, 0.25];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sentences = (s: string) =>
  s
    .split(/(?<=[.!?])\s+|\n+/)
    .map(norm)
    .filter((x) => x.length >= 60);

/** "- **Term**: explanation [mm:ss](#t=…)" → "explanation", the text a lazy quiz copies as an option. */
const bulletBodies = (summary: string) =>
  [...summary.matchAll(/^\s*-\s+\*\*[^*]+\*\*:?\s*(.+)$/gm)].map((m) => norm(m[1].replace(/\[[^\]]*\]\([^)]*\)/g, "")));

/**
 * Catches the shortcuts of notes generated from a template instead of a transcript: every answer
 * at the same position or in one order reused across lessons, the longest option usually right,
 * timestamps on a 20%/25% grid or matching no transcript line, options copied from the summary,
 * sentences reused across lessons.
 * ponytail: these are tells, not proof of quality; shallow hand-written notes still pass.
 */
export const qualityIssues = (c: LessonContent, ctx: QualityContext): string[] => {
  if (c.kind !== "core") return [];
  const issues: string[] = [];
  const quiz = c.quiz;

  if (quiz.length >= 3 && new Set(quiz.map((q) => q.answerIndex)).size === 1) {
    issues.push(`quiz: every correct answer is option ${quiz[0].answerIndex}; spread them across positions`);
  }
  const order = quiz.map((q) => q.answerIndex).join(",");
  const sameOrder = ctx.otherAnswerOrders.filter((o) => o === order).length;
  if (quiz.length >= 3 && sameOrder >= 2) {
    issues.push(`quiz: answer order ${order} is already used by ${sameOrder} other lessons; reorder the options`);
  }
  const longestRight = quiz.filter((q) => {
    const len = q.options.map((o) => o.length);
    return len.every((l, i) => i === q.answerIndex || l < len[q.answerIndex]);
  }).length;
  // Positions are shuffled on save, so length is the giveaway left: allow it in at most half the questions.
  const longestLimit = quiz.length >= 4 ? Math.floor(quiz.length / 2) : quiz.length - 1;
  if (quiz.length >= 3 && longestRight > longestLimit) {
    issues.push(
      `quiz: the correct option is the longest in ${longestRight} of ${quiz.length} questions (max ${longestLimit}); make wrong options as long and specific`,
    );
  }

  const summaryTs = [...c.summary.matchAll(TS)].map((m) => Number(m[1]));
  const allTs = [...summaryTs, ...quiz.flatMap((q) => (q.atSec === undefined ? [] : [q.atSec]))];
  const outside = allTs.filter((t) => t < ctx.startSec - 5 || t > ctx.endSec + 5);
  if (outside.length) issues.push(`timestamps outside the video (${ctx.startSec}–${ctx.endSec}s): ${outside.join(", ")}`);

  if (ctx.segmentStarts.length) {
    const unmatched = allTs.filter((t) => !ctx.segmentStarts.some((s) => Math.abs(s - t) <= 3));
    if (unmatched.length) issues.push(`timestamps that match no transcript line (±3s): ${unmatched.join(", ")}`);
  }

  const span = ctx.endSec - ctx.startSec;
  if (span > 0 && summaryTs.length >= 4) {
    const onGrid = summaryTs.filter((t) => {
      const f = (t - ctx.startSec) / span;
      return f > 0.01 && GRIDS.some((g) => Math.abs(f - Math.round(f / g) * g) < 0.006);
    }).length;
    if (onGrid >= 3 && onGrid / summaryTs.length >= 0.75) {
      issues.push("summary: timestamps sit on a 20%/25% grid of the video; take each one from the transcript line that explains it");
    }
  }

  const bullets = new Set(bulletBodies(c.summary));
  const copied = quiz.flatMap((q) => q.options).filter((o) => bullets.has(norm(o)));
  if (copied.length) issues.push(`quiz: ${copied.length} option(s) copied word for word from "Important points"`);

  const seen = new Set(ctx.otherSummaries.flatMap(sentences));
  const reused = sentences(c.summary).filter((s) => seen.has(s));
  if (reused.length) issues.push(`summary: ${reused.length} sentence(s) already used in another lesson, e.g. "${reused[0].slice(0, 70)}…"`);

  return issues;
};
