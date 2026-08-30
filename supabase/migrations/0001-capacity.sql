-- Waterbear Field School — capacity enforcement for Field Day registration
-- Run in the Supabase SQL editor. Written 2026-08-24.
--
-- ============================================================================
-- RUN THIS IN TWO PARTS.
--
--   PART A (everything down to the PART B banner) is purely additive. It adds
--   columns, a table, a view and a function. Nothing that exists today changes
--   behaviour, and the running /v1 /v2 /v3 prototypes keep working.
--
--   PART B revokes anonymous INSERT on rsvps. That is what makes the capacity
--   check unbypassable — but it also breaks every prototype immediately, since
--   they all insert into rsvps directly. Run Part B only once the client has
--   been switched over to register().
--
-- Both parts are safe to re-run: everything is IF NOT EXISTS / CREATE OR
-- REPLACE / ON CONFLICT DO UPDATE.
-- ============================================================================
--
-- The point: a capacity check that runs on the client is decoration. It can be
-- bypassed by anyone with a console, and it races — two people looking at
-- "2 spots left" can both register. Enforcement has to happen inside the
-- database, in the same transaction as the insert.

-- 0. Registrations need to know how many people a row represents.
alter table public.rsvps
  add column if not exists party_size int not null default 1;

-- Keying the count on the session *label* is brittle: rename "Build a Toolbox"
-- and every prior count silently detaches. Key on the date instead.
alter table public.rsvps
  add column if not exists session_date date;


-- 1. Capacity lives in the database, because that's where it gets enforced.
--    (Content — titles, blurbs, images — stays in workshops.js. This table is
--    only the numbers.)
create table if not exists public.session_caps (
  date        date primary key,
  label       text not null,
  capacity    int  not null check (capacity > 0),
  min_to_run  int  not null default 0
);


-- 2. A public view of how full each day is. No personal data in it, so it's
--    safe for anonymous read — this is what draws "4 spots left" on the page.
create or replace view public.session_counts as
  select c.date,
         c.label,
         c.capacity,
         c.min_to_run,
         coalesce(sum(r.party_size), 0)::int                            as taken,
         greatest(c.capacity - coalesce(sum(r.party_size), 0), 0)::int  as remaining
    from public.session_caps c
    left join public.rsvps r on r.session_date = c.date
   group by c.date, c.label, c.capacity, c.min_to_run;


-- 3. The only way to register. Counts and inserts atomically, under a row lock,
--    so two simultaneous registrations cannot both take the last spot.
create or replace function public.register(
  p_date  date,
  p_name  text,
  p_email text,
  p_party int,
  p_kit   boolean default false
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cap   int;
  lbl   text;
  taken int;
begin
  if p_party < 1 or p_party > 10 then
    return json_build_object('ok', false, 'reason', 'bad_party');
  end if;
  if coalesce(trim(p_name), '') = '' or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return json_build_object('ok', false, 'reason', 'bad_details');
  end if;

  -- FOR UPDATE is the whole trick: it serialises concurrent registrations
  -- for this day behind each other rather than letting them interleave.
  select capacity, label into cap, lbl
    from session_caps
   where date = p_date
     for update;

  if not found then
    return json_build_object('ok', false, 'reason', 'unknown_session');
  end if;

  select coalesce(sum(party_size), 0) into taken
    from rsvps where session_date = p_date;

  if taken + p_party > cap then
    return json_build_object('ok', false, 'reason', 'full',
                             'remaining', greatest(cap - taken, 0));
  end if;

  insert into rsvps (name, email, session, session_date,
                     wants_updates, wants_materials, party_size)
  values (p_name, p_email, lbl, p_date, true, p_kit, p_party);

  return json_build_object('ok', true, 'remaining', cap - taken - p_party);
end $$;


-- 4. Grants needed by Part A: read the counts, call the function.
--    These are additive — nothing breaks.
grant select  on public.session_counts to anon;
grant execute on function public.register(date, text, text, int, boolean) to anon;


-- 5. Seed the current Field Days. ADJUST THE CAPACITIES before running —
--    these numbers are guesses.
insert into public.session_caps (date, label, capacity, min_to_run) values
  ('2026-08-19', 'Wed · Aug 19 — Solar Power & Electronics Bench', 10, 3),
  ('2026-08-20', 'Thu · Aug 20 — Build a Toolbox',                 10, 3),
  ('2026-08-21', 'Fri · Aug 21 — Music & Instrument Making',       12, 3),
  ('2026-08-25', 'Tue · Aug 25 — Build a Workbench',                8, 3),
  ('2026-08-26', 'Wed · Aug 26 — Solar Power & Electronics Bench', 10, 3),
  ('2026-08-27', 'Thu · Aug 27 — Plant ID & Mapping',              15, 3),
  ('2026-08-28', 'Fri · Aug 28 — Zines & Printmaking',             12, 3)
on conflict (date) do update
  set label = excluded.label,
      capacity = excluded.capacity,
      min_to_run = excluded.min_to_run;


-- ============================================================================
-- PART B — run only after the site has been switched to call register().
--          Until then this breaks registration on /, /v2/ and /v3/.
-- ============================================================================

-- Close the front door. With direct inserts revoked, register() is the only
-- path in, so the capacity check cannot be walked around.
-- revoke insert on public.rsvps from anon;

-- Names and emails stop being readable by anyone with the public key.
-- (This is the RLS gap flagged in wfs-registration-architecture.md §6.)
-- revoke select on public.rsvps from anon;
