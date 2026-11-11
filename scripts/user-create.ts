/**
 * Creates a login, or resets its password if the username exists. There is no signup page.
 * Usage: make user NAME=<username> [ROLE=owner|demo]   (prompts for the password, never echoes it)
 */
import { db, pool, schema } from "@/server/db/client";
import { hashPassword } from "@/server/auth/login";

const main = async () => {
  const [username, role = "owner"] = process.argv.slice(2);
  const password = process.env.PASSWORD ?? "";
  if (!username) throw new Error("usage: make user NAME=<username> [ROLE=owner|demo]");
  if (role !== "owner" && role !== "demo") throw new Error(`ROLE must be owner or demo, not "${role}"`);
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");

  const passwordHash = await hashPassword(password);
  await db
    .insert(schema.users)
    .values({ username, passwordHash, role })
    .onConflictDoUpdate({ target: schema.users.username, set: { passwordHash, role } });
  console.log(`User "${username}" (${role}) saved.`);
};

main()
  .catch((err: Error) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
