import { App } from "antd";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { displayId } from "@/shared/format";
import { useCourses } from "./useCourses";

/**
 * App-wide: when a course's transcripts finish loading, show a toast — unless you're already
 * on that course's page (its progress bar tells you there).
 */
export const useTranscriptWatcher = () => {
  const { data } = useCourses();
  const { notification } = App.useApp();
  const pathname = usePathname();
  const pending = useRef(new Map<string, number>());

  useEffect(() => {
    for (const c of data ?? []) {
      const before = pending.current.get(c.token);
      pending.current.set(c.token, c.transcriptsPending);
      if (!before || c.transcriptsPending > 0 || pathname === `/courses/${c.token}`) continue;
      notification.success({
        title: "Transcripts ready",
        description: `${c.title} — ${c.lessonCount} lessons. Copy the course id from its card and ask your agent to fill notes (${displayId(c.token)}).`,
        duration: 10,
      });
    }
  }, [data, notification, pathname]);
};
