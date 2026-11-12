import assert from "node:assert/strict";
import { decideRefresh, GRACE_MS } from "./refresh-decision";

const now = 1_000_000_000;
const live = { currentHash: "cur", rotatedAt: now - 60_000, expiresAt: now + 1000, revokedAt: null };

assert.equal(decideRefresh(live, "cur", now), "rotate");
assert.equal(decideRefresh(live, "old", now), "reuse");
assert.equal(decideRefresh({ ...live, rotatedAt: now - GRACE_MS + 1 }, "old", now), "rotate");
assert.equal(decideRefresh({ ...live, expiresAt: now }, "cur", now), "expired");
assert.equal(decideRefresh({ ...live, revokedAt: now - 1 }, "cur", now), "expired");
// A revoked session never reports reuse again (it is already dead).
assert.equal(decideRefresh({ ...live, revokedAt: now - 1 }, "old", now), "expired");

console.log("refresh-decision ok");
