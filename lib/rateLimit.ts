import { query } from "@/lib/db";
import { RATE_LIMIT_PER_IP_PER_DAY, RATE_LIMIT_VALIDATE_PER_IP_PER_DAY } from "@/lib/generatorConfig";

export type RateLimitKind = "generate" | "validate";

const LIMITS: Record<RateLimitKind, number> = {
  generate: RATE_LIMIT_PER_IP_PER_DAY,
  validate: RATE_LIMIT_VALIDATE_PER_IP_PER_DAY,
};

/** Atomically increments today's (UTC) request count for a hashed IP and
 * `kind`, and returns whether this request is still within that kind's
 * daily limit. Generate and validate have separate budgets: validating
 * doesn't call a paid model, so it shouldn't share the generator's quota. */
export async function checkAndIncrementRateLimit(
  ipHash: string,
  kind: RateLimitKind = "generate"
): Promise<{ allowed: boolean; count: number }> {
  const rows = await query<{ count: number }>(
    `insert into rate_limits (ip_hash, day, kind, count)
     values ($1, (now() at time zone 'utc')::date, $2, 1)
     on conflict (ip_hash, day, kind) do update set count = rate_limits.count + 1
     returning count`,
    [ipHash, kind]
  );
  const count = rows[0]?.count ?? 1;
  return { allowed: count <= LIMITS[kind], count };
}
