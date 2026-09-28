create table if not exists outbox (
  id bigserial primary key,
  lead_id text not null references leads (id) on delete cascade,
  template text not null,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists outbox_pending_idx on outbox (send_after) where sent_at is null;
