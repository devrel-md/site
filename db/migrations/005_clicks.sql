create table if not exists clicks (
  id bigserial primary key,
  slug text not null,
  medium text not null,
  campaign text,
  lead_token text,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists clicks_slug_created_at_idx on clicks (slug, created_at desc);
