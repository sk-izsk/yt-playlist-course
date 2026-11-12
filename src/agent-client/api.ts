// HTTP client for /api/agent/*, used by the MCP server and the CLI's remote mode.
// Relative imports only: the MCP server is started from any folder, where the "@/" alias does not resolve.
import type { LessonContext, ReportData, TranscriptMode } from "../shared/agent-format";
import type { CourseDetail, CourseSummary } from "../shared/types";

export type TranscriptTarget = {
  token: string;
  position: number;
  title: string;
  videoId: string;
  startSec: number | null;
  endSec: number | null;
  transcriptStatus: "pending" | "ok" | "none" | "error";
};
export type PendingRow = { token: string; position: number; title: string; transcript: string; course: string };
export type TranscriptUpload =
  | { status: "ok"; lang: string; segments: Array<[number, string]> }
  | { status: "none" | "error" };

/** Remote mode is on when both are set (MCP config or shell env). */
export const remoteConfigured = () => Boolean(process.env.TUBEWISE_URL && process.env.TUBEWISE_TOKEN);

const call = async <T>(method: "GET" | "PUT", path: string, body?: unknown): Promise<T> => {
  const base = process.env.TUBEWISE_URL?.replace(/\/+$/, "");
  const token = process.env.TUBEWISE_TOKEN;
  if (!base || !token)
    throw new Error("Set TUBEWISE_URL and TUBEWISE_TOKEN (create the token on the app's Settings page).");
  const res = await fetch(`${base}/api/agent/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), // GETs carry no body at all
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `${method} ${path} failed with HTTP ${res.status}`);
  return data as T;
};

const q = encodeURIComponent;

export const agentApi = {
  courses: () => call<CourseSummary[]>("GET", "courses"),
  course: (id: string) => call<CourseDetail>("GET", `courses/${q(id)}`),
  report: (id: string) => call<ReportData>("GET", `courses/${q(id)}/report`),
  transcriptTargets: (id: string) => call<TranscriptTarget[]>("GET", `courses/${q(id)}/transcripts`),
  pending: (course?: string) => call<PendingRow[]>("GET", `pending${course ? `?course=${q(course)}` : ""}`),
  resolve: (id: string) => call<{ type: "course" | "lesson"; token: string }>("GET", `resolve?id=${q(id)}`),
  lesson: (id: string, mode: TranscriptMode = "compact") => call<LessonContext>("GET", `lessons/${q(id)}?mode=${mode}`),
  uploadTranscript: (id: string, body: TranscriptUpload) =>
    call<{ ok: true }>("PUT", `lessons/${q(id)}/transcript`, body),
  saveNotes: (id: string, content: unknown, force = false) =>
    call<{ kind: string; practice: number; quiz: number }>("PUT", `lessons/${q(id)}/notes`, { content, force }),
};

/** Full UUID or unique prefix → full UUID of the expected type. */
export const resolveRemote = async (type: "course" | "lesson", input: string) => {
  const r = await agentApi.resolve(input);
  if (r.type !== type) throw new Error(`"${input}" is a ${r.type}, expected a ${type}.`);
  return r.token;
};
