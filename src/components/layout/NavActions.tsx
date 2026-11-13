"use client"

import { SettingOutlined } from "@ant-design/icons"
import { Button, Tag, Tooltip } from "antd"
import Link from "next/link"
import { useDbSource } from "@/client/hooks/useDbSource"
import { useSession } from "@/client/hooks/useSession"
import { LogoutButton } from "../auth/LogoutButton"
import { NotificationBell } from "../notifications/NotificationBell"
import { MobileMenu } from "./MobileMenu"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./NavBar.module.css"

/**
 * Right side of the nav. Desktop: inline theme, settings, logout and the CTA.
 * Phones: only the bell stays inline; everything else moves into the ☰ sheet.
 */
export const NavActions = () => {
  const { user, canEdit, loading } = useSession()
  const { source } = useDbSource()
  return (
    <>
      {source === "backup" && (
        <Link href="/settings">
          <Tag color="warning" style={{ margin: 0 }}>
            <span className={styles.desktopOnly}>Local backup · read-only</span>
            <span className={styles.phoneOnly}>Backup</span>
          </Tag>
        </Link>
      )}
      {user && <NotificationBell />}
      <div className={styles.desktop}>
        <ThemeToggle />
        {user && (
          <Tooltip title="Settings">
            <Link href="/settings" aria-label="Settings">
              <Button
                shape="circle"
                type="text"
                icon={<SettingOutlined />}
                style={{ border: "1px solid var(--line)" }}
              />
            </Link>
          </Tooltip>
        )}
        {user && <LogoutButton />}
        {canEdit && (
          <Link href="/#add" className={styles.cta}>
            Add a course
          </Link>
        )}
        {!user && !loading && (
          <Link href="/login" className={styles.cta}>
            Log in
          </Link>
        )}
      </div>
      <MobileMenu />
    </>
  )
}
