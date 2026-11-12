"use client"

import { SettingOutlined } from "@ant-design/icons"
import { Button, Tag, Tooltip } from "antd"
import Link from "next/link"
import { useDbSource } from "@/client/hooks/useDbSource"
import { useSession } from "@/client/hooks/useSession"
import { LogoutButton } from "../auth/LogoutButton"
import { NotificationBell } from "../notifications/NotificationBell"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./NavBar.module.css"

/** Right side of the nav: visitors get "Log in"; the owner gets the bell, settings, logout and "Add a course". */
export const NavActions = () => {
  const { user, canEdit, loading } = useSession()
  const { source } = useDbSource()
  return (
    <>
      {source === "backup" && (
        <Link href="/settings">
          <Tag color="warning" style={{ margin: 0 }}>
            Local backup · read-only
          </Tag>
        </Link>
      )}
      {user && <NotificationBell />}
      <ThemeToggle />
      {user && (
        <Tooltip title="Settings">
          <Link href="/settings" aria-label="Settings">
            <Button shape="circle" type="text" icon={<SettingOutlined />} style={{ border: "1px solid var(--line)" }} />
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
    </>
  )
}
