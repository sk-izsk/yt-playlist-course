import type { ReactNode } from "react"
import styles from "./common.module.css"

interface Props {
  title: string
  /** Optional one-line explanation under the heading. */
  children?: ReactNode
  id?: string
}

/** Left-aligned section heading, like station signage. No eyebrow labels, no accent words. */
export const SectionHeading = ({ title, children, id }: Props) => (
  <div className={styles.heading} id={id}>
    <h2>{title}</h2>
    {children && <p>{children}</p>}
  </div>
)
