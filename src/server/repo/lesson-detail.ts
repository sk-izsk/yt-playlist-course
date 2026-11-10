import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { LessonDetail } from "@/shared/types";
import { toLessonRow } from "./mappers";
import { findLesson, lessonsOfCourse } from "./lessons";
import { notesOf, practiceOf, quizOf } from "./lesson-content";

/** Everything the lesson page needs in one payload. */
export const getLessonDetail = (token: string): LessonDetail | null => {
  const lesson = findLesson(token);
  if (!lesson) return null;

  const course = db.select().from(schema.courses).where(eq(schema.courses.id, lesson.courseId)).get()!;
  const siblings = lessonsOfCourse(lesson.courseId);
  const idx = siblings.findIndex((l) => l.id === lesson.id);

  return {
    ...toLessonRow(lesson),
    startSec: lesson.startSec,
    endSec: lesson.endSec,
    summary: lesson.summary,
    course: { token: course.token, title: course.title, channel: course.channel },
    prevToken: siblings[idx - 1]?.token ?? null,
    nextToken: siblings[idx + 1]?.token ?? null,
    practice: practiceOf(lesson.id),
    quiz: quizOf(lesson.id),
    notes: notesOf(lesson.id),
  };
}
