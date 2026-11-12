"use client";

import { SyncOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useCheckAll, useUpdateCourses } from "@/client/hooks/useCourseUpdates";
import type { CourseSummary } from "@/shared/types";
import styles from "./notifications.module.css";

/** Courses with detected-but-not-added videos, each with its own Update button. */
export const UpdatesList = ({ courses, onNavigate }: { courses: CourseSummary[]; onNavigate: () => void }) => {
  const update = useUpdateCourses();
  const checkAll = useCheckAll();
  const waiting = courses.filter((c) => c.availableUpdates > 0);
  const busy = update.isPending ? update.variables : [];

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h3>Updates available</h3>
        {waiting.length > 1 && (
          <Button size="small" type="primary" loading={update.isPending} onClick={() => update.mutate(waiting)}>
            Update all
          </Button>
        )}
        <Button size="small" icon={<SyncOutlined spin={checkAll.isPending} />} onClick={() => checkAll.mutate(courses)}>
          Check now
        </Button>
      </header>

      {!waiting.length && <p className={styles.empty}>All playlists are up to date.</p>}
      {waiting.map((c) => (
        <div key={c.token} className={styles.update}>
          <Link href={`/courses/${c.token}`} onClick={onNavigate} className={styles.updateTitle}>
            {c.title}
          </Link>
          <span className={styles.updateCount}>+{c.availableUpdates} new</span>
          <Button
            size="small"
            type="primary"
            loading={busy?.includes(c)}
            disabled={update.isPending}
            onClick={() => update.mutate([c])}
          >
            Update
          </Button>
        </div>
      ))}
    </section>
  );
};
