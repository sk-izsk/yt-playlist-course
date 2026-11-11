// Runs on the Mac: YouTube blocks caption requests from Vercel, so the Mac downloads them and uploads to the app.
import { fetchBestTranscript, sliceSegments } from "../server/youtube/transcript";
import { agentApi } from "./api";

const GAP_MS = 1200; // be polite to YouTube; bursts get rate-limited
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type TranscriptRun = { total: number; ok: number; none: number; failed: number; errors: string[] };

/** Fetches every `pending` (and, if asked, `error`) transcript of a course and uploads it, one video at a time. */
export const fetchAndUploadTranscripts = async (courseId: string, opts: { retryErrors?: boolean } = {}): Promise<TranscriptRun> => {
  const targets = await agentApi.transcriptTargets(courseId);
  const todo = targets.filter((l) => l.transcriptStatus === "pending" || (opts.retryErrors && l.transcriptStatus === "error"));
  const run: TranscriptRun = { total: todo.length, ok: 0, none: 0, failed: 0, errors: [] };

  // Chapter lessons share one video: fetch it once, slice per lesson.
  for (const [videoId, group] of Map.groupBy(todo, (l) => l.videoId)) {
    try {
      const t = await fetchBestTranscript(videoId);
      for (const l of group) {
        const segments = t ? sliceSegments(t.segments, l.startSec ?? 0, l.endSec ?? Infinity) : [];
        if (t && segments.length) {
          await agentApi.uploadTranscript(l.token, { status: "ok", lang: t.lang, segments });
          run.ok++;
        } else {
          await agentApi.uploadTranscript(l.token, { status: "none" });
          run.none++;
        }
      }
    } catch (err) {
      run.errors.push(`${videoId}: ${(err as Error).message}`);
      for (const l of group) await agentApi.uploadTranscript(l.token, { status: "error" }).catch(() => {});
      run.failed += group.length;
    }
    await sleep(GAP_MS);
  }
  return run;
};
