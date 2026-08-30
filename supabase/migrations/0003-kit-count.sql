-- Record how many kits, not just whether any.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Why: the /v3/ basket lets someone reserve three toolboxes, but rsvps only had
-- `wants_materials boolean`, so all three collapsed to "true" and the count was
-- lost. The confirmation email can't say "Number of kits: 3" from a boolean.

alter table public.rsvps
  add column if not exists kit_count int not null default 0;

-- Backfill: existing rows that wanted a kit are assumed to have wanted one.
update public.rsvps
   set kit_count = 1
 where kit_count = 0
   and wants_materials is true;

-- register() gains p_kits. The old five-argument version has to be dropped
-- rather than replaced — adding a defaulted argument creates an overload, and
-- PostgREST would then have two candidates to choose between.
drop function if exists public.register(date, text, text, int, boolean);

create or replace function public.register(
  p_date  date,
  p_name  text,
  p_email text,
  p_party int,
  p_kit   boolean default false,
  p_kits  int     default 0
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
  if coalesce(trim(p_name), '') = ''
     or p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    return json_build_object('ok', false, 'reason', 'bad_details');
  end if;
  if p_kits < 0 or p_kits > 20 then
    return json_build_object('ok', false, 'reason', 'bad_kits');
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
                     wants_updates, wants_materials, party_size, kit_count)
  values (p_name, p_email, lbl, p_date, true,
          (p_kit or p_kits > 0), p_party, greatest(p_kits, 0));

  return json_build_object('ok', true, 'remaining', cap - taken - p_party);
end $$;

-- dropping the function dropped its grant too
grant execute on function
  public.register(date, text, text, int, boolean, int) to anon;
