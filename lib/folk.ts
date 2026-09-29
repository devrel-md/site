import { env, isConfigured } from "@/lib/env";
import { query } from "@/lib/db";

const FOLK_API_URL = "https://api.folk.app/v1/people";

export interface FolkPushParams {
  email: string;
  company: string;
  failingGate: string;
  resultUrl: string;
}

/** Pushes a qualified, opted-in lead to Folk as a person, tagged
 * `source: devrel.md`. Never throws: on failure (or when FOLK_API_KEY is
 * unset) it logs and queues a retry via the outbox table, so a Folk outage
 * never breaks the generator's user flow. */
export async function pushToFolk(leadId: string, params: FolkPushParams): Promise<void> {
  if (!isConfigured("folk")) {
    console.log(`[folk:not-configured] would push lead ${params.email} (${params.company})`);
    return;
  }

  try {
    const res = await fetch(FOLK_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.folkApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        company: params.company,
        tags: ["source: devrel.md"],
        notes: `Failing gate: ${params.failingGate}. Result: ${params.resultUrl}`,
      }),
    });
    if (!res.ok) throw new Error(`Folk API returned ${res.status}`);
  } catch (err) {
    console.error("Folk push failed, queueing retry", err);
    await query(
      `insert into outbox (lead_id, template, send_after) values ($1, 'folk_push', now() + interval '10 minutes')`,
      [leadId]
    );
  }
}
