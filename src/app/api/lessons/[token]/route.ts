import { handle, handleRead, notFound, readJson } from "@/server/http"
import { getLessonDetail } from "@/server/repo/lesson-detail"
import { setCompleted } from "@/server/repo/lessons"

export const dynamic = "force-dynamic"

type Ctx = RouteContext<"/api/lessons/[token]">

export const GET = async (_: Request, ctx: Ctx) => {
  const { token } = await ctx.params
  return handleRead(async () => {
    const detail = await getLessonDetail(token)
    if (!detail) {
      throw notFound("Lesson")
    }
    return detail
  })
}

/** Body: { completed: boolean } */
export const PATCH = async (req: Request, ctx: Ctx) => {
  const { token } = await ctx.params
  return handle(async () => {
    const { completed } = await readJson<{ completed?: boolean }>(req)
    if (!(await setCompleted(token, Boolean(completed)))) {
      throw notFound("Lesson")
    }
    return { ok: true }
  })
}
