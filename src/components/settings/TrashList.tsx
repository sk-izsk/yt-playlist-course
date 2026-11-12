"use client"

import { Button } from "antd"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/client/api"

const day = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" })

/** Deleted courses stay restorable for 7 days, then the daily cron purges them for good. */
export const TrashList = () => {
  const qc = useQueryClient()
  const trash = useQuery({ queryKey: ["trash"], queryFn: api.trash })
  const restore = useMutation({
    mutationFn: api.restoreCourse,
    onSuccess: () => qc.invalidateQueries(), // the course is back in the library too
  })

  if (!trash.isLoading && !trash.data?.length) {
    return <p style={{ margin: 0, color: "var(--ink-soft)" }}>Trash is empty. Deleted courses stay here for 7 days.</p>
  }
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
      {trash.data?.map((c, i) => (
        <div
          key={c.token}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            borderTop: i ? "1px solid var(--line)" : 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{c.title}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {c.channel} · deleted {day(c.deletedAt)} · gone for good {day(c.purgeAt)}
            </div>
          </div>
          <Button
            size="small"
            loading={restore.isPending && restore.variables === c.token}
            onClick={() => restore.mutate(c.token)}
          >
            Restore
          </Button>
        </div>
      ))}
    </div>
  )
}
