// Admin script: actions a removal request for every generated result of a host.
// It blocks the host (generation is refused and the 24 hour cache never serves it),
// then marks its results excluded (noindex, with a note on the page) or, with
// --delete, deletes them. Usage:
//   infisical run --env=prod -- npm run exclude-host -- example.com
//   infisical run --env=prod -- npm run exclude-host -- example.com --delete --reason "request from owner"
// See docs/result-pages.md.
import { Pool } from "pg";
import { excludeHost } from "../lib/excludeHost";
import { hostKey } from "../lib/resultPolicy";

async function main() {
  const args = process.argv.slice(2);
  const remove = args.includes("--delete");
  const reasonAt = args.indexOf("--reason");
  const reason = reasonAt === -1 ? undefined : args[reasonAt + 1];
  const target = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--reason");
  const host = target ? hostKey(target) : "";
  if (!host) {
    console.error("Usage: npm run exclude-host -- <host or URL> [--delete] [--reason <text>]");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const { affected } = await excludeHost((text, params) => pool.query(text, params), host, { remove, reason });
    console.log(
      `${host} is now blocked from generation. ${remove ? "Deleted" : "Marked as excluded"} ${affected} result(s).`
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
