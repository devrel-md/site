import { query } from "@/lib/db";
import { env } from "@/lib/env";

/** Atomically increments today's (UTC) request count for a hashed IP and
 * returns whether this request is still within the daily limit. */
export async function checkAndIncrementRateLimit(ipHash: string): Promise<{ allowed: boolean; count: number }> {
  const rows = await query<{ count: number }>(
    `insert into rate_limits (ip_hash, day, count)
     values ($1, (now() at time zone 'utc')::date, 1)
     on conflict (ip_hash, day) do update set count = rate_limits.count + 1
     returning count`,
    [ipHash]
  );
  const count = rows[0]?.count ?? 1;
  return { allowed: count <= env.rateLimitPerIpPerDay, count };
}
