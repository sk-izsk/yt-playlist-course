// Where you stopped in each lesson. Per-browser convenience, so localStorage is fine;
// every access is guarded because storage can be blocked (private windows).

const key = (lesson: string) => `tw-pos:${lesson}`;

export const readPos = (lesson: string): number | null => {
  try {
    const v = Number(localStorage.getItem(key(lesson)));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
};

export const savePos = (lesson: string, sec: number) => {
  try {
    localStorage.setItem(key(lesson), String(Math.floor(sec)));
  } catch {}
};

export const clearPos = (lesson: string) => {
  try {
    localStorage.removeItem(key(lesson));
  } catch {}
};

/** Resume only when it's worth it: not in the first 5s, not in the last 10s. */
export const resumeAt = (saved: number | null, start: number | null | undefined, end: number | null | undefined) =>
  saved != null && saved > (start ?? 0) + 5 && (end == null || saved < end - 10) ? saved : null;
