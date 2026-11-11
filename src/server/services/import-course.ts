import { db, schema } from "../db/client";
import { findCourseByYoutubeId } from "../repo/courses";
import { nextLine, topSortOrder } from "../repo/course-order";
import { insertLessons, type LessonDraft } from "../repo/lessons";
import { newId } from "../tokens";
import { fetchPlaylist, fetchVideo } from "../youtube/fetch-course";
import { parseYouTubeLink } from "../youtube/parse-url";
import { draftsFromPlaylist, draftsFromVideo } from "./build-lessons";
import { fillTranscripts } from "./transcripts";

export interface ImportResult {
  token: string;
  title: string;
  created: boolean;
  /** Resolves when all transcripts are fetched. The API ignores it; the CLI awaits it. */
  transcripts: Promise<void>;
}

interface CourseMeta {
  kind: "playlist" | "video";
  youtubeId: string;
  title: string;
  channel: string;
  thumbnail: string;
  drafts: LessonDraft[];
}

const fetchMeta = async (input: string): Promise<CourseMeta> => {
  const link = parseYouTubeLink(input);
  if (link.kind === "playlist") {
    const pl = await fetchPlaylist(link.playlistId);
    if (!pl.videos.length) throw new Error("That playlist is empty or private.");
    return { kind: "playlist", youtubeId: link.playlistId, ...pl, drafts: draftsFromPlaylist(pl.videos) };
  }
  const { video, channel, chapters } = await fetchVideo(link.videoId);
  return {
    kind: "video",
    youtubeId: link.videoId,
    title: video.title,
    channel,
    thumbnail: video.thumbnail,
    drafts: draftsFromVideo(video, chapters),
  };
}

/** Adds a playlist or video as a course. Re-adding the same link returns the existing course. */
export const importCourse = async (input: string): Promise<ImportResult> => {
  const link = parseYouTubeLink(input);
  const id = link.kind === "playlist" ? link.playlistId : link.videoId;
  const existing = await findCourseByYoutubeId(id);
  if (existing) return { token: existing.token, title: existing.title, created: false, transcripts: Promise.resolve() };

  const { drafts, ...meta } = await fetchMeta(input);
  const token = newId();
  const [course] = await db
    .insert(schema.courses)
    .values({ ...meta, token, line: await nextLine(token), lastSyncedAt: Date.now(), sortOrder: await topSortOrder() })
    .returning();
  await insertLessons(course, drafts);

  const transcripts = fillTranscripts(course.id).catch((e) => console.error("[import]", e));
  return { token: course.token, title: course.title, created: true, transcripts };
}
