import assert from "node:assert/strict"
import { requireBackupReady } from "./backup-ready"
import { HttpError } from "../http-error"

const main = async () => {
  await requireBackupReady(async () => [])
  await assert.rejects(requireBackupReady(undefined), (err: unknown) => err instanceof HttpError && err.status === 400)
  for (const reason of ["ECONNREFUSED", "connection timeout", "relation courses does not exist"]) {
    await assert.rejects(
      requireBackupReady(async () => {
        throw new Error(reason)
      }),
      (err: unknown) => err instanceof HttpError && err.status === 503 && err.message.includes("Start local database"),
    )
  }
  console.log("backup readiness ok")
}
void main()
