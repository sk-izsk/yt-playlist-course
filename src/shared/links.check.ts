// Self-check: `bunx tsx src/shared/links.check.ts`
import assert from "node:assert/strict";
import { extractLinks, nonLinkLines } from "./links";

const pasted = `https://www.youtube.com/playlist?list=PL1
youtu.be/abcdefghijk, https://www.youtube.com/watch?v=x&list=PL2.
https://www.youtube.com/playlist?list=PL1
hello world`;

assert.deepEqual(extractLinks(pasted), [
  "https://www.youtube.com/playlist?list=PL1",
  "youtu.be/abcdefghijk",
  "https://www.youtube.com/watch?v=x&list=PL2",
]); // split on newline/comma, trailing "." trimmed, duplicate dropped
assert.deepEqual(nonLinkLines(pasted), ["hello world"]);
assert.deepEqual(extractLinks("no links here"), []);
console.log("links ok");
