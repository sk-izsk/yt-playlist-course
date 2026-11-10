import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

const addColumn = (sqlite: Database.Database, table: string, column: string, type: string) => {
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
};

/** Idempotent upgrades for databases created by older versions of the app. */
export const migrate = (sqlite: Database.Database) => {
  addColumn(sqlite, "lessons", "lesson_kind", "TEXT");
  addColumn(sqlite, "lessons", "notes_updated_at", "INTEGER");
  addColumn(sqlite, "courses", "pinned", "INTEGER NOT NULL DEFAULT 0");
  addColumn(sqlite, "courses", "sort_order", "INTEGER NOT NULL DEFAULT 0");
  addColumn(sqlite, "courses", "available_updates", "INTEGER NOT NULL DEFAULT 0");

  // v1 used CRS-XXXX / LSN-XXXX-NN tokens; give those rows UUIDs, keep everything else.
  const swap = (table: "courses" | "lessons") => {
    const rows = sqlite.prepare(`SELECT id FROM ${table} WHERE length(token) <> 36`).all() as { id: number }[];
    const update = sqlite.prepare(`UPDATE ${table} SET token = ? WHERE id = ?`);
    rows.forEach((r) => update.run(randomUUID(), r.id));
  };
  sqlite.transaction(() => {
    swap("courses");
    swap("lessons");
  })();
};
