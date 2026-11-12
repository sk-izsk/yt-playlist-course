import type { LessonDetail } from "@/shared/types";
import { toLessonRow } from "./mappers";
import { findCourseById } from "./courses";
import { findLesson, lessonsOfCourse } from "./lessons";
import { notesOf, practiceOf, quizOf } from "./lesson-content";

/** Everything the lesson page needs in one payload. */
export const getLessonDetail = async (token: string): Promise<LessonDetail | null> => {
  const lesson = await findLesson(token);
  if (!lesson) return null;

  const [course, siblings, practice, quiz, notes] = await Promise.all([
    findCourseById(lesson.courseId),
    lessonsOfCourse(lesson.courseId),
    practiceOf(lesson.id),
    quizOf(lesson.id),
    notesOf(lesson.id),
  ]);
  const idx = siblings.findIndex((l) => l.id === lesson.id);

  return {
    ...toLessonRow(lesson),
    startSec: lesson.startSec,
    endSec: lesson.endSec,
    summary: lesson.summary,
    course: { token: course!.token, title: course!.title, channel: course!.channel, line: course!.line },
    prevToken: siblings[idx - 1]?.token ?? null,
    nextToken: siblings[idx + 1]?.token ?? null,
    practice,
    quiz,
    notes,
  };
};
