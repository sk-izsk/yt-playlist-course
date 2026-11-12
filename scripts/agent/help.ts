export type Commands = Record<string, (args: string[]) => Promise<void> | void>;

export const HELP = `Commands (ids = full UUID v4 from the app):
  list                          all courses with ids and progress
  pending [course-id]           lessons that still need notes (only these — never redo finished ones)
  show <course-id|lesson-id> [--full|--head]
                                context for a course or lesson; lessons print a compact transcript
                                (--full: every caption line, --head: first 3 minutes only)
  report <course-id>            per-lesson table: kind, length, timestamps, practice, quiz, answers
  save <lesson-id> <file|-> [--force]
                                store kind/summary/practice/quiz JSON (- reads stdin); answer
                                positions are shuffled on save; --force overwrites existing notes
  add <youtube-url>             import a video or playlist and fetch transcripts   (local mode only)
  sync <course-id>              pull new videos from the playlist                 (local mode only)
  transcripts <course-id>       retry missing/failed transcripts

Mode: local (DATABASE_URL) by default; remote (the app's agent API) when TUBEWISE_URL and TUBEWISE_TOKEN are set.`;

export const required = (v: string | undefined, name: string): string => {
  if (!v) throw new Error(`Missing ${name}.\n\n${HELP}`);
  return v;
};

export const printPending = (rows: { token: string; position: number; transcript: string; title: string; course: string }[]) => {
  if (!rows.length) return console.log("Nothing pending — every lesson has notes.");
  for (const r of rows) console.log(`${r.token}  #${r.position}  [transcript: ${r.transcript}]  ${r.title}  — ${r.course}`);
};

export const printSaved = (token: string, r: { kind: string; practice: number; quiz: number }) =>
  console.log(`Saved ${token} (${r.kind}): summary + ${r.practice} practice + ${r.quiz} quiz.`);
