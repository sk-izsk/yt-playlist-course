import { handle, notFound } from "@/server/http";
import { restoreCourse } from "@/server/repo/trash";

/** Restores a course from the trash with all its lessons, notes and progress. */
export const POST = async (_: Request, ctx: RouteContext<"/api/trash/[token]">) => {
  const { token } = await ctx.params;
  return handle(async () => {
    if (!(await restoreCourse(token))) throw notFound("Course in trash");
    return { ok: true };
  });
};
