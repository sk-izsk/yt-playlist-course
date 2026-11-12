import { z } from "zod"
import { handleAgent, HttpError, notFound, readJson } from "@/server/http"
import { saveTranscript } from "@/server/repo/lesson-content"
import { findLesson } from "@/server/repo/lessons"

// Segments are already sliced to the lesson's chapter range by the Mac (absolute video seconds).
const body = z.union([
  z.object({
    status: z.literal("ok"),
    lang: z.string().min(2).max(20),
    segments: z.array(z.tuple([z.number().nonnegative(), z.string()])).min(1),
  }),
  z.object({ status: z.enum(["none", "error"]) }),
])

/** Upload a transcript fetched on the Mac (Vercel can't reach YouTube's captions). */
export const PUT = async (req: Request, ctx: RouteContext<"/api/agent/lessons/[token]/transcript">) => {
  const { token } = await ctx.params
  return handleAgent(req, async () => {
    const lesson = await findLesson(token)
    if (!lesson) {
      throw notFound("Lesson")
    }
    const parsed = body.safeParse(await readJson(req))
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "))
    }
    const t = parsed.data
    await saveTranscript(lesson.id, t.status, t.status === "ok" ? { lang: t.lang, segments: t.segments } : undefined)
    return { ok: true, status: t.status }
  })
}
