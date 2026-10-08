-- Marks /go clicks that look automated (see lib/clickBot.ts), so click metrics can
-- leave them out. Additive only. Rows from before this migration default to false,
-- because the request headers were not kept.
alter table clicks add column if not exists likely_bot boolean not null default false;
