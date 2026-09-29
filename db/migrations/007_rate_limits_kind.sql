-- Separate rate-limit budgets per feature (the paid generator vs the free
-- validator), keyed by hashed IP, day and kind, so testing the validator
-- can't burn through someone's daily generate() quota.
alter table rate_limits add column if not exists kind text not null default 'generate';
alter table rate_limits drop constraint if exists rate_limits_pkey;
alter table rate_limits add primary key (ip_hash, day, kind);
