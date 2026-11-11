import { handle, HttpError, notFound, readJson } from "@/server/http";
import { addNote } from "@/server/repo/lesson-content";
import { findLesson } from "@/server/repo/lessons";

/** Body: { atSec, text } — a note pinned to a moment in the video. */
export const POST = async (req: Request, ctx: RouteContext<"/api/lessons/[token]/notes">) => {
  const { token } = await ctx.params;
  return handle(async () => {
    const lesson = await findLesson(token);
    if (!lesson) throw notFound("Lesson");
    const { atSec, text } = await readJson<{ atSec?: number; text?: string }>(req);
    if (!text?.trim()) throw new HttpError(400, "Note is empty");
    return addNote(lesson.id, Math.max(0, Math.floor(atSec ?? 0)), text.trim());
  }, 201);
}
