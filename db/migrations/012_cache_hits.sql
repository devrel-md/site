-- One row each time /api/generate serves a result from the 24 hour cache, so the
-- launch metrics report (scripts/launch-metrics.ts) can count cached generations
-- beside fresh ones. Additive only. Holds no IP hash or other visitor data: only
-- which result was served and when. Cache hits before this migration were not
-- recorded.
create table if not exists cache_hits (
  id bigserial primary key,
  result_id text references results (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists cache_hits_created_at_idx on cache_hits (created_at desc);
