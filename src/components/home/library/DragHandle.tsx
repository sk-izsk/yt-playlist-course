import { HolderOutlined } from "@ant-design/icons";
import type { HandleProps } from "./SortableItem";
import styles from "./library.module.css";

/** Grip button that starts a drag; hidden while dragging is disabled (e.g. during search). */
export const DragHandle = ({ handle }: { handle: HandleProps | null }) => {
  if (!handle) return null;
  return (
    <button type="button" className={styles.toolBtn} aria-label="Drag to reorder" {...handle.attributes} {...handle.listeners}>
      <HolderOutlined />
    </button>
  );
};
