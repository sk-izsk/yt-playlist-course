import { asc, eq } from "drizzle-orm"
import { db, first, schema } from "../db/client"
import type { LessonContent } from "@/shared/content-schema"
import type { Transcript } from "../youtube/transcript"

const { lessons, transcripts, practice, quiz, notes } = schema

export const getTranscript = (lessonId: number) =>
  first(db.select().from(transcripts).where(eq(transcripts.lessonId, lessonId)).limit(1))

/** Stores a transcript (or just the status when there is none / it failed). */
export const saveTranscript = (lessonId: number, status: "ok" | "none" | "error", transcript?: Transcript) =>
  db.transaction(async (tx) => {
    await tx.update(lessons).set({ transcriptStatus: status }).where(eq(lessons.id, lessonId))
    if (!transcript) {
      return
    }
    await tx
      .insert(transcripts)
      .values({ lessonId, ...transcript })
      .onConflictDoUpdate({ target: transcripts.lessonId, set: transcript })
  })

/** Replaces summary, practice and quiz in one transaction — re-running an agent is idempotent. */
export const replaceLessonContent = (lessonId: number, content: LessonContent) =>
  db.transaction(async (tx) => {
    await tx
      .update(lessons)
      .set({ summary: content.summary, kind: content.kind, notesUpdatedAt: Date.now() })
      .where(eq(lessons.id, lessonId))
    await tx.delete(practice).where(eq(practice.lessonId, lessonId))
    await tx.delete(quiz).where(eq(quiz.lessonId, lessonId))
    if (content.practice.length) {
      await tx.insert(practice).values(content.practice.map((p) => ({ ...p, lessonId })))
    }
    if (content.quiz.length) {
      await tx.insert(quiz).values(content.quiz.map((q) => ({ ...q, lessonId })))
    }
  })

export const practiceOf = (lessonId: number) =>
  db.select().from(practice).where(eq(practice.lessonId, lessonId)).orderBy(asc(practice.id))

export const quizOf = (lessonId: number) =>
  db.select().from(quiz).where(eq(quiz.lessonId, lessonId)).orderBy(asc(quiz.id))

export const notesOf = (lessonId: number) =>
  db.select().from(notes).where(eq(notes.lessonId, lessonId)).orderBy(asc(notes.atSec))

export const addNote = async (lessonId: number, atSec: number, text: string) =>
  (await db.insert(notes).values({ lessonId, atSec, text }).returning())[0]

export const deleteNote = async (id: number) =>
  (await db.delete(notes).where(eq(notes.id, id)).returning({ id: notes.id })).length > 0
