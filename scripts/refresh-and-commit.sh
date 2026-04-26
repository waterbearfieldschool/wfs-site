#!/usr/bin/env bash
# Pi-only wrapper: pull, refresh the MeshCore node snapshot, commit+push if changed.
# Not committed to the repo (lives per-host).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BRANCH="foundations-restructure"

# Ensure we're on the right branch and up to date.
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
