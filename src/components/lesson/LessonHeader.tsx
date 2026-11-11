"use client";

import { CheckOutlined, LeftOutlined, RightOutlined, YoutubeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import type { useToggleComplete } from "@/client/hooks/useLesson";
import { useSession } from "@/client/hooks/useSession";
import { humanDuration, watchUrl } from "@/shared/format";
import type { LessonDetail } from "@/shared/types";
import { TokenChip } from "../common/TokenChip";
import styles from "./lesson.module.css";

interface Props {
  lesson: LessonDetail;
  toggle: ReturnType<typeof useToggleComplete>;
}

export const LessonHeader = ({ lesson: l, toggle }: Props) => {
  const { canEdit } = useSession(); // progress is the owner's; visitors just watch
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <span className={styles.position}>Lesson {l.position}</span>
        <span className="mono">{humanDuration(l.durationSec)}</span>
        <TokenChip token={l.token} />
        {l.kind === "light" && <span className={styles.light}>Light lesson · optional</span>}
      </div>
      <h1 className={styles.title}>{l.title}</h1>

      <div className={styles.actions}>
        {canEdit && (
          <Button
            type={l.completed ? "default" : "primary"}
            icon={<CheckOutlined />}
            loading={toggle.isPending}
            onClick={() => toggle.mutate(!l.completed)}
          >
            {l.completed ? "Completed — undo" : "Mark complete"}
          </Button>
        )}
        <Button icon={<YoutubeOutlined />} href={watchUrl(l.videoId, l.startSec ?? 0)} target="_blank">
          Open on YouTube
        </Button>
        <span className={styles.spacer} />
        <NavButton token={l.prevToken} icon={<LeftOutlined />} label="Previous" />
        <NavButton token={l.nextToken} icon={<RightOutlined />} label="Next" end />
      </div>
    </div>
  );
}

const NavButton = ({ token, icon, label, end }: { token: string | null; icon: ReactNode; label: string; end?: boolean }) => {
  const btn = (
    <Button disabled={!token} icon={icon} iconPlacement={end ? "end" : "start"}>
      {label}
    </Button>
  );
  return token ? <Link href={`/lessons/${token}`}>{btn}</Link> : btn;
}
