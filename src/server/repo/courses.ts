import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { CourseDetail, CourseSummary } from "@/shared/types";
import { toLessonRow } from "./mappers";

const { courses, lessons } = schema;

// Aggregates computed in SQL so the list stays one query regardless of course size.
const stats = {
  lessonCount: sql<number>`count(${lessons.id})`,
  completedCount: sql<number>`count(${lessons.completedAt})`,
  totalSec: sql<number>`coalesce(sum(${lessons.durationSec}), 0)`,
  newCount: sql<number>`coalesce(sum(${lessons.isNew}), 0)`,
  pendingNotes: sql<number>`coalesce(sum(case when ${lessons.summary} is null then 1 else 0 end), 0)`,
  transcriptsPending: sql<number>`coalesce(sum(case when ${lessons.transcriptStatus} = 'pending' then 1 else 0 end), 0)`,
};

const summaryQuery = () => {
  return db
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
    .groupBy(courses.id);
}

export const listCourses = (): CourseSummary[] => {
  // Pinned first, then your drag order, then newest.
  return summaryQuery()
    .orderBy(sql`${courses.pinned} desc`, asc(courses.sortOrder), sql`${courses.createdAt} desc`)
    .all();
}

export const findCourse = (token: string) => {
  return db.select().from(courses).where(eq(courses.token, token)).get();
}

export const findCourseByYoutubeId = (youtubeId: string) => {
  return db.select().from(courses).where(eq(courses.youtubeId, youtubeId)).get();
}

export const getCourseDetail = (token: string): CourseDetail | null => {
  const summary = summaryQuery().where(eq(courses.token, token)).get();
  if (!summary) return null;
  const rows = db
    .select()
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.token, token))
    .orderBy(asc(lessons.position))
    .all();
  return { ...summary, lessons: rows.map((r) => toLessonRow(r.lessons)) };
}

export const deleteCourse = (token: string) => {
  return db.delete(courses).where(eq(courses.token, token)).run().changes > 0;
}

/** Opening a course clears its "new" badges. */
export const markCourseSeen = (courseId: number) => {
  db.update(lessons).set({ isNew: false }).where(eq(lessons.courseId, courseId)).run();
}
