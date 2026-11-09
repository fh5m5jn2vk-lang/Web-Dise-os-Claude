#!/bin/bash
# Render a film, mix its sound and encode it.   ./montar.sh <film dir under seis/> [fps] [subframes]
#   fps: output frame rate (default 30). subframes > 1 renders fps*subframes and blends them (motion blur).
set -e
cd "$(dirname "$0")/.."
F=seis/$1; FPS=${2:-30}; SUB=${3:-1}; R=$((FPS * SUB))
rm -rf "$F/frames"
node record.mjs --page "$F/index" --fps $R --out "$F/frames" > "$F/render.log" 2>&1
python3 seis/mezcla.py "$F"
NAME=$(basename "$F")
if [ "$SUB" -gt 1 ]; then VF="tmix=frames=$SUB,select='not(mod(n\,$SUB))',setpts=N/($FPS*TB)"; else VF="null"; fi
ffmpeg -v error -y -framerate $R -i "$F/frames/f%05d.jpg" -i "$F/mezcla.wav" -vf "$VF" -r $FPS -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "out/long-$NAME.mp4"
ffmpeg -v error -y -i "out/long-$NAME.mp4" -c:v libx264 -preset slow -crf 21 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -c:a copy -movflags +faststart "out/long-$NAME-movil.mp4"
ls -la "out/long-$NAME"*.mp4
