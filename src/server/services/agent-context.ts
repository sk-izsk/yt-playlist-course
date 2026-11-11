import { findCourse } from "../repo/courses";
import { getTranscript, practiceOf, quizOf } from "../repo/lesson-content";
import { getLessonDetail } from "../repo/lesson-detail";
import { findLesson, lessonsOfCourse } from "../repo/lessons";
import { compactTranscript } from "@/shared/transcript-compact";
import { HEAD_SEC, targetChars, type LessonContext, type ReportData, type TranscriptMode } from "@/shared/agent-format";

/** Everything an agent needs to write one lesson's notes (the CLI `show` and the agent API both use it). */
export const lessonContext = async (token: string, mode: TranscriptMode = "compact"): Promise<LessonContext | null> => {
  const lesson = await getLessonDetail(token);
  if (!lesson) return null;
  const record = (await findLesson(token))!;
  const t = await getTranscript(record.id);
  const start = lesson.startSec ?? 0;
  const lines = t ? (mode === "head" ? t.segments.filter(([sec]) => sec < start + HEAD_SEC) : t.segments) : [];
  return {
    lesson,
    targetChars: targetChars(lesson.durationSec),
    transcript: t ? { lang: t.lang, mode, lines: mode === "full" ? lines : compactTranscript(lines) } : null,
  };
};

/** The per-lesson table behind `report` (counts only; formatting is in shared/agent-format). */
export const reportData = async (courseToken: string): Promise<ReportData | null> => {
  const course = await findCourse(courseToken);
  if (!course) return null;
  const lessons = await lessonsOfCourse(course.id);
  const rows = await Promise.all(
    lessons.map(async (l) => {
      if (!l.summary) return { position: l.position, minutes: Math.round(l.durationSec / 60), kind: null };
      const [quiz, practice] = await Promise.all([quizOf(l.id), practiceOf(l.id)]);
      return {
        position: l.position,
        minutes: Math.round(l.durationSec / 60),
        kind: l.kind,
        summaryChars: l.summary.length,
        timestamps: (l.summary.match(/#t=\d+/g) ?? []).length,
        practice: practice.length,
        quiz: quiz.length,
        answers: quiz.map((q) => q.answerIndex).join(","),
      };
    }),
  );
  return { title: course.title, rows };
};

/** Lessons of a course with what the Mac needs to fetch and slice their transcripts. */
export const transcriptTargets = async (courseToken: string) => {
  const course = await findCourse(courseToken);
  if (!course) return null;
  return (await lessonsOfCourse(course.id)).map((l) => ({
    token: l.token,
    position: l.position,
    title: l.title,
    videoId: l.videoId,
    startSec: l.startSec,
    endSec: l.endSec,
    transcriptStatus: l.transcriptStatus,
  }));
};
