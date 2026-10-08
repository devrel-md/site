// Admin script: reports the launch metrics per UTC day and in total: generations (fresh and
// cached), model calls and cost, community signups and unsubscribes, and /go clicks by slug,
// medium and campaign. Read only. Usage:
//   infisical run --env=prod -- npm run launch-metrics
//   infisical run --env=prod -- npm run launch-metrics -- --since 2026-10-01
//   infisical run --env=prod -- npm run launch-metrics -- --json
// See docs/metrics.md.
import { Pool } from "pg";
import { formatLaunchMetrics, loadLaunchMetrics } from "../lib/launchMetrics";

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const sinceAt = args.indexOf("--since");
  const since = sinceAt === -1 ? null : (args[sinceAt + 1] ?? "");
  if (since !== null && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    console.error("Usage: npm run launch-metrics -- [--since YYYY-MM-DD] [--json]");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const metrics = await loadLaunchMetrics((text, params) => pool.query(text, params), since);
    console.log(json ? JSON.stringify(metrics, null, 2) : formatLaunchMetrics(metrics));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
