import type { RemoteChapter, RemoteVideo } from "../youtube/fetch-course";
import type { LessonDraft } from "../repo/lessons";

/** A video with 2+ chapters becomes one lesson per chapter; otherwise a single lesson. */
export const draftsFromVideo = (video: RemoteVideo, chapters: RemoteChapter[]): LessonDraft[] => {
  if (chapters.length < 2) return [{ ...video }];

  return chapters.map((ch, i) => {
    const endSec = chapters[i + 1]?.startSec ?? video.durationSec;
    return {
      videoId: video.videoId,
      thumbnail: video.thumbnail,
      title: ch.title,
      startSec: ch.startSec,
      endSec,
      durationSec: Math.max(0, endSec - ch.startSec),
    };
  });
};

export const draftsFromPlaylist = (videos: RemoteVideo[]): LessonDraft[] => videos.map((v) => ({ ...v }));
