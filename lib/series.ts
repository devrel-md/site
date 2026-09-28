import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { templateForStage } from "@/lib/emailTemplates";
import type { FunnelGate } from "@/lib/results";

const STAGE_ORDER = ["Awareness", "Onboarding", "Activation", "Engagement", "Monetization"];
// 5 emails over 10 days: day 0, 2, 5, 7, 10 for whichever failing gates exist.
const DAY_OFFSETS = [0, 2, 5, 7, 10];

/** Schedules the failing-gate email series for a lead who opted in, one email
 * per failed or unknown stage gate, in funnel order, spread over 10 days.
 * No-ops while SERIES_ENABLED is false: Marcos has not approved the copy yet. */
export async function scheduleSeries(leadId: string, gates: FunnelGate[]): Promise<void> {
  if (!env.seriesEnabled) {
    console.log(`[series:disabled] would schedule series for lead ${leadId}`);
    return;
  }

  const failing = STAGE_ORDER.map((stage) => gates.find((g) => g.stage === stage)).filter(
    (g): g is FunnelGate => g !== undefined && (g.pass === "no" || g.pass === "unknown")
  );
  if (failing.length === 0) return;

  const rows = failing.slice(0, 5).map((gate, index) => {
    const template = templateForStage(gate.stage) ?? "series-onboarding";
    const dayOffset = DAY_OFFSETS[index] ?? DAY_OFFSETS[DAY_OFFSETS.length - 1]!;
    return { template, dayOffset };
  });

  for (const row of rows) {
    await query(
      `insert into outbox (lead_id, template, send_after) values ($1, $2, now() + ($3 || ' days')::interval)`,
      [leadId, row.template, row.dayOffset]
    );
  }
}
