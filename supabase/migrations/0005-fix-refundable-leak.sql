-- SECURITY FIX — run this now.
--
-- The `refundable` view I added in wfs-order-mirror.sql is readable by anon,
-- even though that migration deliberately contained no grant for it.
--
-- Two Postgres/Supabase behaviours combined:
--   1. Supabase sets default privileges on the public schema, so a newly
--      created view is granted to anon automatically. Omitting a grant is not
--      the same as withholding one.
--   2. A view without security_invoker runs with its owner's rights, so it
--      reads straight past the `revoke select on rsvps from anon` that is
--      supposed to keep names and emails private.
--
-- It currently returns an empty set only because the view filters on
-- order_token, and no paid order exists yet. The first real order would have
-- made every registrant's name and email publicly readable, silently.

-- Belt: the view now runs as the caller, so the revoke on rsvps applies through it.
alter view public.refundable set (security_invoker = on);

-- Braces: and anon has no business touching it at all.
revoke all on public.refundable from anon;
revoke all on public.refundable from authenticated;
