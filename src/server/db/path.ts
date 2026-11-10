import Database from "better-sqlite3";
import { copyFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The DB lives OUTSIDE the project: `next dev` watches the project folder, and SQLite's WAL file
 * changing every second (while transcripts load) made the dev server rebuild + reload the page in a loop.
 * Override with DB_PATH.
 */
export const DB_PATH = process.env.DB_PATH ?? path.join(os.homedir(), ".courseit", "app.db");

const LEGACY_PATH = path.join(process.cwd(), "data", "app.db");

/** One-time move of a DB created by older versions inside `<project>/data/`. */
export const ensureDbLocation = () => {
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (existsSync(DB_PATH) || !existsSync(LEGACY_PATH) || process.env.DB_PATH) return;

  // Fold the WAL into the main file so a single-file copy is complete.
  const legacy = new Database(LEGACY_PATH);
  legacy.pragma("wal_checkpoint(TRUNCATE)");
  legacy.close();

  copyFileSync(LEGACY_PATH, DB_PATH);
  renameSync(LEGACY_PATH, `${LEGACY_PATH}.moved`);
  console.log(`[db] moved ${LEGACY_PATH} → ${DB_PATH}`);
};
