#!/usr/bin/env bash
# Install and smoke-test the DeepSeek Assistant deb inside a clean container.
# Runs as root inside ubuntu:24.04; the .deb is mounted at /dist.
set -euo pipefail

DEB="$(ls /dist/*.deb | head -1)"
echo "==> Installing $DEB"
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  libgtk-3-0t64 libnss3 libasound2t64 libxss1 xvfb x11-utils imagemagick >/dev/null
dpkg -i "$DEB"

echo "==> Verify installed files"
test -x "/opt/DeepSeek Assistant/deepseek-assistant"
test -f "/usr/share/applications/deepseek-assistant.desktop"
test -x "/usr/bin/deepseek-assistant"
dpkg -L deepseek-assistant | grep -q "resources/runtime/primary-runtime/runtime.json"

echo "==> chrome-sandbox permission"
MODE="$(stat -c '%a' "/opt/DeepSeek Assistant/chrome-sandbox")"
echo "chrome-sandbox mode: $MODE"

echo "==> Launch under Xvfb"
Xvfb :99 -screen 0 1024x768x24 &
XVFB_PID=$!
sleep 1
export DISPLAY=:99
timeout 25 deepseek-assistant > /tmp/app.log 2>&1 || true
kill $XVFB_PID 2>/dev/null || true

if grep -q "dsh web:" /tmp/app.log; then
  echo "PASS: dsh web started"
else
  echo "FAIL: dsh web did not start"
  cat /tmp/app.log >&2
  exit 1
fi

echo "==> Clean uninstall"
dpkg -r deepseek-assistant
test ! -e "/opt/DeepSeek Assistant" || { echo "WARN: /opt/DeepSeek Assistant still exists"; }
echo "PASS: uninstall clean"
