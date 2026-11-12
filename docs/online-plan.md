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
- **Changed 2026-11-11 (user): the app is public to read.** Anyone can browse courses, lessons, notes, practice and
  quizzes without logging in. Login only unlocks writes: add/sync/delete courses, progress, pin/reorder, personal notes,
  agent tokens. Reads use `handleRead()` (optional user), writes `handle()` (401 "Log in to make changes"); the UI hides
  write controls via `useSession()`. Login credentials never live in env files: `make user NAME=…` (hidden prompt;
  only the argon2 hash goes to the DB). (An earlier `make owner` from `.env.local` was removed at the user's request.)
- **Login: single owner user.** No signup page; create the user with a CLI command.
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
| 3 ✅ 2026-11-12 (tubewise.vercel.app) | **Vercel deploy**: env vars, cron for `check-updates`, transcripts left `pending` online | app live behind login |
| 4 ✅ 2026-11-11 | **Agent API** `/api/agent/*` + `agent_tokens` table + Settings page | token can save a lesson; can't delete |
| 5 ✅ 2026-11-11 | **Custom MCP** (`mcp/server.ts`, stdio): `fetch_transcripts`, `list_pending`, `get_lesson`, `save_notes`, `course_report`; writing rules from `docs/notes-guide.md` (move AGENTS.md Part B there) | Claude Code fills one real lesson through MCP |
| 6 ✅ 2026-11-11 | **CLI remote mode**: `scripts/agent` uses the API when `TUBEWISE_URL`/`TUBEWISE_TOKEN` are set; `make fill` unchanged | `make fill MAX=1` works online |
| 7 ✅ 2026-11-11 | **Backups**: Mac mirror (launchd pull every 15 min + 14 dated dumps + local/Neon toggle, read-only local) + nightly `pg_dump` via GitHub Actions + soft delete with a 7-day trash | local mirror matches Neon; a dump restores into a scratch DB |
| 8 ✅ 2026-11-11 (by public read) | **Demo** | visitor can browse, every write returns 403 |
| 9 ✅ 2026-11-11 (off until a key is added) | **AI tutor** (optional): "Ask this lesson", `claude-haiku-5-5`, notes+transcript as cached prefix, daily caps; demo gets notes-only context | streams an answer within caps |
| 10 ✅ 2026-11-11 (live link after deploy) | **README / portfolio** | architecture diagram, screenshots, demo link |

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

## Phase 3 notes (code done 2026-11-11, not deployed)

- `vercel.json`: region `iad1`, daily cron (Hobby allows once a day) → `GET /api/cron/check-updates`, guarded by
  `Authorization: Bearer $CRON_SECRET` (constant-time compare), not by login. Verified locally: 401 without/with a wrong
  secret, 200 with the right one.
- `canFetchTranscripts()` (`src/server/youtube/transcript.ts`) is false when `VERCEL` is set, so online imports keep
  lessons `pending`; `PROXY_URL` is documented there as the unwired hook.
- `.vercelignore` keeps `.env*` out of uploads. The Vercel project `tubewise` is created and linked (`.vercel/`, gitignored).
- **Left for the user** (adding secrets to Vercel was blocked for the agent):
  `bunx vercel env add DATABASE_URL production`, `… JWT_SECRET production` (a new `openssl rand -base64 48`, not the
  local one), `… CRON_SECRET production` (`openssl rand -hex 24`), then `bunx vercel deploy --prod`, then
  `make user NAME=<you>` (same Neon DB, so the login works locally and online). Then tick this phase.

## Phase 4 notes (done 2026-11-11)

- `agent_tokens` (`drizzle/0002`): `tw_` + 32 random bytes, SHA-256 stored, prefix for display, revoke = soft.
- `Authorization: Bearer tw_…` only (`handleAgent`); the login cookie is not accepted there and the token is not accepted
  on app routes. Routes under `/api/agent/`: `GET courses`, `GET courses/:id`, `GET courses/:id/report`,
  `GET courses/:id/transcripts` (video id + chapter range + status), `GET pending?course=`, `GET resolve?id=`,
  `GET lessons/:id?mode=compact|full|head`, `PUT lessons/:id/transcript`, `PUT lessons/:id/notes` (`save-content`
  checks + shuffle; 422 lists problems). No DELETE handlers exist (405).
- Shared formatting `src/shared/agent-format.ts` + `server/services/agent-context.ts`; CLI `show`/`report` use them.
- Settings page `/settings` (owner only): create (shown once), list, revoke.
- Verified with curl: every route, bad transcript 400, overwrite refused 422, DELETE 405, revoked token 401 at once.

## Phase 5 notes (done 2026-11-11)

- `mcp/server.ts` (stdio) + `src/agent-client/` (HTTP client, Mac-side transcript fetch → upload). Relative imports
  only and CommonJS-safe (no top-level await / import.meta) because it starts from any folder via the repo's tsx.
- Tools: `notes_guide`, `list_courses`, `get_course`, `fetch_transcripts`, `list_pending`, `get_lesson`, `save_notes`,
  `course_report`. Writing rules moved to `docs/notes-guide.md`; AGENTS.md Part B now points there.
- Verified by an MCP client over stdio from outside the repo (see `docs/mcp.md`). **Left for the user:** register it
  in Claude Code with `make mcp-add URL=… TOKEN=…` (it edits your user-level Claude config, so I didn't).

## Phase 6 notes (done 2026-11-11)

- `scripts/agent/index.ts` picks `remote.ts` when `TUBEWISE_URL` + `TUBEWISE_TOKEN` are set, else `local.ts`
  (loaded lazily, so remote mode never needs `DATABASE_URL`). Same commands and output; `add`/`sync` are local-only
  (add courses on the website); `transcripts` downloads on the Mac and uploads.
- Verified: `TUBEWISE_URL=… TUBEWISE_TOKEN=… make fill ID=<test course> AGENT=claude MAX=1` → a fresh Claude session
  wrote and saved a lesson through the API; report printed.

## Phase 7 notes (done 2026-11-11)

- `scripts/backup.sh` (`make db-backup`): `pg_dump -Fc` of Neon's direct endpoint → `~/.courseit/backups/
  tubewise-YYYY-MM-DD.dump` (one per day, newest 14 kept), then `pg_restore --clean` into `LOCAL_DATABASE_URL` if set.
  `PGSSLROOTCERT=system` only for Neon (libpq needs it for verify-full). `make backup-install` loads the launchd job
  (`scripts/launchd/`, every 15 min); `make backup-uninstall` removes it.
- `.github/workflows/backup.yml`: nightly `pg_dump` in a `postgres:18` container → 14-day artifact.
- Soft delete (`drizzle/0003`): `courses.deleted_at`; every query filters `live`/`liveLesson`; Settings → Trash restores;
  re-adding a trashed course restores it; purge after 7 days (on trash list + daily cron).
- Read-only local view: `db` is a proxy picking Neon or the mirror per request (AsyncLocalStorage, `tw_db` cookie set from
  Settings → Data source). Auth, agent API and every write always use Neon; writes 403 while viewing the backup.
- Verified: dump + mirror into a scratch Postgres (counts and summary bytes identical to Neon, rerun idempotent),
  14-dump retention, toggle reads the mirror and blocks writes, delete → hidden (app + agent API) → restore, 7-day purge.
- **Left for the user:** `createdb tubewise_mirror` in your local Postgres + `LOCAL_DATABASE_URL` in `.env.local`,
  `make backup-install`, and the GitHub secret `NEON_DATABASE_URL` (direct URL) for the nightly workflow (not run yet).

## Phase 8 notes (done 2026-11-11)

- Superseded by the user's "public read-only" decision: every visitor already browses the real library, so no demo
  copy, demo button or demo session is needed. Done-when holds: visitors browse, every write is refused (401).
- Hardening: `handle()` now lets only `role = owner` write (403 "This account is read-only"); agent tokens only work
  for the owner; trash is owner-only. Verified with a throwaway `demo` user (reads 200, all writes 403), then deleted.
- `user_id` scoping stays unnecessary while there is one owner; add it before ever creating a second *owner*.

## Phase 9 notes (done 2026-11-11, not run against the real model)

- `src/server/services/tutor.ts` + `POST /api/lessons/:id/ask` (streams plain text) + "Ask" tab (`AskPanel`).
  `@anthropic-ai/sdk` `messages.stream`, `claude-haiku-5-5`, effort `low`, lesson material as a cached system block.
  Owner gets notes + practice + compact transcript; visitors get notes-only context. `refusal`/`max_tokens` stop reasons
  and typed API errors become a readable line (Haiku has no server-side fallback).
- Caps: `tutor_usage(day, audience)` (`drizzle/0004`), owner 200/day, all visitors together 30/day (`TUTOR_DAILY_CAP_*`).
- Off unless `ANTHROPIC_API_KEY` is set (`GET /api/tutor` → the tab hides; the route answers 503).
- Verified without a key (503, tab hidden) and with a deliberately invalid key (tab shows; stream ends with "key was
  rejected"; 3rd visitor call → 429; empty question 400; unknown lesson 404). **Not verified:** a real answer, because
  no key was provided and a real call spends money. Add the key to `.env.local` (and Vercel) to turn it on.

## Needed from the user

- Phase 1: Neon project; put `DATABASE_URL=...` in `.env.local` (never paste secrets in chat).
- Phase 3: Vercel env vars (`DATABASE_URL`, `JWT_SECRET`).
- Phase 7: GitHub secret for the backup job.
- Cleanup: the throwaway test deploy `vercel-yt-test` is still live → `bunx vercel remove vercel-yt-test --yes`.

## Phase 3 done (2026-11-12)

- Live at https://tubewise.vercel.app, imported from GitHub; production deploys from `dev` (merge `online` → `dev` via PR).
- Gotcha hit on the way: Vercel's import pre-filled env vars from `.env.example`, so `DATABASE_URL` was the placeholder
  (`getaddrinfo ENOTFOUND HOST-pooler.REGION…`). Fixed by setting real values (Production only) and redeploying;
  `.env.example` now has every value commented out.
- Vercel's `JWT_SECRET` is deliberately different from the local one (separate login cookies per site).
- Verified live: 4 courses / 206 lessons readable logged out, visitor writes 401, cron without secret 401, owner login works.
