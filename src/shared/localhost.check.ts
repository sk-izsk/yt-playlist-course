import assert from "node:assert/strict"
import { isLocalhost, isLocalRequest } from "./localhost"

for (const host of ["localhost", "127.0.0.1", "[::1]", "::1"]) {
  assert.equal(isLocalhost(host), true)
}
for (const host of ["192.168.2.28", "tubewise.vercel.app", "localhost.example.com", "example.localhost", ""]) {
  assert.equal(isLocalhost(host), false)
}
console.log("localhost visibility ok")

for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
  assert.equal(isLocalRequest(new Request("http://localhost:3000", { headers: { host } })), true)
}
for (const host of ["192.168.2.28:3000", "tubewise.vercel.app", "localhost.example.com", "[invalid"]) {
  assert.equal(isLocalRequest(new Request("http://localhost:3000", { headers: { host } })), false)
}
assert.equal(isLocalRequest(new Request("http://localhost:3000")), false)
