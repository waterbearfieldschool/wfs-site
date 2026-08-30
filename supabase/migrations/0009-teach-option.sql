-- The 'Teach a session' registration option.
-- Paste into the Supabase SQL editor and run. Safe to re-run.
--
-- Replaces the free tier with one that asks for something instead of money: an
-- offer to lead a session on something you know. The offer travels in p_meta
-- and lands in a new column, so it can be followed up later.
--
-- This supersedes wfs-updates-optin.sql, which was never run. That change is
-- folded in below: register() hardcoded wants_updates = true on every row, so
-- everyone who has ever registered is marked as wanting email they never asked
-- for. Running this fixes it and clears the inherited flags.

alter table public.rsvps
  add column if not exists teach_offer text;

create or replace function public.register(
  p_date  date,
  p_name  text,
  p_email text,
  p_party int,
  p_kit   boolean default false,
  p_kits  int     default 0,
  p_meta  jsonb   default '{}'::jsonb
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  cap      int;
  lbl      text;
  taken    int;
  recent   int;
  per_hour int;
  global   int;
  today    date := (now() at time zone 'America/New_York')::date;
begin
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

  select count(*) into recent
    from rsvps
   where lower(email) = lower(p_email)
     and session_date = p_date
     and created_at > now() - interval '10 minutes';
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
                     wants_updates, wants_materials, party_size, kit_count,
                     tier, amount_paid, kit_amount, order_token, teach_offer)
  values (p_name, p_email, lbl, p_date,
          coalesce((p_meta->>'updates')::boolean, false),
          (p_kit or p_kits > 0), p_party, greatest(p_kits, 0),
          nullif(p_meta->>'tier', ''),
          greatest(coalesce((p_meta->>'amount')::numeric, 0), 0),
          greatest(coalesce((p_meta->>'kit_amount')::numeric, 0), 0),
          nullif(p_meta->>'order_token', ''),
          nullif(left(trim(coalesce(p_meta->>'teach', '')), 600), ''));

  return json_build_object('ok', true, 'remaining', cap - taken - p_party);
end $$;

-- Nobody who registered before today asked for email; the old function set the
-- flag on every row regardless.
update public.rsvps set wants_updates = false;
