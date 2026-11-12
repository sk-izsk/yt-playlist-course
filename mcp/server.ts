/**
 * Tubewise MCP server (stdio). Runs on the Mac, so it can download YouTube transcripts that Vercel can't,
 * and talks to the app only through the agent API. It can read, upload transcripts and save notes; never delete.
 * Register once: see docs/mcp.md. Env: TUBEWISE_URL, TUBEWISE_TOKEN.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { agentApi, resolveRemote } from "../src/agent-client/api";
import { fetchAndUploadTranscripts } from "../src/agent-client/transcripts";
import { formatCourse, formatLesson, formatReport } from "../src/shared/agent-format";

// The repo is CommonJS for tsx (no "type": "module"), so __dirname, not import.meta, and no top-level await.
const GUIDE = path.join(__dirname, "..", "docs", "notes-guide.md");

const server = new McpServer(
  { name: "tubewise", version: "1.0.0" },
  {
    instructions:
      "Tubewise turns YouTube playlists into courses. To fill notes for a course: call notes_guide once and follow it, " +
      "fetch_transcripts, then list_pending, and for each lesson get_lesson → write the JSON by hand → save_notes. " +
      "Finish with course_report. Never redo lessons that already have notes unless the user asks (force).",
  },
);

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
// Errors (bad id, quality rejection) go back to the agent as text so it can fix and retry.
const tool =
  <A>(fn: (args: A) => Promise<string>) =>
  async (args: A) => {
    try {
      return text(await fn(args));
    } catch (err) {
      return { ...text((err as Error).message), isError: true };
    }
  };

const id = z.string().describe("Full UUID or a unique prefix (at least 4 characters)");

server.registerTool(
  "notes_guide",
  {
    description: "The rules for writing lesson notes (kinds, summary format, practice, quiz, quality bar). Read first.",
  },
  tool(async () => readFileSync(GUIDE, "utf8")),
);

server.registerTool(
  "list_courses",
  { description: "All courses with ids and how many lessons still need notes." },
  tool(async () =>
    (await agentApi.courses())
      .map(
        (c) =>
          `${c.token}  notes ${c.lessonCount - c.pendingNotes}/${c.lessonCount}  transcripts pending ${c.transcriptsPending}  ${c.title}`,
      )
      .join("\n"),
  ),
);

server.registerTool(
  "get_course",
  {
    description: "One course: every lesson with id, length, notes status and transcript status.",
    inputSchema: { course: id },
  },
  tool(async ({ course }) => formatCourse(await agentApi.course(await resolveRemote("course", course)))),
);

server.registerTool(
  "fetch_transcripts",
  {
    description:
      "Download missing YouTube transcripts on this Mac and upload them. Run before writing notes. Takes ~1–2 s per video.",
    inputSchema: {
      course: id,
      retry_errors: z.boolean().optional().describe("Also retry lessons whose last fetch failed"),
    },
  },
  tool(async ({ course, retry_errors }) => {
    const r = await fetchAndUploadTranscripts(await resolveRemote("course", course), { retryErrors: retry_errors });
    if (!r.total) return "No transcripts missing.";
    const lines = [`${r.total} lessons: ${r.ok} uploaded, ${r.none} have no captions, ${r.failed} failed.`];
    if (r.errors.length)
      lines.push("Failures (YouTube may be rate-limiting; retry later with retry_errors):", ...r.errors);
    return lines.join("\n");
  }),
);

server.registerTool(
  "list_pending",
  { description: "Lessons that still need notes. Only these may be written.", inputSchema: { course: id.optional() } },
  tool(async ({ course }) => {
    const rows = await agentApi.pending(course ? await resolveRemote("course", course) : undefined);
    if (!rows.length) return "Nothing pending: every lesson has notes.";
    return rows
      .map((r) => `${r.token}  #${r.position}  [transcript: ${r.transcript}]  ${r.title}  — ${r.course}`)
      .join("\n");
  }),
);

server.registerTool(
  "get_lesson",
  {
    description: "A lesson's details, transcript ([mm:ss|seconds] lines) and target summary length.",
    inputSchema: {
      lesson: id,
      mode: z
        .enum(["compact", "full", "head"])
        .optional()
        .describe("compact (default), full captions, or head = first 3 minutes"),
    },
  },
  tool(async ({ lesson, mode }) =>
    formatLesson(await agentApi.lesson(await resolveRemote("lesson", lesson), mode ?? "compact")),
  ),
);

server.registerTool(
  "save_notes",
  {
    description:
      "Save a lesson's notes: { kind, summary, practice, quiz } as in notes_guide. The server validates, shuffles quiz " +
      "answers and rejects template-like notes with a list of problems. Refuses lessons that already have notes unless force.",
    inputSchema: {
      lesson: id,
      content: z.record(z.string(), z.unknown()).describe("The content JSON object"),
      force: z
        .boolean()
        .optional()
        .describe("Overwrite existing notes. Only when the user explicitly asked to redo the lesson."),
    },
  },
  tool(async ({ lesson, content, force }) => {
    const token = await resolveRemote("lesson", lesson);
    const r = await agentApi.saveNotes(token, content, force ?? false);
    return `Saved ${token} (${r.kind}): summary + ${r.practice} practice + ${r.quiz} quiz.`;
  }),
);

server.registerTool(
  "course_report",
  {
    description: "Per-lesson table: kind, minutes, summary length, timestamps, practice, quiz, answer order.",
    inputSchema: { course: id },
  },
  tool(async ({ course }) => formatReport(await agentApi.report(await resolveRemote("course", course)))),
);

server.connect(new StdioServerTransport()).catch((err: Error) => {
  console.error(`[tubewise-mcp] ${err.message}`); // stderr: stdout belongs to the MCP protocol
  process.exit(1);
});
