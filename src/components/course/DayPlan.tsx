"use client"

import { CheckOutlined } from "@ant-design/icons"
import { Button, Segmented } from "antd"
import { useEffect, useMemo, useRef, useState } from "react"
import { splitIntoDays, todayIndex } from "@/client/lib/plan"
import { DAILY_OPTIONS, usePrefs } from "@/client/store/prefs"
import { humanDuration } from "@/shared/format"
import type { LessonRow as Lesson } from "@/shared/types"
import { LessonRow } from "./LessonRow"
import styles from "./course.module.css"
import stations from "./stations.module.css"

export const DayPlan = ({ lessons }: { lessons: Lesson[] }) => {
  const { dailyMinutes, setDailyMinutes } = usePrefs()
  const days = useMemo(() => splitIntoDays(lessons, dailyMinutes), [lessons, dailyMinutes])
  const today = todayIndex(days)
  const [picked, setPicked] = useState<number | null>(null)
  const active = days[Math.min(picked ?? today, days.length - 1)]
  const nextToken = lessons.find((l) => !l.completed)?.token
  const strip = useRef<HTMLDivElement>(null)

  // On phones the pills are a horizontal strip: keep the selected day in view. scrollLeft, not
  // scrollIntoView, so the page itself never jumps. A no-op on desktop, where the pills wrap.
  const activeIndex = active?.index ?? 0
  useEffect(() => {
    const el = strip.current
    const pill = el?.children[activeIndex] as HTMLElement | undefined
    if (el && pill) {
      el.scrollLeft = pill.offsetLeft - el.clientWidth / 2 + pill.offsetWidth / 2
    }
  }, [activeIndex])

  if (!active) {
    return null
  }
  return (
    <section>
      <div className={styles.planHead}>
        <h2>Your route</h2>
        <span className={styles.muted}>
          {days.length} days at {dailyMinutes} min a day
        </span>
        <Segmented
          value={dailyMinutes}
          onChange={(v) => setDailyMinutes(Number(v))}
          options={DAILY_OPTIONS.map((m) => ({ value: m, label: `${m} min` }))}
        />
      </div>

      <div ref={strip} className={styles.days} role="tablist" aria-label="Days">
        {days.map((d) => {
          const progress = d.done ? "done" : d.lessons.some((l) => l.completed) ? "partial" : undefined
          return (
            <Button
              key={d.index}
              role="tab"
              aria-selected={d.index === active.index}
              aria-label={`Day ${d.index + 1}${progress ? ` (${progress === "done" ? "completed" : "in progress"})` : ""}`}
              data-progress={progress}
              className={styles.day}
              icon={d.done ? <CheckOutlined /> : undefined}
              onClick={() => setPicked(d.index)}
            >
              Day {d.index + 1}
            </Button>
          )
        })}
      </div>

      <div className={styles.dayHead}>
        <h3>Day {active.index + 1}</h3>
        <span>
          {active.lessons.length} lesson{active.lessons.length === 1 ? "" : "s"}
        </span>
        <span className="mono">{humanDuration(active.totalSec)}</span>
        {active.index === today && <span className={styles.today}>Today</span>}
      </div>
      <div className={stations.list}>
        {active.lessons.map((l) => (
          <LessonRow key={l.token} lesson={l} next={l.token === nextToken} />
        ))}
      </div>
    </section>
  )
}
