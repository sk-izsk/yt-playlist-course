import { HttpError } from "../http-error"

/** Check the restored schema too: an empty database is not a usable mirror. */
export const requireBackupReady = async (probe: (() => Promise<unknown>) | undefined) => {
  if (!probe) {
    throw new HttpError(400, "No local backup configured (LOCAL_DATABASE_URL)")
  }
  try {
    await probe()
  } catch {
    throw new HttpError(
      503,
      "Local backup unavailable. In Settings, click Start local database, then Back up now. If it still fails, check the host and port in LOCAL_DATABASE_URL. Switch to Neon (live) to continue.",
    )
  }
}
