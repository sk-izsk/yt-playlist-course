import { bigint, boolean, index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

const now = () => Date.now();
// Epoch milliseconds, as in the SQLite era, so DTOs and the client stay unchanged. JS numbers hold them exactly.
const ms = (name: string) => bigint(name, { mode: "number" });
const id = () => integer("id").primaryKey().generatedByDefaultAsIdentity();

export const courses = pgTable("courses", {
  id: id(),
  token: text("token").notNull().unique(),
  kind: text("kind", { enum: ["playlist", "video"] }).notNull(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  channel: text("channel").notNull().default(""),
  thumbnail: text("thumbnail").notNull().default(""),
  createdAt: ms("created_at").notNull().$defaultFn(now),
  lastSyncedAt: ms("last_synced_at"),
  pinned: boolean("pinned").notNull().default(false),
  // Manual order from drag & drop; lower = earlier. New courses get min-1 so they appear first.
  sortOrder: integer("sort_order").notNull().default(0),
  // New playlist videos detected by a check but not added yet (you choose when to "Update").
  availableUpdates: integer("available_updates").notNull().default(0),
  // Index into shared/lines.ts LINES, picked once on import so courses don't share a colour.
  line: integer("line").notNull().default(0),
  // Soft delete: set = in the trash (hidden everywhere, restorable); purged for good after 7 days.
  deletedAt: ms("deleted_at"),
});

/** Activity feed behind the notification center: updates found, videos added, failures. */
export const events = pgTable("events", {
  id: id(),
  kind: text("kind", { enum: ["update", "success", "error", "info"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  courseToken: text("course_token"),
  createdAt: ms("created_at").notNull().$defaultFn(now),
  read: boolean("read").notNull().default(false),
});

export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    token: text("token").notNull().unique(),
    courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    videoId: text("video_id").notNull(),
    title: text("title").notNull(),
    durationSec: integer("duration_sec").notNull().default(0),
    // Set when a long single video is split into lessons by its chapters.
    startSec: integer("start_sec"),
    endSec: integer("end_sec"),
    thumbnail: text("thumbnail").notNull().default(""),
    transcriptStatus: text("transcript_status", { enum: ["pending", "ok", "none", "error"] })
      .notNull()
      .default("pending"),
    summary: text("summary"),
    // Set by the agent: "core" = real teaching, "light" = intro / chit-chat / promo (optional to watch).
    kind: text("lesson_kind", { enum: ["core", "light"] }),
    notesUpdatedAt: ms("notes_updated_at"),
    isNew: boolean("is_new").notNull().default(false),
    completedAt: ms("completed_at"),
    createdAt: ms("created_at").notNull().$defaultFn(now),
  },
  (t) => [index("lessons_course_idx").on(t.courseId, t.position)],
);

export const transcripts = pgTable("transcripts", {
  lessonId: integer("lesson_id").primaryKey().references(() => lessons.id, { onDelete: "cascade" }),
  lang: text("lang").notNull(),
  // Array<[offsetSec, text]>
  segments: jsonb("segments").$type<Array<[number, string]>>().notNull(),
});

const lessonRef = () => integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" });

export const practice = pgTable("practice", {
  id: id(),
  lessonId: lessonRef(),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  hint: text("hint"),
  url: text("url"),
});

export const quiz = pgTable("quiz", {
  id: id(),
  lessonId: lessonRef(),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  answerIndex: integer("answer_index").notNull(),
  explanation: text("explanation"),
  atSec: integer("at_sec"),
});

export const notes = pgTable("notes", {
  id: id(),
  lessonId: lessonRef(),
  atSec: integer("at_sec").notNull(),
  text: text("text").notNull(),
  createdAt: ms("created_at").notNull().$defaultFn(now),
});
