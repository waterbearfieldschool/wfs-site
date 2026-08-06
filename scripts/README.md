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
