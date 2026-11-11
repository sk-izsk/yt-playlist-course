import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Next and `bun run` load .env.local themselves; plain `bunx tsx` scripts don't.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
}
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (put it in .env.local).");

// One pool across Next dev hot reloads; otherwise every reload leaks connections to Neon.
// ponytail: max 5 suits one user on Neon's pooled (-pooler) URL; raise it if requests start queueing.
const g = globalThis as unknown as { __pg?: Pool };
export const pool = (g.__pg ??= new Pool({ connectionString: url, max: 5 }));

export const db = drizzle(pool, { schema });
export { schema };

/** First row or undefined: Postgres has no `.get()`, so add `.limit(1)` to the query for speed. */
export const first = async <T>(rows: PromiseLike<T[]>) => (await rows)[0];
