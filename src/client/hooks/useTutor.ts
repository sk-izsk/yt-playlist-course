import { useQuery } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { api } from "../api"

export type TutorTurn = { role: "user" | "assistant"; content: string }

export const useTutorEnabled = () =>
  useQuery({ queryKey: ["tutor"], queryFn: api.tutor, staleTime: Infinity }).data?.enabled ?? false

/**
 * One chat per lesson, kept in memory only. The answer streams in as plain text; fetch (not ky) because
 * ky buffers the body. ponytail: no refresh-on-401 here, the route works logged out anyway.
 */
export const useTutorChat = (lessonToken: string) => {
  const [turns, setTurns] = useState<TutorTurn[]>([])
  const [busy, setBusy] = useState(false)

  const ask = useCallback(
    async (question: string) => {
      const history = turns
      setTurns([...history, { role: "user", content: question }, { role: "assistant", content: "" }])
      setBusy(true)
      const append = (text: string) =>
        setTurns((t) => [...t.slice(0, -1), { role: "assistant", content: t[t.length - 1].content + text }])
      try {
        const res = await fetch(`/api/lessons/${lessonToken}/ask`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question, history }),
        })
        if (!res.ok || !res.body) {
          const { error } = (await res.json().catch(() => ({}))) as { error?: string }
          return append(`_${error ?? `The tutor failed (${res.status}).`}_`)
        }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        for (let r = await reader.read(); !r.done; r = await reader.read()) {
          append(r.value)
        }
      } catch {
        append("_Network error. Try again._")
      } finally {
        setBusy(false)
      }
    },
    [lessonToken, turns],
  )

  return { turns, busy, ask, reset: () => setTurns([]) }
}
