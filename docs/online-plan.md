# Tubewise online — plan

Decided with the user on 2026-11-11. Work on a new branch `online`; `dev` keeps working locally until the switch.
Do **one phase per session**, verify it (`make check`, browser, a real lesson save), then tick it here.

## Decisions (already made, don't re-litigate)

- **Host: Vercel (Hobby, free). DB: Neon Postgres (free).** Postgres was chosen for the user's resume.
  Neon free tier autosuspends after 5 min idle (~0.5 s wake-up) and has only a 6 h restore window → own backups (phase 7).
- **Everything must stay free.** No residential proxy, no paid transcript API. AI tutor only if the user adds a key.
- **YouTube blocks transcripts from Vercel** (tested 2026-11-11 with a throwaway deploy, 5/5 tries):
  `getInfo` and `getPlaylist` work, `youtube-transcript-plus` returns "no transcripts", youtubei.js `getTranscript` → HTTP 400.
  The same video gave 675 lines from the user's Mac. So: **adding a course online saves metadata only; lessons stay
  `transcript pending`; the Mac downloads transcripts and uploads them through the agent API.**
  Leave a disabled `PROXY_URL` hook in the transcript fetcher for later; don't build anything else for it.
- **Login: single owner user + a demo user.** No signup page; create the user with a CLI command.
  - Access token: JWT HS256 via `jose`, 15 min, claims `{sub, role, sid}`, httpOnly Secure SameSite=Lax cookie.
  - Session token: 32 random bytes, only its SHA-256 stored, cookie scoped to `/api/auth`. **24 h sliding** idle expiry,
    rotated on every refresh; reuse of an old one revokes all sessions.
  - Client: ky `afterResponse` hook on `401 token_expired` → `POST /api/auth/refresh` → retry once.
  - Passwords: argon2id (`@node-rs/argon2`). Login rate limit: 5 failures → 15 min lock.
  - Next 16 uses **`proxy.ts`** (not middleware.ts) — read `node_modules/next/dist/docs/01-app/02-guides/authentication.md`.
    Proxy only redirects visitors without cookies; the real check is `requireUser()` in `handle()` (`src/server/http.ts`).
  - Every query is scoped by `user_id` (new column on `courses`).
- **Agent access: personal agent token** (created/revoked on a Settings page, shown once, stored hashed). Scope: read lessons,
  upload transcripts, save notes, report. **Never delete.** Quality checks + quiz shuffle stay server-side in `save-content`.
- **Custom MCP runs on the user's Mac (stdio)**, not on Vercel, because only the Mac can download transcripts. Registered once
  with `--scope user` so it works from any folder; config carries `TUBEWISE_URL` + `TUBEWISE_TOKEN`. The user chose the
  pasted token over a browser-login flow.
- **Demo:** "Try the demo" button → session as the `demo` user; a copy of the System Design course
  (`a3450f88-54e6-4a03-adce-cbda5fb844e2`) with new ids and **no transcripts**. Read-only enforced in `handle()` (non-GET → 403).
- **Local backup DB (user request):** Neon is the only primary; all writes go there (Vercel can't reach the Mac, so
  dual writes are impossible for online edits and would drift anyway). The Mac runs local **Postgres** (Postgres.app,
  same schema, no SQLite code path) as a mirror: the launchd job that fetches transcripts also pulls Neon → local every
  15 min (`pg_dump | pg_restore`) and keeps the last 14 dated dumps. When the app runs locally, a Settings toggle
  switches between "Neon (live)" and "Local backup" (**read-only**). Disaster recovery = point `DATABASE_URL` at local.
  The old `~/.courseit/app.db` stays as a frozen archive after the one-time copy.
- **Driver:** must support real transactions (`replaceLessonContent` uses one) and work in both the Node CLI and Vercel
  functions → node-postgres `pg` Pool + `drizzle-orm/node-postgres` on the pooled (`-pooler`) URL, unless the Neon agent
  skill says otherwise for Vercel Fluid compute. Not `neon-http` (no interactive transactions). Use bun, not npm.
- **Neon project:** `zed-yt-course`, AWS US East 1 (next to Vercel's default region), only the Postgres service enabled
  (no Neon Auth/Better Auth; we build our own JWT login).
- **User's chat workflow after launch:** add course on the website → copy id → in the Codex / Claude Code chat app:
  "Fill notes for course <id>" → MCP fetches transcripts on the Mac, agent writes notes, server checks them → study anywhere.

## Phases

| # | Phase | Done when |
|---|---|---|
| 1 ✅ 2026-11-11 | **Postgres**: drizzle pg-core schema, async repo (~54 sync call sites: `.all()/.get()/.run()/transaction`), drizzle-kit migrations instead of migrate-on-load, one-time copy script SQLite → Neon | `make check` passes; app + CLI work against Neon with the user's real data |
| 2 ✅ 2026-11-11 | **Login** (see decisions) + `users`, `sessions`, `login_attempts` tables + `user:create` CLI | idle logout, refresh, token reuse revocation verified in the browser |
| 3 | **Vercel deploy**: env vars, cron for `check-updates`, transcripts left `pending` online | app live behind login |
| 4 | **Agent API** `/api/agent/*` + `agent_tokens` table + Settings page | token can save a lesson; can't delete |
| 5 | **Custom MCP** (`mcp/server.ts`, stdio): `fetch_transcripts`, `list_pending`, `get_lesson`, `save_notes`, `course_report`; writing rules from `docs/notes-guide.md` (move AGENTS.md Part B there) | Claude Code fills one real lesson through MCP |
| 6 | **CLI remote mode**: `scripts/agent` uses the API when `TUBEWISE_URL`/`TUBEWISE_TOKEN` are set; `make fill` unchanged | `make fill MAX=1` works online |
| 7 | **Backups**: Mac mirror (launchd pull every 15 min + 14 dated dumps + local/Neon toggle, read-only local) + nightly `pg_dump` via GitHub Actions + soft delete with a 7-day trash | local mirror matches Neon; a dump restores into a scratch DB |
| 8 | **Demo** | visitor can browse, every write returns 403 |
| 9 | **AI tutor** (optional): "Ask this lesson", `claude-haiku-5-5`, notes+transcript as cached prefix, daily caps; demo gets notes-only context | streams an answer within caps |
| 10 | **README / portfolio** | architecture diagram, screenshots, demo link |

## Phase 1 notes (done 2026-11-11)

- Neon has the user's data: 4 courses, 206 lessons, 206 transcripts, 667 practice, 726 quiz (`make db-copy`, ids kept).
- Schema: `src/server/db/schema.ts` (pg-core; ms timestamps as `bigint` mode number, booleans, jsonb). Migrations in
  `drizzle/`; `make db-generate` / `make db-migrate`. better-sqlite3 removed; the copy script uses Node's `node:sqlite`.
- Repo is async everywhere (`first()` replaces `.get()`); the CLI closes the pg pool on exit.
- Verified: `make check`, `make build`, CLI `list`/`pending`, browser + API: course/lesson pages, complete toggle,
  note add/delete, pin, reorder (transaction), `/api/sync`.

## Phase 2 notes (done 2026-11-11)

- Tables `users`, `sessions`, `refresh_tokens` (every issued hash, so reuse of *any* older token is caught),
  `login_attempts` (`drizzle/0001_auth.sql`). Code in `src/server/auth/`, routes `/api/auth/{login,refresh,logout}`,
  `src/proxy.ts`, login page `/login`, pages moved into the `src/app/(app)/` route group (URLs unchanged).
- Client: ky `afterResponse` → on `401 token_expired` one shared refresh, then `ky.retry()` (retry limit 1 with no
  methods/status codes, so ky keeps an unread body copy; plain `retry: 0` would replay POST/PATCH with an empty body).
- Verified (dev server with `AUTH_ACCESS_TTL_SEC`): no cookie → 401 / redirect with `next`; wrong password 401;
  5 failures → 429 for 15 min; expired access → `token_expired` → refresh rotates → request replayed (GET and PATCH
  with body); old refresh token after the 30 s grace → all sessions revoked; idle-expired session → 401; logout → 401.
- **Deferred to Phase 8:** scoping every query by `user_id` (only one real user exists until the demo user can log in).
- `make user NAME=<you>` creates the owner login (prompts for the password). No users exist yet.

## Needed from the user

- Phase 1: Neon project; put `DATABASE_URL=...` in `.env.local` (never paste secrets in chat).
- Phase 3: Vercel env vars (`DATABASE_URL`, `JWT_SECRET`).
- Phase 7: GitHub secret for the backup job.
- Cleanup: the throwaway test deploy `vercel-yt-test` is still live → `bunx vercel remove vercel-yt-test --yes`.
