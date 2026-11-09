#!/bin/bash
# A render queue: films listed in cola.txt ("name fps subframes"), rendered one at a time, after any render in progress.
# Leaves when the list has been empty for 20 minutes.  ./cola.sh &   then append lines to cola.txt
cd "$(dirname "$0")"
idle=0
while [ $idle -lt 80 ]; do
  if pgrep -f "seis/montar.sh|/montar.sh v" >/dev/null; then sleep 15; continue; fi
  next=$(head -n 1 cola.txt 2>/dev/null)
  if [ -z "$next" ]; then idle=$((idle + 1)); sleep 15; continue; fi
  idle=0; sed -i '1d' cola.txt
  echo "$(date +%T) start $next" >> cola.log
  ./montar.sh $next >> cola.log 2>&1
  echo "$(date +%T) done $next" >> cola.log
done
