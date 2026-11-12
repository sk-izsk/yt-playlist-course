import { handleRead } from "@/server/http"
import { checkStaleCourses } from "@/server/services/sync-stale"

/**
 * Called once when the app opens: resumes transcripts and detects new videos (adds nothing).
 * Only for the owner: visitors opening the public app must not make the server hit YouTube.
 */
export const POST = () => handleRead((user) => (user ? checkStaleCourses() : []))
