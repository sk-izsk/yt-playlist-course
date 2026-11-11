import { getCourseDetail } from "@/server/repo/courses";
import { getLessonDetail } from "@/server/repo/lesson-detail";
import { getTranscript } from "@/server/repo/lesson-content";
import { findLesson } from "@/server/repo/lessons";
import { resolveId } from "@/server/repo/resolve";
import { clock, humanDuration, watchUrl } from "@/shared/format";
import { compactTranscript } from "@/shared/transcript-compact";

const HEAD_SEC = 180;

/**
 * Prints everything an LLM needs to reason about a course or lesson. Lessons print a compact
 * transcript by default; `--full` prints every caption line, `--head` only the first 3 minutes.
 */
export const showId = (input: string, flags: string[] = []) => {
  const { type, token } = resolveId(input);
  return type === "course" ? showCourse(token) : showLesson(token, flags);
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

const showLesson = (token: string, flags: string[]) => {
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
  // Short videos get shorter notes; padding a 10-minute video to 3,500 characters invites nitpicks.
  const target = Math.min(3500, Math.max(1200, Math.round((l.durationSec / 60) * 1.1) * 100));
  console.log(`Target summary for a core lesson: about ${target} characters (a guide, not a cap).`);

  const head = flags.includes("--head");
  const lines = head ? t.segments.filter(([sec]) => sec < start + HEAD_SEC) : t.segments;
  const out = flags.includes("--full") ? lines : compactTranscript(lines);
  const label = flags.includes("--full") ? "full" : "compact: merged ~12s blocks, exact repeats removed";
  console.log(`## Transcript (${t.lang}${t.lang !== "en" ? " — write notes in English" : ""}; ${label})`);
  // Format: [mm:ss|seconds] — seconds are absolute video time; use them for #t= links and atSec.
  for (const [sec, text] of out) console.log(`[${clock(sec)}|${Math.floor(sec)}] ${text}`);
  if (head) console.log(`\n(First ${HEAD_SEC / 60} minutes only. Clearly light? Write light notes. Otherwise run show without --head.)`);
};
