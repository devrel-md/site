-- One row per hashed IP per UTC day. Incremented atomically on each generate
-- request that passes Turnstile, so the limit holds even under concurrent
-- requests from the same visitor.
create table if not exists rate_limits (
  ip_hash text not null,
  day date not null,
  count integer not null default 0,
  primary key (ip_hash, day)
);
