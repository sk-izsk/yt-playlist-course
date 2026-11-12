/** A rotated-away token presented this soon counts as a race between tabs, not theft. */
export const GRACE_MS = 30_000;

export type RefreshDecision = "rotate" | "expired" | "reuse";

/**
 * What to do with a presented refresh token that belongs to `session`.
 * - current token, live session → rotate
 * - session revoked or idle past its sliding expiry → expired
 * - an older token of a live session → reuse (theft) unless within the grace window
 */
export const decideRefresh = (
  session: { currentHash: string; rotatedAt: number; expiresAt: number; revokedAt: number | null },
  presentedHash: string,
  now: number,
): RefreshDecision => {
  if (session.revokedAt != null || session.expiresAt <= now) return "expired";
  if (presentedHash === session.currentHash) return "rotate";
  return now - session.rotatedAt <= GRACE_MS ? "rotate" : "reuse";
};
