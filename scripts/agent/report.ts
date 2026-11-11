import { reportData } from "@/server/services/agent-context";
import { formatReport } from "@/shared/agent-format";

/** The end-of-run table, printed by code so an agent doesn't spend tokens writing it. */
export const reportCourse = async (token: string) => console.log(formatReport((await reportData(token))!));
