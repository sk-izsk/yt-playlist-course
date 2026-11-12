import { desc, eq, sql } from "drizzle-orm"
import { db, schema } from "../db/client"
import type { AppEvent, EventKind } from "@/shared/types"

const { events } = schema
const KEEP = 200 // the feed is a recent-activity list, not an audit log

export const addEvent = async (e: { kind: EventKind; title: string; body?: string; courseToken?: string | null }) => {
  try {
    await db.insert(events).values({ ...e, body: e.body ?? "" })
    // Trim old rows so the table never grows unbounded.
    await db.execute(sql`DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY id DESC LIMIT ${KEEP})`)
  } catch (err) {
    console.error("[events] could not record event", err) // never let logging break the caller
  }
}

export const listEvents = (limit = 50): Promise<AppEvent[]> =>
  db.select().from(events).orderBy(desc(events.id)).limit(limit)

export const markEventsRead = () => db.update(events).set({ read: true }).where(eq(events.read, false))

export const clearEvents = () => db.delete(events)
