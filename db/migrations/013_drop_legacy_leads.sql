-- Drops the tables of the retired unlock flow and email series (issue #29). Nothing
-- has read or written them since the code that used them was removed (PRs #56 and
-- #57), which deployed before this migration so no running version queries them.
-- They held only test rows. outbox references leads, so it goes first.
drop table if exists outbox;
drop table if exists leads;
