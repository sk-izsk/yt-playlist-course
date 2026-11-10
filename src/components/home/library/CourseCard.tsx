"use client";

import { PushpinFilled } from "@ant-design/icons";
import { Progress, Tag } from "antd";
import Link from "next/link";
import { humanDuration } from "@/shared/format";
import type { CourseSummary } from "@/shared/types";
import { UpdateChip } from "../../common/UpdateChip";
import { CourseMenu } from "./CourseMenu";
import { DragHandle } from "./DragHandle";
import { SelectMark, useSelectableClick } from "./SelectMark";
import type { HandleProps } from "./SortableItem";
import { TranscriptBadge } from "./TranscriptBadge";
import styles from "./library.module.css";

export const progressPct = (c: CourseSummary) =>
  c.lessonCount ? Math.round((c.completedCount / c.lessonCount) * 100) : 0;

/** Grid view card. The tools (drag + menu) sit outside the link so they don't navigate. */
export const CourseCard = ({ course: c, handle }: { course: CourseSummary; handle: HandleProps | null }) => {
  const { selecting, selected, onClick } = useSelectableClick(c.token);

  return (
    <div className={styles.card} data-selected={selected}>
      <Link href={`/courses/${c.token}`} className={styles.cardLink} onClick={onClick}>
        <div className={styles.thumb}>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbs, no optimisation needed locally */}
          <img src={c.thumbnail} alt="" loading="lazy" />
          <span className={`${styles.duration} mono`}>{humanDuration(c.totalSec)}</span>
          <div className={styles.thumbBadges}>
            <UpdateChip course={c} />
            {c.newCount > 0 && <Tag color="green">{c.newCount} unseen</Tag>}
          </div>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.cardMeta}>
            <div className={styles.cardText}>
              <h3 className={styles.cardTitle}>
                {c.pinned && <PushpinFilled className={styles.pin} />}
                {c.title}
              </h3>
              <span className={styles.channel}>{c.channel}</span>
            </div>
            <TranscriptBadge course={c} />
          </div>
          <div className={styles.cardFoot}>
            <span>
              {c.completedCount}/{c.lessonCount} lessons
            </span>
            <Progress percent={progressPct(c)} size="small" showInfo={false} style={{ width: 90, margin: 0 }} />
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
  );
};
