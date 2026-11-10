# CourseIt (personal)

Turn any YouTube video or playlist into a course you actually finish. Local-only and single-user.

- Paste a link: lessons are created (long videos with chapters are split), and transcripts download in the background.
- Hand a course id to **Claude or Codex**: the agent writes formatted notes, Easy/Medium/Hard practice and a quiz for each lesson.
- Learn: embedded player, a 30–120 min daily plan, quizzes that jump the video to the explaining moment, timestamped markdown notes.
- Stay current: the app checks playlists for new videos. The 🔔 notification center lets you add them, and it lists failures.

## Quick start

```bash
make install   # bun install
make dev       # http://localhost:3000
```

Requirements: **bun**, **Node ≥ 22** (Next and the CLI run on Node), and `sqlite3` for the `db-*` targets. No API keys.

## Everyday commands

| Command | What it does |
|---|---|
| `make dev` | dev server |
| `make check` | typecheck + lint + self-tests (run before calling work done) |
| `make build` | production build |
| `make list` | courses with ids and progress |
| `make pending ID=<course-id>` | lessons still needing notes |
| `make show ID=<id>` | everything about a course or lesson, including the transcript |
| `make add URL="…"` | import a video or playlist from the terminal |
| `make db-backup` | snapshot your library to `~/.courseit/backups/` |

Run `make` with no target to see all of them.

## How the AI part works

The app never calls an LLM. Notes are written by your coding agent through a small CLI:

1. Copy a course id in the app (the chip or **Copy prompt** copies the full UUID).
2. Tell Claude or Codex: *"Fill notes for course `<id>`"*.
3. The agent follows [AGENTS.md](AGENTS.md): `pending` → `show` → write JSON → `save`. It only touches lessons without notes.

## Where things live

| What | Where |
|---|---|
| Your data (SQLite) | `~/.courseit/app.db`, outside the repo on purpose (see AGENTS.md); override with `DB_PATH` |
| Agent instructions | [AGENTS.md](AGENTS.md) (also loaded by Claude Code via `CLAUDE.md`) |
| Server code | `src/server/` (db, repo, services, youtube) |
| API routes | `src/app/api/` |
| UI | `src/components/` + `src/client/` (hooks, store, api) |
| Agent CLI | `scripts/agent/` |

Stack: Next.js 16 (App Router) · TypeScript · antd 6 · TanStack Query · zustand · ky · SQLite (better-sqlite3 + drizzle) · youtubei.js · youtube-transcript-plus · dnd-kit.
