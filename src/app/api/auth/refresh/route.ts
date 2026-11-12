import { cookies } from "next/headers";
import { handlePublic, HttpError } from "@/server/http";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/server/auth/cookies";
import { refreshSession } from "@/server/auth/sessions";

/** Rotates the refresh token and issues a new access token; 401 means log in again. */
export const POST = () =>
  handlePublic(async () => {
    const token = (await cookies()).get(REFRESH_COOKIE)?.value;
    const issued = token ? await refreshSession(token) : null;
    if (!issued) {
      await clearAuthCookies();
      throw new HttpError(401, "unauthenticated");
    }
    await setAuthCookies(issued.access, issued.refresh);
    return { ok: true };
  });
