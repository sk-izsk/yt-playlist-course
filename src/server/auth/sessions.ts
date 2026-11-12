import { randomUUID } from "node:crypto"
import { and, eq, isNull, lt } from "drizzle-orm"
import { db, first, schema } from "../db/client"
import { decideRefresh } from "./refresh-decision"
import { IDLE_MS, newRefreshToken, sha256, signAccess, type Role } from "./tokens"

const { sessions, refreshTokens, users } = schema

export type Issued = { access: string; refresh: string }

const issue = async (sid: string, user: { id: number; role: Role }) => {
  const refresh = newRefreshToken()
  const hash = sha256(refresh)
  const now = Date.now()
  await db.insert(refreshTokens).values({ hash, sessionId: sid, createdAt: now })
  await db
    .update(sessions)
    .set({ currentHash: hash, rotatedAt: now, expiresAt: now + IDLE_MS })
    .where(eq(sessions.id, sid))
  // Old hashes only matter while their cookie could still exist (24 h max age).
  await db
    .delete(refreshTokens)
    .where(and(eq(refreshTokens.sessionId, sid), lt(refreshTokens.createdAt, now - IDLE_MS)))
  return { access: await signAccess({ id: user.id, role: user.role, sid }), refresh }
}

export const startSession = async (user: { id: number; role: Role }): Promise<Issued> => {
  const sid = randomUUID()
  const now = Date.now()
  await db
    .insert(sessions)
    .values({ id: sid, userId: user.id, currentHash: "", rotatedAt: now, expiresAt: now + IDLE_MS })
  return issue(sid, user)
}

const revokeAll = (userId: number) =>
  db
    .update(sessions)
    .set({ revokedAt: Date.now() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)))

/**
 * Rotates a refresh token. Returns null when the user must log in again; presenting a token that was
 * already rotated away (outside the grace window) revokes every session of that user.
 * ponytail: two tabs refreshing in the same instant can both rotate; the 30 s grace absorbs it.
 */
export const refreshSession = async (refresh: string): Promise<Issued | null> => {
  const hash = sha256(refresh)
  const row = await first(
    db
      .select({ session: sessions, role: users.role })
      .from(refreshTokens)
      .innerJoin(sessions, eq(refreshTokens.sessionId, sessions.id))
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(refreshTokens.hash, hash))
      .limit(1),
  )
  if (!row) {
    return null
  }
  const decision = decideRefresh(row.session, hash, Date.now())
  if (decision === "reuse") {
    console.warn(`[auth] refresh token reuse on session ${row.session.id}; revoking all sessions`)
    await revokeAll(row.session.userId)
  }
  if (decision !== "rotate") {
    return null
  }
  return issue(row.session.id, { id: row.session.userId, role: row.role })
}

export const endSession = async (refresh: string | undefined) => {
  if (!refresh) {
    return
  }
  const row = await first(
    db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.hash, sha256(refresh)))
      .limit(1),
  )
  if (row) {
    await db.update(sessions).set({ revokedAt: Date.now() }).where(eq(sessions.id, row.sessionId))
  }
}
