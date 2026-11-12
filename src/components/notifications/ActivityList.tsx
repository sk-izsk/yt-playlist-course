"use client";

import { CheckCircleFilled, CloseCircleFilled, CloudDownloadOutlined, InfoCircleFilled } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";
import { useNotificationActions } from "@/client/hooks/useNotifications";
import { timeAgo } from "@/shared/format";
import type { AppEvent, EventKind } from "@/shared/types";
import styles from "./notifications.module.css";

const ICON: Record<EventKind, ReactNode> = {
  update: <CloudDownloadOutlined />,
  success: <CheckCircleFilled />,
  error: <CloseCircleFilled />,
  info: <InfoCircleFilled />,
};

/** Recent server activity: transcripts ready, videos added, failures. */
export const ActivityList = ({ events, onNavigate }: { events: AppEvent[]; onNavigate: () => void }) => {
  const { clear } = useNotificationActions();

  return (
    <section className={styles.section}>
      <header className={styles.head}>
        <h3>Activity</h3>
        {events.length > 0 && (
          <Button size="small" type="text" loading={clear.isPending} onClick={() => clear.mutate()}>
            Clear all
          </Button>
        )}
      </header>

      {!events.length && <p className={styles.empty}>Nothing yet. Errors and finished jobs will show up here.</p>}
      {events.map((e) => {
        const body = (
          <>
            <span className={styles.icon} data-kind={e.kind}>
              {ICON[e.kind]}
            </span>
            <span className={styles.eventText}>
              <b>{e.title}</b>
              {e.body && <span>{e.body}</span>}
            </span>
            <time className={styles.time}>{timeAgo(e.createdAt)}</time>
          </>
        );
        return e.courseToken ? (
          <Link
            key={e.id}
            href={`/courses/${e.courseToken}`}
            onClick={onNavigate}
            className={styles.event}
            data-unread={!e.read}
          >
            {body}
          </Link>
        ) : (
          <div key={e.id} className={styles.event} data-unread={!e.read}>
            {body}
          </div>
        );
      })}
    </section>
  );
};
