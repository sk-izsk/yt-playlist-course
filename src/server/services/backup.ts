import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const DIR = process.env.BACKUP_DIR ?? path.join(os.homedir(), ".courseit", "backups");
const SCRIPT = path.join(process.cwd(), "scripts", "backup.sh");
// The dev server may have started without Homebrew / Postgres.app on PATH; pg_dump lives there.
const PATH = ["/opt/homebrew/bin", "/Applications/Postgres.app/Contents/Versions/latest/bin", process.env.PATH].join(":");

export type BackupStatus = { lastAt: number | null; file: string | null; sizeBytes: number | null; dumps: number };

/** Newest dated dump on this Mac (the mirror is refreshed from the same run). */
export const backupStatus = async (): Promise<BackupStatus> => {
  const files = (await readdir(DIR).catch(() => [] as string[])).filter((f) => /^tubewise-.*\.dump$/.test(f));
  const stats = await Promise.all(files.map(async (f) => ({ f, s: await stat(path.join(DIR, f)) })));
  const newest = stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs)[0];
  return { lastAt: newest?.s.mtimeMs ?? null, file: newest?.f ?? null, sizeBytes: newest?.s.size ?? null, dumps: files.length };
};

/**
 * Runs scripts/backup.sh (dump Neon, keep 14 days, refresh the local mirror) — the same thing `make db-backup` and
 * the launchd job do. Fixed script, no user input reaches the shell. ponytail: blocks the request for the few
 * seconds a dump takes; fine for one owner clicking a button.
 */
export const runBackup = async () => {
  const { stdout } = await run("/bin/bash", [SCRIPT], { env: { ...process.env, PATH }, timeout: 120_000 });
  return { log: stdout.trim().split("\n").slice(-3), status: await backupStatus() };
};
