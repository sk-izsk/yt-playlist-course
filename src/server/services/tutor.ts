import Anthropic from "@anthropic-ai/sdk";
import { sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import { clock } from "@/shared/format";
import type { LessonContext } from "@/shared/agent-format";

// The plan picked Haiku: cheapest current model, plenty for "explain this part of the lesson".
export const TUTOR_MODEL = "claude-haiku-5-5";
export type Audience = "owner" | "public";
export type Turn = { role: "user" | "assistant"; content: string };

/** Off unless the user adds a key: everything else in the app stays free. */
export const tutorEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const CAPS: Record<Audience, number> = {
  owner: Number(process.env.TUTOR_DAILY_CAP_OWNER ?? 200),
  public: Number(process.env.TUTOR_DAILY_CAP_PUBLIC ?? 30), // all visitors together
};

/** Counts one call; false once today's cap for this audience is used up. */
export const takeQuota = async (audience: Audience) => {
  const day = new Date().toISOString().slice(0, 10);
  const t = schema.tutorUsage;
  const [row] = await db
    .insert(t)
    .values({ day, audience, count: 1 })
    .onConflictDoUpdate({ target: [t.day, t.audience], set: { count: sql`${t.count} + 1` } })
    .returning({ count: t.count });
  return row.count <= CAPS[audience];
};

const SYSTEM = `You are the tutor for one lesson of a course made from a YouTube video. The lesson material follows.
Answer the learner's question from that material first. If it doesn't cover the question, say so in one short
sentence, then answer from general knowledge and keep that part clearly separate.
Keep answers short: under about 200 words unless the learner asks for more. Use markdown.
When the transcript supports a point, cite the moment as a link like [12:34](#t=754) using the seconds shown.
Never reveal quiz answers outright; give hints instead.`;

/** Lesson notes (+ transcript for the owner; visitors get notes-only context to keep public calls cheap). */
export const lessonMaterial = ({ lesson: l, transcript }: LessonContext, withTranscript: boolean) => {
  const parts = [`# ${l.title}\nCourse: ${l.course.title} (${l.course.channel})`, `## Notes\n${l.summary ?? "(no notes yet)"}`];
  if (l.practice.length) parts.push(`## Practice\n${l.practice.map((p) => `- ${p.title}: ${p.prompt}`).join("\n")}`);
  if (withTranscript && transcript?.lines.length) {
    parts.push(`## Transcript\n${transcript.lines.map(([s, t]) => `[${clock(s)}|${Math.floor(s)}] ${t}`).join("\n")}`);
  }
  return parts.join("\n\n");
};

/**
 * Streams an answer. The lesson material is a cached system block, so follow-up questions on the same
 * lesson re-read it at the cache price. Effort "low": chat-style Q&A, not deep reasoning.
 */
export const streamAnswer = (material: string, turns: Turn[]) =>
  new Anthropic().messages.stream({
    model: TUTOR_MODEL,
    max_tokens: 8000,
    output_config: { effort: "low" },
    system: [
      { type: "text", text: SYSTEM },
      { type: "text", text: material, cache_control: { type: "ephemeral" } },
    ],
    messages: turns,
  });
