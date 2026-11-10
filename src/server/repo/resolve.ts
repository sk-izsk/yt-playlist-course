import { like } from "drizzle-orm";
import { db, schema } from "../db/client";

export type Resolved = { type: "course" | "lesson"; token: string };

/** Resolves a full UUID v4 (or, as a convenience, a unique prefix) to a course or lesson id. */
export const resolveId = (input: string): Resolved => {
  const prefix = input.trim().toLowerCase();
  if (prefix.length < 4) throw new Error(`"${input}" is too short — use at least 4 characters of the id.`);

  const q = `${prefix}%`;
  const hits: Resolved[] = [
    ...db.select({ token: schema.courses.token }).from(schema.courses).where(like(schema.courses.token, q)).all()
      .map((r) => ({ type: "course" as const, token: r.token })),
    ...db.select({ token: schema.lessons.token }).from(schema.lessons).where(like(schema.lessons.token, q)).all()
      .map((r) => ({ type: "lesson" as const, token: r.token })),
  ];

  if (!hits.length) throw new Error(`No course or lesson matches "${input}".`);
  if (hits.length > 1) throw new Error(`"${input}" matches ${hits.length} items — use more characters.`);
  return hits[0];
};

export const resolveAs = (type: Resolved["type"], input: string) => {
  const r = resolveId(input);
  if (r.type !== type) throw new Error(`"${input}" is a ${r.type}, expected a ${type}.`);
  return r.token;
};
