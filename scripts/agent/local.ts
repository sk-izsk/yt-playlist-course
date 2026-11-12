// Local mode: talks to Postgres directly through the server code (needs DATABASE_URL).
import { readFileSync } from "node:fs"
import { pool } from "@/server/db/client"
import { findCourse, listCourses } from "@/server/repo/courses"
import { pendingLessons } from "@/server/repo/lessons"
import { resolveAs } from "@/server/repo/resolve"
import { importCourse } from "@/server/services/import-course"
import { saveLessonContent } from "@/server/services/save-content"
import { syncCourse } from "@/server/services/sync-course"
import { fillTranscripts } from "@/server/services/transcripts"
import { printPending, printSaved, required, type Commands } from "./help"
import { reportCourse } from "./report"
import { showId } from "./show"

export const commands: Commands = {
  list: async () => {
    for (const c of await listCourses()) {
      console.log(
        `${c.token}  ${c.completedCount}/${c.lessonCount} watched  ${c.lessonCount - c.pendingNotes}/${c.lessonCount} notes  ${c.title}`,
      )
    }
  },
  pending: async ([course]) =>
    printPending(await pendingLessons(course ? await resolveAs("course", course) : undefined)),
  show: ([id, ...flags]) => showId(required(id, "id"), flags),
  report: async ([id]) => reportCourse(await resolveAs("course", required(id, "course id"))),
  save: async ([id, file, flag]) => {
    const token = await resolveAs("lesson", required(id, "lesson id"))
    const raw = readFileSync(file === "-" || !file ? 0 : file, "utf8")
    printSaved(token, await saveLessonContent(token, JSON.parse(raw), { force: flag === "--force" }))
  },
  add: async ([url]) => {
    const res = await importCourse(required(url, "url"))
    console.log(res.created ? `Added ${res.token}. Fetching transcripts…` : `Already added as ${res.token}.`)
    await res.transcripts
    console.log(`Done. Next: bun run agent pending ${res.token}`)
  },
  sync: async ([id]) => {
    const res = await syncCourse(await resolveAs("course", required(id, "course id")))
    console.log(res.added.length ? `${res.added.length} new lesson(s):` : "No new videos.")
    for (const l of res.added) {
      console.log(`  ${l.token}  #${l.position}  ${l.title}`)
    }
    await res.transcripts
  },
  transcripts: async ([id]) => {
    const course = (await findCourse(await resolveAs("course", required(id, "course id"))))!
    await fillTranscripts(course.id, { retryErrors: true })
    console.log("Transcripts refreshed.")
  },
}

// The pg pool keeps the process alive; close it so the command exits.
export const close = () => pool.end()
