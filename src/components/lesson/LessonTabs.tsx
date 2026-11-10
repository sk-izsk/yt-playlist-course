"use client";

import { Tabs } from "antd";
import type { PlayerControls } from "@/client/hooks/useYouTubePlayer";
import type { LessonDetail } from "@/shared/types";
import { NotesPanel } from "./NotesPanel";
import { PracticePanel } from "./PracticePanel";
import { QuizPanel } from "./QuizPanel";
import { SummaryPanel } from "./SummaryPanel";

const count = (label: string, n: number) => (n ? `${label} · ${n}` : label);

export const LessonTabs = ({ lesson, player }: { lesson: LessonDetail; player: PlayerControls }) => {
  return (
    <Tabs
      size="large"
      defaultActiveKey="summary"
      items={[
        { key: "summary", label: "Summary", children: <SummaryPanel lesson={lesson} seek={player.seek} /> },
        { key: "practice", label: count("Practice", lesson.practice.length), children: <PracticePanel items={lesson.practice} /> },
        { key: "quiz", label: count("Quiz", lesson.quiz.length), children: <QuizPanel items={lesson.quiz} seek={player.seek} /> },
        { key: "notes", label: count("My notes", lesson.notes.length), children: <NotesPanel lesson={lesson} player={player} /> },
      ]}
    />
  );
}
