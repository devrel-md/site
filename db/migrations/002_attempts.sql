create table if not exists attempts (
  id bigserial primary key,
  result_id text references results (id) on delete set null,
  model text not null,
  outcome text not null check (outcome in ('success', 'error', 'timeout', 'quality_fail')),
  first_token_ms integer,
  total_ms integer,
  tokens_in integer,
  tokens_out integer,
  cost_usd numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists attempts_model_created_at_idx on attempts (model, created_at desc);
create index if not exists attempts_created_at_idx on attempts (created_at desc);
