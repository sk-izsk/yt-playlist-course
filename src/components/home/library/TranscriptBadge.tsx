import { Progress, Tooltip } from "antd"
import type { CourseSummary } from "@/shared/types"
import styles from "./library.module.css"

interface Props {
  course: CourseSummary
  /** "card": ring with "4/35" inside, beside the card title; "row": small ring + label for list view. */
  variant?: "card" | "row"
}

/** Live ring while a course's transcripts are still being fetched. */
export const TranscriptBadge = ({ course: c, variant = "card" }: Props) => {
  if (!c.transcriptsPending) {
    return null
  }
  const done = c.lessonCount - c.transcriptsPending
  const pct = c.lessonCount ? Math.round((done / c.lessonCount) * 100) : 0
  const count = `${done}/${c.lessonCount}`
  const card = variant === "card"

  return (
    <Tooltip title={`Transcripts ${count} — fetching in the background`}>
      <span className={card ? styles.ringCard : styles.ringRow}>
        <Progress
          type="circle"
          percent={pct}
          size={card ? 38 : 22}
          strokeWidth={card ? 11 : 12}
          showInfo={card}
          // Two lines ("103" over "/125") so 3-digit counts never spill outside the ring.
          format={() => (
            <span className={styles.ringCount}>
              <b>{done}</b>
              <small>/{c.lessonCount}</small>
            </span>
          )}
        />
        {!card && <span>Transcripts {count}</span>}
      </span>
    </Tooltip>
  )
}
