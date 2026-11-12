// Self-check for library helpers: `bunx tsx src/client/lib/library.check.ts`
import assert from "node:assert/strict"
import type { CourseSummary } from "@/shared/types"
import { filterCourses, reorderTokens, splitPinned } from "./library"

const c = (token: string, title: string, pinned = false) => ({ token, title, channel: "Chan", pinned }) as CourseSummary
const list = [c("aaaa1111", "System Design", true), c("bbbb2222", "AI Engineer"), c("cccc3333", "Python Basics")]

assert.deepEqual(
  filterCourses(list, "  ai ").map((x) => x.token),
  ["bbbb2222"],
) // trimmed, case-insensitive
assert.deepEqual(
  filterCourses(list, "cccc").map((x) => x.token),
  ["cccc3333"],
) // id prefix
assert.equal(filterCourses(list, "").length, 3)
assert.equal(splitPinned(list).pinned.length, 1)
assert.deepEqual(reorderTokens(["p"], ["a", "b", "c"], "rest", 2, 0), ["p", "c", "a", "b"]) // pinned stay first
assert.deepEqual(reorderTokens(["p", "q"], ["a"], "pinned", 0, 1), ["q", "p", "a"])
console.log("library ok")
