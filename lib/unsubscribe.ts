import { query } from "@/lib/db";
import { unsubscribeAudienceContact } from "@/lib/resend";
import { markCommunityUnsubscribedInFolk } from "@/lib/folk";

export interface UnsubscribeResult {
  found: boolean;
  alreadyUnsubscribed: boolean;
}

export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  if (!token) return { found: false, alreadyUnsubscribed: false };

  const subscribers = await query<{ email: string; unsubscribed_at: string | null; folk_person_id: string | null }>(
    `select email, unsubscribed_at, folk_person_id from community_subscribers where unsubscribe_token = $1`,
    [token],
  );
  const subscriber = subscribers[0];
  if (subscriber) {
    if (subscriber.unsubscribed_at) return { found: true, alreadyUnsubscribed: true };
    await query(`update community_subscribers set unsubscribed_at = now() where email = $1`, [subscriber.email]);
    await unsubscribeAudienceContact(subscriber.email);
    if (subscriber.folk_person_id) await markCommunityUnsubscribedInFolk(subscriber.folk_person_id);
    return { found: true, alreadyUnsubscribed: false };
  }

  return { found: false, alreadyUnsubscribed: false };
}
