import { and, desc, eq, isNotNull, lt } from "drizzle-orm"
import { db, schema } from "../db/client"

const { courses } = schema
export const TRASH_DAYS = 7
const TRASH_MS = TRASH_DAYS * 24 * 60 * 60 * 1000

/** Hard-deletes courses that sat in the trash longer than 7 days (lessons, notes, quiz cascade). */
export const purgeTrash = (now = Date.now()) =>
  db.delete(courses).where(and(isNotNull(courses.deletedAt), lt(courses.deletedAt, now - TRASH_MS)))

/** What's in the trash, newest first; expired entries are purged on the way. */
export const listTrash = async () => {
  await purgeTrash()
  const rows = await db
    .select({ token: courses.token, title: courses.title, channel: courses.channel, deletedAt: courses.deletedAt })
    .from(courses)
    .where(isNotNull(courses.deletedAt))
    .orderBy(desc(courses.deletedAt))
  return rows.map((r) => ({ ...r, deletedAt: r.deletedAt!, purgeAt: r.deletedAt! + TRASH_MS }))
}

export const restoreCourse = async (token: string) =>
  (
    await db
      .update(courses)
      .set({ deletedAt: null })
      .where(and(eq(courses.token, token), isNotNull(courses.deletedAt)))
      .returning({ id: courses.id })
  ).length > 0
