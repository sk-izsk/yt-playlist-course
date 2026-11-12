"use client";

import { Button, Input } from "antd";
import { useState } from "react";
import { useTutorChat } from "@/client/hooks/useTutor";
import type { LessonDetail } from "@/shared/types";
import { MarkdownView } from "../common/MarkdownView";
import styles from "./lesson.module.css";

/** "Ask this lesson": a short chat with the AI tutor, grounded in this lesson's notes (and transcript for the owner). */
export const AskPanel = ({ lesson, seek }: { lesson: LessonDetail; seek: (sec: number) => void }) => {
  const { turns, busy, ask, reset } = useTutorChat(lesson.token);
  const [q, setQ] = useState("");

  const send = () => {
    if (!q.trim() || busy) return;
    void ask(q.trim());
    setQ("");
  };

  return (
    <div className={styles.notes}>
      {turns.map((t, i) => (
        <div key={i} className={styles.note}>
          <div className={styles.noteBody}>
            {t.role === "user" ? (
              <strong>{t.content}</strong>
            ) : (
              <MarkdownView compact onSeek={seek}>{t.content || "…"}</MarkdownView>
            )}
          </div>
        </div>
      ))}
      <Input.TextArea
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder="Ask about this lesson, e.g. “Why does consistent hashing help here?”"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        disabled={busy}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Button type="primary" onClick={send} loading={busy} disabled={!q.trim()}>
          Ask
        </Button>
        {turns.length > 0 && <Button onClick={reset} disabled={busy}>New chat</Button>}
      </div>
    </div>
  );
};
