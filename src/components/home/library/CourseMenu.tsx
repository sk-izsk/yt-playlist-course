"use client"

import {
  CloudDownloadOutlined,
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  PushpinOutlined,
  SyncOutlined,
  YoutubeOutlined,
} from "@ant-design/icons"
import { App, Dropdown, type MenuProps } from "antd"
import { useDeleteCourse } from "@/client/hooks/useCourse"
import { useTogglePin } from "@/client/hooks/useCourseActions"
import { useCheckCourse, useUpdateCourses } from "@/client/hooks/useCourseUpdates"
import { useCopy } from "@/client/hooks/useCopy"
import { displayId } from "@/shared/format"
import type { CourseSummary } from "@/shared/types"
import styles from "./library.module.css"
import { useSession } from "@/client/hooks/useSession"

const youtubeUrl = (c: CourseSummary) =>
  c.kind === "playlist"
    ? `https://www.youtube.com/playlist?list=${c.youtubeId}`
    : `https://www.youtube.com/watch?v=${c.youtubeId}`

export const CourseMenu = ({ course: c }: { course: CourseSummary }) => {
  const { canEdit } = useSession() // visitors read only
  const { modal } = App.useApp()
  const pin = useTogglePin()
  const del = useDeleteCourse(c.token)
  const check = useCheckCourse(c.token)
  const update = useUpdateCourses()
  const copy = useCopy()
  const n = c.availableUpdates

  const items: MenuProps["items"] = [
    ...(n ? [{ key: "update", icon: <CloudDownloadOutlined />, label: `Add ${n} new video${n > 1 ? "s" : ""}` }] : []),
    { key: "pin", icon: <PushpinOutlined />, label: c.pinned ? "Unpin" : "Pin to top" },
    { key: "copy", icon: <CopyOutlined />, label: `Copy id (${displayId(c.token)})` }, // copies the full UUID
    { key: "youtube", icon: <YoutubeOutlined />, label: "Open on YouTube" },
    ...(c.kind === "playlist" ? [{ key: "check", icon: <SyncOutlined />, label: "Check for new videos" }] : []),
    { type: "divider" },
    { key: "delete", icon: <DeleteOutlined />, label: "Delete course", danger: true },
  ]

  const actions: Record<string, () => void> = {
    update: () => update.mutate([c]),
    pin: () => pin.mutate({ token: c.token, pinned: !c.pinned }),
    copy: () => copy(c.token, "Id copied"),
    youtube: () => window.open(youtubeUrl(c), "_blank", "noopener"),
    check: () => check.mutate(),
    delete: () =>
      modal.confirm({
        title: `Delete "${c.title}"?`,
        content: "It moves to the trash (Settings) with its progress and notes, and can be restored for 7 days.",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: () => del.mutateAsync(),
      }),
  }

  if (!canEdit) {
    return null
  }
  return (
    <Dropdown trigger={["click"]} placement="bottomRight" menu={{ items, onClick: ({ key }) => actions[key]?.() }}>
      <button type="button" className={styles.toolBtn} aria-label="Course actions">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}
