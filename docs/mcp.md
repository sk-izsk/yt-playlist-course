# Tubewise MCP server

`mcp/server.ts` runs **on your Mac** over stdio. It talks to the app only through the agent API (`/api/agent/*`)
with a personal agent token, and it downloads YouTube transcripts locally (YouTube blocks them from Vercel).
It can read courses and lessons, upload transcripts and save notes. It can never delete anything.

## Set up once

1. In the app, log in → **Settings** → create an agent token (e.g. "MacBook MCP"). Copy it; it is shown once.
2. Register the server for every folder (user scope):

   ```bash
   make mcp-add URL=https://<your-app>.vercel.app TOKEN=tw_...
   ```

   That runs:

   ```bash
   claude mcp add tubewise --scope user \
     -e TUBEWISE_URL=<url> -e TUBEWISE_TOKEN=<token> \
     -- "<repo>/node_modules/.bin/tsx" "<repo>/mcp/server.ts"
   ```

   Use `URL=http://localhost:3000` to point it at the local dev server instead.
   For Codex, add the same command and env to `~/.codex/config.toml` under `[mcp_servers.tubewise]`.
3. Revoke the token on Settings any time; the server stops working at once.

## Tools

| tool | what it does |
|---|---|
| `notes_guide` | the writing rules (`docs/notes-guide.md`); read first |
| `list_courses` | ids, notes done / total, transcripts pending |
| `get_course` | every lesson with id, length, notes and transcript status |
| `fetch_transcripts` | download missing transcripts on the Mac and upload them (`retry_errors` retries failed ones) |
| `list_pending` | the only lessons that still need notes |
| `get_lesson` | lesson details + transcript (`compact` / `full` / `head`) + target length |
| `save_notes` | save `{ kind, summary, practice, quiz }`; server-side checks and answer shuffle; `force` only on request |
| `course_report` | per-lesson table at the end of a run |

## The workflow

"Fill notes for course `<id>`" in Claude Code or Codex → `fetch_transcripts` → `list_pending` → for each lesson
`get_lesson` → write the JSON by hand → `save_notes` → `course_report`.

Verified 2026-11-11 by driving the server over stdio from outside the repo: every tool, a transcript fetched on the
Mac and uploaded, a validation rejection returned to the agent, a light lesson saved, overwrite refused.
