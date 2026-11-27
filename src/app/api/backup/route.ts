import { requireUser } from "@/server/auth/require-user"
import { backupAvailable } from "@/server/db/client"
import { handlePublic, HttpError } from "@/server/http"
import { backupStatus, runBackup } from "@/server/services/backup"
import { isLocalRequest } from "@/shared/localhost"

export const dynamic = "force-dynamic"

// Only on a Mac with a local mirror (LOCAL_DATABASE_URL, not Vercel), and only for the owner.
// handlePublic + an explicit owner check rather than handle(): a backup may run while viewing the backup itself.
const guard = async (req: Request) => {
  if (!backupAvailable()) {
    throw new HttpError(404, "Backups run only on the Mac with a local mirror")
  }
  const user = await requireUser()
  if (user.role !== "owner") {
    throw new HttpError(403, "This account is read-only")
  }
  if (!isLocalRequest(req)) {
    throw new HttpError(403, "Run backups from localhost on the Mac.")
  }
}

export const GET = (req: Request) =>
  handlePublic(async () => {
    await guard(req)
    return backupStatus()
  })

/** Dump Neon now and refresh the local mirror (same as `make db-backup`). */
export const POST = (req: Request) =>
  handlePublic(async () => {
    await guard(req)
    try {
      return await runBackup()
    } catch (err) {
      const e = err as Error & { stderr?: string }
      throw new HttpError(502, `Backup failed: ${(e.stderr || e.message).trim().split("\n").slice(-2).join(" ")}`)
    }
  })
