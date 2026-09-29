import { query } from "@/lib/db";
import { env } from "@/lib/env";

/** Sum of paid-model cost logged today (UTC), from the attempts table. */
export async function todaysPaidSpendUsd(): Promise<number> {
  const rows = await query<{ total: string | null }>(
    `select sum(cost_usd) as total
     from attempts
     where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
       and cost_usd > 0`
  );
  return Number(rows[0]?.total ?? 0);
}

export async function isOverDailySpendCap(): Promise<boolean> {
  const spent = await todaysPaidSpendUsd();
  return spent >= env.dailySpendCapUsd;
}
