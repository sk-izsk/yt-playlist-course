"use client";

import { App } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useToggleComplete } from "@/client/hooks/useLesson";
import { usePlayerShortcuts } from "@/client/hooks/usePlayerShortcuts";
import { useYouTubePlayer } from "@/client/hooks/useYouTubePlayer";
import { usePrefs } from "@/client/store/prefs";
import { routeStyle } from "@/shared/lines";
import type { LessonDetail } from "@/shared/types";
import { Crumbs } from "../common/Crumbs";
import { LessonHeader } from "./LessonHeader";
import { LessonTabs } from "./LessonTabs";
import { PlayerBar } from "./PlayerBar";
import styles from "./lesson.module.css";

export const LessonView = ({ lesson }: { lesson: LessonDetail }) => {
  const toggle = useToggleComplete(lesson.token, lesson.course.token);
  const { message } = App.useApp();
  const router = useRouter();
  const { speed, setSpeed, autoNext, theater, toggleTheater } = usePrefs();
  const { mutate } = toggle;
  const nextHref = lesson.nextToken ? `/lessons/${lesson.nextToken}` : null;

  // Finishing the video marks the lesson done, and with auto-next on, moves you along.
  const onEnded = useCallback(() => {
    if (!lesson.completed) mutate(true);
    if (autoNext && nextHref) {
      message.success("Lesson complete. Up next…");
      router.push(nextHref);
    } else if (!lesson.completed) message.success("Lesson complete");
  }, [lesson.completed, mutate, message, autoNext, nextHref, router]);

  const { ref, seek, currentTime, togglePlay, skip } = useYouTubePlayer({
    videoId: lesson.videoId,
    resumeKey: lesson.token,
    startSec: lesson.startSec,
    endSec: lesson.endSec,
    speed,
    onEnded,
    onSpeedChange: setSpeed,
  });
  const player = useMemo(() => ({ seek, currentTime }), [seek, currentTime]);

  usePlayerShortcuts({
    togglePlay,
    skip,
    speed,
    setSpeed,
    toggleTheater,
    next: nextHref ? () => router.push(nextHref) : null,
  });

  // The course's line colour flows into the badge, summary headings and timestamp chips.
  return (
    <div style={routeStyle(lesson.course.line)}>
      <Crumbs
        items={[
          { label: "Courses", href: "/#courses" },
          { label: lesson.course.title, href: `/courses/${lesson.course.token}` },
          { label: `Lesson ${lesson.position}` },
        ]}
      />
      <div className={styles.stage} data-theater={theater}>
        <div className={styles.player} ref={ref} />
      </div>
      <PlayerBar />
      <LessonHeader lesson={lesson} toggle={toggle} />
      <LessonTabs lesson={lesson} player={player} />
    </div>
  );
};
