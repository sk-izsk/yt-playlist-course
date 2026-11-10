"use client";

import { Button, Empty } from "antd";
import { useCopy } from "@/client/hooks/useCopy";
import { displayId } from "@/shared/format";
import type { LessonDetail } from "@/shared/types";
import { MarkdownView } from "../common/MarkdownView";

export const SummaryPanel = ({ lesson, seek }: { lesson: LessonDetail; seek: (sec: number) => void }) => {
  const copy = useCopy();

  if (!lesson.summary) {
    const prompt = `Fill notes for lesson ${lesson.token}`;
    return (
      <Empty description={`No notes yet. Ask your agent: "Fill notes for lesson ${displayId(lesson.token)}"`}>
        <Button type="primary" onClick={() => copy(prompt, "Prompt copied")}>
          Copy prompt
        </Button>
      </Empty>
    );
  }

  return <MarkdownView onSeek={seek}>{lesson.summary}</MarkdownView>;
};
