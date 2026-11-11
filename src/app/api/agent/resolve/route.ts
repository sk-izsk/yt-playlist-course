import { handleAgent, HttpError } from "@/server/http";
import { resolveId } from "@/server/repo/resolve";

export const dynamic = "force-dynamic";

/** ?id=<uuid or unique prefix> → { type: "course" | "lesson", token }. */
export const GET = (req: Request) =>
  handleAgent(req, async () => {
    try {
      return await resolveId(new URL(req.url).searchParams.get("id") ?? "");
    } catch (err) {
      throw new HttpError(404, (err as Error).message);
    }
  });
