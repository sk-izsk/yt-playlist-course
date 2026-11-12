import { handleAgent, HttpError, readJson } from "@/server/http"
import { saveLessonContent } from "@/server/services/save-content"

/**
 * Body: { content, force? }. Same validation, quality checks and answer shuffle as the CLI `save`.
 * Rejections are the agent's to fix, so they come back as 422 with every problem listed.
 */
export const PUT = async (req: Request, ctx: RouteContext<"/api/agent/lessons/[token]/notes">) => {
  const { token } = await ctx.params
  return handleAgent(req, async () => {
    const { content, force } = await readJson<{ content?: unknown; force?: boolean }>(req)
    try {
      return await saveLessonContent(token, content, { force: force === true })
    } catch (err) {
      throw new HttpError(422, (err as Error).message)
    }
  })
}
