import { handlePublic } from "@/server/http"
import { tutorEnabled } from "@/server/services/tutor"

export const dynamic = "force-dynamic"

/** { enabled }: the lesson page shows the "Ask" tab only when a key is configured. */
export const GET = () => handlePublic(() => ({ enabled: tutorEnabled() }))
