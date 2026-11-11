<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tubewise (personal) — agent guide

Local, single-user app that turns YouTube videos and playlists into courses. The user adds courses in the app; **you** write each lesson's notes, practice and quiz through the CLI. Two kinds of work happen here: **content work** (filling notes; see Part B) and **code work** (changing the app; see Part A).

---

# Part A — working on the code

## Commands (see `Makefile`; run `make` to list them)

- `make dev`: dev server at http://localhost:3000.
- `make check`: typecheck, lint and the `*.check.ts` self-tests. **Run it before saying you're done.**
- `make build`: production build; catches broken imports that dev mode tolerates.
- `make list | pending | show | add | sync | transcripts`: the agent CLI (Part B). Local mode uses `DATABASE_URL`; with `TUBEWISE_URL` + `TUBEWISE_TOKEN` set it goes through the app's agent API instead (`scripts/agent/remote.ts`). The MCP server is `mcp/server.ts` (see `docs/mcp.md`).

## Conventions (the user asked for these, so follow them)

- **bun** is the package manager (`bun install`, `bun add`, `bunx`), never npm or npx. `next` and the CLI (`tsx`) still *run on Node* (node-postgres, `node:sqlite` in the copy script). Bun only installs and launches them.
- **Arrow functions only** (`export const fn = () => {}`). The exception is code that needs `this` (classes like `HttpError`). Pages use `const Page = () => …; export default Page;`.
- **Small files**, about 100–120 lines max. Split UI into components plus custom hooks rather than growing a file.
- Comment *why*, not what. A deliberate shortcut gets a `ponytail:` comment that names its limit.
- Non-trivial pure logic gets a tiny `*.check.ts` self-test next to it (see `src/client/lib/plan.check.ts`). `make selfcheck` runs them.

## Architecture

```
src/
  app/                  Next routes. Pages are thin client components; api/ = JSON routes
  server/               Node-only
    auth/               tokens (jose JWT), sessions (refresh rotation), login (argon2 + lockout), require-user, cookies
    db/                 client.ts (pg Pool + drizzle, `first()` helper), schema.ts + auth-schema.ts (drizzle pg-core)
drizzle/                generated SQL migrations (drizzle-kit)
    repo/               queries: courses, lessons, lesson-content, events, course-order, resolve
    services/           import-course, sync-course (add new videos), check-updates (detect only),
                        sync-stale (on app open), transcripts (background fetch loop), save-content
    youtube/            youtubei.js (playlist/video/chapters) + youtube-transcript-plus
    http.ts             handle(): errors → { error } JSON; unexpected ones are logged to the events feed
  client/               browser-side: api.ts (ky), hooks/, store/ (zustand: prefs, selection), lib/
  components/           common/ home/ home/library/ course/ lesson/ notifications/ layout/
  shared/               types.ts (DTOs), content-schema.ts (zod), format.ts, links.ts
scripts/agent/          the CLI agents use (index.ts, show.ts)
```

Data flow: component → hook (TanStack Query) → `client/api.ts` (ky) → `app/api/*` → `server/services|repo` → Postgres (Neon).

## Things that will bite you

- **The DB is Postgres on Neon**, via `DATABASE_URL` in `.env.local` (never commit it). Every repo function is async: await it, and use `first()` instead of SQLite's `.get()`. Timestamps are epoch-ms `bigint` columns read as JS numbers. `~/.courseit/app.db` is the frozen SQLite archive, copied once with `make db-copy`.
- **Login (reading is public):** read routes use `handleRead()` (user is optional; visitors get the same data), every write uses `handle()`, which calls `requireUser()` (JWT in the `tw_at` cookie, 15 min) and answers 401 "Log in to make changes". `handlePublic()` is for `/api/auth/*` and the cron; `handleAgent()` for `/api/agent/*` (Bearer agent token). In the UI, gate write controls with `useSession().canEdit`. `src/proxy.ts` only guards `/settings`. The refresh token (`tw_rt`, path `/api/auth`) rotates on every refresh with a 24 h sliding idle expiry; presenting a rotated-away token revokes all of that user's sessions. Pages behind login live in the `src/app/(app)/` route group. Create users with `make user NAME=…` or `make owner` (reads `OWNER_USERNAME`/`OWNER_PASSWORD` from `.env.local`); no signup. `JWT_SECRET` lives in `.env.local`.
- **Schema changes:** edit `schema.ts`, run `make db-generate`, read the new SQL in `drizzle/`, then `make db-migrate`. Nothing migrates on load. **Restart the dev server** afterwards, because a hot-reloaded server can keep a stale drizzle schema and fail with "Cannot read properties of undefined (reading 'Symbol(drizzle:Columns)')".
- **ky 2** reads error bodies into `err.data`, and `err.response.json()` throws. Use `errorMessage()` from `client/api.ts`, which never throws.
- **Errors surface automatically:** `useErrorToasts` toasts any failed query or mutation. A mutation that shows its own error sets `meta: { silentError: true }` to avoid a double toast. Server failures go to the `events` table and show in the 🔔 notification center.
- **Transcripts run in-process.** Stopping the server mid-load leaves lessons `pending`. `POST /api/sync` (called on app open) resumes them, and the loop stops if its course gets deleted.
- **New videos are detect-then-add.** `check-updates` only counts them (`courses.available_updates` drives the "+N new" chip, banner and bell), and `sync-course` actually adds them.
- **Ids:** every course and lesson has a full **UUID v4**. The UI *shows* only the part before the first dash (`displayId()`), and every copy action copies the full UUID.
- Verify UI changes in the browser, not just with tsc. The look is the **Transit** system: Geist / Geist Mono, ink on cool white (dark = night map), and each course is a "line" whose colour is stored in `courses.line` (picked once on import by `pickLine` in `shared/lines.ts` so courses don't clash; exposed as `--route`). Progress is drawn as metro stops (`RouteBar`). Never reuse courseit.xyz styling.
- The app is named **Tubewise**; `~/.courseit/` and the `courseit-prefs` storage key keep the old name on purpose, because renaming them orphans existing data.

---

# Part B — writing course content

**The full rules live in [docs/notes-guide.md](docs/notes-guide.md). Read it before writing any lesson notes.**
They apply the same way whether you use the local CLI (`bun run agent …`) or the Tubewise MCP server.

Short version: never edit the DB directly; `pending` lists the only lessons to do; `show` gives the transcript;
`save` (or the MCP `save_notes` tool) validates, shuffles quiz answers and refuses template-looking notes;
never redo finished lessons without an explicit request; write every lesson by hand from its own transcript.
