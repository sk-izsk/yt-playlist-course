import { findCourseById } from "../repo/courses"
import { addEvent } from "../repo/events"
import { lessonsOfCourse } from "../repo/lessons"
import { saveTranscript } from "../repo/lesson-content"
import { sleep } from "../youtube/client"
import { canFetchTranscripts, fetchBestTranscript, sliceSegments } from "../youtube/transcript"

// ponytail: in-process guard; fine for one local server. A second process (CLI) may overlap
// with the dev server — harmless, the upsert just runs twice.
const running = new Set<number>()
const GAP_MS = 1200 // be polite to YouTube; bursts get rate-limited

/** One feed entry per finished run: "ready", or how many failed (retry with the CLI `transcripts` command). */
const reportRun = async (courseId: number, total: number, failed: number) => {
  const course = await findCourseById(courseId)
  if (!course) {
    return
  }
  if (failed) {
    await addEvent({
      kind: "error",
      title: `${failed} of ${total} transcripts failed`,
      body: `${course.title} — YouTube may be rate-limiting. Retry: bun run agent transcripts ${course.token}`,
      courseToken: course.token,
    })
  } else {
    await addEvent({
      kind: "success",
      title: "Transcripts ready",
      body: `${course.title} — ${total} lesson${total === 1 ? "" : "s"}`,
      courseToken: course.token,
    })
  }
}

/** Fetches transcripts for every lesson still `pending`, one video at a time. */
export const fillTranscripts = async (courseId: number, opts: { retryErrors?: boolean } = {}) => {
  if (running.has(courseId) || !canFetchTranscripts()) {
    return
  }
  running.add(courseId)
  try {
    const rows = await lessonsOfCourse(courseId)
    const todo = rows.filter(
      (l) => l.transcriptStatus === "pending" || (opts.retryErrors && l.transcriptStatus === "error"),
    )

    if (!todo.length) {
      return
    }
    let failed = 0

    // Chapter lessons share one video — fetch it once, slice per lesson.
    const byVideo = Map.groupBy(todo, (l) => l.videoId)
    for (const [videoId, group] of byVideo) {
      // The course may be deleted mid-run (big playlists take minutes) — stop hitting YouTube for it.
      if (!(await findCourseById(courseId))) {
        return
      }
      try {
        const t = await fetchBestTranscript(videoId)
        for (const l of group) {
          if (!t) {
            await saveTranscript(l.id, "none")
          } else {
            await saveTranscript(l.id, "ok", {
              lang: t.lang,
              segments: sliceSegments(t.segments, l.startSec ?? 0, l.endSec ?? Infinity),
            })
          }
        }
      } catch (err) {
        console.warn(`[transcripts] ${videoId}:`, (err as Error).message)
        for (const l of group) {
          await saveTranscript(l.id, "error")
        }
        failed += group.length
      }
      await sleep(GAP_MS)
    }
    await reportRun(courseId, todo.length, failed)
  } finally {
    running.delete(courseId)
  }
}
