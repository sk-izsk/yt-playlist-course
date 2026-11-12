"use client"

import { PushpinFilled } from "@ant-design/icons"
import { Tag } from "antd"
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

/** Grid view card, painted in the course's line colour. Tools sit outside the link so they don't navigate. */
export const CourseCard = ({ course: c, handle }: { course: CourseSummary; handle: HandleProps | null }) => {
  const { selecting, selected, onClick } = useSelectableClick(c.token)

  return (
    <div className={styles.card} data-selected={selected} style={routeStyle(c.line)}>
      <Link href={`/courses/${c.token}`} className={styles.cardLink} onClick={onClick}>
        <div className={styles.thumb}>
          <img src={c.thumbnail} alt="" loading="lazy" />
          <span className={`${styles.duration} mono`}>{humanDuration(c.totalSec)}</span>
          <div className={styles.thumbBadges}>
            <UpdateChip course={c} />
            {c.newCount > 0 && <Tag color="green">{c.newCount} unseen</Tag>}
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <LineBadge title={c.title} size="sm" />
            <div className={styles.cardText}>
              <h3 className={styles.cardTitle}>
                {c.pinned && <PushpinFilled className={styles.pin} aria-label="Pinned" />}
                {c.title}
              </h3>
              <span className={styles.channel}>{c.channel}</span>
            </div>
            <TranscriptBadge course={c} />
          </div>
          <div className={styles.cardFoot}>
            <RouteBar done={c.completedCount} total={c.lessonCount} />
            <span className="mono">
              {c.completedCount}/{c.lessonCount}
            </span>
          </div>
        </div>
      </Link>
      <div className={styles.tools} data-selecting={selecting}>
        {selecting ? (
          <SelectMark token={c.token} />
        ) : (
          <>
            <DragHandle handle={handle} />
            <CourseMenu course={c} />
          </>
        )}
      </div>
    </div>
  )
}
