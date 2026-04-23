# iris.local — MeshCore node snapshot refresh

Operational notes on the scheduled job that keeps the static MeshCore node
snapshot fresh for the Mesh Network Path card on `/hhf/`.

## Why it exists

The HHF dashboard visualises the route a sensor message took through the
MeshCore network. To translate the 1-byte path hashes from a Bayou `log`
field into repeater names and coordinates, the page needs a roster of
nearby MeshCore nodes.

In theory it would just fetch `https://map.meshcore.io/api/v1/nodes`
live from the browser. In practice, that API's CORS policy only
whitelists `localhost:8080` and `map.meshcore.dev` — all other origins
(including `waterbearfieldschool.org`) get a mismatched
`Access-Control-Allow-Origin` header and the browser blocks the response.

So the site ships with a **static snapshot** of the roster at
`src/assets/data/meshcore-nodes-cached.json`. The page loads that first
for an instant render, then tries the live API in the background (works
on localhost, silently fails in production).

The iris Pi runs a weekly cron job that regenerates the snapshot from the
live API (server-side `curl` isn't subject to CORS) and commits + pushes
the update.

## Pipeline

```
Pi cron (Mon 05:00 BST)
   │
   ▼
~/gitwork/wfs-site/scripts/refresh-and-commit.sh         (Pi-only wrapper)
   │  git fetch + checkout foundations-restructure + pull
   │  ./scripts/update-meshcore-nodes.sh                 (committed)
   │     ├─ curl https://map.meshcore.io/api/v1/nodes
   │     ├─ filter to ~40 km around 42.4,-71.25
   │     └─ strip to {public_key, adv_name, adv_lat, adv_lon}
   │         → src/assets/data/meshcore-nodes-cached.json
   │  if file changed:
   │     git add + commit + push origin/foundations-restructure
   └─ log: ~/.cache/wfs/refresh.log
```

## Paths on iris

| Path | Purpose |
|------|---------|
| `~/.ssh/id_ed25519` | GitHub push credential (ed25519, no passphrase) |
| `~/gitwork/wfs-site` | SSH-cloned working tree on branch `foundations-restructure` |
| `~/gitwork/waterbearfieldschool.github.io` | GitHub Pages target (unused by cron today — kept in case we later automate the build+deploy step) |
| `~/gitwork/wfs-site/scripts/refresh-and-commit.sh` | Per-host wrapper, **not committed** to the repo |
| `~/.cache/wfs/refresh.log` | Append-only log of each cron run |

Git identity on iris: `iris-refresher <dwblair+iris@gmail.com>` (global).

## Cron line

```cron
# Weekly refresh of MeshCore node snapshot for wfs-site/hhf dashboard.
# Mon 05:00 Europe/London -> commits + pushes to origin/foundations-restructure if roster changed.
0 5 * * 1 /home/dwblair/gitwork/wfs-site/scripts/refresh-and-commit.sh >> /home/dwblair/.cache/wfs/refresh.log 2>&1
```

Note the Pi's timezone is **Europe/London** (BST/GMT), not EST — 05:00 BST
is midnight-ish EST.

## Wrapper script (per-host, not committed)

Lives at `~/gitwork/wfs-site/scripts/refresh-and-commit.sh` on iris.
Content (recreate if lost):

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BRANCH="foundations-restructure"

git fetch origin
git checkout "$BRANCH"
git pull --rebase --ff-only origin "$BRANCH"

./scripts/update-meshcore-nodes.sh

if git diff --quiet -- src/assets/data/meshcore-nodes-cached.json; then
  echo "[$(date -Iseconds)] no changes"
  exit 0
fi

git add src/assets/data/meshcore-nodes-cached.json
git commit -m "chore: refresh MeshCore node snapshot"
git push origin "$BRANCH"
echo "[$(date -Iseconds)] pushed snapshot update"
```

Reasons it isn't committed:
- Branch name (`foundations-restructure`) is environment-specific and will
  change when we eventually merge to `main`.
- Keeps secrets/paths out of the repo.

## How to run it by hand

```bash
ssh dwblair@iris.local
~/gitwork/wfs-site/scripts/refresh-and-commit.sh
```

Expected output on a change:
```
kept 341 of 38097 nodes
wrote .../meshcore-nodes-cached.json
[foundations-restructure abc1234] chore: refresh MeshCore node snapshot
To github.com:waterbearfieldschool/wfs-site.git
   863f07d..644fec9  foundations-restructure -> foundations-restructure
[2026-04-23T14:38:18+01:00] pushed snapshot update
```

No-change run:
```
kept 341 of 38097 nodes
wrote .../meshcore-nodes-cached.json
[...] no changes
```

## Troubleshooting

**`Permission denied (publickey)` during git push** — the SSH key at
`~/.ssh/id_ed25519` isn't associated with a GitHub identity that has
write access to `waterbearfieldschool/wfs-site`. Check
`ssh -T git@github.com` and GitHub → Settings → SSH and GPG keys.

**Merge/rebase conflict in cron** — the wrapper uses `--ff-only`, so if
`foundations-restructure` has diverged between runs (e.g., you pushed
unrelated work), the pull fails and the run aborts without committing.
Fix by syncing your working tree, then rerun.

**Branch changed** — if/when we merge `foundations-restructure` into
`main`, update the `BRANCH=` variable in the wrapper accordingly.

**Region/radius drift** — the static snapshot is filtered to a 40 km
radius around `42.4, -71.25`. If the sender/receiver ever move outside
that bubble, edit `CENTER_LAT`, `CENTER_LON`, `RADIUS_KM` in
`scripts/update-meshcore-nodes.sh` **and** the matching `mp-center` /
`mp-radius` input values in `src/hhf/hhf.njk`.

**Live fetch "unavailable" in production** — expected; that's the CORS
block. The card silently falls back to the static snapshot. Nothing to
fix. If MeshCore ever whitelists `waterbearfieldschool.org`, live
refresh will start working automatically.

## Future work (not yet wired)

- **Full deploy automation**: currently the cron only updates
  `wfs-site/foundations-restructure`. The live site is served from
  `waterbearfieldschool.github.io`, which is updated manually via
  `deploy.sh`. If we want fully automated end-to-end refreshes,
  extend the wrapper to build (`npm run build`) and run `deploy.sh`
  (which handles the copy + push to the Pages repo).
- **Merge to `main`**: `foundations-restructure` is 65+ commits ahead of
  `main`. When we merge, update the wrapper's `BRANCH=` variable.
- **Bayou `log` in production**: once the sensor firmware is updated to
  send path hex in the `log` field, the HHF page will automatically
  follow it — no code changes needed on this side.

## Related files

- `scripts/update-meshcore-nodes.sh` — the refresh script (committed)
- `scripts/README.md` — user-facing docs for the script
- `src/hhf/hhf.njk` — consumer of the snapshot
- `src/assets/data/meshcore-nodes-cached.json` — the snapshot itself
