"use client";

import { Button, Progress } from "antd";
import { useCopy } from "@/client/hooks/useCopy";
import { displayId } from "@/shared/format";
import type { CourseDetail } from "@/shared/types";
import styles from "./course.module.css";

const Bar = ({ label, done, total }: { label: string; done: number; total: number }) => (
  <div className={styles.bar}>
    <span className={styles.barLabel}>{label}</span>
    <Progress percent={total ? Math.round((done / total) * 100) : 0} format={() => `${done}/${total}`} />
  </div>
);

/** Transcript + notes progress, and the prompt to hand your agent while notes are missing. */
export const CourseProgress = ({ course }: { course: CourseDetail }) => {
  const copy = useCopy();
  const total = course.lessonCount;
  const fetched = course.lessons.filter((l) => l.transcriptStatus !== "pending").length;
  const noted = total - course.pendingNotes;
  if (fetched === total && noted === total) return null;

  const nextUp = course.lessons.find((l) => !l.hasNotes);
  const prompt = `Fill notes for course ${course.token}`;

  return (
    <div className={styles.banner}>
      <div className={styles.bars}>
        {fetched < total && <Bar label="Transcripts" done={fetched} total={total} />}
        <Bar label="AI notes" done={noted} total={total} />
        {nextUp && (
          <span className={styles.muted}>
            {noted ? `Notes done up to lesson ${nextUp.position - 1}. ` : ""}
            Ask your agent: <b className="mono">Fill notes for course {displayId(course.token)}</b>
          </span>
        )}
      </div>
      {nextUp && (
        <Button type="primary" onClick={() => copy(prompt, "Prompt copied")}>
          Copy prompt
        </Button>
      )}
    </div>
  );
};
