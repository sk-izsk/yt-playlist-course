import { youtube } from "./client";

export interface RemoteVideo {
  videoId: string;
  title: string;
  durationSec: number;
  thumbnail: string;
}

export interface RemoteChapter {
  title: string;
  startSec: number;
}

export interface RemotePlaylist {
  title: string;
  channel: string;
  thumbnail: string;
  videos: RemoteVideo[];
}

const thumb = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

/** Every video in a playlist, following continuation pages. */
export const fetchPlaylist = async (playlistId: string): Promise<RemotePlaylist> => {
  const yt = await youtube();
  let page = await yt.getPlaylist(playlistId);
  const items = [...page.videos];
  while (page.has_continuation) {
    page = await page.getContinuation();
    items.push(...page.videos);
  }

  const videos = items.flatMap((item): RemoteVideo[] => {
    // v18 returns LockupView items; `content_id` is the video id.
    const v = item as unknown as {
      content_id?: string;
      id?: string;
      metadata?: { title?: { text?: string } };
      title?: { text?: string };
      duration?: { seconds?: number };
    };
    const videoId = v.content_id ?? v.id;
    if (!videoId) return [];
    const title = v.metadata?.title?.text ?? v.title?.text ?? "Untitled";
    return [{ videoId, title, durationSec: v.duration?.seconds ?? 0, thumbnail: thumb(videoId) }];
  });

  return {
    title: page.info.title ?? "Untitled playlist",
    channel: page.info.author?.name ?? "",
    thumbnail: videos[0]?.thumbnail ?? "",
    videos,
  };
}

/** One video's details plus its YouTube chapters (empty if the creator added none). */
export const fetchVideo = async (videoId: string) => {
  const yt = await youtube();
  const info = await yt.getInfo(videoId);
  const b = info.basic_info;
  const markers = info.player_overlays?.decorated_player_bar?.player_bar?.markers_map ?? [];
  const chapters: RemoteChapter[] = (markers[0]?.value?.chapters ?? []).map((c) => ({
    title: c.title.toString(),
    startSec: Math.floor(c.time_range_start_millis / 1000),
  }));

  return {
    video: {
      videoId,
      title: b.title ?? "Untitled",
      durationSec: b.duration ?? 0,
      thumbnail: thumb(videoId),
    } satisfies RemoteVideo,
    channel: b.channel?.name ?? b.author ?? "",
    chapters,
  };
}
