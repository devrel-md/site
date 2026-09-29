create table if not exists leads (
  id text primary key,
  email text not null,
  company text not null,
  role text not null,
  team_size text not null,
  qualified boolean not null default false,
  series_opt_in boolean not null default false,
  result_id text references results (id) on delete set null,
  lead_token text not null unique,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists leads_email_idx on leads (email);
create index if not exists leads_lead_token_idx on leads (lead_token);
