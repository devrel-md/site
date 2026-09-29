import { query } from "@/lib/db";

export type AttemptOutcome = "success" | "error" | "timeout" | "quality_fail";

export async function logAttempt(params: {
  resultId: string | null;
  model: string;
  outcome: AttemptOutcome;
  firstTokenMs: number | null;
  totalMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number;
}): Promise<void> {
  await query(
    `insert into attempts (result_id, model, outcome, first_token_ms, total_ms, tokens_in, tokens_out, cost_usd)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.resultId,
      params.model,
      params.outcome,
      params.firstTokenMs,
      params.totalMs,
      params.tokensIn,
      params.tokensOut,
      params.costUsd,
    ]
  );
}
