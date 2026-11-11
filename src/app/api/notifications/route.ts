import { handle } from "@/server/http";
import { clearEvents, listEvents, markEventsRead } from "@/server/repo/events";

export const dynamic = "force-dynamic";

export const GET = () => handle(() => listEvents());

/** Marks everything read (opening the notification center). */
export const POST = () =>
  handle(async () => {
    await markEventsRead();
    return { ok: true };
  });

export const DELETE = () =>
  handle(async () => {
    await clearEvents();
    return { ok: true };
  });
