#!/bin/bash
# deploy.sh — commit source changes, build, and publish to GitHub Pages.
#
# Usage:
#   ./deploy.sh                          # uses default commit message 'update'
#   ./deploy.sh "added farm day photos"  # uses your message for both source and pages commits
#
# What it does, in order:
#   1. If there are uncommitted source changes, commits + pushes them via
#      wfs-edit (which handles rebase-on-reject if origin moved).
#   2. If there's nothing to commit, syncs from origin so we don't build stale.
#   3. Runs `npm run build` so _site/ is current with src/.
#   4. Copies _site/ over the Pages repo (../waterbearfieldschool.github.io/),
#      commits with your message, and force-pushes.

set -e
cd "$(dirname "$0")"

msg="${1:-update}"

# 1. Source repo: commit and push if there are changes; otherwise pull to stay current.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "→ committing and pushing source changes via wfs-edit"
  wfs-edit push "$msg"
else
  echo "→ no source changes; pulling to stay current"
  wfs-edit pull
fi

# 2. Build fresh — never deploy a stale _site/.
echo "→ building site"
npm run build

# 3. Deploy to GitHub Pages.
PAGES_DIR="../waterbearfieldschool.github.io"
if [[ ! -d "$PAGES_DIR/.git" ]]; then
  echo "✗ Pages repo not found at $PAGES_DIR — bail out"
  exit 1
fi

echo "→ publishing to $PAGES_DIR"
rm -rf "$PAGES_DIR"/*
cp -r _site/* "$PAGES_DIR/"
cp CNAME "$PAGES_DIR/"

cd "$PAGES_DIR"
git add -A
if git diff --cached --quiet; then
  echo "(no changes to deploy)"
else
  git commit -m "$msg"
  git push -f
  echo "✓ deployed $(git rev-parse --short HEAD)"
fi
