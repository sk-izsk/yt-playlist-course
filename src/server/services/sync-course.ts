import { eq } from "drizzle-orm"
import { db, schema } from "../db/client"
import { findCourse } from "../repo/courses"
import { addEvent } from "../repo/events"
import { insertLessons, lessonsOfCourse, maxPosition } from "../repo/lessons"
import { toLessonRow } from "../repo/mappers"
import { fetchPlaylist } from "../youtube/fetch-course"
import { draftsFromPlaylist } from "./build-lessons"
import { fillTranscripts } from "./transcripts"
import type { SyncResult } from "@/shared/types"

/**
 * Re-reads a playlist and appends videos we haven't seen, flagged `isNew`.
 * Removed videos are kept — your progress and notes on them are worth more than parity.
 */
export const syncCourse = async (token: string): Promise<SyncResult & { transcripts: Promise<void> }> => {
  const course = await findCourse(token)
  if (!course) {
    throw new Error(`Unknown course ${token}`)
  }
  const done = Promise.resolve()
  if (course.kind !== "playlist") {
    return { added: [], transcripts: done }
  }

  const remote = await fetchPlaylist(course.youtubeId)
  const known = new Set((await lessonsOfCourse(course.id)).map((l) => l.videoId))
  const fresh = remote.videos.filter((v) => !known.has(v.videoId))

  const inserted = await insertLessons(course, draftsFromPlaylist(fresh), {
    afterPosition: await maxPosition(course.id),
    isNew: true,
  })
  await db
    .update(schema.courses)
    .set({ lastSyncedAt: Date.now(), availableUpdates: 0 })
    .where(eq(schema.courses.id, course.id))
  if (inserted.length) {
    await addEvent({
      kind: "success",
      title: `Added ${inserted.length} new video${inserted.length > 1 ? "s" : ""}`,
      body: course.title,
      courseToken: course.token,
    })
  }

  const transcripts = inserted.length ? fillTranscripts(course.id).catch((e) => console.error("[sync]", e)) : done
  return { added: inserted.map(toLessonRow), transcripts }
}
