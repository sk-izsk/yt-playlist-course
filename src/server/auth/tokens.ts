import { createHash, randomBytes } from "node:crypto"
import { errors, jwtVerify, SignJWT } from "jose"

export type Role = "owner" | "demo"
export type AuthUser = { id: number; role: Role; sid: string }

// ponytail: AUTH_ACCESS_TTL_SEC exists only to test expiry quickly; leave it unset.
export const ACCESS_TTL_SEC = Number(process.env.AUTH_ACCESS_TTL_SEC ?? 15 * 60)
export const IDLE_MS = 24 * 60 * 60 * 1000

const secret = () => {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters.")
  }
  return new TextEncoder().encode(s)
}

export const signAccess = (u: AuthUser) =>
  new SignJWT({ role: u.role, sid: u.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(u.id))
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret())

/** "expired" lets the client refresh; "invalid" means log in again. */
export const verifyAccess = async (jwt: string): Promise<AuthUser | "expired" | "invalid"> => {
  try {
    const { payload } = await jwtVerify(jwt, secret(), { algorithms: ["HS256"] })
    return { id: Number(payload.sub), role: payload.role as Role, sid: String(payload.sid) }
  } catch (err) {
    return err instanceof errors.JWTExpired ? "expired" : "invalid"
  }
}

export const newRefreshToken = () => randomBytes(32).toString("base64url")
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex")
