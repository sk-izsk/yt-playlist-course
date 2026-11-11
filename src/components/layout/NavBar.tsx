import Link from "next/link";
import { LogoutButton } from "../auth/LogoutButton";
import { NotificationBell } from "../notifications/NotificationBell";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./NavBar.module.css";

export const NavBar = () => (
  <header className={styles.wrap}>
    <nav className={styles.bar} aria-label="Main">
      <Link href="/" className={styles.logo}>
        <Logo />
        Tubewise
      </Link>
      <div className={styles.links}>
        <Link href="/#courses">Library</Link>
        <Link href="/#how">How it works</Link>
      </div>
      <NotificationBell />
      <ThemeToggle />
      <LogoutButton />
      <Link href="/#add" className={styles.cta}>
        Add a course
      </Link>
    </nav>
  </header>
);
