"use client";

import { PushpinFilled } from "@ant-design/icons";
import { Progress } from "antd";
import Link from "next/link";
import { humanDuration } from "@/shared/format";
import type { CourseSummary } from "@/shared/types";
import { UpdateChip } from "../../common/UpdateChip";
import { progressPct } from "./CourseCard";
import { CourseMenu } from "./CourseMenu";
import { DragHandle } from "./DragHandle";
import { SelectMark, useSelectableClick } from "./SelectMark";
import type { HandleProps } from "./SortableItem";
import { TranscriptBadge } from "./TranscriptBadge";
import styles from "./library.module.css";

/** Compact list view row: handle · thumb · title/channel · progress · menu. */
export const CourseListRow = ({ course: c, handle }: { course: CourseSummary; handle: HandleProps | null }) => {
  const { selecting, selected, onClick } = useSelectableClick(c.token);

  return (
    <div className={styles.row} data-selected={selected}>
      {selecting ? <SelectMark token={c.token} /> : <DragHandle handle={handle} />}
      <Link href={`/courses/${c.token}`} className={styles.rowLink} onClick={onClick}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.rowThumb} src={c.thumbnail} alt="" loading="lazy" />
        <div className={styles.rowBody}>
          <span className={styles.rowTitle}>
            {c.pinned && <PushpinFilled className={styles.pin} />}
            {c.title}
            {c.newCount > 0 && <span className={styles.newPill}>{c.newCount} unseen</span>}
          </span>
          <span className={styles.channel}>
            {c.channel} · {humanDuration(c.totalSec)} · {c.lessonCount} lessons
          </span>
          <span className={styles.rowBadges}>
            <UpdateChip course={c} />
            <TranscriptBadge course={c} variant="row" />
          </span>
        </div>
        <div className={styles.rowProgress}>
          <span>
            {c.completedCount}/{c.lessonCount}
          </span>
          <Progress percent={progressPct(c)} size="small" showInfo={false} style={{ width: 110, margin: 0 }} />
        </div>
      </Link>
      {!selecting && <CourseMenu course={c} />}
    </div>
  );
};
