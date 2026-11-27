import { requireUser } from "@/server/auth/require-user"
import { handlePublic, HttpError } from "@/server/http"
import { startLocalDatabase } from "@/server/services/start-local-database"
import { isLocalRequest } from "@/shared/localhost"

export const dynamic = "force-dynamic"

// Recovery must work even when the selected mirror is offline, so it cannot use handle().
export const POST = (req: Request) =>
  handlePublic(async () => {
    const user = await requireUser()
    if (user.role !== "owner") {
      throw new HttpError(403, "This account is read-only")
    }
    if (!isLocalRequest(req)) {
      throw new HttpError(403, "Start the database from localhost on the Mac.")
    }
    return startLocalDatabase()
  })
