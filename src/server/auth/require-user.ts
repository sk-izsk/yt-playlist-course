import { cookies } from "next/headers";
import { HttpError } from "../http-error";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccess, type AuthUser } from "./tokens";

/**
 * The auth check for every write (reads are public). Stateless: a revoked session keeps working until its
 * access token expires (≤ 15 min). "token_expired" tells the client to refresh; anything else means log in.
 */
export const requireUser = async (): Promise<AuthUser> => {
  const user = await optionalUser();
  if (!user) throw new HttpError(401, "Log in to make changes");
  return user;
};

/**
 * Reading is public: visitors without a cookie get null. An *expired* token still answers 401 "token_expired"
 * so a logged-in browser refreshes instead of silently browsing as a visitor.
 */
export const optionalUser = async (): Promise<AuthUser | null> => {
  const jwt = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!jwt) return null;
  const res = await verifyAccess(jwt);
  if (res === "expired") throw new HttpError(401, "token_expired");
  return res === "invalid" ? null : res;
};
