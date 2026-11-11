#!/usr/bin/env bash
# Fills every pending lesson of a course with ONE FRESH AGENT SESSION PER LESSON.
# Why: in one long session every earlier transcript stays in context, so lesson 30 pays again for
# lessons 1–29 and quality drifts. A fresh session per lesson keeps cost linear and lesson 100 as
# careful as lesson 1. Safe to stop and rerun: `pending` only lists lessons without notes.
#
# Usage: scripts/fill-course.sh <course-id> [codex|claude|echo] [max-lessons]
#   echo = dry run: prints what would be sent, spends no tokens.
set -euo pipefail
cd "$(dirname "$0")/.."

course="${1:?usage: scripts/fill-course.sh <course-id> [codex|claude|echo] [max-lessons]}"
agent="${2:-codex}"
max="${3:-1000}"
cli() { bunx tsx scripts/agent/index.ts "$@"; }

# The fixed part comes first and the lesson id last, so the CLIs' prompt caching reuses the prefix.
prompt_for() {
  cat <<EOF
You are filling notes for ONE lesson in the Tubewise repo. Follow AGENTS.md Part B and its Quality bar exactly.
1. Run \`bun run agent show <lesson-id>\`. It prints a compact transcript and a target summary length.
   For an intro, roadmap or revision video you may run it with --head first; write light notes from that
   only if the video is clearly light and under 15 minutes, otherwise read the whole transcript.
2. Write the content JSON by hand from the transcript (no scripts or templates). Don't think about answer
   positions: save shuffles them, so never mention option letters or positions in explanations.
3. Save through stdin: bun run agent save <lesson-id> - <<'JSON'
   {...}
   JSON
4. If save rejects it, fix exactly the listed issues and save again, at most 3 tries.
Do nothing else: no other lessons, no code changes, no commits. End with one line: "saved" or "failed: <why>".
Lesson id: $1
EOF
}

done_count=0
while [ "$done_count" -lt "$max" ]; do
  id=$(cli pending "$course" | awk '$1 ~ /^[0-9a-f]{8}-/ {print $1; exit}')
  if [ -z "$id" ]; then echo "All lessons have notes."; break; fi
  echo "=== lesson $id ($((done_count + 1))/$max)"
  case "$agent" in
    codex) codex exec --ephemeral -s workspace-write --add-dir "$HOME/.courseit" "$(prompt_for "$id")" ;;
    claude) claude -p --allowedTools "Bash(bun run agent:*)" -- "$(prompt_for "$id")" ;;
    echo) prompt_for "$id"; echo "(dry run)"; break ;;
    *) echo "Unknown agent '$agent' (codex|claude|echo)"; exit 1 ;;
  esac
  # A lesson the agent couldn't save would be picked again forever; stop and let the user look.
  if cli pending "$course" | grep -q "^$id"; then
    echo "Lesson $id is still pending after the agent finished. Stopping; check it with: bun run agent show $id"
    exit 1
  fi
  done_count=$((done_count + 1))
done

cli report "$course"
