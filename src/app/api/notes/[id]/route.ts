import { handle, notFound } from "@/server/http"
import { deleteNote } from "@/server/repo/lesson-content"

export const DELETE = async (_: Request, ctx: RouteContext<"/api/notes/[id]">) => {
  const { id } = await ctx.params
  return handle(async () => {
    if (!(await deleteNote(Number(id)))) {
      throw notFound("Note")
    }
    return { ok: true }
  })
}
