type Line = [sec: number, text: string];

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Shrinks a transcript before an agent reads it: caption lines merge into blocks of about
 * `chunkSec` seconds (one timestamp per block instead of one per 3-second line), and a sentence
 * the speaker repeats within the last few sentences is dropped. Each block keeps the start second
 * of its first caption line, so it is still a valid `#t=` / `atSec` target.
 * ponytail: exact-repeat removal only; paraphrased repeats stay. Fuzzy matching if it matters.
 */
export const compactTranscript = (segments: Line[], chunkSec = 12): Line[] => {
  const chunks: Line[] = [];
  for (const [sec, text] of segments) {
    const cur = chunks.at(-1);
    if (cur && sec - cur[0] < chunkSec) cur[1] += ` ${text}`;
    else chunks.push([sec, text]);
  }

  const recent: string[] = [];
  const out: Line[] = [];
  for (const [sec, text] of chunks) {
    const kept = text.split(/(?<=[.?!।])\s+/).filter((s) => {
      const n = norm(s);
      if (!n || recent.includes(n)) return false;
      recent.push(n);
      if (recent.length > 3) recent.shift();
      return true;
    });
    if (kept.length) out.push([sec, kept.join(" ")]);
  }
  return out;
};
