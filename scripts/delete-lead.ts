// Admin script: deletes a lead and their outbox entries by email, per the
// brief's DELETE path requirement. Usage:
//   infisical run --env=dev --path=/ -- npm run delete-lead -- someone@example.com
import { Pool } from "pg";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run delete-lead -- <email>");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({ connectionString: databaseUrl });
  const leads = await pool.query<{ id: string }>("select id from leads where email = $1", [email]);
  const subscribers = await pool.query("delete from community_subscribers where email = $1", [email.toLowerCase()]);

  for (const lead of leads.rows) {
    await pool.query("delete from outbox where lead_id = $1", [lead.id]);
    await pool.query("delete from leads where id = $1", [lead.id]);
  }
  console.log(`Deleted ${leads.rows.length} legacy lead(s) and ${subscribers.rowCount ?? 0} community subscription(s) for ${email}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
