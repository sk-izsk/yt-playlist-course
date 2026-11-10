import { lessonContentSchema } from "@/shared/content-schema";
import { qualityIssues } from "@/shared/content-quality";
import { findLesson, lessonsOfCourse } from "../repo/lessons";
import { getTranscript, replaceLessonContent } from "../repo/lesson-content";

/**
 * Validates agent-written JSON and stores it. Throws a readable error listing every problem.
 * Refuses to overwrite a lesson that already has notes unless `force` — finished work is never redone by accident.
 */
export const saveLessonContent = (token: string, raw: unknown, opts: { force?: boolean } = {}) => {
  const lesson = findLesson(token);
  if (!lesson) throw new Error(`Unknown lesson ${token}`);
  if (lesson.summary && !opts.force) {
    throw new Error(`Lesson ${token} already has notes. Re-run with --force only if the user asked to redo it.`);
  }

  const parsed = lessonContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid content for ${token}:\n${issues.join("\n")}`);
  }

  // Template-shaped notes (all answers at A, grid timestamps, reused filler) are refused even with --force.
  const startSec = lesson.startSec ?? 0;
  const issues = qualityIssues(parsed.data, {
    startSec,
    endSec: lesson.endSec ?? startSec + lesson.durationSec,
    segmentStarts: (getTranscript(lesson.id)?.segments ?? []).map(([sec]) => sec),
    otherSummaries: lessonsOfCourse(lesson.courseId).flatMap((l) => (l.id !== lesson.id && l.summary ? [l.summary] : [])),
  });
  if (issues.length) {
    throw new Error(`Notes for ${token} look template-generated; fix and save again:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
  }

  replaceLessonContent(lesson.id, parsed.data);
  return { kind: parsed.data.kind, practice: parsed.data.practice.length, quiz: parsed.data.quiz.length };
};
