import { eq, min } from "drizzle-orm";
import { pickLine } from "@/shared/lines";
import { db, schema } from "../db/client";

const { courses } = schema;

/** Sort value that places a new course above every existing one. */
export const topSortOrder = () => {
  const row = db.select({ m: min(courses.sortOrder) }).from(courses).get();
  return (row?.m ?? 0) - 1;
};

/** Line colour for a new course: the least-used one (see pickLine). */
export const nextLine = (token: string) =>
  pickLine(token, db.select({ line: courses.line }).from(courses).all().map((r) => r.line));

/** Persists drag & drop order: each token's index becomes its sort value. */
export const reorderCourses = (tokens: string[]) => {
  db.transaction((tx) => {
    tokens.forEach((token, i) => {
      tx.update(courses).set({ sortOrder: i }).where(eq(courses.token, token)).run();
    });
  });
};

export const setPinned = (token: string, pinned: boolean) =>
  db.update(courses).set({ pinned }).where(eq(courses.token, token)).run().changes > 0;
