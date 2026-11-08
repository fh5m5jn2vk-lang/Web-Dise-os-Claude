# Sound for the presenter cut: the voice-over and the sound effects on each card, stamp and tap.
# No music on purpose: the trending/epic sound goes on in TikTok or CapCut, so it is licensed and helps reach.
# Reads cues-presentador.json (written by node record.mjs --page presentador) and ../voz/voz.wav.  -> presentador.wav
import json, wave, numpy as np
SR = 44100; rng = np.random.default_rng(3)
C = json.load(open('cues-presentador.json')); DUR = C['dur']; N = int(DUR * SR)
def tt(n): return np.arange(n) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4), len(x))
mix = np.zeros((N, 2))
def add(sig, start, g=1.0, pan=0.0):
    i = int(round(start * SR)); j = min(N, i + len(sig))
    if i < 0 or j <= i: return
    s = sig[: j - i] * g; mix[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; mix[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41
def whoosh(d=0.3):
    n = int(d * SR); t = tt(n); return band(rng.normal(0, 1, n), 500, 7000) * np.sin(np.pi * t / d) ** 2
def swish(d=0.2):
    n = int(d * SR); t = tt(n); return band(rng.normal(0, 1, n), 2500, 9000) * (t / d) ** 1.5 * np.exp(-t * 4)
def thump(g=1.0):
    t = tt(int(0.35 * SR)); f = 55 + 120 * np.exp(-t * 30); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 1.6) * g
def slap():
    n = int(0.12 * SR); t = tt(n); return band(rng.normal(0, 1, n), 800, 6000) * np.exp(-t * 45)
def pop():
    t = tt(int(0.15 * SR)); f = 380 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)
def tap(f=1600):
    n = int(0.06 * SR); t = tt(n); return np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + band(rng.normal(0, 1, n), 3000, 10000) * np.exp(-t * 160) * 0.4
def click():
    n = int(0.05 * SR); t = tt(n); return band(rng.normal(0, 1, n), 1500, 9000) * np.exp(-t * 300) + 0.6 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 200)
def bell(m, d=0.9):
    t = tt(int(d * SR)); f = hz(m); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)) * np.exp(-t * 5) * np.minimum(1, t / 0.003)
def shimmer(d=1.6):
    t = tt(int(d * SR)); x = np.zeros(len(t))
    for k, m in enumerate([86, 89, 93, 96, 98, 101]): st = k * 0.05; x += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(0, t - st) * 3) * (t > st)
    return x / 6
for k, it in enumerate(C['items']):
    t0, kind = it['t'], it['kind']
    if kind == 'stamp': add(thump(), t0, 0.45); add(slap(), t0, 0.35)
    elif kind == 'drop': add(whoosh(0.28), t0 - 0.08, 0.2, 0.3); add(thump(0.6), t0 + 0.3, 0.2)
    elif kind == 'pop': add(pop(), t0 + 0.02, 0.3, 0.2); add(bell(88 + (k % 4) * 3, 0.6), t0 + 0.04, 0.05)
    elif kind == 'slide': add(swish(0.22), t0 - 0.05, 0.25, 0.4)
    elif kind == 'rise': add(whoosh(0.35), t0 - 0.05, 0.16)
for t0 in C['ticks']: add(tap(1700), t0, 0.12)
add(click(), C['tap'], 0.5)
add(click(), C['lightsOff'], 0.6); add(shimmer(), C['glow'], 0.35); add(thump(), C['glow'], 0.25)
for b in C['cuts']: add(whoosh(0.32), b - 0.16, 0.12)
add(thump(), C['end'], 0.4); add(shimmer(2.0), C['end'] + 0.1, 0.2)
# the voice, cleaned like a phone mic
w = wave.open('../voz/voz.wav'); vsr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v); v = band(v, 90, 12000)
v = np.tanh(v / np.max(np.abs(v)) * 2.2) / np.tanh(2.2)
voice = np.zeros(N); voice[:min(N, len(v))] = v[:N]
mix += voice[:, None] * 1.0
t = tt(N); mix *= (np.minimum(1, t / 0.01) * np.minimum(1, (DUR - t) / 0.6))[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.2) / np.tanh(1.2) * 0.9
with wave.open('presentador.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
print('saved presentador.wav', round(DUR, 2))
