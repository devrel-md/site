// Admin script: retries the Folk sync for every confirmed, subscribed community
// member whose Folk person id was never saved (an earlier sync failed). Safe to
// run again: people are found by email before anyone is created. Usage:
//   infisical run --env=prod -- npm run resync-folk
import { Pool } from "pg";
import { syncCommunityToFolk } from "@/lib/folk";
import { isConfigured } from "@/lib/env";

async function main() {
  if (!isConfigured("folk")) throw new Error("FOLK_API_KEY is not set.");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({ connectionString: databaseUrl });
  const rows = await pool.query<{ email: string }>(
    `select email from community_subscribers
     where confirmed_at is not null and unsubscribed_at is null and folk_person_id is null
     order by confirmed_at`,
  );

  let synced = 0;
  for (const { email } of rows.rows) {
    const personId = await syncCommunityToFolk(email, null);
    if (!personId) continue;
    await pool.query("update community_subscribers set folk_person_id = $2 where email = $1", [email, personId]);
    synced++;
  }
  console.log(`Synced ${synced} of ${rows.rows.length} community subscriber(s) to Folk.`);
  await pool.end();
  if (synced < rows.rows.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
