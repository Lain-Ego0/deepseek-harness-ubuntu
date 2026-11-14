#!/usr/bin/env bash
# Build unsigned Linux Desktop artifacts (AppImage + deb) for Ubuntu.
# Prereqs: pnpm install && pnpm run build:artifacts --profile local
# Usage: scripts/linux/package-ubuntu.sh [x64|arm64]

set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

ARCH="${1:-x64}"
TARGET_ARCH="$ARCH"
case "$ARCH" in
  x64) EB_ARCH=x64;  DEB_ARCH=amd64 ;;
  arm64) EB_ARCH=arm64; DEB_ARCH=arm64 ;;
  *) echo "usage: $0 [x64|arm64]" >&2; exit 2 ;;
esac

export DSH_DESKTOP_TARGET_PLATFORM=linux
export DSH_DESKTOP_TARGET_ARCH="$EB_ARCH"
export DSH_DESKTOP_UNSIGNED=1
export DSH_DESKTOP_APP_ID=com.deepseek.harness
export DSH_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN="${DSH_DESKTOP_MANDATORY_UPDATE_TEST_ORIGIN:-https://example.invalid}"
export DSH_DESKTOP_MANDATORY_UPDATE_CONFIG="${DSH_DESKTOP_MANDATORY_UPDATE_CONFIG:-{\"allowedAuthOrigins\":[\"https://example.invalid\"]}}"
export DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS="${DSH_RESOURCE_DOWNLOAD_TIMEOUT_MS:-1800000}"

ARTIFACT_DIR="apps/desktop/.desktop-build/targets/linux-$ARCH/unsigned-artifacts"
PACKED="apps/desktop/.desktop-build/targets/linux-$ARCH/packed"

echo "==> [1/7] build artifacts"
pnpm run build:artifacts --profile local

echo "==> [2/7] prepare runtime (Electron + Node + Python + pnpm)"
pnpm --dir apps/desktop run prepare:runtime

echo "==> [3/7] pack local dsh/vendor/landlock packages"
pnpm exec tsx apps/desktop/scripts/pack-local-packages.ts --out "$PACKED/dsh" --concurrency 8
pnpm --dir apps/desktop-host pack --pack-destination "$REPO_ROOT/$PACKED/dsh"
pnpm run release:pack --family vendor --out "$PACKED/vendor" --concurrency 8
mkdir -p "$PACKED/landlock"
pnpm --dir native/system/packages/entry pack --pack-destination "$REPO_ROOT/$PACKED/landlock"

echo "==> [4/7] prepare package set"
pnpm --dir apps/desktop run prepare:packages

echo "==> [5/7] prepare dsh runtime"
pnpm --dir apps/desktop run prepare:dsh

echo "==> [6/7] electron-builder (AppImage + deb)"
cd apps/desktop
npx electron-builder --linux AppImage deb \
  --config electron-builder.config.mjs \
  --config.extraMetadata.name=deepseek-harness \
  --config.extraMetadata.executableName=deepseek-harness \
  --config.extraMetadata.homepage=https://deepseek.com \
  --publish never
cd "$REPO_ROOT"

echo "==> [7/7] fix chrome-sandbox permission in unpacked dir"
chmod 4755 "$ARTIFACT_DIR/linux-unpacked/chrome-sandbox" 2>/dev/null || true

echo ""
echo "Artifacts:"
ls -lh "$ARTIFACT_DIR"/*.AppImage "$ARTIFACT_DIR"/*.deb 2>/dev/null
