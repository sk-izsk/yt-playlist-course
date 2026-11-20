import { z } from "zod"

const practiceItem = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  hint: z.string().optional(),
  url: z.url().optional(),
})

const quizItem = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    answerIndex: z.number().int().min(0),
    explanation: z.string().optional(),
    atSec: z.number().int().min(0).optional(),
  })
  .refine((q) => q.answerIndex < q.options.length, "answerIndex out of range")

/**
 * Shape an agent (Claude / Codex) writes for one lesson via `bun run agent save`.
 * Timestamps inside `summary` use markdown links: [18:37](#t=1117) → clickable seek.
 *
 * kind "core"  = real teaching → full notes with an "Important points" section, ≥1 practice, ≥1 quiz (no cap).
 * kind "light" = intro / chit-chat / promo → short honest summary; practice and quiz optional.
 */
export const lessonContentSchema = z
  .object({
    kind: z.enum(["core", "light"]),
    summary: z.string().min(20, "summary is too short"),
    practice: z.array(practiceItem).default([]),
    quiz: z.array(quizItem).default([]),
  })
  .superRefine((c, ctx) => {
    if (c.kind !== "core") {
      return
    }
    if (!/^##\s+Important points/im.test(c.summary)) {
      ctx.addIssue({ code: "custom", path: ["summary"], message: 'core lessons need a "## Important points" section' })
    }
    if (c.practice.length < 1) {
      ctx.addIssue({ code: "custom", path: ["practice"], message: "core lessons need at least 1 practice item" })
    }
    if (c.quiz.length < 1) {
      ctx.addIssue({ code: "custom", path: ["quiz"], message: "core lessons need at least 1 quiz question" })
    }
  })

export type LessonContent = z.infer<typeof lessonContentSchema>
