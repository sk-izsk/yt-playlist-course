import { bigint, index, integer, pgTable, text } from "drizzle-orm/pg-core"

const now = () => Date.now()
const ms = (name: string) => bigint(name, { mode: "number" })

/** No signup: rows come from `make user`. "demo" is read-only (enforced in Phase 8). */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "demo"] })
    .notNull()
    .default("owner"),
  createdAt: ms("created_at").notNull().$defaultFn(now),
})

/** One per login. `currentHash` is the only refresh token that rotates without counting as reuse. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // UUID; the `sid` claim in access tokens
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentHash: text("current_hash").notNull(),
    rotatedAt: ms("rotated_at").notNull(),
    expiresAt: ms("expires_at").notNull(), // sliding: now + 24 h on every refresh
    revokedAt: ms("revoked_at"),
    createdAt: ms("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
)

/** Every refresh token a session ever issued (SHA-256 only), so an old one is recognised as reuse. */
export const refreshTokens = pgTable("refresh_tokens", {
  hash: text("hash").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  createdAt: ms("created_at").notNull().$defaultFn(now),
})

/**
 * Personal tokens for the agent API (MCP / CLI on the Mac). Shown once; only the SHA-256 is kept.
 * `prefix` (first chars of the token) lets the Settings page tell tokens apart.
 */
export const agentTokens = pgTable("agent_tokens", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hash: text("hash").notNull().unique(),
  prefix: text("prefix").notNull(),
  createdAt: ms("created_at").notNull().$defaultFn(now),
  lastUsedAt: ms("last_used_at"),
  revokedAt: ms("revoked_at"),
})

/** Failed logins per submitted username: 5 failures lock it for 15 minutes. */
export const loginAttempts = pgTable("login_attempts", {
  username: text("username").primaryKey(),
  failures: integer("failures").notNull().default(0),
  lockedUntil: ms("locked_until"),
})
