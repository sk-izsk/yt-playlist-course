import { lessonContentSchema } from "@/shared/content-schema";
import { qualityIssues } from "@/shared/content-quality";
import { shuffleQuiz } from "@/shared/shuffle-quiz";
import { findLesson, lessonsOfCourse } from "../repo/lessons";
import { getTranscript, quizOf, replaceLessonContent } from "../repo/lesson-content";

/**
 * Validates agent-written JSON and stores it. Throws a readable error listing every problem.
 * Refuses to overwrite a lesson that already has notes unless `force` — finished work is never redone by accident.
 */
export const saveLessonContent = async (token: string, raw: unknown, opts: { force?: boolean } = {}) => {
  const lesson = await findLesson(token);
  if (!lesson) throw new Error(`Unknown lesson ${token}`);
  if (lesson.summary && !opts.force) {
    throw new Error(`Lesson ${token} already has notes. Re-run with --force only if the user asked to redo it.`);
  }

  const parsed = lessonContentSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid content for ${token}:\n${issues.join("\n")}`);
  }

  const startSec = lesson.startSec ?? 0;
  const others = (await lessonsOfCourse(lesson.courseId)).filter((l) => l.id !== lesson.id);
  // ponytail: one quiz query per sibling lesson; fine for playlists of ~100, batch with inArray if it gets slow.
  const otherQuizzes = await Promise.all(others.map((l) => quizOf(l.id)));
  const otherAnswerOrders = otherQuizzes.map((qs) => qs.map((q) => q.answerIndex).join(",")).filter(Boolean);
  const transcript = await getTranscript(lesson.id);
  // Answer positions are code's job, not the agent's: shuffle so no habit (all A, C,A,D,B…) survives.
  const content = { ...parsed.data, quiz: shuffleQuiz(parsed.data.quiz, otherAnswerOrders) };

  // Template-shaped notes (grid timestamps, reused filler, copied options) are refused even with --force.
  const issues = qualityIssues(content, {
    startSec,
    endSec: lesson.endSec ?? startSec + lesson.durationSec,
    segmentStarts: (transcript?.segments ?? []).map(([sec]) => sec),
    otherSummaries: others.flatMap((l) => (l.summary ? [l.summary] : [])),
    otherAnswerOrders,
  });
  if (issues.length) {
    throw new Error(
      `Notes for ${token} look template-generated; fix and save again:\n${issues.map((i) => `  - ${i}`).join("\n")}`,
    );
  }

  await replaceLessonContent(lesson.id, content);
  return { kind: content.kind, practice: content.practice.length, quiz: content.quiz.length };
};
