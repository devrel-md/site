import { query } from "@/lib/db";
import {
  RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY,
  RATE_LIMIT_PER_IP_PER_DAY,
  RATE_LIMIT_UNKNOWN_IP_COMMUNITY_PER_DAY,
  RATE_LIMIT_UNKNOWN_IP_GENERATE_PER_DAY,
  RATE_LIMIT_UNKNOWN_IP_VALIDATE_PER_DAY,
  RATE_LIMIT_VALIDATE_PER_IP_PER_DAY,
} from "@/lib/generatorConfig";
import { UNKNOWN_IP, hashIp } from "@/lib/hash";

export type RateLimitKind = "generate" | "validate" | "community";

const LIMITS: Record<RateLimitKind, number> = {
  generate: RATE_LIMIT_PER_IP_PER_DAY,
  validate: RATE_LIMIT_VALIDATE_PER_IP_PER_DAY,
  community: RATE_LIMIT_COMMUNITY_PER_IP_PER_DAY,
};

const UNKNOWN_LIMITS: Record<RateLimitKind, number> = {
  generate: RATE_LIMIT_UNKNOWN_IP_GENERATE_PER_DAY,
  validate: RATE_LIMIT_UNKNOWN_IP_VALIDATE_PER_DAY,
  community: RATE_LIMIT_UNKNOWN_IP_COMMUNITY_PER_DAY,
};

/** Requests with no trustworthy address share one bucket, so it gets a stricter limit. */
function limitFor(ipHash: string, kind: RateLimitKind): number {
  return ipHash === hashIp(UNKNOWN_IP) ? UNKNOWN_LIMITS[kind] : LIMITS[kind];
}

/** Atomically increments today's (UTC) request count for a hashed IP and
 * `kind`, and returns whether this request is still within that kind's
 * daily limit. Generate, validate and community signup have separate
 * budgets: validating doesn't call a paid model, so it shouldn't share the
 * generator's quota, and signups shouldn't eat either. */
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
  return { allowed: count <= limitFor(ipHash, kind), count };
}

/** Whether today's limit for this hashed IP and `kind` is already used up,
 * without counting this request. The generator checks this up front and only
 * counts a run once it's about to call a model, so cached results and
 * refusals don't use up anyone's runs. */
export async function isRateLimited(ipHash: string, kind: RateLimitKind = "generate"): Promise<boolean> {
  const rows = await query<{ count: number }>(
    `select count from rate_limits where ip_hash = $1 and day = (now() at time zone 'utc')::date and kind = $2`,
    [ipHash, kind]
  );
  return (rows[0]?.count ?? 0) >= limitFor(ipHash, kind);
}
