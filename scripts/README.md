# scripts/

Utility scripts for the site.

## `wfs-edit`

Guarded git wrapper for safe pull/push on this repo across multiple
devices (laptop, Pi, Telegram-driven edits). Designed so multi-device
edits don't accidentally clobber each other.

Three commands:

```bash
wfs-edit pull              # fetch + fast-forward; aborts if working tree is dirty
wfs-edit push "<message>"  # commit -A + push; auto-rebases once if push is rejected
wfs-edit status            # ahead/behind + working-tree changes
```

**Setup on a fresh checkout:** symlink the script into your PATH so
`wfs-edit` is callable from anywhere:

```bash
ln -s "$(pwd)/scripts/wfs-edit" ~/.local/bin/wfs-edit
```

The canonical script lives in the repo so it travels with whatever
device pulls a fresh checkout. The symlink keeps the command-name
location stable across hosts.

## `wfs-confirm`

Sends the confirmation email for a new Field Day registration — the one that
carries the exact address, which the site deliberately withholds until someone
registers. Without this, registering tells a person nothing they can act on.

```bash
wfs-confirm --dry-run          # show what would be sent; send nothing, stamp nothing
wfs-confirm --test-to you@…    # one sample email, touches no registration
wfs-confirm --limit 1          # a cautious first live run
wfs-confirm                    # send, and stamp confirmation_sent_at
```

Session details (title, day, time, what to bring) are read live from
`src/_data/sessions.js` via node, so the email can't drift from the page
someone registered on. Addresses are merged from a private file — see
`wfs-addresses.example.json` below.

Needs the Supabase **secret** key, because anonymous select on `rsvps` is
revoked on purpose:

```bash
pass insert -e supabase/wfs-secret
```

Each row is stamped `confirmation_sent_at` once sent, so a rerun can never
double-send. Meant to run from cron on the Pi; sends via msmtp as
`info@waterbearfieldschool.org`.

## `wfs-roster`

Read-only view of who has registered for what. Uses the same secret key.

```bash
wfs-roster                     # everything, grouped by day
wfs-roster --pending           # only those awaiting a confirmation email
wfs-roster --orphans           # rows with no session_date (legacy/imported)
wfs-roster --day 2026-08-19    # one day
wfs-roster --mask              # hide email addresses, for screenshots
```

Shows capacity beside each day, and flags any day missing from `session_caps` —
that combination makes a day look registerable while `register()` silently
refuses it, which is otherwise easy to miss.

## `wfs-addresses.example.json`

Template for the real meeting points. Copy it and fill it in:

```bash
cp scripts/wfs-addresses.example.json ~/iris/private/wfs-addresses.json
chmod 600 ~/iris/private/wfs-addresses.json
```

The real file is kept **out of this repo on purpose** — the addresses are what
registration actually buys, and the public pages only ever say "exact address
sent when you register". The template is tracked so the expected shape survives.

Keys must match the `place` values in `src/_data/workshops.js` exactly, or
`wfs-confirm` refuses to send for that session rather than emailing a location
it isn't sure about.

## `update-meshcore-nodes.sh`

Refreshes the static MeshCore node snapshot used by the **Mesh Network Path**
card on `/hhf/`.

The card tries the live MeshCore map API first, but that API's CORS policy
blocks every origin except `localhost:8080` and `map.meshcore.dev` — so in
production the browser falls back to this snapshot. The snapshot is small
(~340 nodes, filtered to a 40 km radius around Lincoln/Waltham MA), stripped
to the four fields the resolver needs.

**Run manually:**

```bash
./scripts/update-meshcore-nodes.sh
```

Writes `src/assets/data/meshcore-nodes-cached.json`. Commit + push if the
file changed and you're preparing a deploy.

**Change the region or radius:** edit the `CENTER_LAT`, `CENTER_LON`, and
`RADIUS_KM` constants at the top of the script. Keep them in sync with the
hardcoded `mp-center` / `mp-radius` values in `src/hhf/hhf.njk`.

**Dependencies:** `bash`, `curl`, `python3`, and `git` (no non-stdlib
Python packages).

### Running from a Pi (scheduled refresh)

The intended home for scheduled refreshes is a local Pi-based agent with a
checkout of this repo and push credentials. Example crontab entry
(refreshes Mondays at 05:00 local time):

```cron
0 5 * * 1  cd /home/pi/gitwork/wfs-site && scripts/refresh-and-commit.sh >> /home/pi/logs/wfs-refresh.log 2>&1
```

Minimal `scripts/refresh-and-commit.sh` (not committed — create per-host so
the commit identity/git remote stay environment-specific):

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Optional: pull before, so we don't commit on top of stale state.
git pull --rebase --ff-only

./scripts/update-meshcore-nodes.sh

if git diff --quiet -- src/assets/data/meshcore-nodes-cached.json; then
  echo "no changes"
  exit 0
fi

git add src/assets/data/meshcore-nodes-cached.json
git commit -m "chore: refresh MeshCore node snapshot"
git push
```

Make it executable (`chmod +x scripts/refresh-and-commit.sh`) on the Pi.
Ensure `git` has a push credential that works non-interactively (SSH key
with a passphrase-less key, or a cached HTTPS token).
