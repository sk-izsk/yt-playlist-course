// Plain-text views for agents. Pure, so the local CLI, the agent API clients and the MCP server print the same thing.
import { clock, humanDuration, watchUrl } from "./format";
import type { CourseDetail, LessonDetail } from "./types";

export const HEAD_SEC = 180;
export type TranscriptMode = "compact" | "full" | "head";
export type LessonContext = {
  lesson: LessonDetail;
  targetChars: number;
  transcript: { lang: string; mode: TranscriptMode; lines: Array<[number, string]> } | null;
};
export type ReportRow = {
  position: number;
  minutes: number;
  kind: string | null;
  summaryChars?: number;
  timestamps?: number;
  practice?: number;
  quiz?: number;
  answers?: string;
};
export type ReportData = { title: string; rows: ReportRow[] };

export const modeFromFlags = (flags: string[]): TranscriptMode =>
  flags.includes("--full") ? "full" : flags.includes("--head") ? "head" : "compact";

// Short videos get shorter notes; padding a 10-minute video to 3,500 characters invites nitpicks.
export const targetChars = (durationSec: number) => Math.min(3500, Math.max(1200, Math.round((durationSec / 60) * 1.1) * 100));

export const formatCourse = (c: CourseDetail) => {
  const todo = c.lessons.filter((l) => !l.hasNotes);
  const out = [
    `# ${c.title}\n${c.token} · ${c.kind} · ${c.channel} · ${humanDuration(c.totalSec)}`,
    `Watched ${c.completedCount}/${c.lessonCount} · notes ${c.lessonCount - todo.length}/${c.lessonCount}`,
    todo.length
      ? `Work only on these ${todo.length}: ${todo.map((l) => `#${l.position}`).join(", ")} (lessons with notes are finished — skip them)\n`
      : "All lessons have notes. Nothing to do unless the user asks to redo one.\n",
  ];
  for (const l of c.lessons) {
    const flags = [l.completed ? "watched" : "", l.hasNotes ? `notes:${l.kind}` : "NEEDS NOTES", `transcript:${l.transcriptStatus}`];
    out.push(`${l.token}  #${String(l.position).padStart(2)}  ${humanDuration(l.durationSec).padStart(6)}  ${l.title}  [${flags.filter(Boolean).join(", ")}]`);
  }
  return out.join("\n");
};

export const formatLesson = ({ lesson: l, targetChars: target, transcript: t }: LessonContext) => {
  const start = l.startSec ?? 0;
  const range = l.startSec != null ? `, ${clock(start)}–${clock(l.endSec ?? 0)} of the video` : "";
  const out = [
    `# ${l.title}`,
    `${l.token} · lesson ${l.position} of course ${l.course.token} "${l.course.title}" by ${l.course.channel}`,
    `Video: ${watchUrl(l.videoId, start)}  (${humanDuration(l.durationSec)}${range})`,
    l.summary
      ? `Notes: ALREADY WRITTEN (${l.kind}) · practice ${l.practice.length} · quiz ${l.quiz.length} — skip unless asked to redo (--force)\n`
      : "Notes: MISSING\n",
  ];
  if (!t) {
    out.push(`No transcript (status: ${l.transcriptStatus}). Work from the title and your knowledge, and say so in the summary.`);
    return out.join("\n");
  }
  out.push(`Target summary for a core lesson: about ${target} characters (a guide, not a cap).`);
  const label = t.mode === "full" ? "full" : "compact: merged ~12s blocks, exact repeats removed";
  out.push(`## Transcript (${t.lang}${t.lang !== "en" ? " — write notes in English" : ""}; ${label})`);
  // Format: [mm:ss|seconds] — seconds are absolute video time; use them for #t= links and atSec.
  for (const [sec, text] of t.lines) out.push(`[${clock(sec)}|${Math.floor(sec)}] ${text}`);
  if (t.mode === "head") out.push(`\n(First ${HEAD_SEC / 60} minutes only. Clearly light? Write light notes. Otherwise run show without --head.)`);
  return out.join("\n");
};

export const formatReport = ({ title, rows }: ReportData) => {
  const out = [`# ${title}\n#    kind   min  summary  ts  practice  quiz  answers`];
  for (const r of rows) {
    if (!r.kind) {
      out.push(`#${String(r.position).padEnd(3)} —      ${String(r.minutes).padStart(3)}  (no notes yet)`);
      continue;
    }
    out.push(
      [
        `#${String(r.position).padEnd(3)}`,
        r.kind.padEnd(5),
        String(r.minutes).padStart(4),
        String(r.summaryChars).padStart(8),
        String(r.timestamps).padStart(3),
        String(r.practice).padStart(9),
        String(r.quiz).padStart(5),
        ` ${r.answers}`,
      ].join(" "),
    );
  }
  return out.join("\n");
};
