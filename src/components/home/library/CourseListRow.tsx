"use client"

import { PushpinFilled } from "@ant-design/icons"
import Link from "next/link"
import { humanDuration } from "@/shared/format"
import { routeStyle } from "@/shared/lines"
import type { CourseSummary } from "@/shared/types"
import { LineBadge } from "../../common/LineBadge"
import { RouteBar } from "../../common/RouteBar"
import { UpdateChip } from "../../common/UpdateChip"
import { CourseMenu } from "./CourseMenu"
import { DragHandle } from "./DragHandle"
import { SelectMark, useSelectableClick } from "./SelectMark"
import type { HandleProps } from "./SortableItem"
import { TranscriptBadge } from "./TranscriptBadge"
import styles from "./library.module.css"

/** Compact list view row: handle, line badge, title and route, menu. */
export const CourseListRow = ({ course: c, handle }: { course: CourseSummary; handle: HandleProps | null }) => {
  const { selecting, selected, onClick } = useSelectableClick(c.token)

  return (
    <div className={styles.row} data-selected={selected} style={routeStyle(c.line)}>
      {selecting ? <SelectMark token={c.token} /> : <DragHandle handle={handle} />}
      <Link href={`/courses/${c.token}`} className={styles.rowLink} onClick={onClick}>
        <LineBadge title={c.title} />
        <div className={styles.rowBody}>
          <span className={styles.rowTitle}>
            {c.pinned && <PushpinFilled className={styles.pin} aria-label="Pinned" />}
            {c.title}
            {c.newCount > 0 && <span className={styles.newPill}>{c.newCount} unseen</span>}
          </span>
          <span className={styles.rowMeta}>
            <span>{c.channel}</span>
            <span className="mono">{humanDuration(c.totalSec)}</span>
            <span>{c.lessonCount} lessons</span>
          </span>
          <span className={styles.rowBadges}>
            <UpdateChip course={c} />
            <TranscriptBadge course={c} variant="row" />
          </span>
        </div>
        <div className={styles.rowProgress}>
          <RouteBar done={c.completedCount} total={c.lessonCount} maxStops={7} />
          <span className="mono">
            {c.completedCount}/{c.lessonCount}
          </span>
        </div>
      </Link>
      {!selecting && <CourseMenu course={c} />}
    </div>
  )
}
