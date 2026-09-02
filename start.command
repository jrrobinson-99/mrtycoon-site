#!/bin/bash
# Double-click this file to run the Mr. Tycoon site.
cd "$(dirname "$0")/public"
PORT=8080
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo "Serving $(pwd)"
echo "Opening http://localhost:$PORT"
( sleep 1; open "http://localhost:$PORT/index.html" ) &
python3 -m http.server $PORT
