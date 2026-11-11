/**
 * Agent CLI — the bridge between this app and Claude / Codex.
 * Usage: bun run agent <command> [args]   (see AGENTS.md)
 * Ids: full UUID v4 as shown in the app (a unique prefix also works).
 */
import { readFileSync } from "node:fs";
import { findCourse, listCourses } from "@/server/repo/courses";
import { pendingLessons } from "@/server/repo/lessons";
import { resolveAs } from "@/server/repo/resolve";
import { importCourse } from "@/server/services/import-course";
import { saveLessonContent } from "@/server/services/save-content";
import { syncCourse } from "@/server/services/sync-course";
import { fillTranscripts } from "@/server/services/transcripts";
import { reportCourse } from "./report";
import { showId } from "./show";

const HELP = `Commands (ids = full UUID v4 from the app):
  list                          all courses with ids and progress
  pending [course-id]           lessons that still need notes (only these — never redo finished ones)
  show <course-id|lesson-id> [--full|--head]
                                context for a course or lesson; lessons print a compact transcript
                                (--full: every caption line, --head: first 3 minutes only)
  report <course-id>            per-lesson table: kind, length, timestamps, practice, quiz, answers
  save <lesson-id> <file|-> [--force]
                                store kind/summary/practice/quiz JSON (- reads stdin); answer
                                positions are shuffled on save; --force overwrites existing notes
  add <youtube-url>             import a video or playlist and fetch transcripts
  sync <course-id>              pull new videos from the playlist
  transcripts <course-id>       retry missing/failed transcripts`;

const required = (v: string | undefined, name: string): string => {
  if (!v) throw new Error(`Missing ${name}.\n\n${HELP}`);
  return v;
};

const commands: Record<string, (args: string[]) => Promise<void> | void> = {
  list: () => {
    for (const c of listCourses()) {
      const notes = `${c.lessonCount - c.pendingNotes}/${c.lessonCount} notes`;
      console.log(
        `${c.token}  ${c.completedCount}/${c.lessonCount} watched  ${notes}  ${c.title}`,
      );
    }
  },
  pending: ([course]) => {
    const rows = pendingLessons(
      course ? resolveAs("course", course) : undefined,
    );
    if (!rows.length)
      return console.log("Nothing pending — every lesson has notes.");
    rows.forEach((r) =>
      console.log(
        `${r.token}  #${r.position}  [transcript: ${r.transcript}]  ${r.title}  — ${r.course}`,
      ),
    );
  },
  show: ([id, ...flags]) => showId(required(id, "id"), flags),
  report: ([id]) => reportCourse(resolveAs("course", required(id, "course id"))),
  save: ([id, file, flag]) => {
    const token = resolveAs("lesson", required(id, "lesson id"));
    const raw = readFileSync(file === "-" || !file ? 0 : file, "utf8");
    const res = saveLessonContent(token, JSON.parse(raw), {
      force: flag === "--force",
    });
    console.log(
      `Saved ${token} (${res.kind}): summary + ${res.practice} practice + ${res.quiz} quiz.`,
    );
  },
  add: async ([url]) => {
    const res = await importCourse(required(url, "url"));
    const id = res.token;
    console.log(
      res.created
        ? `Added ${id}. Fetching transcripts…`
        : `Already added as ${id}.`,
    );
    await res.transcripts;
    console.log(`Done. Next: bun run agent pending ${id}`);
  },
  sync: async ([id]) => {
    const res = await syncCourse(
      resolveAs("course", required(id, "course id")),
    );
    console.log(
      res.added.length
        ? `${res.added.length} new lesson(s):`
        : "No new videos.",
    );
    res.added.forEach((l) =>
      console.log(`  ${l.token}  #${l.position}  ${l.title}`),
    );
    await res.transcripts;
  },
  transcripts: async ([id]) => {
    const course = findCourse(resolveAs("course", required(id, "course id")))!;
    await fillTranscripts(course.id, { retryErrors: true });
    console.log("Transcripts refreshed.");
  },
};

const [cmd, ...args] = process.argv.slice(2);
const run = cmd ? commands[cmd] : undefined;
if (!run) {
  console.log(HELP);
  process.exit(cmd ? 1 : 0);
}
// .then() so synchronous throws also land in .catch and print as a clean message.
Promise.resolve()
  .then(() => run(args))
  .catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });
