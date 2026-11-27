import assert from "node:assert/strict"
import { HttpError } from "../http-error"
import { ensureDatabaseRunning, localDatabaseUrl } from "./start-local-database"

const pause = async () => {}

const main = async () => {
  const env = { LOCAL_DATABASE_URL: "postgresql://localhost:5433/mirror" }
  assert.equal(localDatabaseUrl(env, "darwin"), env.LOCAL_DATABASE_URL)
  assert.throws(() => localDatabaseUrl({ LOCAL_DATABASE_URL: "invalid" }, "darwin"), /valid PostgreSQL URL/)
  for (const [config, platform] of [
    [{}, "darwin"],
    [env, "linux"],
    [{ ...env, VERCEL: "1" }, "darwin"],
  ] as const) {
    assert.throws(
      () => localDatabaseUrl(config, platform),
      (err: unknown) => err instanceof HttpError && err.status === 404,
    )
  }
  assert.throws(
    () => localDatabaseUrl({ LOCAL_DATABASE_URL: "postgresql://remote.example/mirror" }, "darwin"),
    /on this Mac/,
  )

  let starts = 0
  const start = async () => {
    starts++
  }
  assert.deepEqual(await ensureDatabaseRunning(async () => true, start, pause), { started: false })
  assert.equal(starts, 0)

  let probes = 0
  assert.deepEqual(await ensureDatabaseRunning(async () => ++probes === 4, start, pause), { started: true })
  assert.equal(starts, 1)
  assert.equal(probes, 4)

  await assert.rejects(
    ensureDatabaseRunning(async () => false, start, pause),
    /did not become ready/,
  )
  await assert.rejects(
    ensureDatabaseRunning(
      async () => false,
      async () => {
        throw new Error("start failed")
      },
      pause,
    ),
    /start failed/,
  )
  console.log("local database startup ok")
}
void main()
