"use client";

import { Result, Skeleton } from "antd";
import { use } from "react";
import { useLesson } from "@/client/hooks/useLesson";
import { LessonView } from "@/components/lesson/LessonView";

const LessonPage = ({ params }: PageProps<"/lessons/[token]">) => {
  const { token } = use(params);
  const { data: lesson, isLoading, error } = useLesson(token);

  return (
    <div className="container" style={{ paddingBlock: "40px 96px", maxWidth: 1000 }}>
      {isLoading && <Skeleton.Node active style={{ width: "100%", height: 480 }} />}
      {error && <Result status="404" title="Lesson not found" subTitle={token} />}
      {lesson && <LessonView lesson={lesson} />}
    </div>
  );
}

export default LessonPage;
