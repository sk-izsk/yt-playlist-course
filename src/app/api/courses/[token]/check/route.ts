import { handle } from "@/server/http"
import { checkCourseUpdatesByToken } from "@/server/services/check-updates"

/** Detects new playlist videos without adding them. Returns { available }. */
export const POST = async (_: Request, ctx: RouteContext<"/api/courses/[token]/check">) => {
  const { token } = await ctx.params
  return handle(async () => ({ available: await checkCourseUpdatesByToken(token) }))
}
