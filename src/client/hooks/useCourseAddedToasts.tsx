import { App, Button } from "antd"
import { useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

const MAX_VISIBLE = 3

type Added = { token: string; title: string }

/**
 * "Course added" toasts with an Open button. At most 3 are on screen; adding more queues the
 * rest, and each dismissal (manual or the auto-timeout) lets the next one in.
 */
export const useCourseAddedToasts = () => {
  const { notification } = App.useApp()
  const router = useRouter()
  const state = useRef({ visible: 0, queue: [] as Added[] })

  const pump = useCallback(() => {
    const s = state.current
    const next = () => {
      while (s.visible < MAX_VISIBLE && s.queue.length) {
        const course = s.queue.shift()!
        const key = `course-added-${course.token}`
        let closed = false // onClose can fire twice (button + timeout); count it once
        s.visible++
        notification.success({
          key,
          title: "Course added",
          description: course.title,
          duration: 8,
          showProgress: true,
          pauseOnHover: true,
          actions: (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                notification.destroy(key)
                router.push(`/courses/${course.token}`)
              }}
            >
              Open course
            </Button>
          ),
          onClose: () => {
            if (closed) {
              return
            }
            closed = true
            s.visible--
            next()
          },
        })
      }
    }
    next()
  }, [notification, router])

  return useCallback(
    (course: Added) => {
      state.current.queue.push(course)
      pump()
    },
    [pump],
  )
}
