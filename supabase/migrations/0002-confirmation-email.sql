-- Confirmation email support. Run in the Supabase SQL editor.
-- Additive and safe: nothing that works today changes behaviour.

-- 1. Stamped once a confirmation has actually gone out, so a rerun of the
--    mailer can never send the same person the same email twice.
alter table public.rsvps
  add column if not exists confirmation_sent_at timestamptz;

-- 2. IMPORTANT — mark everything that already exists as handled.
--
--    rsvps currently holds 11 rows, ten of them left over from the earlier
--    prototypes (Aug 17–24), with real names and addresses in them, including
--    one called "Schema test — please delete". Without this line the mailer
--    would treat every one of them as a new registration awaiting a
--    confirmation email.
--
--    This does NOT send anything. It only says "these have been dealt with".
update public.rsvps
   set confirmation_sent_at = now()
 where confirmation_sent_at is null;

-- After running this, make one fresh registration on /v3/ — that becomes the
-- single pending row, and the only email the mailer will send.

-- The mailer reads and stamps with the SECRET key, so no anon grants are needed
-- here — anonymous select on rsvps stays revoked.
