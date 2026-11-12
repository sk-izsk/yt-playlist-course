// Remote mode: the same commands through the app's agent API (TUBEWISE_URL + TUBEWISE_TOKEN), so `make fill`
// works against the online app. Transcripts are downloaded on this Mac and uploaded. No DB access, no deletes.
import { readFileSync } from "node:fs";
import { agentApi, resolveRemote } from "@/agent-client/api";
import { fetchAndUploadTranscripts } from "@/agent-client/transcripts";
import { formatCourse, formatLesson, formatReport, modeFromFlags } from "@/shared/agent-format";
import { printPending, printSaved, required, type Commands } from "./help";

const localOnly = (what: string) => () => {
  throw new Error(`"${what}" needs local mode. Online, add or update courses on the website, then run "transcripts".`);
};

export const commands: Commands = {
  list: async () => {
    for (const c of await agentApi.courses()) {
      console.log(
        `${c.token}  ${c.completedCount}/${c.lessonCount} watched  ${c.lessonCount - c.pendingNotes}/${c.lessonCount} notes  ${c.title}`,
      );
    }
  },
  pending: async ([course]) =>
    printPending(await agentApi.pending(course ? await resolveRemote("course", course) : undefined)),
  show: async ([id, ...flags]) => {
    const r = await agentApi.resolve(required(id, "id"));
    console.log(
      r.type === "course"
        ? formatCourse(await agentApi.course(r.token))
        : formatLesson(await agentApi.lesson(r.token, modeFromFlags(flags))),
    );
  },
  report: async ([id]) =>
    console.log(formatReport(await agentApi.report(await resolveRemote("course", required(id, "course id"))))),
  save: async ([id, file, flag]) => {
    const token = await resolveRemote("lesson", required(id, "lesson id"));
    const raw = readFileSync(file === "-" || !file ? 0 : file, "utf8");
    printSaved(token, await agentApi.saveNotes(token, JSON.parse(raw), flag === "--force"));
  },
  add: localOnly("add"),
  sync: localOnly("sync"),
  transcripts: async ([id]) => {
    const r = await fetchAndUploadTranscripts(await resolveRemote("course", required(id, "course id")), {
      retryErrors: true,
    });
    console.log(`${r.total} lessons: ${r.ok} uploaded, ${r.none} without captions, ${r.failed} failed.`);
    for (const e of r.errors) console.log(`  ${e}`);
  },
};

export const close = async () => {};
