import { handle, handleRead, notFound, readJson } from "@/server/http"
import { setPinned } from "@/server/repo/course-order"
import { deleteCourse, findCourse, getCourseDetail, markCourseSeen } from "@/server/repo/courses"

export const dynamic = "force-dynamic"

type Ctx = RouteContext<"/api/courses/[token]">

export const GET = async (_: Request, ctx: Ctx) => {
  const { token } = await ctx.params
  return handleRead(async (user) => {
    const detail = await getCourseDetail(token)
    if (!detail) {
      throw notFound("Course")
    }
    // Badges show on this visit, then clear for the next one (only the owner's visit counts).
    if (user && detail.newCount) {
      await markCourseSeen((await findCourse(token))!.id)
    }
    return detail
  })
}

/** Body: { pinned: boolean } */
export const PATCH = async (req: Request, ctx: Ctx) => {
  const { token } = await ctx.params
  return handle(async () => {
    const { pinned } = await readJson<{ pinned?: boolean }>(req)
    if (!(await setPinned(token, Boolean(pinned)))) {
      throw notFound("Course")
    }
    return { ok: true }
  })
}

export const DELETE = async (_: Request, ctx: Ctx) => {
  const { token } = await ctx.params
  return handle(async () => {
    if (!(await deleteCourse(token))) {
      throw notFound("Course")
    }
    return { ok: true }
  })
}
