-- Waivers: one row per signed online waiver (src/waiver/index.html).
--
-- Each row is good for 12 months (expires_at) and may cover several
-- participants. The browser, using the publishable key, may only INSERT: nobody
-- can read waivers through the anon key, so signed waivers (names, phone numbers,
-- medical notes, signatures) are visible only with the secret key or in the
-- Supabase dashboard. Paper waivers can be keyed in with source = 'paper'.
--
-- Drafted 2026-10-20 as iris/maps/waivers-table.sql; made re-runnable here.

create table if not exists public.waivers (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  expires_at       timestamptz not null default (now() + interval '12 months'),
  event            text,                       -- e.g. 'hhf-2026-10-22'; null = waiver only
  waiver_version   text not null,
  signer_name      text not null,
  signer_email     text not null,
  signer_phone     text not null,
  signer_address   text,
  participants     jsonb not null,             -- [{name, age, medical}]
  emergency_name   text not null,
  emergency_relation text not null,
  emergency_phone  text not null,
  photo_consent    text not null check (photo_consent in ('yes','no_faces','no')),
  newsletter       boolean not null default false,
  is_guardian      boolean not null default false,
  agreed           boolean not null check (agreed),
  signature_typed  text not null,
  signature_png    text check (signature_png is null or length(signature_png) < 300000),
  user_agent       text,
  source           text not null default 'online'   -- 'online' | 'paper' (for ones you key in)
);

alter table public.waivers enable row level security;

revoke all on public.waivers from anon, authenticated;
grant insert on public.waivers to anon;

drop policy if exists "anon can sign" on public.waivers;
create policy "anon can sign" on public.waivers
  for insert to anon
  with check (agreed and source = 'online' and expires_at <= now() + interval '13 months'
              and created_at >= now() - interval '1 hour');

-- Probe after running (should FAIL / return nothing with the publishable key):
--   curl "$SB_URL/rest/v1/waivers?select=*" -H "apikey: $SB_KEY"
