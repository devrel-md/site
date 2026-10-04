import { query, queryOne } from "@/lib/db";
import { env } from "@/lib/env";
import { syncCommunityToFolk } from "@/lib/folk";
import { escapeHtml } from "@/lib/html";
import { randomToken } from "@/lib/hash";
import { sendEmail, type SendEmailResult } from "@/lib/resend";

/** How long an emailed confirmation link works. Pending rows older than this
 * are ignored by the confirm step and deleted by a later signup request. */
export const CONFIRMATION_TTL_DAYS = 7;

/** Signing up the same pending address again inside this window does not send
 * another email, so the form cannot be used to mail-bomb one inbox. */
export const CONFIRMATION_RESEND_COOLDOWN_MINUTES = 10;

export interface CommunitySubscriber {
  email: string;
  unsubscribe_token: string;
  consented_at: string;
  unsubscribed_at: string | null;
  folk_person_id: string | null;
  confirmed_at: string | null;
  confirm_token: string | null;
  confirmation_sent_at: string | null;
}

/** Records a signup as pending and returns the row a confirmation email should
 * be sent for, or null when none should be sent: the address is already
 * confirmed and subscribed, or a confirmation went out very recently. Nothing
 * is synced to Resend or Folk here; that only happens once the link is used.
 * The unsubscribe token is kept across signups so links already emailed to the
 * person keep working. */
export async function requestCommunitySignup(email: string): Promise<CommunitySubscriber | null> {
  const subscriber = await queryOne<CommunitySubscriber>(
    `insert into community_subscribers (email, unsubscribe_token, consented_at, confirm_token, confirmation_sent_at)
     values ($1, $2, now(), $3, now())
     on conflict (email) do update set
       confirm_token = excluded.confirm_token,
       confirmation_sent_at = now(),
       consented_at = now(),
       confirmed_at = null
     where (community_subscribers.confirmed_at is null or community_subscribers.unsubscribed_at is not null)
       and (community_subscribers.confirmation_sent_at is null
            or community_subscribers.confirmation_sent_at < now() - make_interval(mins => $4))
     returning *`,
    [email.toLowerCase(), randomToken(16), randomToken(24), CONFIRMATION_RESEND_COOLDOWN_MINUTES],
  );
  return subscriber ?? null;
}

/** Lets the person try again straight away when the confirmation email could
 * not be sent. Also kills the unsent link. */
export async function releaseConfirmation(email: string): Promise<void> {
  await query(
    `update community_subscribers set confirmation_sent_at = null where email = $1 and confirmed_at is null`,
    [email.toLowerCase()],
  );
}

/** Deletes pending rows whose link has expired. Rows that were ever
 * unsubscribed are kept as a suppression record, and so are rows from the
 * old one-step flow (they have no confirm token). */
export async function purgeExpiredPending(): Promise<void> {
  await query(
    `delete from community_subscribers
     where confirmed_at is null
       and unsubscribed_at is null
       and confirm_token is not null
       and coalesce(confirmation_sent_at, consented_at) < now() - make_interval(days => $1)`,
    [CONFIRMATION_TTL_DAYS],
  );
}

export type ConfirmOutcome =
  | { status: "confirmed"; subscriber: CommunitySubscriber }
  | { status: "already_confirmed" }
  | { status: "unsubscribed" }
  | { status: "invalid" };

/** Marks a pending signup confirmed. The update is a single guarded statement,
 * so only the first use of a link returns "confirmed" (and so is the only one
 * that may sync to external services); later uses are harmless no-ops. A link
 * stops working once it expires, once the person unsubscribes after it was
 * sent, or once a newer signup replaces it. */
export async function confirmCommunitySubscriber(token: string): Promise<ConfirmOutcome> {
  if (!token) return { status: "invalid" };

  const confirmed = await queryOne<CommunitySubscriber>(
    `update community_subscribers
     set confirmed_at = now(), unsubscribed_at = null
     where confirm_token = $1
       and confirmed_at is null
       and confirmation_sent_at > now() - make_interval(days => $2)
       and (unsubscribed_at is null or unsubscribed_at < confirmation_sent_at)
     returning *`,
    [token, CONFIRMATION_TTL_DAYS],
  );
  if (confirmed) return { status: "confirmed", subscriber: confirmed };

  const existing = await queryOne<Pick<CommunitySubscriber, "confirmed_at" | "unsubscribed_at">>(
    `select confirmed_at, unsubscribed_at from community_subscribers where confirm_token = $1`,
    [token],
  );
  if (!existing || !existing.confirmed_at) return { status: "invalid" };
  if (existing.unsubscribed_at) return { status: "unsubscribed" };
  return { status: "already_confirmed" };
}

export async function saveCommunityFolkId(email: string, personId: string): Promise<void> {
  await queryOne(
    `update community_subscribers set folk_person_id = $2 where email = $1`,
    [email, personId],
  );
}

/** Retries the Folk sync for confirmed, still subscribed people whose Folk
 * person id was never saved (an earlier sync failed). Healing runs on the next
 * confirmation and from `scripts/resync-folk.ts`. Oldest first, at most `limit`
 * rows, optionally skipping an address already handled by the caller. Never
 * throws. Returns how many rows were synced. */
export async function retryMissingFolkSyncs(limit: number, excludeEmail?: string): Promise<number> {
  try {
    const rows = await query<{ email: string }>(
      `select email from community_subscribers
       where confirmed_at is not null
         and unsubscribed_at is null
         and folk_person_id is null
         and ($2::text is null or email <> $2)
       order by confirmed_at
       limit $1`,
      [limit, excludeEmail?.toLowerCase() ?? null],
    );
    let synced = 0;
    for (const { email } of rows) {
      const personId = await syncCommunityToFolk(email, null);
      if (personId) {
        await saveCommunityFolkId(email, personId);
        synced++;
      }
    }
    return synced;
  } catch (error) {
    console.error("Folk retry failed", error instanceof Error ? error.message : "unknown error");
    return 0;
  }
}

/** Sends the single confirmation email. It carries the unsubscribe link and,
 * through the shared sender, the List-Unsubscribe headers. */
export async function sendCommunityConfirmation(subscriber: CommunitySubscriber): Promise<SendEmailResult> {
  const confirmUrl = `${env.siteUrl}/api/community/confirm?token=${encodeURIComponent(subscriber.confirm_token ?? "")}`;
  const unsubscribeUrl = `${env.siteUrl}/api/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`;

  const text = [
    "Someone, hopefully you, asked to get occasional DEVREL.md community updates at this address.",
    "",
    "To confirm, open this link:",
    confirmUrl,
    "",
    `You will not get any updates until you do. The link works for ${CONFIRMATION_TTL_DAYS} days. If it was not you, ignore this email and nothing will be sent.`,
    "",
    "Unsubscribe or withdraw this request at any time:",
    unsubscribeUrl,
    "",
    "DEVREL.md, a DevRel Bridge project",
  ].join("\n");

  const html = [
    `<p>Someone, hopefully you, asked to get occasional DEVREL.md community updates at this address.</p>`,
    `<p><a href="${escapeHtml(confirmUrl)}">Confirm my subscription</a></p>`,
    `<p>You will not get any updates until you do. The link works for ${CONFIRMATION_TTL_DAYS} days. If it was not you, ignore this email and nothing will be sent.</p>`,
    `<p><a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe or withdraw this request</a> at any time.</p>`,
    `<p>DEVREL.md, a DevRel Bridge project</p>`,
  ].join("\n");

  return sendEmail({
    to: subscriber.email,
    subject: "Confirm your DEVREL.md community updates",
    html,
    text,
    leadToken: subscriber.unsubscribe_token,
  });
}
