import { LINES } from "@/shared/lines"
import { SectionHeading } from "../common/SectionHeading"
import styles from "./home.module.css"

// A real sequence, so it's drawn as three stops on one line.
const STEPS = [
  {
    title: "Paste a video or playlist",
    body: "Long videos with chapters are split into lessons. Transcripts download in the background.",
  },
  {
    title: "Hand the course id to your agent",
    body: "Claude or Codex writes notes, easy to hard practice and a quiz for every lesson that needs one.",
  },
  {
    title: "Ride it to the last stop",
    body: "Pick 30 to 120 minutes a day. A wrong quiz answer jumps the video to the moment that explains it.",
  },
]

export const HowItWorks = () => (
  <section className={`container ${styles.section}`} id="how">
    <SectionHeading title="How a playlist becomes a route" />
    <ol className={styles.steps} style={{ ["--route" as string]: LINES[1].hex }}>
      {STEPS.map((s, i) => (
        <li key={s.title} className={styles.step}>
          <span className={styles.stepStop} aria-hidden>
            {i + 1}
          </span>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </li>
      ))}
    </ol>
  </section>
)
