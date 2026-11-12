import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, first, schema } from "../db/client";
import type { CourseDetail, CourseSummary } from "@/shared/types";
import { toLessonRow } from "./mappers";

const { courses, lessons } = schema;

// Aggregates computed in SQL so the list stays one query regardless of course size.
// Postgres returns count/sum as bigint/numeric strings, hence mapWith(Number).
const num = (q: ReturnType<typeof sql>) => sql<number>`${q}`.mapWith(Number);
const stats = {
  lessonCount: num(sql`count(${lessons.id})`),
  completedCount: num(sql`count(${lessons.completedAt})`),
  totalSec: num(sql`coalesce(sum(${lessons.durationSec}), 0)`),
  newCount: num(sql`count(*) filter (where ${lessons.isNew})`),
  pendingNotes: num(sql`count(${lessons.id}) filter (where ${lessons.summary} is null)`),
  transcriptsPending: num(sql`count(*) filter (where ${lessons.transcriptStatus} = 'pending')`),
};

const summaryQuery = () =>
  db
    .select({
      token: courses.token,
      kind: courses.kind,
      youtubeId: courses.youtubeId,
      title: courses.title,
      channel: courses.channel,
      thumbnail: courses.thumbnail,
      lastSyncedAt: courses.lastSyncedAt,
      pinned: courses.pinned,
      availableUpdates: courses.availableUpdates,
      line: courses.line,
      ...stats,
    })
    .from(courses)
    .leftJoin(lessons, eq(lessons.courseId, courses.id))
    .groupBy(courses.id)
    .$dynamic();

/** Courses not in the trash. Every read and write goes through this; only repo/trash.ts sees deleted ones. */
export const live = isNull(courses.deletedAt);
/** Lessons whose course is not in the trash. */
export const liveLesson = inArray(lessons.courseId, db.select({ id: courses.id }).from(courses).where(live));

export const listCourses = (): Promise<CourseSummary[]> =>
  // Pinned first, then your drag order, then newest.
  summaryQuery()
    .where(live)
    .orderBy(sql`${courses.pinned} desc`, asc(courses.sortOrder), sql`${courses.createdAt} desc`);

export const findCourse = (token: string) =>
  first(db.select().from(courses).where(and(eq(courses.token, token), live)).limit(1));

export const findCourseById = (id: number) =>
  first(db.select().from(courses).where(and(eq(courses.id, id), live)).limit(1));

export const findCourseByYoutubeId = (youtubeId: string) =>
  first(db.select().from(courses).where(eq(courses.youtubeId, youtubeId)).limit(1));

export const getCourseDetail = async (token: string): Promise<CourseDetail | null> => {
  const summary = await first(summaryQuery().where(and(eq(courses.token, token), live)));
  if (!summary) return null;
  const rows = await db
    .select()
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.token, token))
    .orderBy(asc(lessons.position));
  return { ...summary, lessons: rows.map((r) => toLessonRow(r.lessons)) };
};

/** Moves a course to the trash (restorable for 7 days, see repo/trash.ts). */
export const deleteCourse = async (token: string) =>
  (
    await db
      .update(courses)
      .set({ deletedAt: Date.now() })
      .where(and(eq(courses.token, token), live))
      .returning({ id: courses.id })
  ).length > 0;

/** Opening a course clears its "new" badges. */
export const markCourseSeen = (courseId: number) =>
  db.update(lessons).set({ isNew: false }).where(eq(lessons.courseId, courseId));
