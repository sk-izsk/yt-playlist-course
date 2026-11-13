"use client"

import type { ReactNode } from "react"
import { useSession } from "@/client/hooks/useSession"
import { Logo } from "./Logo"
import styles from "./SessionGate.module.css"

/**
 * Holds every page behind a loader until /api/auth/me answers, so a logged-in reload never flashes the
 * visitor view first. A visitor gets `null` back and sees the normal page; a failed /me also falls through.
 */
export const SessionGate = ({ children }: { children: ReactNode }) => {
  const { loading } = useSession()
  if (!loading) {
    return children
  }
  return (
    <div className={styles.screen} role="status" aria-label="Loading">
      <div className={styles.mark}>
        <Logo size={56} />
      </div>
    </div>
  )
}
