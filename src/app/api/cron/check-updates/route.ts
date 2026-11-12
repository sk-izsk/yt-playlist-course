import { timingSafeEqual } from "node:crypto";
import { handlePublic, HttpError } from "@/server/http";
import { purgeTrash } from "@/server/repo/trash";
import { checkStaleCourses } from "@/server/services/sync-stale";

const authorized = (header: string | null) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * Daily Vercel Cron (vercel.json): detects new playlist videos, adds nothing. Not behind login;
 * Vercel sends `Authorization: Bearer $CRON_SECRET` instead. Transcripts are skipped on Vercel.
 */
export const GET = (req: Request) =>
  handlePublic(async () => {
    if (!authorized(req.headers.get("authorization"))) throw new HttpError(401, "unauthenticated");
    await purgeTrash(); // courses deleted more than 7 days ago go for good
    const found = await checkStaleCourses();
    return { checked: true, withNewVideos: found.length };
  });
