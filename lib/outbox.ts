import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { loadEmailTemplate, renderTemplate } from "@/lib/emailTemplates";
import { sendEmail } from "@/lib/resend";
import { pushToFolk } from "@/lib/folk";
import { earliestBrokenGate } from "@/lib/funnelGates";
import type { FunnelGate } from "@/lib/results";

const MAX_ATTEMPTS = 5;

interface OutboxRow {
  id: number;
  lead_id: string;
  template: string;
  attempts: number;
}

interface LeadRow {
  id: string;
  email: string;
  company: string;
  lead_token: string;
  unsubscribed_at: string | null;
  result_id: string | null;
}

interface ResultRow {
  markdown: string;
  gates: FunnelGate[];
  url: string;
}

async function processRow(row: OutboxRow): Promise<void> {
  const lead = await query<LeadRow>(`select * from leads where id = $1`, [row.lead_id]);
  const leadRow = lead[0];
  if (!leadRow) {
    await query(`update outbox set sent_at = now(), last_error = 'lead not found' where id = $1`, [row.id]);
    return;
  }

  if (row.template === "folk_push") {
    if (!leadRow.result_id) {
      await query(`update outbox set sent_at = now(), last_error = 'no result' where id = $1`, [row.id]);
      return;
    }
    const results = await query<ResultRow>(`select url, gates from results where id = $1`, [leadRow.result_id]);
    const result = results[0];
    const gate = result ? earliestBrokenGate(result.gates) : null;
    try {
      await pushToFolk(leadRow.id, {
        email: leadRow.email,
        company: leadRow.company,
        failingGate: gate?.stage ?? "unknown",
        resultUrl: result?.url ?? "",
      });
      await query(`update outbox set sent_at = now() where id = $1`, [row.id]);
    } catch (err) {
      await failRow(row, (err as Error).message);
    }
    return;
  }

  if (leadRow.unsubscribed_at) {
    await query(`update outbox set sent_at = now(), last_error = 'unsubscribed' where id = $1`, [row.id]);
    return;
  }

  if (!env.seriesEnabled) {
    // Copy not approved yet. Leave the row pending rather than sending or
    // discarding it, so the series picks up automatically once it is enabled.
    return;
  }

  try {
    const template = await loadEmailTemplate(row.template);
    const isFinal = row.template === "series-monetization";
    const body = renderTemplate(template.body, {
      product: leadRow.company,
      status: "needs attention",
      now: "",
      chapterLink: `${env.siteUrl}/go/book?m=email&c=${template.stage ?? ""}`,
      finalNote: isFinal
        ? "Want someone to find and fix the break with you? Book a 20-minute review: " +
          `${env.siteUrl}/go/audit?m=email&c=series&t=${leadRow.lead_token}`
        : "",
      footer: `Unsubscribe any time: ${env.siteUrl}/api/unsubscribe?token=${leadRow.lead_token}`,
    });
    const subject = renderTemplate(template.subject, { product: leadRow.company });

    const result = await sendEmail({
      to: leadRow.email,
      subject,
      html: body.replace(/\n/g, "<br>"),
      text: body,
      leadToken: leadRow.lead_token,
    });
    await query(`update outbox set sent_at = now() where id = $1`, [row.id]);
    if (!result.sent) {
      console.log(`[outbox] logged (not sent, Resend unconfigured): ${row.template} -> ${leadRow.email}`);
    }
  } catch (err) {
    await failRow(row, (err as Error).message);
  }
}

async function failRow(row: OutboxRow, message: string): Promise<void> {
  const attempts = row.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await query(`update outbox set attempts = $2, last_error = $3, sent_at = now() where id = $1`, [
      row.id,
      attempts,
      `gave up: ${message}`,
    ]);
  } else {
    await query(
      `update outbox set attempts = $2, last_error = $3, send_after = now() + interval '10 minutes' where id = $1`,
      [row.id, attempts, message]
    );
  }
}

/** Processes every due outbox row once. Called by /api/cron/outbox; nothing
 * depends on a third-party scheduler to make this run. */
export async function processOutboxOnce(): Promise<{ processed: number }> {
  const due = await query<OutboxRow>(
    `select id, lead_id, template, attempts from outbox
     where sent_at is null and send_after <= now()
     order by send_after asc
     limit 50`
  );
  for (const row of due) {
    await processRow(row);
  }
  return { processed: due.length };
}
