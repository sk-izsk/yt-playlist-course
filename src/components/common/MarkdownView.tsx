"use client";

import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Children, isValidElement, useMemo, type ReactNode } from "react";
import styles from "./markdown.module.css";

const SEEK = /^#t=(\d+)$/;

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((c) =>
      typeof c === "string" ? c : isValidElement<{ children?: ReactNode }>(c) ? textOf(c.props.children) : "",
    )
    .join("");

interface Props {
  children: string;
  /** Turns [mm:ss](#t=123) links into buttons that seek the player. */
  onSeek?: (sec: number) => void;
  compact?: boolean;
}

/** Shared markdown renderer for AI summaries and personal notes. */
export const MarkdownView = ({ children, onSeek, compact }: Props) => {
  // Memoized: new renderer functions on every render would make react-markdown remount every link and heading.
  const components = useMemo<Components>(
    () => ({
      a: ({ href = "", children: label }) => {
        const t = href.match(SEEK);
        if (t && onSeek) {
          return (
            <button type="button" className={`${styles.stamp} mono`} onClick={() => onSeek(Number(t[1]))}>
              ▶ {label}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        );
      },
      // "Important points" / "Key takeaways" headings get the highlighted treatment.
      h2: ({ children: c }) => <h2 data-key={/important|key takeaway/i.test(textOf(c)) || undefined}>{c}</h2>,
    }),
    [onSeek],
  );

  return (
    <div className={compact ? `${styles.md} ${styles.compact}` : styles.md}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </Markdown>
    </div>
  );
};
