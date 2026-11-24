import { cookies } from "next/headers"
import { requireUser } from "@/server/auth/require-user"
import { backupAvailable, backupPool } from "@/server/db/client"
import { requireBackupReady } from "@/server/db/backup-ready"
import { chosenSource, DB_COOKIE, handlePublic, HttpError, readJson } from "@/server/http"

export const dynamic = "force-dynamic"

/** { available, source }: the "Neon (live) / Local backup" switch shows only when a local mirror is configured. */
export const GET = () => handlePublic(async () => ({ available: backupAvailable(), source: await chosenSource() }))

/** Body: { source: "live" | "backup" }. Logged-in only; switching never writes to either database. */
export const PUT = (req: Request) =>
  handlePublic(async () => {
    await requireUser()
    const { source } = await readJson<{ source?: string }>(req)
    if (source !== "live" && source !== "backup") {
      throw new HttpError(400, "source must be live or backup")
    }
    if (source === "backup") {
      const mirror = backupPool
      await requireBackupReady(mirror && (() => mirror.query("SELECT id FROM courses LIMIT 0")))
    }
    ;(await cookies()).set(DB_COOKIE, source, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 })
    return { source }
  })
