import ky, { HTTPError, type AfterResponseHook } from "ky";
import type { AgentToken, AppEvent, CourseDetail, CourseSummary, LessonDetail, Note, SyncResult } from "@/shared/types";

// One refresh at a time: parallel 401s must share it, or the second rotation looks like token reuse.
let refreshing: Promise<boolean> | null = null;
const refreshOnce = () =>
  (refreshing ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((r) => r.ok, () => false)
    .finally(() => {
      refreshing = null;
    }));

const toLogin = () => {
  if (window.location.pathname === "/login") return;
  const next = window.location.pathname + window.location.search;
  // Full load on purpose: drops every cached query of the dead session. No router outside React here.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
};

/** 401 token_expired → refresh → replay the request once; any other 401 → login page. */
const authRetry: AfterResponseHook = async ({ response, retryCount }) => {
  if (response.status !== 401) return;
  const { error } = (await response.clone().json().catch(() => ({}))) as { error?: string };
  if (error === "token_expired" && retryCount === 0 && (await refreshOnce())) return ky.retry({ delay: 0 });
  toLogin();
};

const http = ky.create({
  prefix: "/api",
  timeout: 120_000,
  // limit 1 makes ky keep an unread copy of the body for the auth replay; with no methods/status codes,
  // ordinary automatic retries never fire (a forced ky.retry() skips those checks).
  retry: { limit: 1, methods: [], statusCodes: [] },
  hooks: { afterResponse: [authRetry] },
});

/**
 * Surfaces the server's `{ error }` message instead of "Request failed with status 400".
 * ky 2 has already read the body into `err.data` (response.json() would throw), and this must
 * never throw itself — callers use it inside catch blocks.
 */
export const errorMessage = async (err: unknown): Promise<string> => {
  if (err instanceof HTTPError) {
    const data = err.data as { error?: string } | string | undefined;
    if (typeof data === "object" && data?.error) return data.error;
    if (typeof data === "string" && data) return data;
    return `Request failed (${err.response.status})`;
  }
  return (err as Error)?.message ?? "Something went wrong";
};

export const api = {
  login: (username: string, password: string) => http.post("auth/login", { json: { username, password } }).json(),
  logout: () => http.post("auth/logout").json(),
  agentTokens: () => http.get("agent-tokens").json<AgentToken[]>(),
  createAgentToken: (name: string) => http.post("agent-tokens", { json: { name } }).json<AgentToken & { token: string }>(),
  revokeAgentToken: (id: number) => http.delete(`agent-tokens/${id}`).json(),

  courses: () => http.get("courses").json<CourseSummary[]>(),
  course: (token: string) => http.get(`courses/${token}`).json<CourseDetail>(),
  addCourse: (url: string) => http.post("courses", { json: { url } }).json<{ token: string; title: string; created: boolean }>(),
  deleteCourse: (token: string) => http.delete(`courses/${token}`).json(),
  setPinned: (token: string, pinned: boolean) => http.patch(`courses/${token}`, { json: { pinned } }).json(),
  reorderCourses: (tokens: string[]) => http.put("courses/order", { json: { tokens } }).json(),
  syncCourse: (token: string) => http.post(`courses/${token}/sync`).json<SyncResult>(),
  syncStale: () => http.post("sync").json<{ token: string; title: string; available: number }[]>(),
  checkCourse: (token: string) => http.post(`courses/${token}/check`).json<{ available: number }>(),

  notifications: () => http.get("notifications").json<AppEvent[]>(),
  markNotificationsRead: () => http.post("notifications").json(),
  clearNotifications: () => http.delete("notifications").json(),

  lesson: (token: string) => http.get(`lessons/${token}`).json<LessonDetail>(),
  setCompleted: (token: string, completed: boolean) => http.patch(`lessons/${token}`, { json: { completed } }).json(),
  addNote: (token: string, atSec: number, text: string) =>
    http.post(`lessons/${token}/notes`, { json: { atSec, text } }).json<Note>(),
  deleteNote: (id: number) => http.delete(`notes/${id}`).json(),
};
