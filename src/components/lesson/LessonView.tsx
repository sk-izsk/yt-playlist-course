"use client";

import { App } from "antd";
import { useCallback, useMemo } from "react";
import { useToggleComplete } from "@/client/hooks/useLesson";
import { useYouTubePlayer } from "@/client/hooks/useYouTubePlayer";
import type { LessonDetail } from "@/shared/types";
import { Crumbs } from "../common/Crumbs";
import { LessonHeader } from "./LessonHeader";
import { LessonTabs } from "./LessonTabs";
import styles from "./lesson.module.css";

export const LessonView = ({ lesson }: { lesson: LessonDetail }) => {
  const toggle = useToggleComplete(lesson.token, lesson.course.token);
  const { message } = App.useApp();
  const { mutate } = toggle;

  // Finishing the video marks the lesson done — one less click.
  const onEnded = useCallback(() => {
    if (lesson.completed) return;
    mutate(true);
    message.success("Lesson complete");
  }, [lesson.completed, mutate, message]);

  const { ref, seek, currentTime } = useYouTubePlayer({
    videoId: lesson.videoId,
    startSec: lesson.startSec,
    endSec: lesson.endSec,
    onEnded,
  });
  const player = useMemo(() => ({ seek, currentTime }), [seek, currentTime]);

  return (
    <>
      <Crumbs
        items={[
          { label: "Courses", href: "/#courses" },
          { label: lesson.course.title, href: `/courses/${lesson.course.token}` },
          { label: `Lesson ${lesson.position}` },
        ]}
      />
      <div className={styles.player} ref={ref} />
      <LessonHeader lesson={lesson} toggle={toggle} />
      <LessonTabs lesson={lesson} player={player} />
    </>
  );
}
