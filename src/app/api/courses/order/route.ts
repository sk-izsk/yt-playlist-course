import { handle, HttpError, readJson } from "@/server/http";
import { reorderCourses } from "@/server/repo/course-order";

/** Body: { tokens: string[] } — the full course list in its new order. */
export const PUT = async (req: Request) =>
  handle(async () => {
    const { tokens } = await readJson<{ tokens?: unknown }>(req);
    if (!Array.isArray(tokens) || !tokens.every((t) => typeof t === "string")) {
      throw new HttpError(400, "tokens must be an array of course ids");
    }
    await reorderCourses(tokens);
    return { ok: true };
  });
