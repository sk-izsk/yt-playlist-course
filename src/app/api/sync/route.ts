import { handle } from "@/server/http";
import { checkStaleCourses } from "@/server/services/sync-stale";

/** Called once when the app opens: resumes transcripts and detects new videos (adds nothing). */
export const POST = () => handle(() => checkStaleCourses());
