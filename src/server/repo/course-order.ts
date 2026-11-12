import { eq, min } from "drizzle-orm";
import { pickLine } from "@/shared/lines";
import { db, first, schema } from "../db/client";

const { courses } = schema;

/** Sort value that places a new course above every existing one. */
export const topSortOrder = async () => {
  const row = await first(db.select({ m: min(courses.sortOrder) }).from(courses));
  return (row?.m ?? 0) - 1;
};

/** Line colour for a new course: the least-used one (see pickLine). */
export const nextLine = async (token: string) =>
  pickLine(
    token,
    (await db.select({ line: courses.line }).from(courses)).map((r) => r.line),
  );

/** Persists drag & drop order: each token's index becomes its sort value. */
export const reorderCourses = (tokens: string[]) =>
  db.transaction(async (tx) => {
    for (const [i, token] of tokens.entries()) {
      await tx.update(courses).set({ sortOrder: i }).where(eq(courses.token, token));
    }
  });

export const setPinned = async (token: string, pinned: boolean) =>
  (await db.update(courses).set({ pinned }).where(eq(courses.token, token)).returning({ id: courses.id })).length > 0;
