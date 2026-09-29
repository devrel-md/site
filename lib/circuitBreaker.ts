import { query } from "@/lib/db";
import { MODEL_CHAIN, CIRCUIT_BREAKER } from "@/lib/generatorConfig";

interface AttemptRow {
  outcome: string;
  created_at: string;
}

/** True when the free model should be skipped: 7 of its last 10 logged
 * attempts failed (error, timeout or quality_fail) and the most recent of
 * those 10 was within the last 60 minutes. Derived from the attempts table,
 * not separate state, so it self-heals: once the cooldown passes, the next
 * free attempt is allowed again and joins the window. */
export async function isFreeModelCircuitOpen(): Promise<boolean> {
  const rows = await query<AttemptRow>(
    `select outcome, created_at from attempts where model = $1 order by created_at desc limit $2`,
    [MODEL_CHAIN.free, CIRCUIT_BREAKER.windowSize]
  );
  if (rows.length === 0) return false;

  const failures = rows.filter((r) => r.outcome !== "success").length;
  if (failures < CIRCUIT_BREAKER.failureThreshold) return false;

  const mostRecent = new Date(rows[0]!.created_at).getTime();
  const openUntil = mostRecent + CIRCUIT_BREAKER.cooldownMs;
  return Date.now() < openUntil;
}
