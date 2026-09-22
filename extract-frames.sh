#!/usr/bin/env bash
# Extract the hero clip into a scroll-scrub frame sequence.
# Run from the mrtycoon-site/ folder:  ./extract-frames.sh
#
# ffmpeg is not installed on this Mac. The copy bundled with Remotion in
# dev/Video Agent is used instead; it needs its own folder on the dylib path.
# Override with:  FFMPEG_DIR=/path/to/dir ./extract-frames.sh
set -euo pipefail

SRC="public/assets/video/hero-orbit.v2.mp4"
OUT="public/assets/frames/orbit"
FPS="${FPS:-16}"            # 16fps: the scrub easing hides the gaps, and 24fps would be half again as many frames
WIDTH="${WIDTH:-1280}"      # the canvas is veiled and grayscaled, so 1280 holds up full-bleed
QUALITY="${QUALITY:-8}"     # mjpeg q:v, 2=best/large … 10=small. The stage frames are detail-heavy; 8 keeps ~340 frames near 10 MB

FFMPEG_DIR="${FFMPEG_DIR:-$HOME/dev/Video Agent/node_modules/@remotion/compositor-darwin-arm64}"
if command -v ffmpeg >/dev/null; then
  FFMPEG=ffmpeg
elif [ -x "$FFMPEG_DIR/ffmpeg" ]; then
  export DYLD_LIBRARY_PATH="$FFMPEG_DIR"
  FFMPEG="$FFMPEG_DIR/ffmpeg"
else
  echo "ffmpeg not found. Set FFMPEG_DIR to a folder holding ffmpeg and its dylibs."; exit 1
fi

[ -f "$SRC" ] || { echo "Missing $SRC — drop the mp4 in assets/video/ first."; exit 1; }

rm -rf "$OUT" 2>/dev/null || true; mkdir -p "$OUT"

# The Remotion build ships without the `fps` filter, so the rate is set with -r instead.
"$FFMPEG" -hide_banner -loglevel error -i "$SRC" \
  -r "${FPS}" -vf "scale=${WIDTH}:-2:flags=lanczos" \
  -q:v ${QUALITY} "$OUT/orbit_%04d.jpg"

COUNT=$(ls -1 "$OUT" | wc -l | tr -d ' ')
SIZE=$(du -sh "$OUT" | cut -f1)

echo "Extracted $COUNT frames at ${FPS}fps  ($SIZE total)  →  $OUT"
echo
CURRENT=$(grep -o 'TOTAL_FRAMES = [0-9]*' public/assets/js/scrub.js | grep -o '[0-9]*$' || echo '?')
if [ "$COUNT" != "$CURRENT" ]; then
  echo "NOTE: scrub.js has TOTAL_FRAMES = $CURRENT. Set it to:"
  echo "      const TOTAL_FRAMES = $COUNT;"
fi
