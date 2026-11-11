"use client";

import { DeleteOutlined, YoutubeOutlined } from "@ant-design/icons";
import { Button, Popconfirm } from "antd";
import { useRouter } from "next/navigation";
import { useDeleteCourse } from "@/client/hooks/useCourse";
import { useSession } from "@/client/hooks/useSession";
import { humanDuration } from "@/shared/format";
import { lineFor } from "@/shared/lines";
import type { CourseDetail } from "@/shared/types";
import { LineBadge } from "../common/LineBadge";
import { RouteBar } from "../common/RouteBar";
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
  const { canEdit } = useSession();

  return (
    <header className={styles.header}>
      <LineBadge title={c.title} size="lg" />
      <div className={styles.headerBody}>
        <h1 className={styles.title}>{c.title}</h1>
        <div className={styles.meta}>
          <span>{c.channel}</span>
          <span className="mono">{humanDuration(c.totalSec)}</span>
          <span>{c.lessonCount} lessons</span>
          <span>{lineFor(c.line).name} line</span>
        </div>
        <div className={styles.headerRoute}>
          <RouteBar done={c.completedCount} total={c.lessonCount} maxStops={14} />
          <span className="mono">
            {c.completedCount}/{c.lessonCount}
          </span>
        </div>
        <div className={styles.actions}>
          <TokenChip token={c.token} />
          {c.kind === "playlist" && <SyncButton token={c.token} />}
          <Button href={youtubeUrl(c)} target="_blank" icon={<YoutubeOutlined />}>
            YouTube
          </Button>
          {canEdit && (
            <Popconfirm
              title="Delete this course?"
              description="Progress, notes and quizzes are removed too."
              okButtonProps={{ danger: true, loading: del.isPending }}
              onConfirm={() => del.mutateAsync().then(() => router.push("/"))}
            >
              <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete course" />
            </Popconfirm>
          )}
        </div>
      </div>
      <div className={styles.cover}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.thumbnail} alt="" />
      </div>
    </header>
  );
};
