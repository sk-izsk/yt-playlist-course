import { SectionHeading } from "../common/SectionHeading";
import styles from "./home.module.css";

const STEPS = [
  {
    title: "Paste a video or playlist",
    body: "Any YouTube video or a whole playlist. Long videos with chapters are split into lessons, and transcripts are fetched in the background.",
  },
  {
    title: "Hand the token to your agent",
    body: "Copy a CRS or LSN token and give it to Claude or Codex. It writes the notes, the easy/medium/hard practice and a quiz for each lesson.",
  },
  {
    title: "Learn at your pace",
    body: "Pick 30–120 minutes a day and the course splits into days. A wrong quiz answer jumps the video to the moment that explains it.",
  },
];

export const HowItWorks = () => {
  return (
    <section className={`container ${styles.section}`}>
      <SectionHeading eyebrow="How it works" id="how">
        From a 6-hour video to <em>a plan you finish.</em>
      </SectionHeading>
      <ol className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className={styles.stepNum} data-step={i}>{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
