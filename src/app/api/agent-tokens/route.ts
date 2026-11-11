import { handle, HttpError, readJson } from "@/server/http";
import { createAgentToken, listAgentTokens, ownerOnly } from "@/server/auth/agent-tokens";

export const dynamic = "force-dynamic";

export const GET = () => handle((u) => listAgentTokens(ownerOnly(u).id));

/** Body: { name }. The response holds the token in plain text; it is never shown again. */
export const POST = (req: Request) =>
  handle(async (u) => {
    const { name } = await readJson<{ name?: string }>(req);
    if (!name?.trim()) throw new HttpError(400, "Give the token a name, e.g. \"MacBook MCP\"");
    return createAgentToken(ownerOnly(u).id, name.trim().slice(0, 60));
  }, 201);
