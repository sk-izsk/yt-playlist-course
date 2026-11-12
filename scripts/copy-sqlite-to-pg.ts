/**
 * One-time copy: ~/.courseit/app.db (SQLite) → DATABASE_URL (Postgres). Keeps every id, so links still work.
 * Refuses to run when Postgres already has courses. Run `make db-migrate` first.
 * Usage: make db-copy   (SQLITE_PATH overrides the source)
 */
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { pool } from "@/server/db/client";

const SRC = process.env.SQLITE_PATH ?? path.join(os.homedir(), ".courseit", "app.db");
// Parents before children so foreign keys hold inside the transaction.
const TABLES = ["courses", "lessons", "transcripts", "practice", "quiz", "notes", "events"] as const;
const BOOLS = new Set(["pinned", "read", "is_new"]);
const WITH_IDENTITY = TABLES.filter((t) => t !== "transcripts");
const BATCH = 100; // transcripts are big; keeps each statement well under pg's 65k-parameter cap

type Row = Record<string, unknown>;
const convert = (row: Row): Row =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [k, BOOLS.has(k) ? Boolean(v) : v]));

const main = async () => {
  const sqlite = new DatabaseSync(SRC, { readOnly: true });
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT count(*)::int AS n FROM courses");
    if (rows[0].n > 0) throw new Error("Postgres already has courses; refusing to copy twice.");

    await client.query("BEGIN");
    for (const table of TABLES) {
      const all = (sqlite.prepare(`SELECT * FROM ${table}`).all() as Row[]).map(convert);
      for (let i = 0; i < all.length; i += BATCH) {
        const chunk = all.slice(i, i + BATCH);
        const cols = Object.keys(chunk[0]);
        const values = chunk.map((_row, r) => `(${cols.map((_col, c) => `$${r * cols.length + c + 1}`).join(",")})`);
        // segments/options are JSON text in SQLite and go straight into jsonb.
        await client.query(
          `INSERT INTO ${table} (${cols.join(",")}) VALUES ${values.join(",")}`,
          chunk.flatMap((row) => cols.map((c) => row[c])),
        );
      }
      console.log(`${table}: ${all.length}`);
    }
    // Ids were copied explicitly, so move each identity past the highest one.
    for (const table of WITH_IDENTITY) {
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), coalesce((SELECT max(id) FROM ${table}), 0) + 1, false)`,
      );
    }
    await client.query("COMMIT");
    console.log(`Copied ${SRC} → Postgres.`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    sqlite.close();
    await pool.end();
  }
};

main().catch((err: Error) => {
  console.error(err.message);
  process.exitCode = 1;
});
