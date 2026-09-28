// Dev convenience only: drops every table this app owns and re-runs
// migrations from scratch. Never run against anything but a local database.
import { Pool } from "pg";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }
  if (!databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1")) {
    throw new Error("db:reset refuses to run against a non-local DATABASE_URL.");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  await pool.query(`
    drop table if exists outbox, clicks, rate_limits, attempts, leads, results, schema_migrations cascade;
  `);
  await pool.end();
  console.log("Dropped devrel.md tables. Run npm run migrate to recreate them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
