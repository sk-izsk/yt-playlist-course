import { handle, handleRead } from "@/server/http"
import { clearEvents, listEvents, markEventsRead } from "@/server/repo/events"

export const dynamic = "force-dynamic"

// The feed is the owner's (failures, update counts); visitors get an empty one.
export const GET = () => handleRead((user) => (user ? listEvents() : []))

/** Marks everything read (opening the notification center). */
export const POST = () =>
  handle(async () => {
    await markEventsRead()
    return { ok: true }
  })

export const DELETE = () =>
  handle(async () => {
    await clearEvents()
    return { ok: true }
  })
