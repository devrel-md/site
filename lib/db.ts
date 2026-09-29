import { Pool, type QueryResultRow } from "pg";
import { env } from "@/lib/env";

// A single pooled connection, reused across route handlers. Next.js keeps
// this module cached per server process, which is what we want here: one
// pool per running instance, not one per request.
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    if (!env.databaseUrl) {
      throw new Error(
        "DATABASE_URL is not set. Run with `infisical run --env=dev --path=/ -- npm run dev`."
      );
    }
    pool = new Pool({ connectionString: env.databaseUrl });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const rows = await query<T>(text, params);
  return rows[0];
}
