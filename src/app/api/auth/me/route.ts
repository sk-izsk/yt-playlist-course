import { eq } from "drizzle-orm"
import { db, first, schema } from "@/server/db/client"
import { handleRead } from "@/server/http"

export const dynamic = "force-dynamic"

/** `{ username, role }` when logged in, `null` for visitors. The UI shows write controls only for a user. */
export const GET = () =>
  handleRead(async (user) =>
    user
      ? ((await first(
          db
            .select({ username: schema.users.username, role: schema.users.role })
            .from(schema.users)
            .where(eq(schema.users.id, user.id))
            .limit(1),
        )) ?? null)
      : null,
  )
