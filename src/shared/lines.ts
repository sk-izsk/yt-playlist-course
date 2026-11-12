import type { CSSProperties } from "react";

/** The network's line colours. Saturated enough to read on white and on the dark "night map". */
export const LINES = [
  { name: "Red", hex: "#E8483B" },
  { name: "Green", hex: "#1F9D55" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Amber", hex: "#E39A0B" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Teal", hex: "#0E9AA7" },
  { name: "Magenta", hex: "#D6409F" },
] as const;

export type Line = (typeof LINES)[number];

// FNV-1a: tiny, stable across runtimes, spreads similar UUIDs well.
const hash = (s: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

/** A course's line is a stored index (courses.line), assigned once by pickLine. */
export const lineFor = (line: number): Line => LINES[((line % LINES.length) + LINES.length) % LINES.length];

/**
 * Picks a new course's line: the least-used colour, so courses don't clash until all
 * colours are taken. Prefers the colour its UUID hashes to, so the pick is stable for a
 * given library state.
 */
export const pickLine = (token: string, used: number[]): number => {
  const counts = LINES.map((_, i) => used.filter((u) => u === i).length);
  const least = Math.min(...counts);
  const preferred = hash(token) % LINES.length;
  return counts[preferred] === least ? preferred : counts.indexOf(least);
};

/** Two-letter line code from the title, like a metro roundel ("System Design" → "SD"). */
export const lineCode = (title: string) => {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const code = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return code.toUpperCase();
};

/** Spread on a container so everything inside can use var(--route). */
export const routeStyle = (line: number) => ({ "--route": lineFor(line).hex }) as CSSProperties;
