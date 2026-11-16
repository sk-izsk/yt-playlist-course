import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm"
import { db, first, schema } from "../db/client"
import type { AuthUser } from "../auth/tokens"
import type { CourseDetail, CourseSummary } from "@/shared/types"
import { toLessonRow } from "./mappers"

const { courses, lessons } = schema

// Aggregates computed in SQL so the list stays one query regardless of course size.
// Postgres returns count/sum as bigint/numeric strings, hence mapWith(Number).
const num = (q: ReturnType<typeof sql>) => sql<number>`${q}`.mapWith(Number)
const stats = {
  lessonCount: num(sql`count(${lessons.id})`),
  completedCount: num(sql`count(${lessons.completedAt})`),
  totalSec: num(sql`coalesce(sum(${lessons.durationSec}), 0)`),
  newCount: num(sql`count(*) filter (where ${lessons.isNew})`),
  pendingNotes: num(sql`count(${lessons.id}) filter (where ${lessons.summary} is null)`),
  transcriptsPending: num(sql`count(*) filter (where ${lessons.transcriptStatus} = 'pending')`),
}

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
    .$dynamic()

/** Courses not in the trash. Every read and write goes through this; only repo/trash.ts sees deleted ones. */
export const live = isNull(courses.deletedAt)
/** Lessons whose course is not in the trash. */
export const liveLesson = inArray(lessons.courseId, db.select({ id: courses.id }).from(courses).where(live))

/** Only the owner sees everything; visitors and read-only accounts get demo courses. */
/** Agent tokens and the CLI are the owner by definition: they see everything. */
export const OWNER: AuthUser = { id: 0, role: "owner", sid: "" }
export const isOwner = (user: AuthUser | null) => user?.role === "owner"
const visible = (user: AuthUser | null) => (isOwner(user) ? live : and(live, eq(courses.demo, true)))

/** Strips the owner's activity from a course summary for visitors. */
const anonymous = <T extends CourseSummary>(c: T): T => ({
  ...c,
  completedCount: 0,
  newCount: 0,
  availableUpdates: 0,
  lastSyncedAt: null,
  pinned: false,
})

const anonymousDetail = (d: CourseDetail): CourseDetail => ({
  ...anonymous(d),
  lessons: d.lessons.map((l) => ({ ...l, completed: false, isNew: false })),
})

export const listCourses = async (user: AuthUser | null): Promise<CourseSummary[]> => {
  // Pinned first, then your drag order, then newest.
  const rows = await summaryQuery()
    .where(visible(user))
    .orderBy(sql`${courses.pinned} desc`, asc(courses.sortOrder), sql`${courses.createdAt} desc`)
  return isOwner(user) ? rows : rows.map(anonymous)
}

export const findCourse = (token: string) =>
  first(
    db
      .select()
      .from(courses)
      .where(and(eq(courses.token, token), live))
      .limit(1),
  )

export const findCourseById = (id: number) =>
  first(
    db
      .select()
      .from(courses)
      .where(and(eq(courses.id, id), live))
      .limit(1),
  )

export const findCourseByYoutubeId = (youtubeId: string) =>
  first(db.select().from(courses).where(eq(courses.youtubeId, youtubeId)).limit(1))

export const getCourseDetail = async (token: string, user: AuthUser | null): Promise<CourseDetail | null> => {
  const summary = await first(summaryQuery().where(and(eq(courses.token, token), visible(user))))
  if (!summary) {
    return null
  }
  const rows = await db
    .select()
    .from(lessons)
    .innerJoin(courses, eq(lessons.courseId, courses.id))
    .where(eq(courses.token, token))
    .orderBy(asc(lessons.position))
  const detail = { ...summary, lessons: rows.map((r) => toLessonRow(r.lessons)) }
  return isOwner(user) ? detail : anonymousDetail(detail)
}

/** Moves a course to the trash (restorable for 7 days, see repo/trash.ts). */
export const deleteCourse = async (token: string) =>
  (
    await db
      .update(courses)
      .set({ deletedAt: Date.now() })
      .where(and(eq(courses.token, token), live))
      .returning({ id: courses.id })
  ).length > 0

/** Opening a course clears its "new" badges. */
export const markCourseSeen = (courseId: number) =>
  db.update(lessons).set({ isNew: false }).where(eq(lessons.courseId, courseId))
