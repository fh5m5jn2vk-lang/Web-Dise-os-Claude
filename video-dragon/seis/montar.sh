#!/bin/bash
# Render a film, mix its sound and encode it.   ./montar.sh <film dir under seis/> [fps] [subframes]
#   fps: output frame rate (default 30). subframes > 1 renders fps*subframes and blends them (motion blur).
#   A film with no voice and no sound cues is encoded silent (no audio track), for the owner to add the sound.
#   A film with music also gets out/long-<film>-sin-musica.mp4: the same picture, voice and effects only.
set -e
cd "$(dirname "$0")/.."
F=seis/$1; FPS=${2:-30}; SUB=${3:-1}; R=$((FPS * SUB))
rm -rf "$F/frames" "$F/cues.json"
node record.mjs --page "$F/index" --fps $R --out "$F/frames" > "$F/render.log" 2>&1
NAME=$(basename "$F")
if [ "$SUB" -gt 1 ]; then VF="tmix=frames=$SUB,select='not(mod(n\,$SUB))',setpts=N/($FPS*TB)"; else VF="null"; fi
if [ -f "$F/voz.wav" ] || [ -f "$F/cues.json" ]; then
  python3 seis/mezcla.py "$F"
  ffmpeg -v error -y -framerate $R -i "$F/frames/f%05d.jpg" -i "$F/mezcla.wav" -vf "$VF" -r $FPS -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "out/long-$NAME.mp4"
  ffmpeg -v error -y -i "out/long-$NAME.mp4" -c:v libx264 -preset slow -crf 21 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -c:a copy -movflags +faststart "out/long-$NAME-movil.mp4"
  if python3 -c "import json,sys; c=json.load(open('$F/cues.json')); sys.exit(0 if c.get('musica') or c.get('musicas') else 1)"; then
    D=$(mktemp -d); ln -s "$(pwd)/$F/voz.wav" "$D/voz.wav"
    python3 -c "import json; c=json.load(open('$F/cues.json')); c.pop('musica', None); c.pop('musicas', None); json.dump(c, open('$D/cues.json', 'w'))"
    python3 seis/mezcla.py "$D" > /dev/null
    ffmpeg -v error -y -i "out/long-$NAME-movil.mp4" -i "$D/mezcla.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "out/long-$NAME-sin-musica.mp4"
    rm -rf "$D"
  fi
else
  ffmpeg -v error -y -framerate $R -i "$F/frames/f%05d.jpg" -vf "$VF" -r $FPS -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -an -movflags +faststart "out/long-$NAME.mp4"
  ffmpeg -v error -y -i "out/long-$NAME.mp4" -c:v libx264 -preset slow -crf 21 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -an -movflags +faststart "out/long-$NAME-movil.mp4"
fi
ls -la "out/long-$NAME"*.mp4
