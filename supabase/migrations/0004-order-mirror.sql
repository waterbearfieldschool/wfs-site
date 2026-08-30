-- Mirror the money side of a Snipcart order into Supabase, so the two systems
-- can be reconciled and refunds computed without reading Snipcart order by order.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Grain: one rsvps row is one (person, day). A Snipcart order can span several
-- days, so several rows can share an order_token. That is exactly the shape a
-- per-day partial refund needs: sum amount_paid + kit_amount for the rows
-- matching that date and that order.

alter table public.rsvps
  add column if not exists tier        text,
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists kit_amount  numeric(10,2) not null default 0,
  add column if not exists order_token text;

create index if not exists rsvps_order_token_idx on public.rsvps (order_token);
create index if not exists rsvps_session_date_idx on public.rsvps (session_date);

-- register() gains a single jsonb bag rather than yet more positional
-- arguments. We have now had to drop and recreate this function twice; with
-- p_meta, adding another field later is a new column plus one line here, and
-- the signature — and therefore every client — stays put.
drop function if exists public.register(date, text, text, int, boolean, int);

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

grant execute on function
  public.register(date, text, text, int, boolean, int, jsonb) to anon;

-- What a per-day refund is worth, per person. This is the query a cancellation
-- runs off: no Snipcart lookup needed to know the amount, only to execute it.
create or replace view public.refundable as
  select session_date,
         session,
         name,
         email,
         order_token,
         tier,
         party_size,
         kit_count,
         amount_paid,
         kit_amount,
         (amount_paid + kit_amount) as refund_total
    from public.rsvps
   where order_token is not null;

-- The view exposes names and emails, so it stays secret-key only —
-- deliberately no grant to anon here.
