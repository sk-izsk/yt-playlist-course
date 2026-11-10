import { CheckOutlined, LoadingOutlined, PlayCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { displayId, humanDuration } from "@/shared/format";
import type { LessonRow as Lesson } from "@/shared/types";
import styles from "./course.module.css";

const Status = ({ lesson: l }: { lesson: Lesson }) => {
  if (l.transcriptStatus === "pending") return <span className={styles.statusMuted}><LoadingOutlined /> Transcript</span>;
  if (l.kind === "light") return <span className={styles.statusMuted}><CheckOutlined /> Light notes</span>;
  if (l.hasNotes) return <span className={styles.statusOk}><CheckOutlined /> Notes and quiz</span>;
  return <span className={styles.statusWarn}>Needs notes</span>;
};

export const LessonRow = ({ lesson: l }: { lesson: Lesson }) => (
  <Link href={`/lessons/${l.token}`} className={styles.row} data-done={l.completed} data-kind={l.kind}>
    <span className={styles.num}>{l.completed ? <CheckOutlined /> : l.position}</span>
    <div className={styles.rowBody}>
      <span className={styles.rowTitle}>
        {l.title}
        {l.isNew && <span className={styles.newDot}>new</span>}
        {l.kind === "light" && <span className={styles.optional}>optional</span>}
      </span>
      <span className={`${styles.rowToken} mono`}>{displayId(l.token)}</span>
    </div>
    <div className={styles.rowMeta}>
      <span className="mono">{humanDuration(l.durationSec)}</span>
      <Status lesson={l} />
    </div>
    <PlayCircleOutlined className={styles.play} />
  </Link>
);
