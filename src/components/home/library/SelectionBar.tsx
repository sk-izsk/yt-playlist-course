"use client"

import { DeleteOutlined } from "@ant-design/icons"
import { App, Button } from "antd"
import { useBulkDelete } from "@/client/hooks/useBulkCourses"
import { useSelection } from "@/client/store/selection"
import type { CourseSummary } from "@/shared/types"
import styles from "./library.module.css"
import { useSession } from "@/client/hooks/useSession"

/** Sticky action bar while multi-select is on: count · select all · delete · done. */
export const SelectionBar = ({ visible }: { visible: CourseSummary[] }) => {
  const { canEdit } = useSession() // visitors read only
  const { ids, setAll, stop } = useSelection()
  const { modal } = App.useApp()
  const bulkDelete = useBulkDelete()
  const n = ids.size
  const allSelected = n > 0 && visible.every((c) => ids.has(c.token))

  const confirmDelete = () =>
    modal.confirm({
      title: `Delete ${n} course${n > 1 ? "s" : ""}?`,
      content: "They move to the trash (Settings) with their progress and notes, and can be restored for 7 days.",
      okText: `Delete ${n}`,
      okButtonProps: { danger: true },
      onOk: () => {
        bulkDelete.mutate([...ids])
        stop()
      },
    })

  if (!canEdit) {
    return null
  }
  return (
    <div className={styles.selectionBar}>
      <b>{n ? `${n} selected` : "Select courses"}</b>
      <Button size="small" type="text" onClick={() => setAll(allSelected ? [] : visible.map((c) => c.token))}>
        {allSelected ? "Clear" : "Select all"}
      </Button>
      <span className={styles.spacer} />
      <Button size="small" danger icon={<DeleteOutlined />} disabled={!n} onClick={confirmDelete}>
        Delete
      </Button>
      <Button size="small" onClick={stop}>
        Done
      </Button>
    </div>
  )
}
