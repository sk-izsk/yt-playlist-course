import { useMutation, useQueryClient } from "@tanstack/react-query"
import { App } from "antd"
import type { CourseSummary } from "@/shared/types"
import { api, errorMessage } from "../api"
import { qk } from "../query-keys"
import { useCourseAddedToasts } from "./useCourseAddedToasts"

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** Deletes many courses: cards vanish at once, one toast tracks progress, failures come back. */
export const useBulkDelete = () => {
  const qc = useQueryClient()
  const { message } = App.useApp()
  return useMutation({
    meta: { silentError: true },
    mutationFn: async (tokens: string[]) => {
      const results = await Promise.allSettled(tokens.map((t) => api.deleteCourse(t)))
      return results.filter((r) => r.status === "rejected").length
    },
    onMutate: async (tokens) => {
      message.open({
        key: "bulk-delete",
        type: "loading",
        content: `Deleting ${plural(tokens.length, "course")}…`,
        duration: 0,
      })
      await qc.cancelQueries({ queryKey: qk.courses })
      const prev = qc.getQueryData<CourseSummary[]>(qk.courses)
      if (prev) {
        qc.setQueryData(
          qk.courses,
          prev.filter((c) => !tokens.includes(c.token)),
        )
      }
    },
    onSuccess: (failed, tokens) => {
      const ok = tokens.length - failed
      message.open({
        key: "bulk-delete",
        type: failed ? "warning" : "success",
        content: failed
          ? `Deleted ${ok}, ${failed} failed — they're back in the list`
          : `Deleted ${plural(ok, "course")}`,
      })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.courses })
      qc.invalidateQueries({ queryKey: qk.notifications })
    },
  })
}

/** Adds links one by one (YouTube dislikes bursts) with a live "Adding 2 of 5…" toast. */
export const useBulkAdd = () => {
  const qc = useQueryClient()
  const { message } = App.useApp()
  const announce = useCourseAddedToasts()
  return useMutation({
    meta: { silentError: true },
    mutationFn: async (urls: string[]) => {
      const failures: string[] = []
      let created = 0
      for (const [i, url] of urls.entries()) {
        message.open({ key: "bulk-add", type: "loading", content: `Adding ${i + 1} of ${urls.length}…`, duration: 0 })
        try {
          const res = await api.addCourse(url)
          if (res.created) {
            created++
            announce(res)
          }
          qc.invalidateQueries({ queryKey: qk.courses }) // cards appear as each one lands
        } catch (err) {
          failures.push(`${url} — ${await errorMessage(err)}`)
        }
      }
      return { created, failures }
    },
    onSuccess: ({ created, failures }, urls) => {
      const skipped = urls.length - created - failures.length
      const parts = [
        `Added ${plural(created, "course")}`,
        skipped && `${skipped} already in library`,
        failures.length && `${failures.length} failed`,
      ]
      message.open({
        key: "bulk-add",
        type: failures.length ? "warning" : "success",
        content: parts.filter(Boolean).join(" · "),
        duration: 5,
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  })
}
