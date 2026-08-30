-- Newsletter signup for waterbearfieldschool.org
-- Paste into the Supabase SQL editor and run.
--
-- Same shape as register(): the table is closed to anonymous access entirely,
-- and the only way in is one security-definer function that validates first.
-- Nobody can read the list with the publishable key.

create table if not exists public.subscribers (
  id              bigint generated always as identity primary key,
  email           text not null,
  name            text,
  source          text,
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

-- one row per address, case-insensitive
create unique index if not exists subscribers_email_key
  on public.subscribers (lower(email));

alter table public.subscribers enable row level security;
revoke all on public.subscribers from anon, authenticated;

create or replace function public.subscribe(
  p_email text,
  p_name  text default null,
  p_meta  jsonb default '{}'::jsonb
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    return json_build_object('ok', false, 'reason', 'bad_email');
  end if;

  -- crude flood guard; the function is callable by anyone with the public key
  select count(*) into recent
    from subscribers
   where created_at > now() - interval '1 hour';
  if recent > 100 then
    return json_build_object('ok', false, 'reason', 'too_busy');
  end if;

  -- re-subscribing clears a previous unsubscribe rather than erroring
  insert into subscribers (email, name, source)
  values (lower(trim(p_email)),
          nullif(trim(coalesce(p_name, '')), ''),
          coalesce(p_meta->>'source', 'site'))
  on conflict (lower(email)) do update
     set unsubscribed_at = null,
         name = coalesce(excluded.name, subscribers.name);

  return json_build_object('ok', true);
end $$;

grant execute on function public.subscribe(text, text, jsonb) to anon;
