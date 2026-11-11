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
- `make list | pending | show | add | sync | transcripts`: the agent CLI (Part B).

## Conventions (the user asked for these, so follow them)

- **bun** is the package manager (`bun install`, `bun add`, `bunx`), never npm or npx. `next` and the CLI (`tsx`) still *run on Node*, because better-sqlite3 is a Node native addon. Bun only installs and launches them.
- **Arrow functions only** (`export const fn = () => {}`). The exception is code that needs `this` (classes like `HttpError`). Pages use `const Page = () => …; export default Page;`.
- **Small files**, about 100–120 lines max. Split UI into components plus custom hooks rather than growing a file.
- Comment *why*, not what. A deliberate shortcut gets a `ponytail:` comment that names its limit.
- Non-trivial pure logic gets a tiny `*.check.ts` self-test next to it (see `src/client/lib/plan.check.ts`). `make selfcheck` runs them.

## Architecture

```
src/
  app/                  Next routes. Pages are thin client components; api/ = JSON routes
  server/               Node-only
    db/                 client.ts (connection + migrate on load), schema.ts (drizzle), migrate.ts, path.ts
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

Data flow: component → hook (TanStack Query) → `client/api.ts` (ky) → `app/api/*` → `server/services|repo` → SQLite.

## Things that will bite you

- **The DB lives at `~/.courseit/app.db`, outside the repo**, and `DB_PATH` overrides it. If it were inside the project, `next dev`'s file watcher would see SQLite's WAL change on every write and reload-loop the page. Don't move it back.
- **Schema changes:** edit `schema.ts`, add the column to `bootstrap.sql.ts` (fresh DBs), and add an idempotent `addColumn` in `migrate.ts` (existing DBs). Migration runs on every module load. **Restart the dev server** afterwards, because a hot-reloaded server can keep a stale drizzle schema and fail with "Cannot read properties of undefined (reading 'Symbol(drizzle:Columns)')".
- **ky 2** reads error bodies into `err.data`, and `err.response.json()` throws. Use `errorMessage()` from `client/api.ts`, which never throws.
- **Errors surface automatically:** `useErrorToasts` toasts any failed query or mutation. A mutation that shows its own error sets `meta: { silentError: true }` to avoid a double toast. Server failures go to the `events` table and show in the 🔔 notification center.
- **Transcripts run in-process.** Stopping the server mid-load leaves lessons `pending`. `POST /api/sync` (called on app open) resumes them, and the loop stops if its course gets deleted.
- **New videos are detect-then-add.** `check-updates` only counts them (`courses.available_updates` drives the "+N new" chip, banner and bell), and `sync-course` actually adds them.
- **Ids:** every course and lesson has a full **UUID v4**. The UI *shows* only the part before the first dash (`displayId()`), and every copy action copies the full UUID.
- Verify UI changes in the browser, not just with tsc. The look is the **Transit** system: Geist / Geist Mono, ink on cool white (dark = night map), and each course is a "line" whose colour is stored in `courses.line` (picked once on import by `pickLine` in `shared/lines.ts` so courses don't clash; exposed as `--route`). Progress is drawn as metro stops (`RouteBar`). Never reuse courseit.xyz styling.
- The app is named **Tubewise**; `~/.courseit/` and the `courseit-prefs` storage key keep the old name on purpose, because renaming them orphans existing data.

---

# Part B — writing course content

Never edit the DB directly; use the CLI. Ids are full UUIDs (the user copies them from the app), e.g. `3f2b9c1e-8a4d-4f6e-9c1a-2b7d5e8f0a14`. A YouTube URL means: add it as a new course.

## Workflows

**"Fill notes for course <id>"** (the usual request):
- **Many lessons: the user runs `make fill ID=<course-id> [AGENT=codex|claude] [MAX=n]`** (`scripts/fill-course.sh`). It starts one fresh agent session per lesson, so earlier transcripts never pile up in context: cost stays linear and the last lesson is as careful as the first. Stop it any time; rerunning resumes from `pending`. `AGENT=echo` is a free dry run.
- **One lesson, or inside a session:**
  1. `bun run agent pending <id>` lists exactly the lessons that still need notes.
  2. `bun run agent show <lesson-id>` prints a **compact transcript** (captions merged into ~12 s blocks, exact repeats removed; `--full` for every line) and a **target summary length** scaled to the video.
  3. Save from stdin, no temp file: `bun run agent save <lesson-id> - <<'JSON'` … `JSON`.
- `bun run agent report <course-id>` prints the per-lesson table (kind, length, timestamps, practice, quiz, answer order). Use it instead of writing one.

**Never redo finished lessons.** Lessons with notes are done. `save` refuses to overwrite them unless you pass `--force`, which you only pass when the user explicitly asks to redo a lesson. When new videos drop, `pending` returns only those, so you spend tokens only on new content.

**"Add this link"** → `bun run agent add "<url>"` (quote it; zsh globs `?`), then fill notes.
**"Add the new videos"** → `bun run agent sync <course-id>`, then `pending`.
**"Something is wrong with <id>"** → `show` it first. Retry transcripts with `bun run agent transcripts <course-id>`.

## Step 1 — read the transcript, then classify the lesson

| kind | When | What to write |
|---|---|---|
| `core` | Real teaching: concepts, code, worked examples | Full formatted notes, **≥3 practice**, **≥3 quiz** (enforced) |
| `light` | Intro / trailer, chit-chat, Q&A banter, promo, "what's next" recap | 3–6 line honest summary saying it's light and whether it's worth watching. Practice and quiz are optional; don't invent them |

Judge by the transcript, not the title. For an intro, roadmap or revision video, `show <id> --head` prints only the first 3 minutes: if it's clearly light **and** the video is under 15 minutes, write light notes from that. Otherwise read the whole transcript, because longer "roadmap" videos sometimes teach.

## Step 2 — formatted summary (markdown, rendered with styling)

Make it scannable, never a wall of text. Template for `core`:

```markdown
One-sentence hook: what this lesson teaches and why it matters.

## Important points
- **Term or idea**: one-line explanation [mm:ss](#t=SECONDS)
- 4–8 bullets the learner must remember

## <Topic>
Short paragraphs / bullets. Tables for comparisons, numbered lists for steps,
fenced code with a language, **bold** key terms.

> 💡 **Key idea:** the one-liner worth memorising.

## Common mistakes
- only if the lesson covers it or it's genuinely useful
```

- `## Important points` is required for core lessons (validated) and is shown highlighted.
- Aim for the target length `show` prints (about 1,200 characters for a 10-minute video, up to 3,500 for 30+ minutes). A dense short video may need more; don't pad a light one to reach it.
- Include 4–10 timestamp links `[mm:ss](#t=SECONDS)`. The seconds come from the `[mm:ss|seconds]` transcript lines and are absolute video time.
- Write in English even if the transcript isn't. Cut filler, jokes and sponsor reads.

## Step 3 — practice and quiz

- **Practice**: 3–6 items covering easy, medium and hard. For DSA or coding, use real LeetCode/GFG problems with URLs. For theory or system design, use paper exercises. Give medium and hard items a `hint`.
- **Quiz**: 3–5 multiple-choice questions with plausible wrong options. `atSec` must point at where the transcript explains the answer, because a wrong answer seeks the video there. Add an `explanation`.

## Quality bar (any agent: Claude, Codex, …)

An earlier pass generated 37 lessons from one template, and the output passed every count check while teaching nothing. Don't repeat that:

- **Write each lesson by hand from its own transcript.** Never generate notes with a script, loop or template. Scripts may only read data or check your own JSON.
- **Timestamps come from real transcript lines** where that idea is explained. Never place them at evenly spaced fractions of the video.
- **Quiz questions test understanding** (why, when, what happens if), preferably as scenarios, not "which description fits X". Put the correct answer wherever you like: **`save` shuffles every question's options**, so never refer to positions or letters ("option A", "the first one") in questions or explanations. Wrong options are mistakes a learner would plausibly make, about as long and specific as the right one (positions are shuffled, so length is the only giveaway left). The explanation says *why*, not the answer again.
- **Be specific to the video**: the functions, libraries, numbers, examples and analogies the teacher actually used. Never reuse a sentence from another lesson.
- **Partial transcript?** Say so on the first line of the summary, and only cite timestamps inside the part you have.
- **Many lessons to fill in one session** (when `make fill` isn't used)? Do them all without pausing for approval. The user prefers one strict pass to check-ins. That makes these rules stricter, not looser:
  - Read every transcript in full before writing; no skimming in later lessons.
  - Keep quality flat to the end: the last lesson gets the same depth (length, timestamps, code, practice, quiz) as the first. If you notice yourself shortening lessons to finish faster, stop and tell the user instead.
  - Stop early only when `save` rejects the same lesson 3 times or a transcript is missing or broken. Report it, then continue with the next lesson.
  - At the end, run `bun run agent report <course-id>` and add only what it can't show: save rejections and any lessons you're unsure about.

`save` enforces the mechanical part (`src/shared/content-quality.ts`, which applies even with `--force`). It shuffles answer positions (no all-A, straight A–D runs, or an order 2+ other lessons use), then refuses notes where the longest option is the correct one in more than half the questions (all of them, for a 3-question quiz), timestamps sit on a 20%/25% grid or match no transcript line, options are copied from "Important points", or a sentence repeats another lesson. Passing those checks is the floor, not the goal.

## Content JSON (`src/shared/content-schema.ts` is the source of truth)

```json
{
  "kind": "core",
  "summary": "One-line hook.\n\n## Important points\n- **P99**: the latency 99% of requests beat [18:37](#t=1117)\n…",
  "practice": [
    { "difficulty": "easy", "title": "Two Sum", "prompt": "…", "url": "https://leetcode.com/problems/two-sum/" },
    { "difficulty": "medium", "title": "…", "prompt": "…", "hint": "…" }
  ],
  "quiz": [
    { "question": "…", "options": ["a", "b", "c", "d"], "answerIndex": 2, "explanation": "…", "atSec": 1117 }
  ]
}
```

With no transcript, work from the title and your own knowledge, and say so in one line at the top of the summary.
