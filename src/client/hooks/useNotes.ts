import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "../api"
import { qk } from "../query-keys"

export const useNoteMutations = (lessonToken: string) => {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: qk.lesson(lessonToken) })

  const add = useMutation({
    mutationFn: ({ atSec, text }: { atSec: number; text: string }) => api.addNote(lessonToken, atSec, text),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: api.deleteNote, onSuccess: refresh })

  return { add, remove }
}
