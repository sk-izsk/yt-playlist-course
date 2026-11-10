import { and, asc, eq, isNull, max } from "drizzle-orm";
import { db, schema } from "../db/client";
import { newId } from "../tokens";

const { lessons, courses } = schema;

export interface LessonDraft {
  videoId: string;
  title: string;
  durationSec: number;
  thumbnail: string;
  startSec?: number;
  endSec?: number;
}

export const findLesson = (token: string) => {
  return db.select().from(lessons).where(eq(lessons.token, token)).get();
}

export const lessonsOfCourse = (courseId: number) => {
  return db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(asc(lessons.position)).all();
}

export const maxPosition = (courseId: number): number => {
  const row = db.select({ m: max(lessons.position) }).from(lessons).where(eq(lessons.courseId, courseId)).get();
  return row?.m ?? 0;
}

/** Appends drafts after `afterPosition`, each with a fresh UUID. */
export const insertLessons = (
  course: { id: number },
  drafts: LessonDraft[],
  opts: { afterPosition?: number; isNew?: boolean } = {},
) => {
  const start = opts.afterPosition ?? 0;
  if (!drafts.length) return [];
  return db
    .insert(lessons)
    .values(
      drafts.map((d, i) => ({
        ...d,
        courseId: course.id,
        position: start + i + 1,
        token: newId(),
        isNew: opts.isNew ?? false,
      })),
    )
    .returning()
    .all();
}

export const setCompleted = (token: string, done: boolean) => {
  return db
    .update(lessons)
    .set({ completedAt: done ? Date.now() : null })
    .where(eq(lessons.token, token))
    .run().changes > 0;
}

/** Lessons still waiting for an agent to write notes, optionally scoped to one course. */
export const pendingLessons = (courseToken?: string) => {
  const where = courseToken
    ? and(isNull(lessons.summary), eq(courses.token, courseToken))
    : isNull(lessons.summary);
  return db
    .select({
      token: lessons.token,
      position: lessons.position,
      title: lessons.title,
      transcript: lessons.transcriptStatus,
      course: courses.title,
    })
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(where)
    .orderBy(asc(courses.id), asc(lessons.position))
    .all();
}
