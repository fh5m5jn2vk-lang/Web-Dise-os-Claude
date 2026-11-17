#!/usr/bin/env bash
# Un vídeo dibujado, de principio a fin:  ./hacer.sh d1-cleopatra
#   voz (ElevenLabs) -> boca -> grabación fotograma a fotograma -> sonido (voz + efectos) -> MP4 y portada en ../videos-dibujados/
set -euo pipefail
cd "$(dirname "$0")"
F="${1%/}"
[ -f "$F/tiempos.json" ] || python3 voz.py "$F"
[ -f "$F/boca.json" ] || python3 boca.py "$F"
node grabar.mjs "$F"
python3 mezcla.py "$F" > /dev/null
mkdir -p ../videos-dibujados
ffmpeg -y -v error -i "$F/imagen.mp4" -i "$F/mezcla.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "../videos-dibujados/$F.mp4"
ffmpeg -y -v error -ss 1.0 -i "../videos-dibujados/$F.mp4" -frames:v 1 -q:v 3 "../videos-dibujados/$F-portada.jpg"
echo "listo: videos-dibujados/$F.mp4"
