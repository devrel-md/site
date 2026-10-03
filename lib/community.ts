import { queryOne } from "@/lib/db";
import { randomToken } from "@/lib/hash";

export interface CommunitySubscriber {
  email: string;
  unsubscribe_token: string;
  consented_at: string;
  unsubscribed_at: string | null;
  folk_person_id: string | null;
}

export async function subscribeToCommunity(email: string): Promise<CommunitySubscriber> {
  // A fresh affirmative submission renews consent, including after an earlier unsubscribe.
  const token = randomToken(16);
  const subscriber = await queryOne<CommunitySubscriber>(
    `insert into community_subscribers (email, unsubscribe_token, consented_at)
     values ($1, $2, now())
     on conflict (email) do update set
       unsubscribe_token = excluded.unsubscribe_token,
       consented_at = now(),
       unsubscribed_at = null
     returning *`,
    [email.toLowerCase(), token],
  );
  return subscriber!;
}

export async function saveCommunityFolkId(email: string, personId: string): Promise<void> {
  await queryOne(
    `update community_subscribers set folk_person_id = $2 where email = $1`,
    [email, personId],
  );
}
