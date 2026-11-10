import { Pill } from "../common/SectionHeading";
import { AddLinkForm } from "./AddLinkForm";
import { HeroScene } from "./HeroScene";
import styles from "./home.module.css";

export const Hero = () => {
  return (
    <section className={styles.hero}>
      <HeroScene />
      <div className={styles.heroContent}>
        <Pill>▶ Your personal YouTube classroom</Pill>
        <h1 className={styles.heroTitle}>
          Turn any YouTube video into
          <br />a course you <em className="accent">actually finish.</em>
        </h1>
        <p className={styles.heroSub}>Paste a link. Get lessons, notes, practice and a plan that fits your day.</p>
        <div className={styles.addCard} id="add">
          <AddLinkForm />
        </div>
      </div>
    </section>
  );
}
