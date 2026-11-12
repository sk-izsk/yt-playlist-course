"use client"

import { BellOutlined } from "@ant-design/icons"
import { Badge, Button } from "antd"
import { useState } from "react"
import { useCourses } from "@/client/hooks/useCourses"
import { useNotificationActions, useNotifications } from "@/client/hooks/useNotifications"
import { NotificationDrawer } from "./NotificationDrawer"

/** Navbar bell: badge = unread activity + courses with new videos waiting. */
export const NotificationBell = () => {
  const [open, setOpen] = useState(false)
  const { data: events = [] } = useNotifications()
  const { data: courses = [] } = useCourses()
  const { markRead } = useNotificationActions()

  const unread = events.filter((e) => !e.read).length
  const updatable = courses.filter((c) => c.availableUpdates > 0).length
  const hasError = events.some((e) => !e.read && e.kind === "error")

  const openDrawer = () => {
    setOpen(true)
    if (unread) {
      markRead.mutate()
    }
  }

  return (
    <>
      <Badge count={unread + updatable} size="small" color={hasError ? "red" : undefined} offset={[-4, 4]}>
        <Button
          shape="circle"
          type="text"
          aria-label={`Notifications${unread + updatable ? ` (${unread + updatable})` : ""}`}
          icon={<BellOutlined />}
          onClick={openDrawer}
          style={{ border: "1px solid var(--line)" }}
        />
      </Badge>
      <NotificationDrawer open={open} onClose={() => setOpen(false)} events={events} courses={courses} />
    </>
  )
}
