export type ParsedLink =
  | { kind: "playlist"; playlistId: string; videoId?: string }
  | { kind: "video"; videoId: string };

const VIDEO_ID = /^[\w-]{11}$/;

/**
 * Accepts watch / playlist / youtu.be / shorts / embed links, or a bare video id.
 * A watch link that also carries `list=` is treated as the playlist.
 * Auto-generated mixes (`RD…`) aren't real playlists, so they fall back to the video.
 */
export const parseYouTubeLink = (input: string): ParsedLink => {
  const raw = input.trim();
  if (VIDEO_ID.test(raw)) return { kind: "video", videoId: raw };

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    throw new Error("That doesn't look like a YouTube link.");
  }
  if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(url.hostname)) {
    throw new Error("Only YouTube links are supported.");
  }

  const list = url.searchParams.get("list");
  const videoId = extractVideoId(url);
  if (list && !list.startsWith("RD")) return { kind: "playlist", playlistId: list, videoId };
  if (videoId) return { kind: "video", videoId };
  throw new Error("Couldn't find a video or playlist id in that link.");
}

const extractVideoId = (url: URL): string | undefined => {
  if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1, 12) || undefined;
  const v = url.searchParams.get("v");
  if (v) return v;
  const m = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
  return m?.[1];
}
