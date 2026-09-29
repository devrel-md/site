import { query } from "@/lib/db";

export interface UnsubscribeResult {
  found: boolean;
  alreadyUnsubscribed: boolean;
}

export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  if (!token) return { found: false, alreadyUnsubscribed: false };

  const existing = await query<{ id: string; unsubscribed_at: string | null }>(
    `select id, unsubscribed_at from leads where lead_token = $1`,
    [token]
  );
  const lead = existing[0];
  if (!lead) return { found: false, alreadyUnsubscribed: false };

  if (lead.unsubscribed_at) return { found: true, alreadyUnsubscribed: true };

  await query(`update leads set unsubscribed_at = now() where id = $1`, [lead.id]);
  await query(
    `update outbox set sent_at = now(), last_error = 'unsubscribed' where lead_id = $1 and sent_at is null`,
    [lead.id]
  );
  return { found: true, alreadyUnsubscribed: false };
}
