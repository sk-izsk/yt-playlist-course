"use client";

import { CloudDownloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useUpdateCourses } from "@/client/hooks/useCourseUpdates";
import type { CourseDetail } from "@/shared/types";
import styles from "./course.module.css";
import { useSession } from "@/client/hooks/useSession";

/** Shown on the course page when the playlist has videos we haven't added yet. */
export const CourseUpdateBanner = ({ course }: { course: CourseDetail }) => {
  const { canEdit } = useSession(); // visitors read only
  const update = useUpdateCourses();
  const n = course.availableUpdates;
  if (!n) return null;

  if (!canEdit) return null;
  return (
    <div className={styles.updateBanner}>
      <CloudDownloadOutlined className={styles.updateIcon} />
      <span>
        <b>
          {n} new video{n > 1 ? "s" : ""}
        </b>{" "}
        in this playlist since you added it.
      </span>
      <Button type="primary" loading={update.isPending} onClick={() => update.mutate([course])}>
        Add {n} to course
      </Button>
    </div>
  );
};
