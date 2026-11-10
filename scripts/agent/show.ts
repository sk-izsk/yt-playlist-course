import { getCourseDetail } from "@/server/repo/courses";
import { getLessonDetail } from "@/server/repo/lesson-detail";
import { getTranscript } from "@/server/repo/lesson-content";
import { findLesson } from "@/server/repo/lessons";
import { resolveId } from "@/server/repo/resolve";
import { clock, humanDuration, watchUrl } from "@/shared/format";

/** Prints everything an LLM needs to reason about a course or lesson. */
export const showId = (input: string) => {
  const { type, token } = resolveId(input);
  return type === "course" ? showCourse(token) : showLesson(token);
};

const showCourse = (token: string) => {
  const c = getCourseDetail(token)!;
  const done = c.lessons.filter((l) => l.hasNotes);
  const todo = c.lessons.filter((l) => !l.hasNotes);
  console.log(`# ${c.title}\n${c.token} · ${c.kind} · ${c.channel} · ${humanDuration(c.totalSec)}`);
  console.log(`Watched ${c.completedCount}/${c.lessonCount} · notes ${done.length}/${c.lessonCount}`);
  console.log(
    todo.length
      ? `Work only on these ${todo.length}: ${todo.map((l) => `#${l.position}`).join(", ")} (lessons with notes are finished — skip them)\n`
      : "All lessons have notes. Nothing to do unless the user asks to redo one.\n",
  );
  for (const l of c.lessons) {
    const flags = [l.completed ? "watched" : "", l.hasNotes ? `notes:${l.kind}` : "NEEDS NOTES", `transcript:${l.transcriptStatus}`];
    console.log(`${l.token}  #${String(l.position).padStart(2)}  ${humanDuration(l.durationSec).padStart(6)}  ${l.title}  [${flags.filter(Boolean).join(", ")}]`);
  }
};

const showLesson = (token: string) => {
  const l = getLessonDetail(token)!;
  const record = findLesson(token)!;

  const start = l.startSec ?? 0;
  const range = l.startSec != null ? `, ${clock(start)}–${clock(l.endSec ?? 0)} of the video` : "";
  console.log(`# ${l.title}`);
  console.log(`${l.token} · lesson ${l.position} of course ${l.course.token} "${l.course.title}" by ${l.course.channel}`);
  console.log(`Video: ${watchUrl(l.videoId, start)}  (${humanDuration(l.durationSec)}${range})`);
  console.log(
    l.summary
      ? `Notes: ALREADY WRITTEN (${l.kind}) · practice ${l.practice.length} · quiz ${l.quiz.length} — skip unless asked to redo (--force)\n`
      : "Notes: MISSING\n",
  );

  const t = getTranscript(record.id);
  if (!t) {
    console.log(`No transcript (status: ${l.transcriptStatus}). Work from the title and your knowledge, and say so in the summary.`);
    return;
  }
  console.log(`## Transcript (${t.lang}${t.lang !== "en" ? " — write notes in English" : ""})`);
  // Format: [mm:ss|seconds] — seconds are absolute video time; use them for #t= links and atSec.
  for (const [sec, text] of t.segments) console.log(`[${clock(sec)}|${Math.floor(sec)}] ${text}`);
};
