import { AddLinkForm } from "./AddLinkForm";
import { TransitMap } from "./TransitMap";
import styles from "./home.module.css";

export const Hero = () => (
  <section className={`container ${styles.hero}`}>
    <div className={styles.heroCopy}>
      <h1 className={styles.heroTitle}>
        Turn a YouTube playlist
        <br />
        into a route you finish.
      </h1>
      <p className={styles.heroSub}>
        Paste a link. Every video becomes a stop with notes, practice and a quiz, laid out as a daily plan you can
        actually keep.
      </p>
      <div className={styles.addCard} id="add">
        <AddLinkForm />
      </div>
    </div>
    <TransitMap />
  </section>
);
