import { eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import { addEvent } from "../repo/events";
import { saveTranscript } from "../repo/lesson-content";
import { sleep } from "../youtube/client";
import { fetchBestTranscript, sliceSegments } from "../youtube/transcript";

// ponytail: in-process guard; fine for one local server. A second process (CLI) may overlap
// with the dev server — harmless, the upsert just runs twice.
const running = new Set<number>();
const GAP_MS = 1200; // be polite to YouTube; bursts get rate-limited

/** One feed entry per finished run: "ready", or how many failed (retry with the CLI `transcripts` command). */
const reportRun = (courseId: number, total: number, failed: number) => {
  const course = db.select().from(schema.courses).where(eq(schema.courses.id, courseId)).get();
  if (!course) return;
  if (failed) {
    addEvent({
      kind: "error",
      title: `${failed} of ${total} transcripts failed`,
      body: `${course.title} — YouTube may be rate-limiting. Retry: bun run agent transcripts ${course.token}`,
      courseToken: course.token,
    });
  } else {
    addEvent({ kind: "success", title: "Transcripts ready", body: `${course.title} — ${total} lesson${total === 1 ? "" : "s"}`, courseToken: course.token });
  }
};

const courseExists = (courseId: number) =>
  Boolean(db.select({ id: schema.courses.id }).from(schema.courses).where(eq(schema.courses.id, courseId)).get());

/** Fetches transcripts for every lesson still `pending`, one video at a time. */
export const fillTranscripts = async (courseId: number, opts: { retryErrors?: boolean } = {}) => {
  if (running.has(courseId)) return;
  running.add(courseId);
  try {
    const rows = db.select().from(schema.lessons).where(eq(schema.lessons.courseId, courseId)).all();
    const todo = rows.filter(
      (l) => l.transcriptStatus === "pending" || (opts.retryErrors && l.transcriptStatus === "error"),
    );

    if (!todo.length) return;
    let failed = 0;

    // Chapter lessons share one video — fetch it once, slice per lesson.
    const byVideo = Map.groupBy(todo, (l) => l.videoId);
    for (const [videoId, group] of byVideo) {
      // The course may be deleted mid-run (big playlists take minutes) — stop hitting YouTube for it.
      if (!courseExists(courseId)) return;
      try {
        const t = await fetchBestTranscript(videoId);
        for (const l of group) {
          if (!t) saveTranscript(l.id, "none");
          else saveTranscript(l.id, "ok", { lang: t.lang, segments: sliceSegments(t.segments, l.startSec ?? 0, l.endSec ?? Infinity) });
        }
      } catch (err) {
        console.warn(`[transcripts] ${videoId}:`, (err as Error).message);
        group.forEach((l) => saveTranscript(l.id, "error"));
        failed += group.length;
      }
      await sleep(GAP_MS);
    }
    reportRun(courseId, todo.length, failed);
  } finally {
    running.delete(courseId);
  }
}
