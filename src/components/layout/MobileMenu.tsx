"use client"

import {
  BookOutlined,
  CloseOutlined,
  CompassOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  PlusOutlined,
  SettingOutlined,
  SunOutlined,
} from "@ant-design/icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import { useSession } from "@/client/hooks/useSession"
import { usePrefs } from "@/client/store/prefs"
import { logout } from "../auth/LogoutButton"
import { useMenuOpen } from "./useMenuOpen"
import styles from "./MobileMenu.module.css"

type Row = { href?: string; onClick?: () => void; icon: ReactNode; label: string; active?: boolean }

const MenuRow = ({ href, onClick, icon, label, active }: Row) => {
  const cls = `${styles.row} ${active ? styles.active : ""}`
  const body = (
    <>
      {icon}
      {label}
    </>
  )
  return href ? (
    <Link href={href} className={cls} onClick={onClick} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      {body}
    </button>
  )
}

/** Phone-only nav: a ☰ button that opens a full-screen sheet. Desktop keeps the inline controls. */
export const MobileMenu = () => {
  const { open, setOpen } = useMenuOpen()
  const { user, canEdit, loading } = useSession()
  const { mode, toggleMode } = usePrefs()
  const path = usePathname()
  const close = () => setOpen(false)

  const rows: Row[] = [
    { href: "/", icon: <HomeOutlined />, label: "Home", active: path === "/" },
    { href: "/#courses", icon: <BookOutlined />, label: "Library" },
    { href: "/#how", icon: <CompassOutlined />, label: "How it works" },
    ...(canEdit ? [{ href: "/#add", icon: <PlusOutlined />, label: "Add a course" }] : []),
    ...(user
      ? [{ href: "/settings", icon: <SettingOutlined />, label: "Settings", active: path === "/settings" }]
      : []),
  ]

  return (
    <>
      <button type="button" className={styles.toggle} aria-label="Open navigation" onClick={() => setOpen(true)}>
        <MenuOutlined />
      </button>
      {open &&
        createPortal(
          // Portal: the sticky nav's backdrop-filter would otherwise trap position: fixed inside the bar.
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Navigation">
            <button type="button" className={styles.close} aria-label="Close navigation" onClick={close}>
              <CloseOutlined />
            </button>
            <nav className={styles.list}>
              {rows.map((r) => (
                <MenuRow key={r.label} {...r} onClick={close} />
              ))}
              <MenuRow
                icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
                label={mode === "light" ? "Dark mode" : "Light mode"}
                onClick={toggleMode}
              />
              {user && <MenuRow icon={<LogoutOutlined />} label="Log out" onClick={logout} />}
              {!user && !loading && <MenuRow href="/login" icon={<LoginOutlined />} label="Log in" onClick={close} />}
            </nav>
          </div>,
          document.body,
        )}
    </>
  )
}
