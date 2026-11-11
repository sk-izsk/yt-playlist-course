import { handleAgent, notFound } from "@/server/http";
import { transcriptTargets } from "@/server/services/agent-context";

export const dynamic = "force-dynamic";

/** Lessons with video id, chapter range and transcript status, so the Mac can fetch what is missing. */
export const GET = async (req: Request, ctx: RouteContext<"/api/agent/courses/[token]/transcripts">) => {
  const { token } = await ctx.params;
  return handleAgent(req, async () => (await transcriptTargets(token)) ?? Promise.reject(notFound("Course")));
};
