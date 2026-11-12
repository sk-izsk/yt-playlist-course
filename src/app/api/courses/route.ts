import { handle, handleRead, HttpError, readJson } from "@/server/http"
import { listCourses } from "@/server/repo/courses"
import { addEvent } from "@/server/repo/events"
import { importCourse } from "@/server/services/import-course"

export const dynamic = "force-dynamic"

export const GET = () => handleRead(() => listCourses())

/** Body: { url } — returns as soon as lessons exist; transcripts keep filling in the background. */
export const POST = async (req: Request) => {
  return handle(async () => {
    const { url } = await readJson<{ url?: string }>(req)
    if (!url?.trim()) {
      throw new HttpError(400, "Paste a YouTube video or playlist link")
    }
    try {
      const { token, title, created } = await importCourse(url)
      return { token, title, created }
    } catch (err) {
      // Bad link, private playlist or YouTube hiccup — log it for the notification center, answer 422.
      await addEvent({ kind: "error", title: "Couldn't add course", body: `${url} — ${(err as Error).message}` })
      throw new HttpError(422, (err as Error).message)
    }
  }, 201)
}
