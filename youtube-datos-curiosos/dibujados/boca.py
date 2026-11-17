# Apertura de la boca para los personajes que hablan: la energía de la voz, 30 veces por segundo.
#   python3 boca.py <vídeo>  ->  <vídeo>/boca.json
import sys, os, json, wave, numpy as np
F = sys.argv[1]; w = wave.open(os.path.join(F, 'voz.wav')); sr = w.getframerate()
y = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
hop = sr // 30; v = [float(np.sqrt(np.mean(y[i:i + hop] ** 2))) for i in range(0, len(y), hop)]
m = max(v) or 1; v = [round(min(1, (x / m) ** 0.7 * 1.3), 3) for x in v]
json.dump({'fps': 30, 'v': v}, open(os.path.join(F, 'boca.json'), 'w'))
print('boca', len(v))
