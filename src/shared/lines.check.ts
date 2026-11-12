// Self-check: `bunx tsx src/shared/lines.check.ts`
import assert from "node:assert/strict"
import { LINES, lineCode, lineFor, pickLine } from "./lines"

const id = "a3450f88-54e6-4a03-adce-cbda5fb844e2"
assert.equal(pickLine(id, []), pickLine(id, [])) // stable for the same library
assert.equal(lineFor(LINES.length + 2), LINES[2]) // wraps

// Assigning one course at a time never repeats a colour until all are used.
const used: number[] = []
for (let i = 0; i < LINES.length; i++) {
  used.push(pickLine(`${i}f2b9c1e-8a4d-4f6e-9c1a-2b7d5e8f0a1${i}`, used))
}
assert.equal(new Set(used).size, LINES.length)
// The 8th course reuses a colour, but only one that's used once.
assert.ok(used.filter((u) => u === pickLine("x", used)).length === 1)

assert.equal(lineCode("Complete System Design Course | From Zero"), "CS")
assert.equal(lineCode("DSA Patterns 2026"), "DP")
assert.equal(lineCode("Python"), "PY")
assert.equal(lineCode("🐍 Python tutorial for beginners"), "PT")
console.log("lines ok")
