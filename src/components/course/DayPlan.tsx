"use client";

import { Button, Segmented } from "antd";
import { useMemo, useState } from "react";
import { splitIntoDays, todayIndex } from "@/client/lib/plan";
import { DAILY_OPTIONS, usePrefs } from "@/client/store/prefs";
import { humanDuration } from "@/shared/format";
import type { LessonRow as Lesson } from "@/shared/types";
import { LessonRow } from "./LessonRow";
import styles from "./course.module.css";

export const DayPlan = ({ lessons }: { lessons: Lesson[] }) => {
  const { dailyMinutes, setDailyMinutes } = usePrefs();
  const days = useMemo(() => splitIntoDays(lessons, dailyMinutes), [lessons, dailyMinutes]);
  const today = todayIndex(days);
  const [picked, setPicked] = useState<number | null>(null);
  const active = days[Math.min(picked ?? today, days.length - 1)];

  if (!active) return null;
  return (
    <section>
      <div className={styles.planHead}>
        <h2>The plan</h2>
        <span className={styles.muted}>
          {days.length} days at {dailyMinutes} min a day
        </span>
        <Segmented
          value={dailyMinutes}
          onChange={(v) => setDailyMinutes(Number(v))}
          options={DAILY_OPTIONS.map((m) => ({ value: m, label: `${m} min` }))}
        />
      </div>

      <div className={styles.days}>
        {days.map((d) => (
          <Button
            key={d.index}
            type={d.index === active.index ? "primary" : "default"}
            onClick={() => setPicked(d.index)}
          >
            Day {d.index + 1}
            {d.done ? " ✓" : d.index === today ? " •" : ""}
          </Button>
        ))}
      </div>

      <div className={styles.dayHead}>
        <h3>Day {active.index + 1}</h3>
        <span className="mono">
          {active.lessons.length} lessons · {humanDuration(active.totalSec)}
        </span>
        {active.index === today && <span className={styles.today}>Today</span>}
      </div>
      <div className={styles.lessonList}>
        {active.lessons.map((l) => <LessonRow key={l.token} lesson={l} />)}
      </div>
    </section>
  );
}
