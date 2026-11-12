import { handleAgent, notFound } from "@/server/http"
import { getCourseDetail } from "@/server/repo/courses"

export const dynamic = "force-dynamic"

export const GET = async (req: Request, ctx: RouteContext<"/api/agent/courses/[token]">) => {
  const { token } = await ctx.params
  return handleAgent(req, async () => (await getCourseDetail(token)) ?? Promise.reject(notFound("Course")))
}
