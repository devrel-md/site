-- Indexing, provenance and removal for generated result pages. Additive only:
-- no drops, no renames. See docs/result-pages.md.
--
-- host:          the site the result was generated from (lower case, no leading
--                "www."), so a removal request can act on every result for it.
-- pages_read:    how many public pages the file was written from, for the
--                provenance line. Null for rows created before this migration.
-- indexable:     true only when the draft passed the validator and the
--                grounding check and states at least one sourced fact. Existing
--                rows default to false: the grounding rules have tightened since
--                they were written, and we did not record the outcome then.
-- excluded_at:   set when the site owner has asked for the result not to be
--                indexed (robots.txt) or an admin has actioned a request.
-- own_devrel_url: the company's own DEVREL.md, when discovery found a valid one.
alter table results add column if not exists host text;
alter table results add column if not exists pages_read integer;
alter table results add column if not exists indexable boolean not null default false;
alter table results add column if not exists excluded_at timestamptz;
alter table results add column if not exists own_devrel_url text;

update results
   set host = regexp_replace(lower(substring(normalised_url from '^https?://([^/?#:]+)')), '^www\.', '')
 where host is null;

create index if not exists results_host_idx on results (host);

-- Hosts whose owners have asked us to stop. Generation for these hosts is
-- refused, and the 24 hour URL cache never serves a result for them.
create table if not exists excluded_hosts (
  host text primary key,
  reason text,
  created_at timestamptz not null default now()
);
