// Self-check for the live hero map: `bunx tsx src/client/lib/route-map.check.ts`
import assert from "node:assert/strict";
import type { CourseSummary } from "@/shared/types";
import { MAX_LINES, layoutRoutes, slice } from "./route-map";

// slice: halfway along an L-shape of two 10-long legs lands on the corner.
assert.deepEqual(slice([[0, 0], [10, 0], [10, 10]], 0.5).at(-1), [10, 0]);
assert.deepEqual(slice([[0, 0], [10, 0]], 2).at(-1), [10, 0]); // clamps past the end

const mk = (token: string, lessonCount: number, completedCount: number, pinned = false) =>
  ({ token, title: token, lessonCount, completedCount, pinned, line: 0 }) as CourseSummary;

const routes = layoutRoutes([mk("a", 10, 5), mk("b", 3, 0, true), ...["c", "d", "e", "f"].map((t) => mk(t, 4, 4))]);
assert.equal(routes.length, MAX_LINES); // capped
assert.equal(routes[0].token, "b"); // pinned first
assert.equal(routes[0].travelled, null); // nothing watched → no travelled overlay
assert.ok(routes[0].stops.every((s) => !s.done));
const a = routes.find((r) => r.token === "a")!;
assert.equal(a.stops.length, 8); // sampled, not one per lesson
assert.equal(a.stops.filter((s) => s.done).length, 4); // t = 0, 1/7, 2/7, 3/7 ≤ 0.5
assert.ok(routes.find((r) => r.token === "c")!.stops.every((s) => s.done)); // finished line fully done
console.log("route-map ok");
