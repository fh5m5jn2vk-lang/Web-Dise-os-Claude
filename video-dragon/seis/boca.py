# Mouth movement for a presenter film: the loudness of <film>/voz.wav, 60 values a second, 0..1, smoothed like a jaw.
#   python3 boca.py <film dir>  ->  <film>/boca.json
import sys, os, wave, json, numpy as np
F = sys.argv[1]
w = wave.open(os.path.join(F, 'voz.wav')); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
hop = sr // 60; rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
v = np.clip((rms - 0.01) / (np.percentile(rms, 97) - 0.01), 0, 1) ** 0.7
out = np.zeros_like(v); a = 0.0
for i, s in enumerate(v): a += (s - a) * (0.6 if s > a else 0.35); out[i] = a   # opens fast, closes a bit slower
json.dump({'fps': 60, 'v': [round(float(k), 3) for k in out]}, open(os.path.join(F, 'boca.json'), 'w'))
print(F, len(out), 'values')
