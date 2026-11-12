"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"

export type HandleProps = Pick<ReturnType<typeof useSortable>, "attributes" | "listeners">

interface Props {
  id: string
  disabled?: boolean
  /** Render prop: spread `handle` onto the drag handle so the rest of the card stays clickable. */
  children: (handle: HandleProps | null) => ReactNode
}

export const SortableItem = ({ id, disabled, children }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 5 : undefined,
        opacity: isDragging ? 0.85 : 1,
        position: "relative",
      }}
    >
      {children(disabled ? null : { attributes, listeners })}
    </div>
  )
}
