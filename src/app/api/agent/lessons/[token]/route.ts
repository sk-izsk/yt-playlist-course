import { handleAgent, notFound } from "@/server/http"
import { lessonContext } from "@/server/services/agent-context"
import type { TranscriptMode } from "@/shared/agent-format"

export const dynamic = "force-dynamic"

const MODES: TranscriptMode[] = ["compact", "full", "head"]

/** ?mode=compact|full|head → lesson detail + transcript lines + target summary length. */
export const GET = async (req: Request, ctx: RouteContext<"/api/agent/lessons/[token]">) => {
  const { token } = await ctx.params
  const asked = new URL(req.url).searchParams.get("mode") as TranscriptMode | null
  const mode = asked && MODES.includes(asked) ? asked : "compact"
  return handleAgent(req, async () => (await lessonContext(token, mode)) ?? Promise.reject(notFound("Lesson")))
}
