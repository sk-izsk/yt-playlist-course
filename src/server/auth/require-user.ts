import { cookies } from "next/headers";
import { HttpError } from "../http-error";
import { ACCESS_COOKIE } from "./cookies";
import { verifyAccess, type AuthUser } from "./tokens";

/**
 * The real auth check (proxy.ts only redirects visitors without a cookie). Stateless: a revoked
 * session keeps working until its access token expires (≤ 15 min). The 401 message tells the client
 * whether to refresh ("token_expired") or log in again ("unauthenticated").
 */
export const requireUser = async (): Promise<AuthUser> => {
  const jwt = (await cookies()).get(ACCESS_COOKIE)?.value;
  const res = jwt ? await verifyAccess(jwt) : "invalid";
  if (res === "expired") throw new HttpError(401, "token_expired");
  if (res === "invalid") throw new HttpError(401, "unauthenticated");
  return res;
};
