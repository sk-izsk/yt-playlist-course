import { NextResponse } from "next/server";
import { addEvent } from "./repo/events";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found`);

/** Wraps a handler so thrown errors become `{ error }` JSON instead of an HTML 500 page. */
export const handle = async <T>(fn: () => T | Promise<T>, status = 200) => {
  try {
    return NextResponse.json(await fn(), { status });
  } catch (err) {
    const code = err instanceof HttpError ? err.status : 400;
    // Expected rejections (bad input, 404) are HttpErrors; anything else is a real failure worth surfacing.
    if (code >= 500 || !(err instanceof HttpError)) {
      console.error("[api]", err);
      await addEvent({ kind: "error", title: "Something failed on the server", body: (err as Error).message ?? String(err) });
    }
    return NextResponse.json({ error: (err as Error).message ?? "Something went wrong" }, { status: code });
  }
}

export const readJson = async <T = Record<string, unknown>>(req: Request): Promise<T> => {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Body must be JSON");
  }
}
