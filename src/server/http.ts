import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backupAvailable, withSource, type DbSource } from "./db/client";
import { requireAgent } from "./auth/agent-tokens";
import { optionalUser, requireUser } from "./auth/require-user";
import type { AuthUser } from "./auth/tokens";
import { HttpError } from "./http-error";
import { addEvent } from "./repo/events";

export { HttpError, notFound } from "./http-error";

/** Wraps a handler so thrown errors become `{ error }` JSON instead of an HTML 500 page. No auth: login/refresh only. */
export const handlePublic = async <T>(fn: () => T | Promise<T>, status = 200) => {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (err) {
    // Expected rejections (bad input, 401, 404, 422) are HttpErrors and their messages are written for users.
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
    // Anything else is a real failure: details (SQL, params, stack) go to the server log and the owner's
    // notification feed, never to the browser, which is public now.
    console.error("[api]", err);
    await addEvent({
      kind: "error",
      title: "Something failed on the server",
      body: (err as Error).message ?? String(err),
    });
    return NextResponse.json({ error: "Something went wrong on the server. Try again." }, { status: 500 });
  }
};

/** Which database this browser reads: "backup" (the local mirror) only when chosen in Settings and available. */
export const DB_COOKIE = "tw_db";
export const chosenSource = async (): Promise<DbSource> =>
  (await cookies()).get(DB_COOKIE)?.value === "backup" && backupAvailable() ? "backup" : "live";

/** Public reads: `user` is null for visitors. Anything that writes must use `handle` instead. */
export const handleRead = <T>(fn: (user: AuthUser | null) => T | Promise<T>, status = 200) =>
  handlePublic(async () => {
    const user = await optionalUser();
    return withSource(await chosenSource(), () => fn(user));
  }, status);

/** Every write: 401 unless logged in; 403 while viewing the local backup, which is read-only. Always hits Neon. */
export const handle = <T>(fn: (user: AuthUser) => T | Promise<T>, status = 200) =>
  handlePublic(async () => {
    const user = await requireUser();
    // Only the owner changes anything; a "demo" login (if one is ever handed out) is read-only like a visitor.
    if (user.role !== "owner") throw new HttpError(403, "This account is read-only");
    if ((await chosenSource()) === "backup") {
      throw new HttpError(
        403,
        "You're viewing the local backup, which is read-only. Switch to Neon (live) in Settings to make changes.",
      );
    }
    return fn(user);
  }, status);

/** /api/agent/* only: `Authorization: Bearer tw_…` (an agent token), never the login cookie. */
export const handleAgent = <T>(req: Request, fn: (user: AuthUser) => T | Promise<T>, status = 200) =>
  handlePublic(async () => fn(await requireAgent(req)), status);

export const readJson = async <T = Record<string, unknown>>(req: Request): Promise<T> => {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
};
