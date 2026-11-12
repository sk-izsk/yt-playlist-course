import { hash, verify } from "@node-rs/argon2"
import { eq } from "drizzle-orm"
import { db, first, schema } from "../db/client"
import { HttpError } from "../http-error"

const { users, loginAttempts } = schema
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000
// Verifying against a throwaway hash keeps "no such user" as slow as "wrong password".
let dummy: Promise<string> | undefined

export const hashPassword = (password: string) => hash(password) // argon2id defaults

/** Returns the user, or throws 401 (wrong credentials) / 429 (locked). */
export const checkLogin = async (username: string, password: string) => {
  const now = Date.now()
  const attempt = await first(db.select().from(loginAttempts).where(eq(loginAttempts.username, username)).limit(1))
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    const mins = Math.ceil((attempt.lockedUntil - now) / 60_000)
    throw new HttpError(429, `Too many failed logins. Try again in ${mins} min.`)
  }

  const user = await first(db.select().from(users).where(eq(users.username, username)).limit(1))
  const ok = await verify(user?.passwordHash ?? (await (dummy ??= hash("not-a-real-password"))), password)
  if (user && ok) {
    await db.delete(loginAttempts).where(eq(loginAttempts.username, username))
    return user
  }

  // A lock that has run out starts a fresh count.
  const failures = (attempt?.lockedUntil ? 0 : (attempt?.failures ?? 0)) + 1
  const lock = failures >= MAX_FAILURES ? now + LOCK_MS : null
  await db
    .insert(loginAttempts)
    .values({ username, failures, lockedUntil: lock })
    .onConflictDoUpdate({ target: loginAttempts.username, set: { failures, lockedUntil: lock } })
  throw new HttpError(401, "Wrong username or password")
}
