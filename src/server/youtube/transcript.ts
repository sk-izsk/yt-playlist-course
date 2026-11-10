import { fetchTranscript, listLanguages } from "youtube-transcript-plus";

export type Segment = [offsetSec: number, text: string];

export interface Transcript {
  lang: string;
  segments: Segment[];
}

// English first, then Hindi, then whatever the video has.
const PREFERRED = ["en", "hi"];

const decode = (s: string) =>
  s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** Returns null when the video simply has no captions. Throws on network / rate-limit errors. */
export const fetchBestTranscript = async (videoId: string): Promise<Transcript | null> => {
  let tracks;
  try {
    tracks = await listLanguages(videoId);
  } catch (err) {
    if (isNoCaptions(err)) return null;
    throw err;
  }
  if (!tracks.length) return null;

  const codes = tracks.map((t) => t.languageCode);
  const lang =
    PREFERRED.map((p) => codes.find((c) => c === p || c.startsWith(`${p}-`))).find(Boolean) ??
    codes[0];

  const raw = await fetchTranscript(videoId, { lang });
  const segments = raw.map((s): Segment => [Math.round(s.offset * 10) / 10, decode(s.text)]);
  return { lang, segments };
}

/** Segments inside [start, end) — used when one video is split into chapter lessons. */
export const sliceSegments = (segments: Segment[], start = 0, end = Infinity): Segment[] => {
  return segments.filter(([t]) => t >= start && t < end);
}

const isNoCaptions = (err: unknown) => {
  const name = (err as Error)?.constructor?.name ?? "";
  return /Disabled|NotAvailable/.test(name);
}
