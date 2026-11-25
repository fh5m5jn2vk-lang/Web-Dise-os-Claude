#!/usr/bin/env bash
# Un vídeo dibujado, de principio a fin:  ./hacer.sh d1-cleopatra
#   voz (ElevenLabs) -> boca -> grabación fotograma a fotograma -> sonido (voz + efectos) -> MP4 y portada en ../videos-dibujados/
set -euo pipefail
cd "$(dirname "$0")"
F="${1%/}"
[ -f "$F/voz.wav" ] || python3 voz.py "$F"
if python3 -c "import json,sys; sys.exit(0 if json.load(open('$F/tiempos.json')).get('provisional') else 1)"; then echo "$F: sin voz todavía (tiempos provisionales); no se graba"; exit 1; fi
OUT="${OUT:-../videos-dibujados}"
if [ -f "$F/guion.json" ] && [ ! -f "musica/$F.wav" ]; then E=$(python3 -c "import json; print({'blanca':'comic','tiza':'comic','cuaderno':'cuaderno','boceto':'lapiz','arroz':'tinta','neon':'neon'}.get(json.load(open('$F/guion.json')).get('estilo',''),''))"); [ -n "$E" ] && python3 musica.py "$F" "$E" > /dev/null; fi
[ -f "$F/boca.json" ] || python3 boca.py "$F"
node grabar.mjs "$F"
python3 mezcla.py "$F" > /dev/null
mkdir -p "$OUT"
ffmpeg -y -v error -i "$F/imagen.mp4" -i "$F/mezcla.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT/$F.mp4"
ffmpeg -y -v error -ss 1.0 -i "$OUT/$F.mp4" -frames:v 1 -q:v 3 "$OUT/$F-portada.jpg"
echo "listo: $OUT/$F.mp4"
