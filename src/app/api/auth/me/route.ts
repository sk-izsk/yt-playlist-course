import { eq } from "drizzle-orm"
import { db, first, schema } from "@/server/db/client"
import { optionalUser } from "@/server/auth/require-user"
import { handlePublic } from "@/server/http"

export const dynamic = "force-dynamic"

/** `{ username, role }` when logged in, `null` for visitors. The UI shows write controls only for a user. */
export const GET = () =>
  handlePublic(async () => {
    // Identity comes from live data so Settings remains reachable when the mirror is offline.
    const user = await optionalUser()
    return user
      ? ((await first(
          db
            .select({ username: schema.users.username, role: schema.users.role })
            .from(schema.users)
            .where(eq(schema.users.id, user.id))
            .limit(1),
        )) ?? null)
      : null
  })
