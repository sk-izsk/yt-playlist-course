// Self-check for transcript compaction and quiz shuffling: `bunx tsx src/shared/notes-helpers.check.ts`
import assert from "node:assert/strict";
import { shuffleQuiz } from "./shuffle-quiz";
import { compactTranscript } from "./transcript-compact";

// Lines within 12s merge under the first line's second; an exact repeat is dropped.
const lines: [number, string][] = [
  [0, "What is it called?"],
  [3, "A packet."],
  [6, "What is it called?"],
  [9, "A packet."],
  [14, "Packets travel by different routes."],
];
assert.deepEqual(compactTranscript(lines), [
  [0, "What is it called? A packet."],
  [14, "Packets travel by different routes."],
]);

// Seeded rng: shuffling keeps the right text right and avoids runs and reused orders.
let seed = 7;
const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const quiz = [0, 1, 2, 3].map((n) => ({ question: `Q${n}`, options: [`right${n}`, "w1", "w2", "w3"], answerIndex: 0 }));
for (let i = 0; i < 50; i++) {
  const out = shuffleQuiz(quiz, ["1,2,0,3", "1,2,0,3"], rng);
  out.forEach((q, n) => assert.equal(q.options[q.answerIndex], `right${n}`));
  const order = out.map((q) => q.answerIndex);
  assert.notEqual(order.join(","), "1,2,0,3");
  assert.ok(new Set(order).size > 1);
  assert.ok(!["0,1,2,3", "3,2,1,0"].includes(order.join(",")));
}
console.log("notes-helpers ok");
