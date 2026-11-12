import { and, desc, eq, isNull } from "drizzle-orm"
import { db, first, schema } from "../db/client"
import { HttpError } from "../http-error"
import { newRefreshToken, sha256, type AuthUser } from "./tokens"

const { agentTokens, users } = schema

/** Token management is for the owner; the demo user (Phase 8) must never mint write access. */
export const ownerOnly = (u: AuthUser) => {
  if (u.role !== "owner") {
    throw new HttpError(403, "Only the owner can manage agent tokens")
  }
  return u
}

/** Creates a token and returns it in plain text: the only time it is ever visible. */
export const createAgentToken = async (userId: number, name: string) => {
  const token = `tw_${newRefreshToken()}`
  const [row] = await db
    .insert(agentTokens)
    .values({ userId, name, hash: sha256(token), prefix: token.slice(0, 10) })
    .returning({
      id: agentTokens.id,
      name: agentTokens.name,
      prefix: agentTokens.prefix,
      createdAt: agentTokens.createdAt,
    })
  return { ...row, token }
}

export const listAgentTokens = (userId: number) =>
  db
    .select({
      id: agentTokens.id,
      name: agentTokens.name,
      prefix: agentTokens.prefix,
      createdAt: agentTokens.createdAt,
      lastUsedAt: agentTokens.lastUsedAt,
    })
    .from(agentTokens)
    .where(and(eq(agentTokens.userId, userId), isNull(agentTokens.revokedAt)))
    .orderBy(desc(agentTokens.createdAt))

export const revokeAgentToken = async (userId: number, id: number) =>
  (
    await db
      .update(agentTokens)
      .set({ revokedAt: Date.now() })
      .where(and(eq(agentTokens.id, id), eq(agentTokens.userId, userId), isNull(agentTokens.revokedAt)))
      .returning({ id: agentTokens.id })
  ).length > 0

/** `Authorization: Bearer tw_…` → the token's owner. Agent routes never accept the login cookie. */
export const requireAgent = async (req: Request): Promise<AuthUser> => {
  const token = req.headers.get("authorization")?.match(/^Bearer (tw_\S+)$/)?.[1]
  if (!token) {
    throw new HttpError(401, "Missing agent token (Authorization: Bearer tw_…)")
  }
  const row = await first(
    db
      .select({ id: agentTokens.id, userId: users.id, role: users.role })
      .from(agentTokens)
      .innerJoin(users, eq(agentTokens.userId, users.id))
      .where(and(eq(agentTokens.hash, sha256(token)), isNull(agentTokens.revokedAt)))
      .limit(1),
  )
  if (!row) {
    throw new HttpError(401, "Agent token is invalid or revoked")
  }
  if (row.role !== "owner") {
    throw new HttpError(403, "Agent tokens only work for the owner account")
  }
  await db.update(agentTokens).set({ lastUsedAt: Date.now() }).where(eq(agentTokens.id, row.id))
  return { id: row.userId, role: row.role, sid: `agent:${row.id}` }
}
