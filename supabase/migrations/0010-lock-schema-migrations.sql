-- Close the migrations table to the publishable key.
--
-- wfs-migrate creates schema_migrations in the public schema, and anything in
-- public is exposed through PostgREST by default. It answered 200 (with no rows,
-- because RLS defaults to deny) rather than 401 — protected, but by a default
-- rather than by intent. This is the same shape as the refundable view leak:
-- creating a thing in public and assuming it is private.
--
-- It holds only migration filenames, so nothing sensitive was reachable. Said
-- out loud anyway.

alter table public.schema_migrations enable row level security;
revoke all on public.schema_migrations from anon, authenticated;
