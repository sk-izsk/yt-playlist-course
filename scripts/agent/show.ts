import { getCourseDetail } from "@/server/repo/courses"
import { resolveId } from "@/server/repo/resolve"
import { lessonContext } from "@/server/services/agent-context"
import { formatCourse, formatLesson, modeFromFlags } from "@/shared/agent-format"

/**
 * Prints everything an LLM needs to reason about a course or lesson. Lessons print a compact
 * transcript by default; `--full` prints every caption line, `--head` only the first 3 minutes.
 */
export const showId = async (input: string, flags: string[] = []) => {
  const { type, token } = await resolveId(input)
  console.log(
    type === "course"
      ? formatCourse((await getCourseDetail(token))!)
      : formatLesson((await lessonContext(token, modeFromFlags(flags)))!),
  )
}
