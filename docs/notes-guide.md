# Writing course notes (for any agent: Claude, Codex, …)

Read by agents through the CLI (`bun run agent …`) or the Tubewise MCP server (`notes_guide` tool). AGENTS.md links here.


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
