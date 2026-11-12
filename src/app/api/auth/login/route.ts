import { handlePublic, HttpError, readJson } from "@/server/http"
import { setAuthCookies } from "@/server/auth/cookies"
import { checkLogin } from "@/server/auth/login"
import { startSession } from "@/server/auth/sessions"

/** Body: { username, password }. Sets the access + refresh cookies. */
export const POST = (req: Request) =>
  handlePublic(async () => {
    const { username, password } = await readJson<{ username?: string; password?: string }>(req)
    if (!username?.trim() || !password) {
      throw new HttpError(400, "Enter a username and password")
    }
    const user = await checkLogin(username.trim(), password)
    const { access, refresh } = await startSession({ id: user.id, role: user.role })
    await setAuthCookies(access, refresh)
    return { username: user.username, role: user.role }
  })
