import { handleAgent } from "@/server/http"
import { listCourses, OWNER } from "@/server/repo/courses"

export const dynamic = "force-dynamic"

export const GET = (req: Request) => handleAgent(req, () => listCourses(OWNER))
