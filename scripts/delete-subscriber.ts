// Admin script: deletes a community subscriber by email, per the brief's
// DELETE path requirement. Usage:
//   infisical run --env=dev --path=/ -- npm run delete-subscriber -- someone@example.com
import { Pool } from "pg";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run delete-subscriber -- <email>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({ connectionString: databaseUrl });
  const subscribers = await pool.query("delete from community_subscribers where email = $1", [email.toLowerCase()]);
  console.log(`Deleted ${subscribers.rowCount ?? 0} community subscription(s) for ${email}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
