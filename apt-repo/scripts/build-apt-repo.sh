#!/usr/bin/env bash
# Build a signed APT repository from .deb artifacts using reprepro.
# Inputs:  dist/*.deb
# Outputs: apt-repo/dist/{noble,jammy}/... + InRelease
# Env:     GPG_KEY_ID (required), APT_CODENAMES (default "noble jammy")

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

: "${GPG_KEY_ID:?GPG_KEY_ID must be set to the signing key id}"
CODENAMES="${APT_CODENAMES:-noble jammy}"
ARCHS="amd64 arm64"
POOL_DIR="apt-repo/pool"
CONF_DIR="apt-repo/conf"

mkdir -p "$CONF_DIR" "$POOL_DIR"

# Generate reprepro distributions config once
if [ ! -f "$CONF_DIR/distributions" ]; then
  {
    for codename in $CODENAMES; do
      cat <<DIST
Origin: DeepSeek Assistant Linux Community
Label: deepseek-assistant
Suite: $codename
Codename: $codename
Architectures: $ARCHS
Components: main
Description: Community APT repository for DeepSeek Assistant desktop
SignWith: $GPG_KEY_ID

DIST
    done
  } > "$CONF_DIR/distributions"
fi

for deb in dist/*.deb; do
  [ -f "$deb" ] || { echo "no .deb in dist/" >&2; exit 1; }
  for codename in $CODENAMES; do
    reprepro -b apt-repo includedeb "$codename" "$deb"
  done
done

reprepro -b apt-repo export
echo "APT repository built at apt-repo/"
