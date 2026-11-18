/** Copied prompts name the MCP server so an agent without it knows what to look for. */
export const agentPrompt = (task: string) =>
  `Using the Tubewise MCP server (it must be installed and connected in your agent), ${task}. ` +
  `Call notes_guide first, then follow it.`
