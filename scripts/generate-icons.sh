#!/usr/bin/env bash
# Canvas Tracker — icon generator
#
# Converts build-resources/icon.png into platform icon formats:
#   build-resources/icon.icns  (macOS)
#   build-resources/icon.ico   (Windows)
#
# Usage:
#   npm run generate-icons
#
# Requirements:
#   - build-resources/icon.png must exist (1024×1024 px, square)
#   - macOS: sips + iconutil are built-in (no install needed)
#   - Windows ico: Node.js + png-to-ico (installed via npm install)

set -e

SRC="build-resources/icon.png"

if [ ! -f "$SRC" ]; then
  echo "Error: $SRC not found."
  echo "Place a 1024×1024 PNG at build-resources/icon.png and re-run."
  exit 1
fi

# ── macOS .icns ──────────────────────────────────────────────────────────────
echo "→ Generating icon.icns..."

if ! command -v iconutil &>/dev/null; then
  echo "  ⚠  iconutil not found — skipping icon.icns (requires macOS)"
else
  ICONSET="build-resources/icon.iconset"
  mkdir -p "$ICONSET"

  sips -z 16   16   "$SRC" --out "$ICONSET/icon_16x16.png"      >/dev/null
  sips -z 32   32   "$SRC" --out "$ICONSET/icon_16x16@2x.png"   >/dev/null
  sips -z 32   32   "$SRC" --out "$ICONSET/icon_32x32.png"       >/dev/null
  sips -z 64   64   "$SRC" --out "$ICONSET/icon_32x32@2x.png"   >/dev/null
  sips -z 128  128  "$SRC" --out "$ICONSET/icon_128x128.png"     >/dev/null
  sips -z 256  256  "$SRC" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
  sips -z 256  256  "$SRC" --out "$ICONSET/icon_256x256.png"     >/dev/null
  sips -z 512  512  "$SRC" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
  sips -z 512  512  "$SRC" --out "$ICONSET/icon_512x512.png"     >/dev/null
  sips -z 1024 1024 "$SRC" --out "$ICONSET/icon_512x512@2x.png" >/dev/null

  iconutil -c icns "$ICONSET" --output "build-resources/icon.icns"
  rm -rf "$ICONSET"
  echo "  ✓ build-resources/icon.icns"
fi

# ── Windows .ico ─────────────────────────────────────────────────────────────
echo "→ Generating icon.ico..."
node scripts/generate-ico.cjs

echo ""
echo "Icons ready. Run npm run electron:build:mac or npm run release to use them."
