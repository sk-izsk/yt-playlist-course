import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { BOOTSTRAP_SQL } from "./bootstrap.sql";
import { migrate } from "./migrate";
import { DB_PATH, ensureDbLocation } from "./path";

const open = () => {
  ensureDbLocation();
  const sqlite = new Database(DB_PATH);
  // WAL lets the dev server and the agent CLI use the DB at the same time.
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
};

// Reuse one connection across Next dev hot reloads…
const g = globalThis as unknown as { __sqlite?: Database.Database };
const sqlite = (g.__sqlite ??= open());
// …but re-run the (idempotent, cheap) schema setup on every module load so new columns land without a restart.
sqlite.exec(BOOTSTRAP_SQL);
migrate(sqlite);

export const db = drizzle(sqlite, { schema });
export { schema };
