#!/usr/bin/env bash
# One-line installer for the DeepSeek Assistant APT repository.
# Usage: curl -fsSL https://example.com/apt/install.sh | sudo bash
# Env:   DSH_APT_BASE (default https://dsh-linux-community.github.io/apt)

set -euo pipefail
BASE="${DSH_APT_BASE:-https://dsh-linux-community.github.io/apt}"
KEYRING=/usr/share/keyrings/deepseek-assistant-archive-keyring.gpg
LIST=/etc/apt/sources.list.d/deepseek-assistant.list

if [ "$(id -u)" -ne 0 ]; then
  echo "run as root: curl -fsSL $BASE/install.sh | sudo bash" >&2
  exit 1
fi

echo "==> Fetch GPG key"
mkdir -p /etc/apt/keyrings
curl -fsSL "$BASE/key.gpg" | gpg --dearmor -o "$KEYRING"
chmod 0644 "$KEYRING"

echo "==> Detect distribution"
. /etc/os-release
case "${VERSION_CODENAME:-}" in
  noble|jammy) codename="$VERSION_CODENAME" ;;
  *) echo "Unsupported Ubuntu version: ${VERSION_CODENAME:-unknown}; supported: noble(24.04), jammy(22.04)" >&2; exit 1 ;;
esac

echo "==> Write APT source"
cat > "$LIST" <<LIST_EOF
deb [signed-by=$KEYRING arch=amd64,arm64] $BASE/ubuntu $codename main
LIST_EOF
chmod 0644 "$LIST"

echo "==> Update package index"
apt-get update

echo ""
echo "Installation ready. Install with:"
echo "  sudo apt install deepseek-assistant"
echo ""
echo "Upgrade with:"
echo "  sudo apt update && sudo apt install --only-upgrade deepseek-assistant"
