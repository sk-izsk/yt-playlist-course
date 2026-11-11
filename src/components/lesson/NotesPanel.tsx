"use client";

import { DeleteOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNoteMutations } from "@/client/hooks/useNotes";
import type { PlayerControls } from "@/client/hooks/useYouTubePlayer";
import { clock } from "@/shared/format";
import type { LessonDetail } from "@/shared/types";
import { MarkdownView } from "../common/MarkdownView";
import { NoteEditor } from "./NoteEditor";
import styles from "./lesson.module.css";

/** Notes pinned to the moment you wrote them; click a time to jump back there. */
import { useSession } from "@/client/hooks/useSession";

export const NotesPanel = ({ lesson, player }: { lesson: LessonDetail; player: PlayerControls }) => {
  const { add, remove } = useNoteMutations(lesson.token);
  const { canEdit } = useSession(); // visitors can read notes, not write them

  return (
    <div className={styles.notes}>
      {canEdit && (
        <NoteEditor saving={add.isPending} onSave={(text) => add.mutateAsync({ atSec: player.currentTime(), text })} />
      )}
      {!canEdit && !lesson.notes.length && <p className={styles.noteBody}>No notes on this lesson.</p>}

      {lesson.notes.map((n) => (
        <div key={n.id} className={styles.note}>
          <button type="button" className={`${styles.stamp} mono`} onClick={() => player.seek(n.atSec)}>
            ▶ {clock(n.atSec)}
          </button>
          <div className={styles.noteBody}>
            <MarkdownView compact onSeek={player.seek}>{n.text}</MarkdownView>
          </div>
          {canEdit && (
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              aria-label="Delete note"
              onClick={() => remove.mutate(n.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
