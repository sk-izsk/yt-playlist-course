import Link from "next/link";
import { NotificationBell } from "../notifications/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./NavBar.module.css";

export const NavBar = () => {
  return (
    <header className={styles.wrap}>
      <nav className={styles.bar}>
        <Link href="/" className={styles.logo}>
          <span aria-hidden className={styles.cap}>🎓</span>
          <span>
            Course<span className={styles.it}>It</span>
          </span>
        </Link>
        <div className={styles.links}>
          <Link href="/#courses">Courses</Link>
          <Link href="/#how">How it works</Link>
        </div>
        <NotificationBell />
        <ThemeToggle />
        <Link href="/#add" className={styles.cta}>
          Start learning
        </Link>
      </nav>
    </header>
  );
}
