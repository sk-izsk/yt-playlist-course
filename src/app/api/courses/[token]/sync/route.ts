import { handle } from "@/server/http";
import { syncCourse } from "@/server/services/sync-course";

export const POST = async (_: Request, ctx: RouteContext<"/api/courses/[token]/sync">) => {
  const { token } = await ctx.params;
  return handle(async () => {
    const { added } = await syncCourse(token);
    return { added };
  });
}
