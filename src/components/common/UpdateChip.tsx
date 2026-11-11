"use client";

import { CloudDownloadOutlined, LoadingOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { MouseEvent } from "react";
import { useUpdateCourses } from "@/client/hooks/useCourseUpdates";
import type { CourseSummary } from "@/shared/types";
import styles from "./common.module.css";
import { useSession } from "@/client/hooks/useSession";

/** "+3 new videos" pill — click to add them. Safe inside a card link: it never navigates. */
export const UpdateChip = ({ course }: { course: CourseSummary }) => {
  const { canEdit } = useSession(); // visitors read only
  const update = useUpdateCourses();
  if (!course.availableUpdates) return null;

  const run = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!update.isPending) update.mutate([course]);
  };

  const n = course.availableUpdates;
  if (!canEdit) return null;
  return (
    <Tooltip title={`${n} new video${n > 1 ? "s" : ""} in this playlist — click to add`}>
      <button type="button" className={styles.updateChip} onClick={run} aria-label={`Add ${n} new videos`}>
        {update.isPending ? <LoadingOutlined /> : <CloudDownloadOutlined />} +{n} new
      </button>
    </Tooltip>
  );
};
