#!/usr/bin/env bash
# Extract the hero orbit into a scroll-scrub frame sequence.
# Run from the mrtycoon-site/ folder:  ./extract-frames.sh
set -euo pipefail

SRC="public/assets/video/hero-orbit.v2.mp4"
OUT="public/assets/frames/orbit"
FPS=24          # 8.04s clip x 24fps = 193 frames — matches TOTAL_FRAMES in public/index.html
WIDTH=1600      # plenty for full-bleed; keeps each frame small
QUALITY=6       # mjpeg q:v, 2=best/large … 8=small. 6 is the sweet spot here.

command -v ffmpeg >/dev/null || { echo "ffmpeg not found"; exit 1; }
[ -f "$SRC" ] || { echo "Missing $SRC — drop the three mp4s in assets/video/ first."; exit 1; }

rm -rf "$OUT" 2>/dev/null || true; mkdir -p "$OUT"

ffmpeg -hide_banner -loglevel error -i "$SRC" \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -q:v ${QUALITY} "$OUT/orbit_%04d.jpg"

COUNT=$(ls -1 "$OUT" | wc -l | tr -d ' ')
SIZE=$(du -sh "$OUT" | cut -f1)

echo "Extracted $COUNT frames  ($SIZE total)  →  $OUT"
echo
if [ "$COUNT" != "193" ]; then
  echo "NOTE: index.html expects 193 frames. Open it and set:"
  echo "      var TOTAL_FRAMES = $COUNT;"
fi
