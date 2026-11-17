#!/usr/bin/env bash
# Fábrica de Shorts: de un guion JSON a un MP4 listo para subir.
#   ./hacer.sh guiones/01-historia.json            (todo)
#   ./hacer.sh guiones/01-historia.json --fotos    (solo buscar fotos y ver la hoja de contactos)
set -euo pipefail
cd "$(dirname "$0")"
G="$1"; ID=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['id'])" "$G")
export NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1
if [[ "${2:-}" == "--fotos" ]]; then node lib/fotos.mjs buscar "$G"; exit 0; fi
[ -f "build/$ID/candidatos.json" ] || node lib/fotos.mjs buscar "$G"
node lib/fotos.mjs bajar "$G"
node lib/voz.mjs "$G"
node lib/grabar.mjs "$ID"
python3 lib/musica.py "$ID"
B="build/$ID"; DUR=$(python3 -c "import json; print(json.load(open('$B/timeline.json'))['dur'])")
mkdir -p videos
ffmpeg -y -v error -i "$B/imagen.mp4" -i "$B/voz.mp3" -i "$B/musica.wav" -i "$B/efectos.wav" -filter_complex "\
[1:a]aresample=44100,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=0.12:ratio=3:attack=5:release=120,apad,atrim=0:$DUR,asplit=2[v1][v2];\
[2:a]volume=0.55[m];[m][v2]sidechaincompress=threshold=0.03:ratio=8:attack=15:release=350[md];\
[3:a]volume=0.8[fx];\
[v1][md][fx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart -t "$DUR" "videos/$ID.mp4"
node lib/metadatos.mjs "$G"
echo "listo: videos/$ID.mp4"
