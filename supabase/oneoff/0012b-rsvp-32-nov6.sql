-- ONE-OFF — not reusable, not a migration. Run once, after 0012a.
--
-- rsvps id 32 was taken while Nov 6's two events were still merged into one
-- caps row, so it carries the merged label and no way for the backfill to tell
-- which event it was for. It was for the lettuce morning.
--
--   wfs-migrate --run supabase/oneoff/0012b-rsvp-32-nov6.sql
--
-- Guarded on every field we expect, so it touches nothing if the row is not
-- exactly what we think it is; the select afterwards shows the result. Running
-- it twice is a no-op (the second time the label no longer matches).

update public.rsvps
   set session_key = '2026-11-06-farmtryout',
       session     = 'Fri · Nov 6 — Winter Lettuce Transplanting & Farm Tour'
 where id = 32
   and session_date = '2026-11-06'
   and session = 'Fri · Nov 6 — Winter Lettuce Transplanting & Farm Tour / Off-Grid Fridays'
   and (session_key is null or session_key = '2026-11-06-farmtryout');

select id, session_date, session_key, session
  from public.rsvps
 where id = 32;
