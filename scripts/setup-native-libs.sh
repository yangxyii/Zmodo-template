#!/usr/bin/env bash
# scripts/setup-native-libs.sh
#
# WHY THIS SCRIPT EXISTS
# ──────────────────────
# The proprietary Zmodo native video libraries (.a static archives) are too large
# to commit to git:
#   - liblibcore.a  ≈ 107 MB   (> GitHub's 100 MB hard file limit)
#   - libGPAC4iOS.a ≈  14 MB
# Committing them would cause `git push` to be rejected by GitHub.
#
# Instead, the .a files are gitignored (see root .gitignore), and the headers
# (vendor/**/include/) are committed. This script re-copies ONLY the .a files
# from the zmodo-template source tree so a fresh checkout can build locally.
#
# USAGE
# ─────
#   # Use default source path:
#   bash scripts/setup-native-libs.sh
#
#   # Or point to a custom zmodo-template checkout:
#   ZMODO_TEMPLATE=/path/to/zmodo-template bash scripts/setup-native-libs.sh
#
# REQUIREMENTS
# ────────────
#   The zmodo-template directory must be accessible at ZMODO_TEMPLATE.
#   (Default: /Users/jianzhang/Downloads/zmodo-template)

set -euo pipefail

ZMODO_TEMPLATE="${ZMODO_TEMPLATE:-/Users/jianzhang/Downloads/zmodo-template}"

# Resolve the repo root (directory containing this script's parent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DST_BASE="$REPO_ROOT/modules/zmodo-video/ios/vendor"

echo "==> setup-native-libs.sh"
echo "    Source : $ZMODO_TEMPLATE"
echo "    Dest   : $DST_BASE"
echo ""

if [ ! -d "$ZMODO_TEMPLATE" ]; then
  echo "ERROR: zmodo-template not found at '$ZMODO_TEMPLATE'"
  echo "       Set ZMODO_TEMPLATE env var to the correct path."
  exit 1
fi

copy_a() {
  local src_dir="$1"
  local dst_dir="$2"
  local label="$3"

  if [ ! -d "$src_dir" ]; then
    echo "  WARN: source dir not found: $src_dir (skipping $label)"
    return
  fi

  mkdir -p "$dst_dir"
  local count=0
  while IFS= read -r -d '' f; do
    rel="${f#$src_dir/}"
    dst_file="$dst_dir/$rel"
    mkdir -p "$(dirname "$dst_file")"
    cp "$f" "$dst_file"
    size=$(ls -lh "$dst_file" | awk '{print $5}')
    echo "  Copied [$label] $rel ($size)"
    count=$((count + 1))
  done < <(find "$src_dir" -name "*.a" -print0)
  echo "  → $count file(s) copied for $label"
}

# LibCore  ── lib/{liblibcore.a, libGPAC4iOS.a}
copy_a \
  "$ZMODO_TEMPLATE/Library/LibCore/lib" \
  "$DST_BASE/LibCore/lib" \
  "LibCore"

# FFmpeg  ── lib/{libavcodec.a, libavdevice.a, libavfilter.a, libavformat.a, libavutil.a, libswscale.a}
copy_a \
  "$ZMODO_TEMPLATE/Library/FFmpeg-3.3.3-iOS/lib" \
  "$DST_BASE/FFmpeg/lib" \
  "FFmpeg"

# pjsip  ── lib-all/{libpj-*.a, libpjlib-util-*.a, libpjnath-*.a}
copy_a \
  "$ZMODO_TEMPLATE/Library/pjsipIOS/lib-all" \
  "$DST_BASE/pjsip/lib-all" \
  "pjsip"

# libSmartLink  ── libSmartLink_armv7_i386_release.a (in root of lib dir)
copy_a \
  "$ZMODO_TEMPLATE/Library/libSmartLink" \
  "$DST_BASE/libSmartLink" \
  "libSmartLink"

echo ""
echo "==> Done. Verify with:"
echo "    find $DST_BASE -name '*.a' | xargs ls -lh"
