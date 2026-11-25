#!/usr/bin/env bash
# Los 20 Shorts de Dato Bomba de una vez: voz (ElevenLabs, VelionF), música, grabación y MP4 en ../videos-bomba/.
# Los que ya tienen voz no gastan créditos otra vez. Necesita unos 6.500 créditos de ElevenLabs para los 19 que faltan.
#   ./hacer-bomba.sh            (todos)       ./hacer-bomba.sh b02-miel b03-dinos   (solo esos)
cd "$(dirname "$0")"
export OUT=../videos-bomba
LISTA=("$@"); [ ${#LISTA[@]} -eq 0 ] && LISTA=(b??-*/)
for F in "${LISTA[@]}"; do
  F="${F%/}"
  [ -f "$F/voz.wav" ] || python3 voz.py "$F" || { echo "$F: la voz ha fallado (¿créditos de ElevenLabs?)"; continue; }
  rm -f "musica/$F.wav"          # la música se ajusta a la duración de la voz de verdad
  ./hacer.sh "$F" || echo "$F: no se ha podido grabar"
done
