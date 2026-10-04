create table if not exists community_subscribers (
  email text primary key,
  unsubscribe_token text not null unique,
  folk_person_id text,
  consented_at timestamptz not null,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);
