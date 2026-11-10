import { lineCode } from "@/shared/lines";
import styles from "./route.module.css";

/** Metro-style roundel with the course's line code, e.g. "SD" in the line colour. */
export const LineBadge = ({ title, size = "md" }: { title: string; size?: "sm" | "md" | "lg" }) => (
  <span className={styles.badge} data-size={size} aria-hidden>
    {lineCode(title)}
  </span>
);
