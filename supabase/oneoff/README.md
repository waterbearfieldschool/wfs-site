# One-off SQL

SQL that has to run **once, at a particular moment**, and so cannot be a
migration: `wfs-migrate --apply` runs every pending file in `../migrations/`
back to back, so anything that must wait for another step (here, for
`wfs-sync-caps` to give the caps rows their keys) would run too early and be
recorded as done. Each file here is written to be safe to re-run.

    wfs-migrate --run supabase/oneoff/<file>.sql

## Rolling out 0012 — several events on one date

From the repo root on the Pi (every step needs the owner's `pass` keys):

```bash
# 1. schema: session_caps.key + id, rsvps.session_key, session_counts per key,
#    register(..., p_key)
./scripts/wfs-migrate                 # should list 0012-multi-event.sql
./scripts/wfs-migrate --apply

# 2. key the caps rows. Dry run first: expect "=" lines claiming the legacy
#    rows (incl. the merged Nov 6 row -> 2026-11-06-farmtryout) and a "+" for
#    2026-11-06-offgrid. --prune drops leftovers nobody booked.
./scripts/wfs-sync-caps --prune
./scripts/wfs-sync-caps --apply --prune

# 3. key the old registrations; prints whatever is still unkeyed
./scripts/wfs-migrate --run supabase/oneoff/0012a-backfill-session-key.sql

# 4. the one Nov 6 registration taken under the merged label
./scripts/wfs-migrate --run supabase/oneoff/0012b-rsvp-32-nov6.sql

./scripts/wfs-check                   # expect no drift
./scripts/wfs-roster --day 2026-11-06

# 5. webhook (understands new and old item ids), then the site
supabase functions deploy snipcart-webhook --no-verify-jwt
./deploy.sh "multi-event: one session per event, keyed by session file"
```

Between steps 1 and 5 the old site and webhook keep working on every date with
one event, and get `ambiguous_session` on a date with two — so run 2–5
together.
