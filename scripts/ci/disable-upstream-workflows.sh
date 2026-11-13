#!/usr/bin/env bash
# Disable all upstream workflows in this fork (keeps ubuntu-package.yml active).
# Requires: gh CLI (https://cli.github.com/) authenticated with the fork's owner.
# Usage: scripts/ci/disable-upstream-workflows.sh

set -euo pipefail
OWNER_REPO="${1:-$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')}"
KEEP="ubuntu-package.yml"

command -v gh > /dev/null || { echo "install gh: https://cli.github.com/" >&2; exit 1; }
gh auth status > /dev/null 2>&1 || { echo "run: gh auth login" >&2; exit 1; }

echo "==> Listing workflows in $OWNER_REPO"
WORKFLOWS=$(gh api "repos/$OWNER_REPO/actions/workflows?per_page=100" --jq '.workflows[] | select(.path |endswith("/'"$KEEP"'") | not) | "\(.id) \(.name)"')

if [ -z "$WORKFLOWS" ]; then
  echo "no workflows to disable"
  exit 0
fi

while read -r id name; do
  echo "  disable: $name (id=$id)"
  gh api -X PUT "repos/$OWNER_REPO/actions/workflows/$id/disable" > /dev/null
done <<< "$WORKFLOWS"

echo "==> Done. ubuntu-package.yml remains active."
