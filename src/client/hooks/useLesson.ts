import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { LessonDetail } from "@/shared/types"
import { api } from "../api"
import { qk } from "../query-keys"

export const useLesson = (token: string) => {
  return useQuery({ queryKey: qk.lesson(token), queryFn: () => api.lesson(token) })
}

/** Optimistic toggle — the checkmark should feel instant. */
export const useToggleComplete = (token: string, courseToken?: string) => {
  const qc = useQueryClient()
  const key = qk.lesson(token)
  return useMutation({
    mutationFn: (completed: boolean) => api.setCompleted(token, completed),
    onMutate: async (completed) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<LessonDetail>(key)
      if (prev) {
        qc.setQueryData<LessonDetail>(key, { ...prev, completed })
      }
      return { prev }
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: qk.courses })
      if (courseToken) {
        qc.invalidateQueries({ queryKey: qk.course(courseToken) })
      }
    },
  })
}
