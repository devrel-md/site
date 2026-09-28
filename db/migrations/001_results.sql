create table if not exists results (
  id text primary key,
  url text not null,
  normalised_url text not null,
  markdown text not null,
  gates jsonb not null default '[]',
  model text not null,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists results_normalised_url_created_at_idx
  on results (normalised_url, created_at desc);
