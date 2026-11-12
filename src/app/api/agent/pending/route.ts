import { handleAgent } from "@/server/http"
import { pendingLessons } from "@/server/repo/lessons"

export const dynamic = "force-dynamic"

/** ?course=<uuid> optional. Lessons that still need notes, never finished ones. */
export const GET = (req: Request) =>
  handleAgent(req, () => pendingLessons(new URL(req.url).searchParams.get("course") ?? undefined))
