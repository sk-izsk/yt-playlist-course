import Link from "next/link"
import { Logo } from "./Logo"
import { NavActions } from "./NavActions"
import styles from "./NavBar.module.css"

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
      <NavActions />
    </nav>
  </header>
)
