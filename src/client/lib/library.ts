import type { CourseSummary } from "@/shared/types";

/** Case-insensitive match on title, channel or id prefix. */
export const filterCourses = (list: CourseSummary[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) => c.title.toLowerCase().includes(q) || c.channel.toLowerCase().includes(q) || c.token.startsWith(q),
  );
};

export const splitPinned = (list: CourseSummary[]) => ({
  pinned: list.filter((c) => c.pinned),
  rest: list.filter((c) => !c.pinned),
});

/** Moves `from` → `to` inside one section, returning the full token order (pinned first). */
export const reorderTokens = (pinned: string[], rest: string[], section: "pinned" | "rest", from: number, to: number) => {
  const move = (arr: string[]) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };
  return section === "pinned" ? [...move(pinned), ...rest] : [...pinned, ...move(rest)];
};
