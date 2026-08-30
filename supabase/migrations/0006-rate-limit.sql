-- Guard register() against double-submits and abuse.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- register() is callable by anyone holding the publishable key, which is in the
-- page source by necessity. Today one person can register for the same day
-- twice by double-clicking, and a script could fill every Field Day in a loop.
--
-- Note this is CREATE OR REPLACE with no DROP: the signature is unchanged
-- because the p_meta bag absorbs new fields. That was the point of it.

create index if not exists rsvps_email_created_idx
  on public.rsvps (lower(email), created_at desc);

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
begin
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

  -- 1. Double-submit. Same person, same day, moments apart — almost always a
  --    double click or a retried request, never a real second registration.
  --    Deliberately a short window, so genuinely adding a friend later still works.
  select count(*) into recent
    from rsvps
   where lower(email) = lower(p_email)
     and session_date = p_date
     and created_at > now() - interval '10 minutes';
  if recent > 0 then
    return json_build_object('ok', false, 'reason', 'duplicate');
  end if;

  -- 2. One address can't register endlessly.
  select count(*) into per_hour
    from rsvps
   where lower(email) = lower(p_email)
     and created_at > now() - interval '1 hour';
  if per_hour >= 10 then
    return json_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  -- 3. Flood stop. Set well above any believable real rush, so it only ever
  --    catches a script — but it means a runaway can't quietly fill every day.
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
                     tier, amount_paid, kit_amount, order_token)
  values (p_name, p_email, lbl, p_date, true,
          (p_kit or p_kits > 0), p_party, greatest(p_kits, 0),
          nullif(p_meta->>'tier', ''),
          greatest(coalesce((p_meta->>'amount')::numeric, 0), 0),
          greatest(coalesce((p_meta->>'kit_amount')::numeric, 0), 0),
          nullif(p_meta->>'order_token', ''));

  return json_build_object('ok', true, 'remaining', cap - taken - p_party);
end $$;
