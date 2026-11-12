import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../api"
import { qk } from "../query-keys"

export const useCourses = () =>
  useQuery({
    queryKey: qk.courses,
    queryFn: api.courses,
    // Poll only while some course is still fetching transcripts (drives card progress + the "ready" toast).
    refetchInterval: (q) => (q.state.data?.some((c) => c.transcriptsPending > 0) ? 3000 : false),
    // Keep polling in a background browser tab so the toast is waiting when you come back.
    refetchIntervalInBackground: true,
  })

export const useAddCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.addCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.courses }),
  })
}
