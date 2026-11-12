import { eq } from "drizzle-orm"
import { db, schema } from "../db/client"
import { findCourse } from "../repo/courses"
import { addEvent } from "../repo/events"
import { lessonsOfCourse } from "../repo/lessons"
import { fetchPlaylist } from "../youtube/fetch-course"

type Course = typeof schema.courses.$inferSelect

/**
 * Detect-only: counts playlist videos we don't have yet and stores it as `availableUpdates`.
 * Nothing is added until you press Update (which runs syncCourse).
 */
export const checkCourseUpdates = async (course: Course) => {
  if (course.kind !== "playlist") {
    return 0
  }
  const remote = await fetchPlaylist(course.youtubeId)
  const known = new Set((await lessonsOfCourse(course.id)).map((l) => l.videoId))
  const available = remote.videos.filter((v) => !known.has(v.videoId)).length

  await db
    .update(schema.courses)
    .set({ availableUpdates: available, lastSyncedAt: Date.now() })
    .where(eq(schema.courses.id, course.id))

  // Only announce when the number grows, so re-checks don't spam the feed.
  if (available > course.availableUpdates) {
    await addEvent({
      kind: "update",
      title: `${available} new video${available > 1 ? "s" : ""} available`,
      body: course.title,
      courseToken: course.token,
    })
  }
  return available
}

export const checkCourseUpdatesByToken = async (token: string) => {
  const course = await findCourse(token)
  if (!course) {
    throw new Error(`Unknown course ${token}`)
  }
  try {
    return await checkCourseUpdates(course)
  } catch (err) {
    await addEvent({
      kind: "error",
      title: "Update check failed",
      body: `${course.title}: ${(err as Error).message}`,
      courseToken: token,
    })
    throw err
  }
}
