import { execFile } from "node:child_process"
import { access } from "node:fs/promises"
import { setTimeout } from "node:timers/promises"
import { promisify } from "node:util"
import { Pool } from "pg"
import { HttpError } from "../http-error"
import { isLocalhost } from "@/shared/localhost"

const run = promisify(execFile)

export const localDatabaseUrl = (
  env: Record<string, string | undefined> = process.env,
  platform = process.platform,
) => {
  if (platform !== "darwin" || env.VERCEL || !env.LOCAL_DATABASE_URL) {
    throw new HttpError(404, "Starting the local database is available only on the Mac with a configured mirror.")
  }
  let url: URL
  try {
    url = new URL(env.LOCAL_DATABASE_URL)
  } catch {
    throw new HttpError(400, "LOCAL_DATABASE_URL must be a valid PostgreSQL URL.")
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !isLocalhost(url.hostname)) {
    throw new HttpError(400, "LOCAL_DATABASE_URL must point to PostgreSQL on this Mac.")
  }
  return env.LOCAL_DATABASE_URL
}

export const ensureDatabaseRunning = async (
  probe: () => Promise<boolean>,
  start: () => Promise<unknown>,
  pause = () => setTimeout(500),
) => {
  if (await probe()) {
    return { started: false }
  }
  await start()
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await probe()) {
      return { started: true }
    }
    await pause()
  }
  throw new HttpError(
    503,
    "PostgreSQL did not become ready. Check its Homebrew service and the host/port in LOCAL_DATABASE_URL.",
  )
}

const start = async () => {
  const pool = new Pool({
    connectionString: localDatabaseUrl(),
    max: 1,
    connectionTimeoutMillis: 1000,
    query_timeout: 1000,
  })
  const probe = () =>
    pool.query("SELECT 1").then(
      () => true,
      () => false,
    )
  try {
    return await ensureDatabaseRunning(probe, async () => {
      const brew = await access("/opt/homebrew/bin/brew").then(
        () => "/opt/homebrew/bin/brew",
        () => "/usr/local/bin/brew",
      )
      try {
        // ponytail: this Mac uses Homebrew PostgreSQL 18; other installations must be started manually.
        await run(brew, ["services", "restart", "postgresql@18"], { timeout: 20_000 })
      } catch {
        throw new HttpError(503, "Could not start PostgreSQL. Check the Homebrew postgresql@18 service on this Mac.")
      }
    })
  } finally {
    await pool.end()
  }
}

// Concurrent clicks must not restart a service that another request just brought online.
let starting: ReturnType<typeof start> | null = null
export const startLocalDatabase = () =>
  (starting ??= start().finally(() => {
    starting = null
  }))
