"use client";

import { CheckCircleFilled } from "@ant-design/icons";
import type { MouseEvent } from "react";
import { useSelection } from "@/client/store/selection";
import styles from "./library.module.css";

/** Round checkbox shown on cards/rows while multi-select is on. */
export const SelectMark = ({ token }: { token: string }) => {
  const { ids, toggle } = useSelection();
  const selected = ids.has(token);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selected ? "Deselect course" : "Select course"}
      className={styles.selectMark}
      data-selected={selected}
      onClick={() => toggle(token)}
    >
      {selected && <CheckCircleFilled />}
    </button>
  );
};

/** While selecting, a click on the card toggles it instead of opening the course. */
export const useSelectableClick = (token: string) => {
  const { active, ids, toggle } = useSelection();
  return {
    selecting: active,
    selected: ids.has(token),
    onClick: (e: MouseEvent) => {
      if (!active) return;
      e.preventDefault();
      toggle(token);
    },
  };
};
