"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import type { LibraryView } from "@/client/store/prefs"
import type { CourseSummary } from "@/shared/types"
import { CourseCard } from "./CourseCard"
import { CourseListRow } from "./CourseListRow"
import { SortableItem } from "./SortableItem"
import styles from "./library.module.css"

interface Props {
  title?: string
  courses: CourseSummary[]
  view: LibraryView
  dragDisabled: boolean
  onMove: (from: number, to: number) => void
}

/** One draggable group (Pinned / All). Items only move within their own group. */
export const SortableSection = ({ title, courses, view, dragDisabled, onMove }: Props) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  if (!courses.length) {
    return null
  }

  const ids = courses.map((c) => c.token)
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return
    }
    onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
  }

  const Item = view === "grid" ? CourseCard : CourseListRow
  return (
    <section className={styles.section}>
      {title && <h3 className={styles.sectionTitle}>{title}</h3>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={view === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
          <div className={view === "grid" ? styles.grid : styles.list}>
            {courses.map((c) => (
              <SortableItem key={c.token} id={c.token} disabled={dragDisabled}>
                {(handle) => <Item course={c} handle={handle} />}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  )
}
