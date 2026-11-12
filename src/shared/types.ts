// DTOs shared by API routes, client hooks and the agent CLI.

export type Difficulty = "easy" | "medium" | "hard"
export type TranscriptStatus = "pending" | "ok" | "none" | "error"
/** core = real teaching; light = intro / chit-chat / promo, optional to watch. null until notes exist. */
export type LessonKind = "core" | "light"

export interface CourseSummary {
  token: string
  kind: "playlist" | "video"
  youtubeId: string
  title: string
  channel: string
  thumbnail: string
  lessonCount: number
  completedCount: number
  totalSec: number
  newCount: number
  pendingNotes: number
  transcriptsPending: number
  /** New playlist videos detected but not added yet. */
  availableUpdates: number
  pinned: boolean
  lastSyncedAt: number | null
  /** Line colour index (shared/lines.ts), stored so courses don't share a colour. */
  line: number
}

export interface LessonRow {
  token: string
  position: number
  title: string
  videoId: string
  durationSec: number
  completed: boolean
  hasNotes: boolean
  kind: LessonKind | null
  isNew: boolean
  transcriptStatus: TranscriptStatus
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonRow[]
}

export interface PracticeItem {
  id: number
  difficulty: Difficulty
  title: string
  prompt: string
  hint: string | null
  url: string | null
}

export interface QuizItem {
  id: number
  question: string
  options: string[]
  answerIndex: number
  explanation: string | null
  atSec: number | null
}

export interface Note {
  id: number
  atSec: number
  text: string
  createdAt: number
}

export interface LessonDetail extends LessonRow {
  startSec: number | null
  endSec: number | null
  summary: string | null
  course: { token: string; title: string; channel: string; line: number }
  prevToken: string | null
  nextToken: string | null
  practice: PracticeItem[]
  quiz: QuizItem[]
  notes: Note[]
}

export type EventKind = "update" | "success" | "error" | "info"

/** One row of the notification center feed. */
export interface AppEvent {
  id: number
  kind: EventKind
  title: string
  body: string
  courseToken: string | null
  createdAt: number
  read: boolean
}

export interface SyncResult {
  added: LessonRow[]
}

/** Newest local dump (Settings → Data source). */
export interface BackupStatus {
  lastAt: number | null
  file: string | null
  sizeBytes: number | null
  dumps: number
}

/** A deleted course, restorable until `purgeAt`. */
export interface TrashedCourse {
  token: string
  title: string
  channel: string
  deletedAt: number
  purgeAt: number
}

/** A personal agent token as listed on Settings (the secret itself is only in the create response). */
export interface AgentToken {
  id: number
  name: string
  prefix: string
  createdAt: number
  lastUsedAt?: number | null
}
