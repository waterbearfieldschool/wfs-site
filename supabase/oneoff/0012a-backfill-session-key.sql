-- Backfill rsvps.session_key for registrations written before 0012.
--
-- NOT a migration, deliberately: wfs-migrate runs every pending file in
-- supabase/migrations/ back to back, so a backfill there would run straight
-- after 0012 — before wfs-sync-caps has given the caps rows their keys — find
-- nothing to copy, and be recorded as done. Run this AFTER `wfs-sync-caps
-- --apply`:
--
--   wfs-migrate --run supabase/oneoff/0012a-backfill-session-key.sql
--
-- Only ever fills a NULL session_key, never overwrites one, so it is safe to
-- re-run. Two rules, both requiring the caps row to already have a key:
--
--   1. the registration's date has exactly ONE caps row → that one
--   2. otherwise, its session label matches exactly one keyed caps row on
--      that date → that one (a registration made before a second event was
--      added to its day still carries the single-event label)
--
-- Anything left over — a registration made under a merged "A / B" label — is
-- listed by the final select and needs a human to say which event it was.
-- Until then it counts against every event on its date (see session_counts).

begin;

-- 1. dates with a single event
update public.rsvps r
   set session_key = c.key
  from public.session_caps c
 where r.session_key is null
   and r.session_date = c.date
   and c.key is not null
   and (select count(*) from public.session_caps c2
         where c2.date = c.date) = 1;

-- 2. multi-event dates, matched on the exact label
update public.rsvps r
   set session_key = c.key
  from public.session_caps c
 where r.session_key is null
   and r.session_date = c.date
   and c.key is not null
   and r.session = c.label
   and (select count(*) from public.session_caps c2
         where c2.date = c.date and c2.label = c.label) = 1;

commit;

-- What is still unkeyed, and why. Empty is the goal (rows with no
-- session_date at all are legacy prototype rows and are expected here).
select r.id, r.session_date, r.session,
       (select count(*) from public.session_caps c where c.date = r.session_date)
         as events_that_day
  from public.rsvps r
 where r.session_key is null
 order by r.session_date nulls first, r.id;
