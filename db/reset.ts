// Dev convenience only: drops every table this app owns and re-runs
// migrations from scratch. Never run against anything but the dev database.
// Dev Postgres is a dedicated container (devrelmd-db), so requiring the
// database name to be "devrelmd" is a meaningful guard, not a formality.
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  const database = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (database !== "devrelmd") {
    throw new Error(
      `db:reset refuses to run against database "${database}": only the dev database (devrelmd) is allowed.`
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  await pool.query(`
    drop table if exists community_subscribers, outbox, clicks, rate_limits, attempts, leads, results, schema_migrations cascade;
  `);
  await pool.end();
  console.log("Dropped devrel.md tables. Run npm run migrate to recreate them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
