import { handleAgent } from "@/server/http"
import { listCourses } from "@/server/repo/courses"

export const dynamic = "force-dynamic"

export const GET = (req: Request) => handleAgent(req, () => listCourses())
