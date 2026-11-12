import type { schema } from "../db/client"
import type { LessonRow } from "@/shared/types"

type LessonRecord = typeof schema.lessons.$inferSelect

export const toLessonRow = (l: LessonRecord): LessonRow => {
  return {
    token: l.token,
    position: l.position,
    title: l.title,
    videoId: l.videoId,
    durationSec: l.durationSec,
    completed: l.completedAt != null,
    hasNotes: l.summary != null,
    kind: l.kind,
    isNew: l.isNew,
    transcriptStatus: l.transcriptStatus,
  }
}
