import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { optionalUser } from "@/server/auth/require-user";
import { HttpError, notFound, readJson } from "@/server/http";
import { lessonContext } from "@/server/services/agent-context";
import { lessonMaterial, streamAnswer, takeQuota, tutorEnabled, type Turn } from "@/server/services/tutor";

export const dynamic = "force-dynamic";

/** Keeps the last few turns, alternating and starting with the learner, so the request is always valid. */
const cleanHistory = (raw: unknown): Turn[] => {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((t): t is Turn => (t?.role === "user" || t?.role === "assistant") && typeof t.content === "string" && t.content.trim() !== "")
    .slice(-8)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 4000) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns.filter((t, i) => i === 0 || t.role !== turns[i - 1].role);
};

const apiErrorText = (err: unknown) => {
  if (err instanceof Anthropic.AuthenticationError) return "The tutor's API key was rejected. Check ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError) return "The tutor is busy right now. Try again in a minute.";
  if (err instanceof Anthropic.APIError) return `The tutor failed (${err.status ?? "network"}). Try again.`;
  return "The tutor failed. Try again.";
};

/** Body: { question, history? }. Streams plain text. Public: visitors share a small daily cap, notes-only context. */
export const POST = async (req: Request, ctx: RouteContext<"/api/lessons/[token]/ask">) => {
  const { token } = await ctx.params;
  try {
    if (!tutorEnabled()) throw new HttpError(503, "The AI tutor is off. Add ANTHROPIC_API_KEY to turn it on.");
    const user = await optionalUser();
    const { question, history } = await readJson<{ question?: string; history?: unknown }>(req);
    if (!question?.trim()) throw new HttpError(400, "Ask a question first");
    const context = await lessonContext(token, "compact");
    if (!context) throw notFound("Lesson");
    const audience = user?.role === "owner" ? "owner" : "public";
    if (!(await takeQuota(audience))) throw new HttpError(429, "The tutor's daily limit is used up. It resets at midnight UTC.");

    const turns: Turn[] = [...cleanHistory(history), { role: "user", content: question.trim().slice(0, 2000) }];
    const stream = streamAnswer(lessonMaterial(context, audience === "owner"), cleanHistory(turns));
    const enc = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start: async (out) => {
        try {
          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") out.enqueue(enc.encode(ev.delta.text));
          }
          const final = await stream.finalMessage();
          // Haiku has no server-side fallback: say so instead of ending on a half answer.
          if (final.stop_reason === "refusal") out.enqueue(enc.encode("\n\n_The tutor can't help with that one._"));
          if (final.stop_reason === "max_tokens") out.enqueue(enc.encode("\n\n_(Answer cut short.)_"));
        } catch (err) {
          console.error("[tutor]", err);
          out.enqueue(enc.encode(`\n\n_${apiErrorText(err)}_`));
        }
        out.close();
      },
      cancel: () => stream.abort(),
    });
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
};
