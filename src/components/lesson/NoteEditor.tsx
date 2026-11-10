"use client";

import { Button, Input, Segmented } from "antd";
import { useState } from "react";
import { MarkdownView } from "../common/MarkdownView";
import styles from "./lesson.module.css";

interface Props {
  saving: boolean;
  onSave: (text: string) => Promise<unknown>;
}

const HINT = "Markdown: - bullets · **bold** · `code` · - [ ] todo · ⌘/Ctrl + Enter to pin";

/** Big markdown editor with a live preview; the note is pinned at the current video time. */
export const NoteEditor = ({ saving, onSave }: Props) => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");

  const save = () => {
    if (!text.trim()) return;
    onSave(text).then(() => {
      setText("");
      setMode("write");
    });
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHead}>
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => setMode(v as typeof mode)}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
        <span className={styles.hint}>{HINT}</span>
      </div>

      {mode === "write" ? (
        <Input.TextArea
          autoSize={{ minRows: 7, maxRows: 20 }}
          placeholder={"Write while you watch — the note is pinned at the current video time.\n\n- key idea\n- **important** term"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
          }}
          className={styles.textarea}
        />
      ) : (
        <div className={styles.preview}>
          {text.trim() ? <MarkdownView compact>{text}</MarkdownView> : <span className={styles.hint}>Nothing to preview yet.</span>}
        </div>
      )}

      <div className={styles.editorFoot}>
        <Button type="primary" onClick={save} loading={saving} disabled={!text.trim()}>
          Pin note at current time
        </Button>
      </div>
    </div>
  );
};
