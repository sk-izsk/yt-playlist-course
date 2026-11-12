import styles from "./route.module.css"

interface Props {
  done: number
  total: number
  /** How many stations to draw; long courses are sampled so the bar stays readable. */
  maxStops?: number
  label?: string
}

/**
 * Progress drawn as a metro line: travelled part is solid in the course colour,
 * the rest is a pale track; stations mark lessons, the ring marks where you are.
 * Colour comes from var(--route) on an ancestor.
 */
export const RouteBar = ({ done, total, maxStops = 9, label }: Props) => {
  const pct = total ? Math.min(100, (done / total) * 100) : 0
  const stops = Math.min(total, maxStops)
  const positions = Array.from({ length: stops }, (_, i) => (stops > 1 ? (i / (stops - 1)) * 100 : 0))

  return (
    <div
      className={styles.route}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={label ?? `${done} of ${total} lessons done`}
    >
      <span className={styles.track} />
      <span className={styles.travelled} style={{ width: `${pct}%` }} />
      {positions.map((p) => (
        <span key={p} className={styles.stop} data-passed={p <= pct} style={{ left: `${p}%` }} />
      ))}
      {total > 0 && done < total && <span className={styles.here} style={{ left: `${pct}%` }} />}
    </div>
  )
}
