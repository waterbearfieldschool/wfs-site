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
#   3. Checks every session has a capacity row, and stops if not.
#   4. Wipes and rebuilds _site/ so nothing stale survives.
#   5. Copies _site/ over the Pages repo (../waterbearfieldschool.github.io/),
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

# 2. Refuse to deploy a site whose sessions and capacities disagree.
#    A session with no session_caps row renders as registerable and then has
#    every registration refused — silently, until a visitor hits it.
#    WFS_SKIP_CHECK=1 overrides, for when you know and don't care.
if [[ -z "${WFS_SKIP_CHECK:-}" ]]; then
  # Capacity is authored in each session's markdown front matter, but has to be
  # enforced in Postgres — register() counts and inserts under a row lock, and
  # nothing in the repo can do that. This pushes the authored values across
  # using the secret key, so adding a Field Day never means writing SQL.
  echo "→ syncing capacities to session_caps"
  ./scripts/wfs-sync-caps --apply --quiet

  echo "→ checking sessions against session_caps"
  if ! ./scripts/wfs-check --quiet; then
    echo "✗ deploy stopped. Fix the rows above, or re-run with WFS_SKIP_CHECK=1"
    exit 1
  fi
fi

# 3. Build fresh — never deploy a stale _site/.
#    rm -rf first: Eleventy doesn't clean between builds, so output from deleted
#    templates lingers and gets published. A /v5/ experiment survived that way,
#    carrying an API key it should never have had.
echo "→ building site"
rm -rf _site
npm run build

# 3b. Refuse to publish a session recap that is still a stub.
#     Sessions are un-drafted early so they can be previewed on the dev server;
#     without this, a forgotten `draft:` removal publishes a page reading
#     "TODO — two or three paragraphs" to the live site.
if [[ -d _site/s ]]; then
  stubs=$(grep -rl 'TODO' _site/s/ 2>/dev/null || true)
  if [[ -n "$stubs" ]]; then
    echo "✗ deploy stopped — these session pages still contain TODO text:"
    echo "$stubs" | sed 's|^|    |'
    echo "  Write the recap, or put 'draft: true' back in the markdown file."
    exit 1
  fi
fi

# 4. Deploy to GitHub Pages.
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
