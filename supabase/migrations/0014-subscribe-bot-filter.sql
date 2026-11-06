-- Newsletter bot filter.
--
-- From mid-September, ~2 signups a week arrived from bots: gibberish names on
-- Gmail addresses with dots sprinkled through the local part (Gmail ignores
-- dots, so these are likely real people's inboxes being "subscription bombed").
-- The homepage form now sends two signals in p_meta (src/_includes/wfs-subscribe.js):
--   hp — a hidden honeypot field; people never see it, bots fill it
--   ms — how long the page was open before submitting
-- subscribe() applies the same rules server-side, so a bot posting straight to
-- the RPC with the public key is filtered too. Rejected signups get ok:true and
-- no row: telling a bot it failed only teaches it to retry.
-- Signups from a registration (source = 'registration') are unaffected.

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
  src    text := coalesce(p_meta->>'source', 'site');
begin
  if p_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' then
    return json_build_object('ok', false, 'reason', 'bad_email');
  end if;

  -- bot filter (see header): honeypot filled, or the homepage form submitted
  -- too fast / without the timing signal at all
  if coalesce(p_meta->>'hp', '') <> '' then
    return json_build_object('ok', true);
  end if;
  if src = 'homepage'
     and coalesce(nullif(p_meta->>'ms', ''), '0')::numeric < 2500 then
    return json_build_object('ok', true);
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
          src)
  on conflict (lower(email)) do update
     set unsubscribed_at = null,
         name = coalesce(excluded.name, subscribers.name);

  return json_build_object('ok', true);
end $$;

grant execute on function public.subscribe(text, text, jsonb) to anon;
