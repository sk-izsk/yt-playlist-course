import type { ReactNode } from "react";
import styles from "./common.module.css";

interface Props {
  eyebrow: string;
  children: ReactNode;
  id?: string;
}

/** Pill label above a big display heading — wrap the accent words in <em>. */
export const SectionHeading = ({ eyebrow, children, id }: Props) => {
  return (
    <div className={styles.heading} id={id}>
      <span className={styles.pill}>{eyebrow}</span>
      <h2>{children}</h2>
    </div>
  );
}

export const Pill = ({ children }: { children: ReactNode }) => {
  return <span className={styles.pill}>{children}</span>;
}
