import { CheckOutlined, LoadingOutlined, PlayCircleOutlined } from "@ant-design/icons"
import Link from "next/link"
import { displayId, humanDuration } from "@/shared/format"
import type { LessonRow as Lesson } from "@/shared/types"
import styles from "./stations.module.css"

const Status = ({ lesson: l }: { lesson: Lesson }) => {
  if (l.transcriptStatus === "pending") {
    return (
      <span className={styles.status} data-tone="muted">
        <LoadingOutlined /> Fetching transcript
      </span>
    )
  }
  if (l.kind === "light") {
    return (
      <span className={styles.status} data-tone="muted">
        Light notes
      </span>
    )
  }
  if (l.hasNotes) {
    return (
      <span className={styles.status} data-tone="ok">
        Notes and quiz
      </span>
    )
  }
  return (
    <span className={styles.status} data-tone="warn">
      Needs notes
    </span>
  )
}

/** One station on the course line. `next` marks where you are. */
export const LessonRow = ({ lesson: l, next = false }: { lesson: Lesson; next?: boolean }) => (
  <Link
    href={`/lessons/${l.token}`}
    className={styles.row}
    data-done={l.completed}
    data-next={next}
    data-kind={l.kind}
    aria-current={next ? "step" : undefined}
  >
    <span className={styles.stop} aria-hidden>
      {l.completed && <CheckOutlined />}
    </span>
    <div className={styles.body}>
      <span className={styles.title}>
        {l.title}
        {l.isNew && (
          <span className={styles.tag} data-tone="new">
            new
          </span>
        )}
        {l.kind === "light" && <span className={styles.tag}>optional</span>}
      </span>
      <span className={styles.sub}>
        <span>Lesson {l.position}</span>
        <span className="mono">{displayId(l.token)}</span>
      </span>
    </div>
    <Status lesson={l} />
    <span className={`${styles.duration} mono`}>{humanDuration(l.durationSec)}</span>
    <PlayCircleOutlined className={styles.play} />
  </Link>
)
