import ky, { HTTPError } from "ky";
import type { AppEvent, CourseDetail, CourseSummary, LessonDetail, Note, SyncResult } from "@/shared/types";

const http = ky.create({ prefix: "/api", timeout: 120_000, retry: 0 });

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
