import { asc, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { LessonContent } from "@/shared/content-schema";
import type { Transcript } from "../youtube/transcript";

const { lessons, transcripts, practice, quiz, notes } = schema;

export const getTranscript = (lessonId: number) => {
  return db.select().from(transcripts).where(eq(transcripts.lessonId, lessonId)).get();
}

/** Stores a transcript (or just the status when there is none / it failed). */
export const saveTranscript = (
  lessonId: number,
  status: "ok" | "none" | "error",
  transcript?: Transcript,
) => {
  db.transaction((tx) => {
    tx.update(lessons).set({ transcriptStatus: status }).where(eq(lessons.id, lessonId)).run();
    if (!transcript) return;
    tx.insert(transcripts)
      .values({ lessonId, ...transcript })
      .onConflictDoUpdate({ target: transcripts.lessonId, set: transcript })
      .run();
  });
}

/** Replaces summary, practice and quiz in one transaction — re-running an agent is idempotent. */
export const replaceLessonContent = (lessonId: number, content: LessonContent) => {
  db.transaction((tx) => {
    tx.update(lessons)
      .set({ summary: content.summary, kind: content.kind, notesUpdatedAt: Date.now() })
      .where(eq(lessons.id, lessonId))
      .run();
    tx.delete(practice).where(eq(practice.lessonId, lessonId)).run();
    tx.delete(quiz).where(eq(quiz.lessonId, lessonId)).run();
    if (content.practice.length) {
      tx.insert(practice).values(content.practice.map((p) => ({ ...p, lessonId }))).run();
    }
    if (content.quiz.length) {
      tx.insert(quiz).values(content.quiz.map((q) => ({ ...q, lessonId }))).run();
    }
  });
}

export const practiceOf = (lessonId: number) =>
  db.select().from(practice).where(eq(practice.lessonId, lessonId)).orderBy(asc(practice.id)).all();

export const quizOf = (lessonId: number) =>
  db.select().from(quiz).where(eq(quiz.lessonId, lessonId)).orderBy(asc(quiz.id)).all();

export const notesOf = (lessonId: number) =>
  db.select().from(notes).where(eq(notes.lessonId, lessonId)).orderBy(asc(notes.atSec)).all();

export const addNote = (lessonId: number, atSec: number, text: string) => {
  return db.insert(notes).values({ lessonId, atSec, text }).returning().get();
}

export const deleteNote = (id: number) => {
  return db.delete(notes).where(eq(notes.id, id)).run().changes > 0;
}
