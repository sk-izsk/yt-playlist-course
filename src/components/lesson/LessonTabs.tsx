"use client";

import { Tabs } from "antd";
import { useTutorEnabled } from "@/client/hooks/useTutor";
import type { PlayerControls } from "@/client/hooks/useYouTubePlayer";
import type { LessonDetail } from "@/shared/types";
import { AskPanel } from "./AskPanel";
import { NotesPanel } from "./NotesPanel";
import { PracticePanel } from "./PracticePanel";
import { QuizPanel } from "./QuizPanel";
import { SummaryPanel } from "./SummaryPanel";

const count = (label: string, n: number) => (n ? `${label} · ${n}` : label);

export const LessonTabs = ({ lesson, player }: { lesson: LessonDetail; player: PlayerControls }) => {
  const tutor = useTutorEnabled(); // the "Ask" tab exists only when the server has an API key
  const ask = { key: "ask", label: "Ask", children: <AskPanel lesson={lesson} seek={player.seek} /> };
  return (
    <Tabs
      size="large"
      defaultActiveKey="summary"
      items={[
        { key: "summary", label: "Summary", children: <SummaryPanel lesson={lesson} seek={player.seek} /> },
        {
          key: "practice",
          label: count("Practice", lesson.practice.length),
          children: <PracticePanel items={lesson.practice} />,
        },
        {
          key: "quiz",
          label: count("Quiz", lesson.quiz.length),
          children: <QuizPanel items={lesson.quiz} seek={player.seek} />,
        },
        {
          key: "notes",
          label: count("My notes", lesson.notes.length),
          children: <NotesPanel lesson={lesson} player={player} />,
        },
        ...(tutor ? [ask] : []),
      ]}
    />
  );
};
