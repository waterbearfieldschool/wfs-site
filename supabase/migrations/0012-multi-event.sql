-- Several events on one date.
--
-- Until now a date WAS a session: session_caps had `date primary key`,
-- session_counts grouped by date, register() locked and counted by date. Then
-- Nov 6 got two events — the lettuce morning and Off-Grid Friday in the
-- afternoon — and wfs-sync-caps could only cope by merging them into one row
-- ("A / B", capacities summed). One shared pool of 16 places for two different
-- events, and a roster that can't say which one anybody came for.
--
-- The fix is a session KEY: the session file's name without .md, e.g.
-- "2026-11-06-farmtryout". It is unique per event, survives a title change,
-- and the site already has it. Everything that used to key on the date keys on
-- this instead; the date stays as a column for "is it in the past" and display.
--
-- The database cannot derive a key from a label, so this migration only makes
-- room for keys. wfs-sync-caps (which reads the session files) fills them in.
-- ROLLOUT ORDER — see supabase/oneoff/README.md for the commands:
--
--   1. this migration                 wfs-migrate --apply
--   2. key the caps rows              wfs-sync-caps --apply
--        claims each existing row for its session by (date, label), including
--        the old merged "A / B" rows, and inserts a row for the second event
--   3. key the old registrations      supabase/oneoff/0012a-backfill-session-key.sql
--   4. one-off fix for the Nov 6 row  supabase/oneoff/0012b-rsvp-32-nov6.sql
--   5. webhook, then site
--
-- Between 1 and 5 the old site and webhook keep working on every date that
-- has one event (register() without p_key falls back to the date), and get
-- 'ambiguous_session' on a date with two — so do 2–5 promptly.
--
-- Safe to re-run.

begin;

-- 1. session_caps: one row per event, not per date ---------------------------

alter table public.session_caps
  add column if not exists key text;

-- nulls are distinct, so legacy rows without a key don't collide. This is also
-- what PostgREST's ?on_conflict=key upsert in wfs-sync-caps resolves against.
create unique index if not exists session_caps_key_idx
  on public.session_caps (key);

-- A surrogate id replaces `date` as the primary key, so several rows can share
-- a date and a legacy row can still be addressed before it has a key.
alter table public.session_caps
  add column if not exists id bigint generated always as identity;

do $$
begin
  if exists (select 1 from pg_constraint
              where conrelid = 'public.session_caps'::regclass
                and contype  = 'p'
                and pg_get_constraintdef(oid) = 'PRIMARY KEY (date)') then
    alter table public.session_caps drop constraint session_caps_pkey;
  end if;
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.session_caps'::regclass
                    and contype  = 'p') then
    alter table public.session_caps
      add constraint session_caps_pkey primary key (id);
  end if;
end $$;

create index if not exists session_caps_date_idx
  on public.session_caps (date);


-- 2. rsvps: which event, not just which date --------------------------------

alter table public.rsvps
  add column if not exists session_key text;

create index if not exists rsvps_session_key_idx
  on public.rsvps (session_key);


-- 3. session_counts: one row per event --------------------------------------
--
-- A registration counts against the event it is keyed to. A registration with
-- no key yet (written before this migration, not yet backfilled) counts
-- against EVERY event on its date: during the changeover that over-counts,
-- which errs towards "full" rather than towards overbooking.
--
-- Drop and recreate rather than replace: the column list changes, and
-- CREATE OR REPLACE VIEW can only append columns.

drop view if exists public.session_counts;

create view public.session_counts as
  select c.key,
         c.date,
         c.label,
         c.capacity,
         c.min_to_run,
         coalesce(sum(r.party_size), 0)::int                            as taken,
         greatest(c.capacity - coalesce(sum(r.party_size), 0), 0)::int  as remaining
    from public.session_caps c
    left join public.rsvps r
      on r.session_key = c.key
      or (r.session_key is null and r.session_date = c.date)
   group by c.id, c.key, c.date, c.label, c.capacity, c.min_to_run;

-- dropping the view dropped its grant
grant select on public.session_counts to anon;


-- 4. register() learns p_key -------------------------------------------------
--
-- Adding an argument means drop-and-recreate, as in 0003 and 0004: a second
-- signature would be an overload, and PostgREST would have two candidates.
--
-- With p_key: the event is that caps row. Its date must equal p_date — the
--   past-date check stays on p_date, and a key from one day can't be smuggled
--   in under another.
-- Without p_key (the old site and webhook, mid-rollout): the date is used,
--   but only if exactly one event is on it. Otherwise 'ambiguous_session' —
--   guessing would put someone on the wrong event's roster.

drop function if exists public.register(date, text, text, int, boolean, int, jsonb);

create or replace function public.register(
  p_date  date,
  p_name  text,
  p_email text,
  p_party int,
  p_kit   boolean default false,
  p_kits  int     default 0,
  p_meta  jsonb   default '{}'::jsonb,
  p_key   text    default null
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cid      bigint;
  ckey     text;
  cdate    date;
  cap      int;
  lbl      text;
  taken    int;
  recent   int;
  per_hour int;
  global   int;
  n        int;
  today    date := (now() at time zone 'America/New_York')::date;
begin
  p_key := nullif(trim(coalesce(p_key, '')), '');

  if p_date < today then
    return json_build_object('ok', false, 'reason', 'past');
  end if;

  if p_party < 1 or p_party > 10 then
    return json_build_object('ok', false, 'reason', 'bad_party');
  end if;
  if coalesce(trim(p_name), '') = ''
     or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    return json_build_object('ok', false, 'reason', 'bad_details');
  end if;
  if p_kits < 0 or p_kits > 20 then
    return json_build_object('ok', false, 'reason', 'bad_kits');
  end if;

  -- Double-submit, per EVENT: the same person may come to the morning and the
  -- afternoon of one day. A row with no key yet is matched by date, as before.
  select count(*) into recent
    from rsvps
   where lower(email) = lower(p_email)
     and created_at > now() - interval '10 minutes'
     and (case when p_key is not null
               then session_key = p_key
                    or (session_key is null and session_date = p_date)
               else session_date = p_date
          end);
  if recent > 0 then
    return json_build_object('ok', false, 'reason', 'duplicate');
  end if;

  select count(*) into per_hour
    from rsvps
   where lower(email) = lower(p_email)
     and created_at > now() - interval '1 hour';
  if per_hour >= 10 then
    return json_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  select count(*) into global
    from rsvps where created_at > now() - interval '1 hour';
  if global >= 100 then
    return json_build_object('ok', false, 'reason', 'too_busy');
  end if;

  if p_key is not null then
    select id, key, date, capacity, label into cid, ckey, cdate, cap, lbl
      from session_caps
     where key = p_key
       for update;
    if not found or cdate <> p_date then
      return json_build_object('ok', false, 'reason', 'unknown_session');
    end if;
  else
    select count(*) into n from session_caps where date = p_date;
    if n = 0 then
      return json_build_object('ok', false, 'reason', 'unknown_session');
    end if;
    if n > 1 then
      return json_build_object('ok', false, 'reason', 'ambiguous_session');
    end if;
    select id, key, date, capacity, label into cid, ckey, cdate, cap, lbl
      from session_caps
     where date = p_date
       for update;
    if not found then   -- deleted between the count and the lock
      return json_build_object('ok', false, 'reason', 'unknown_session');
    end if;
  end if;

  -- same rule as session_counts: keyed rows for this event, plus any not-yet-
  -- keyed rows on its date
  select coalesce(sum(party_size), 0) into taken
    from rsvps
   where session_key = ckey
      or (session_key is null and session_date = cdate);

  if taken + p_party > cap then
    return json_build_object('ok', false, 'reason', 'full',
                             'remaining', greatest(cap - taken, 0));
  end if;

  insert into rsvps (name, email, session, session_date, session_key,
                     wants_updates, wants_materials, party_size, kit_count,
                     tier, amount_paid, kit_amount, order_token, teach_offer,
                     learn_next)
  values (p_name, p_email, lbl, cdate, ckey,
          coalesce((p_meta->>'updates')::boolean, false),
          (p_kit or p_kits > 0), p_party, greatest(p_kits, 0),
          nullif(p_meta->>'tier', ''),
          greatest(coalesce((p_meta->>'amount')::numeric, 0), 0),
          greatest(coalesce((p_meta->>'kit_amount')::numeric, 0), 0),
          nullif(p_meta->>'order_token', ''),
          nullif(left(trim(coalesce(p_meta->>'teach', '')), 600), ''),
          nullif(left(trim(coalesce(p_meta->>'learn_next', '')), 600), ''));

  return json_build_object('ok', true, 'remaining', cap - taken - p_party,
                           'key', ckey);
end $$;

-- dropping the function dropped its grant too
grant execute on function
  public.register(date, text, text, int, boolean, int, jsonb, text) to anon;

commit;

-- Later, once every row has a key (wfs-check reports any that don't), a
-- follow-up can make session_caps.key NOT NULL. Not here: until wfs-sync-caps
-- has run, the existing rows have no key to give.
