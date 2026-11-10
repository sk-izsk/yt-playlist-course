"use client";

import { DeleteOutlined, YoutubeOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Progress } from "antd";
import { useRouter } from "next/navigation";
import { useDeleteCourse } from "@/client/hooks/useCourse";
import { humanDuration } from "@/shared/format";
import type { CourseDetail } from "@/shared/types";
import { Pill } from "../common/SectionHeading";
import { TokenChip } from "../common/TokenChip";
import { SyncButton } from "./SyncButton";
import styles from "./course.module.css";

const youtubeUrl = (c: CourseDetail) =>
  c.kind === "playlist"
    ? `https://www.youtube.com/playlist?list=${c.youtubeId}`
    : `https://www.youtube.com/watch?v=${c.youtubeId}`;

export const CourseHeader = ({ course: c }: { course: CourseDetail }) => {
  const router = useRouter();
  const del = useDeleteCourse(c.token);
  const pct = c.lessonCount ? Math.round((c.completedCount / c.lessonCount) * 100) : 0;

  return (
    <header className={styles.header}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.cover} src={c.thumbnail} alt="" />
      <div className={styles.headerBody}>
        <Pill>
          {c.channel} · {humanDuration(c.totalSec)} · {c.lessonCount} lessons
        </Pill>
        <h1 className={`${styles.title} accent`}>{c.title}</h1>
        <div className={styles.actions}>
          <TokenChip token={c.token} />
          {c.kind === "playlist" && <SyncButton token={c.token} />}
          <Button href={youtubeUrl(c)} target="_blank" icon={<YoutubeOutlined />}>
            YouTube
          </Button>
          <Popconfirm
            title="Delete this course?"
            description="Progress, notes and quizzes are removed too."
            okButtonProps={{ danger: true, loading: del.isPending }}
            onConfirm={() => del.mutateAsync().then(() => router.push("/"))}
          >
            <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete course" />
          </Popconfirm>
        </div>
        <Progress percent={pct} format={() => `${c.completedCount}/${c.lessonCount} done`} />
      </div>
    </header>
  );
}
