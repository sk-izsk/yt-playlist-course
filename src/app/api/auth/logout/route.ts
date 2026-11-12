import { cookies } from "next/headers"
import { handlePublic } from "@/server/http"
import { clearAuthCookies, REFRESH_COOKIE } from "@/server/auth/cookies"
import { endSession } from "@/server/auth/sessions"

export const POST = () =>
  handlePublic(async () => {
    await endSession((await cookies()).get(REFRESH_COOKIE)?.value)
    await clearAuthCookies()
    return { ok: true }
  })
