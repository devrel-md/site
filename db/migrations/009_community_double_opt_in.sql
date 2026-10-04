-- Double opt-in for community signups. Additive only: no drops, no renames.
--
-- A signup is "pending" until the emailed confirmation link is used, which
-- sets confirmed_at. Only confirmed rows are synced to the Resend audience
-- and Folk. A pending confirmation link is valid for 7 days from
-- confirmation_sent_at; stale pending rows are deleted by a later signup
-- request (see lib/community.ts).
--
-- Rows that already exist were created by the old one-step flow, which never
-- verified the address, so they are deliberately NOT backfilled as confirmed.
-- They keep every existing column, so their unsubscribe links still work, but
-- they stay unconfirmed until that person signs up again and clicks the link.
alter table community_subscribers add column if not exists confirmed_at timestamptz;
alter table community_subscribers add column if not exists confirm_token text;
alter table community_subscribers add column if not exists confirmation_sent_at timestamptz;

create unique index if not exists community_subscribers_confirm_token_idx
  on community_subscribers (confirm_token)
  where confirm_token is not null;
