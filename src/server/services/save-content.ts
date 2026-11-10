import { lessonContentSchema } from "@/shared/content-schema";
import { findLesson } from "../repo/lessons";
import { replaceLessonContent } from "../repo/lesson-content";

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

  replaceLessonContent(lesson.id, parsed.data);
  return { kind: parsed.data.kind, practice: parsed.data.practice.length, quiz: parsed.data.quiz.length };
};
