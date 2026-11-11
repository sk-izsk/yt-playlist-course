import { and, eq, isNull, lt, or } from "drizzle-orm";
import { db, schema } from "../db/client";
import { checkCourseUpdates } from "./check-updates";
import { addEvent } from "../repo/events";
import { fillTranscripts } from "./transcripts";

const STALE_MS = 30 * 60 * 1000; // re-check a playlist at most every 30 minutes

export interface StaleCheckResult {
  token: string;
  title: string;
  available: number;
}

/**
 * Transcript fetching runs in-process, so stopping the dev server mid-load leaves lessons "pending"
 * forever. Restart those loops (fire-and-forget; fillTranscripts skips courses already running).
 */
const resumePendingTranscripts = async () => {
  const ids = await db
    .selectDistinct({ id: schema.lessons.courseId })
    .from(schema.lessons)
    .where(eq(schema.lessons.transcriptStatus, "pending"));
  ids.forEach(({ id }) => fillTranscripts(id).catch((e) => console.error("[resume]", e)));
};

/**
 * Runs on app open: resumes interrupted transcripts, then *detects* new videos in every playlist
 * not checked recently. Nothing is added — courses get an "N new videos" badge you can act on.
 */
export const checkStaleCourses = async (): Promise<StaleCheckResult[]> => {
  await resumePendingTranscripts();
  const c = schema.courses;
  const stale = await db
    .select()
    .from(c)
    .where(and(eq(c.kind, "playlist"), or(isNull(c.lastSyncedAt), lt(c.lastSyncedAt, Date.now() - STALE_MS))));

  const results: StaleCheckResult[] = [];
  for (const course of stale) {
    try {
      const available = await checkCourseUpdates(course);
      if (available > course.availableUpdates) results.push({ token: course.token, title: course.title, available });
    } catch (err) {
      // One broken playlist (deleted / private) shouldn't block the others — but you should hear about it.
      await addEvent({ kind: "error", title: "Update check failed", body: `${course.title}: ${(err as Error).message}`, courseToken: course.token });
    }
  }
  return results;
};
