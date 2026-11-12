import { handle, notFound } from "@/server/http"
import { ownerOnly, revokeAgentToken } from "@/server/auth/agent-tokens"

/** Revokes (does not delete) a token, so it stops working immediately. */
export const DELETE = async (_: Request, ctx: RouteContext<"/api/agent-tokens/[id]">) => {
  const { id } = await ctx.params
  return handle(async (u) => {
    if (!(await revokeAgentToken(ownerOnly(u).id, Number(id)))) {
      throw notFound("Token")
    }
    return { ok: true }
  })
}
