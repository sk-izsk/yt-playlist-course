import { handleAgent, notFound } from "@/server/http";
import { reportData } from "@/server/services/agent-context";

export const dynamic = "force-dynamic";

export const GET = async (req: Request, ctx: RouteContext<"/api/agent/courses/[token]/report">) => {
  const { token } = await ctx.params;
  return handleAgent(req, async () => (await reportData(token)) ?? Promise.reject(notFound("Course")));
};
