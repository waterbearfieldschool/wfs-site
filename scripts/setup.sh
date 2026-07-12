#!/usr/bin/env bash
# setup.sh — one-shot setup for a fresh checkout of wfs-site on a new machine.
#
#   git clone git@github.com:waterbearfieldschool/wfs-site.git
#   cd wfs-site
#   ./scripts/setup.sh
#
# Idempotent: safe to re-run. Does the mechanical steps (branch, deps, wfs-edit
# symlink) and prints checks for the things it can't do for you (SSH auth, the
# sibling Pages repo needed for deploys).

set -euo pipefail
cd "$(dirname "$0")/.."   # repo root
REPO_ROOT="$(pwd)"
WORK_BRANCH="foundations-restructure"

echo "→ wfs-site setup (repo: $REPO_ROOT)"

# 1. Check out the active working branch (not main).
current="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current" != "$WORK_BRANCH" ]]; then
  if git show-ref --verify --quiet "refs/heads/$WORK_BRANCH"; then
    git checkout "$WORK_BRANCH"
  else
    git checkout -b "$WORK_BRANCH" "origin/$WORK_BRANCH"
  fi
else
  echo "  already on $WORK_BRANCH"
fi

# 2. Install dependencies.
echo "→ npm install"
npm install

# 3. Symlink the wfs-edit wrapper into ~/.local/bin (serve.sh / deploy.sh need it).
mkdir -p "$HOME/.local/bin"
ln -sf "$REPO_ROOT/scripts/wfs-edit" "$HOME/.local/bin/wfs-edit"
echo "→ symlinked wfs-edit → $HOME/.local/bin/wfs-edit"
case ":$PATH:" in
  *":$HOME/.local/bin:"*) : ;;
  *) echo "  ⚠ ~/.local/bin is not on your PATH — add it to your shell profile:"
     echo "      export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
esac

# 4. Checks it can't do for you.
echo
echo "→ checks:"
if ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo "  ✓ GitHub SSH auth OK"
else
  echo "  ⚠ GitHub SSH auth not confirmed — add this machine's key to your GitHub account"
  echo "    (origin is git@github.com:waterbearfieldschool/wfs-site.git)"
fi
if [[ -d "../waterbearfieldschool.github.io/.git" ]]; then
  echo "  ✓ Pages repo present at ../waterbearfieldschool.github.io (deploys will work)"
else
  echo "  ⚠ Pages repo missing — needed ONLY for ./deploy.sh. To enable deploys:"
  echo "      (cd .. && git clone git@github.com:waterbearfieldschool/waterbearfieldschool.github.io.git)"
fi

echo
echo "✓ setup done. Start the dev server with:  ./serve.sh   (→ http://localhost:8080)"
