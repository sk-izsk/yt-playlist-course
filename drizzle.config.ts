import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");

// Schema changes: edit schema.ts → `make db-generate` → review the SQL in drizzle/ → `make db-migrate`.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
