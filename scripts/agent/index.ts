/**
 * Agent CLI — the bridge between this app and Claude / Codex.
 * Usage: bun run agent <command> [args]   (see docs/notes-guide.md)
 * Ids: full UUID v4 as shown in the app (a unique prefix also works).
 * Local mode uses DATABASE_URL; remote mode (TUBEWISE_URL + TUBEWISE_TOKEN set) uses the app's agent API.
 */
import { remoteConfigured } from "@/agent-client/api"
import { HELP } from "./help"

const main = async () => {
  const [cmd, ...args] = process.argv.slice(2)
  // Loaded lazily so remote mode never imports the DB client (which needs DATABASE_URL).
  const mode = remoteConfigured() ? await import("./remote") : await import("./local")
  const run = cmd ? mode.commands[cmd] : undefined
  if (!run) {
    console.log(HELP)
    process.exitCode = cmd ? 1 : 0
    return mode.close()
  }
  try {
    await run(args)
  } catch (err) {
    console.error((err as Error).message)
    process.exitCode = 1
  } finally {
    await mode.close()
  }
}

void main()
