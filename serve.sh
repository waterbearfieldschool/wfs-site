#!/bin/bash
# serve.sh — sync from origin (if safe) and run the local dev server.
#
# Safe-pull behavior: fetches from origin, then fast-forwards only if
# the working tree is clean. If you have local edits in progress, the
# script warns but doesn't try to pull on top of them — you proceed
# with whatever you've got.
#
# Use `wfs-edit pull` directly if you need a stricter sync, or
# `wfs-edit status` to see where you stand.

set -e
cd "$(dirname "$0")"

git fetch origin --quiet 2>/dev/null || true
behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)
dirty=$(git status --porcelain)

if [[ "$behind" -gt 0 && -z "$dirty" ]]; then
  echo "→ $behind commit(s) behind origin, fast-forwarding..."
  git pull --ff-only --quiet
elif [[ "$behind" -gt 0 ]]; then
  echo "⚠ $behind commit(s) behind origin, but working tree is dirty — not pulling."
  git status --short
  echo "  (resolve and run 'wfs-edit pull', or proceed with what you have)"
fi

echo "→ starting dev server"
exec npm run dev
