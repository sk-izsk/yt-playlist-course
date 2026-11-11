import { cookies } from "next/headers";
import { IDLE_MS } from "./tokens";

export const ACCESS_COOKIE = "tw_at";
export const REFRESH_COOKIE = "tw_rt";

// Both cookies live as long as the idle window: an expired JWT must still be sent so the API can
// answer "token_expired" (refresh) instead of "unauthenticated" (log in).
const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Plain http on localhost; Vercel is https. Safari drops Secure cookies on http://localhost.
  secure: process.env.NODE_ENV === "production",
  maxAge: IDLE_MS / 1000,
};

export const setAuthCookies = async (accessJwt: string, refreshToken: string) => {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessJwt, { ...base, path: "/" });
  // Only the auth endpoints ever see the long-lived token.
  jar.set(REFRESH_COOKIE, refreshToken, { ...base, path: "/api/auth" });
};

export const clearAuthCookies = async () => {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", { ...base, path: "/", maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { ...base, path: "/api/auth", maxAge: 0 });
};
