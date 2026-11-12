import { and, like } from "drizzle-orm";
import { db, schema } from "../db/client";
import { live, liveLesson } from "./courses";

export type Resolved = { type: "course" | "lesson"; token: string };

/** Resolves a full UUID v4 (or, as a convenience, a unique prefix) to a course or lesson id. */
export const resolveId = async (input: string): Promise<Resolved> => {
  const prefix = input.trim().toLowerCase();
  if (prefix.length < 4) throw new Error(`"${input}" is too short — use at least 4 characters of the id.`);

  const q = `${prefix}%`;
  const [cs, ls] = await Promise.all([
    db
      .select({ token: schema.courses.token })
      .from(schema.courses)
      .where(and(like(schema.courses.token, q), live)),
    db
      .select({ token: schema.lessons.token })
      .from(schema.lessons)
      .where(and(like(schema.lessons.token, q), liveLesson)),
  ]);
  const hits: Resolved[] = [
    ...cs.map((r) => ({ type: "course" as const, token: r.token })),
    ...ls.map((r) => ({ type: "lesson" as const, token: r.token })),
  ];

  if (!hits.length) throw new Error(`No course or lesson matches "${input}".`);
  if (hits.length > 1) throw new Error(`"${input}" matches ${hits.length} items — use more characters.`);
  return hits[0];
};

export const resolveAs = async (type: Resolved["type"], input: string) => {
  const r = await resolveId(input);
  if (r.type !== type) throw new Error(`"${input}" is a ${r.type}, expected a ${type}.`);
  return r.token;
};
