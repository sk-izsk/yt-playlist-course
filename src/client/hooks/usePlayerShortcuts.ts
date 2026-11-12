import { useEffect, useRef } from "react"
import { SPEEDS } from "../store/prefs"

interface Actions {
  togglePlay: () => void
  skip: (delta: number) => void
  speed: number
  setSpeed: (s: number) => void
  toggleTheater: () => void
  next: (() => void) | null
}

/** Same keys as YouTube, so muscle memory works whether or not the iframe has focus. */
export const SHORTCUTS: [string, string][] = [
  ["K", "Play / pause"],
  ["J / L", "Back / forward 10s"],
  ["← / →", "Back / forward 5s"],
  ["< / >", "Slower / faster"],
  ["T", "Theater mode"],
  ["N", "Next lesson"],
]

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))

const step = (speed: number, dir: 1 | -1) => {
  const i = SPEEDS.findIndex((s) => s >= speed)
  return SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, (i < 0 ? SPEEDS.length - 1 : i) + dir))]
}

// Keys only reach the page when the YouTube iframe doesn't have focus; inside it, YouTube's own keys apply.
export const usePlayerShortcuts = (actions: Actions) => {
  const latest = useRef(actions)
  useEffect(() => {
    latest.current = actions
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) {
        return
      }
      const a = latest.current
      const map: Record<string, () => void> = {
        k: a.togglePlay,
        j: () => a.skip(-10),
        l: () => a.skip(10),
        ArrowLeft: () => a.skip(-5),
        ArrowRight: () => a.skip(5),
        "<": () => a.setSpeed(step(a.speed, -1)),
        ">": () => a.setSpeed(step(a.speed, 1)),
        t: a.toggleTheater,
        n: () => a.next?.(),
      }
      const run = map[e.key.length === 1 ? e.key.toLowerCase() : e.key] ?? map[e.key]
      if (!run) {
        return
      }
      e.preventDefault()
      run()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}
