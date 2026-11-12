import { handleRead, HttpError } from "@/server/http"
import { listTrash } from "@/server/repo/trash"

export const dynamic = "force-dynamic"

/** Deleted courses still restorable (7 days). Logged-in only; a read, so it also works on the backup view. */
export const GET = () =>
  handleRead((user) => {
    if (!user) {
      throw new HttpError(401, "Log in to see the trash")
    }
    if (user.role !== "owner") {
      throw new HttpError(403, "This account is read-only")
    }
    return listTrash()
  })
