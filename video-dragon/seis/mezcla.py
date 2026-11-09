# The sound of a film: its voice, a royalty-free Mixkit track (cut to start on a downbeat, ducked under the voice) and
# sound effects placed from the picture's cues. Everything synthesised here, no samples.
#   python3 mezcla.py <film dir>  ->  <film>/mezcla.wav
# cues.json (written by the recorder from the page's window.__cues):
#   { dur, musica: {archivo, desde, gain, duck, fadein, fadeout}, voz: {gain}, sfx: [{t, tipo, g, pan}], ambiente: [{tipo, desde, hasta, g}] }
import sys, os, json, wave, subprocess, numpy as np
FILM = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100; rng = np.random.default_rng(9)
C = json.load(open(os.path.join(FILM, 'cues.json'))); DUR = C['dur']; N = int(DUR * SR)
def tt(n): return np.arange(n) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4), len(x))
def env(n, a=0.002, d=0.2): t = tt(n); return np.minimum(1, t / a) * np.exp(-t / d)
noise = lambda n: rng.normal(0, 1, n)
def mixs(*sig):   # sum signals of different lengths
    out = np.zeros(max(len(x) for x in sig))
    for x in sig: out[:len(x)] += x
    return out

# ---------- the effects ----------
def whoosh(d=0.35): n = int(d * SR); t = tt(n); return band(noise(n), 500, 7000) * np.sin(np.pi * t / d) ** 2 * 0.8
def swish(d=0.22): n = int(d * SR); t = tt(n); return band(noise(n), 2500, 9000) * (t / d) ** 1.5 * np.exp(-t * 4)
def pop(): t = tt(int(0.14 * SR)); f = 380 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)
def tap(f=1600): n = int(0.05 * SR); t = tt(n); return np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + band(noise(n), 3000, 10000) * np.exp(-t * 160) * 0.4
def click(): n = int(0.04 * SR); t = tt(n); return band(noise(n), 1500, 9000) * np.exp(-t * 300) + 0.6 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 200)
def mouse(): n = int(0.03 * SR); t = tt(n); return band(noise(n), 2000, 8000) * np.exp(-t * 400) * 0.7 + np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 500) * 0.3
def thump(g=1.0): t = tt(int(0.35 * SR)); f = 55 + 120 * np.exp(-t * 30); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 1.6) * g
def boom(): t = tt(int(1.4 * SR)); f = 32 + 70 * np.exp(-t * 7); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4) * 2)
def slap(): n = int(0.1 * SR); t = tt(n); return band(noise(n), 800, 6000) * np.exp(-t * 45)
def bell(m=88, d=0.9): t = tt(int(d * SR)); f = hz(m); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)) * np.exp(-t * 5) * np.minimum(1, t / 0.003)
def shimmer(d=1.6):
    t = tt(int(d * SR)); x = np.zeros(len(t))
    for k, m in enumerate([86, 89, 93, 96, 98, 101]): st = k * 0.05; x += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(0, t - st) * 3) * (t > st)
    return x / 6
def notify():   # a two-note phone chime
    return np.concatenate([bell(88, 0.12), bell(95, 0.5)]) * 0.8
def send(): t = tt(int(0.18 * SR)); f = 600 + 1400 * (t / 0.18) ** 2; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.18) * 0.5 + swish(0.18) * 0.3
def receive():
    a, b = pop() * 0.7, bell(91, 0.25) * 0.3; out = np.zeros(max(len(a), len(b))); out[:len(a)] += a; out[:len(b)] += b; return out
def typing(d=1.0):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d - 0.05: out[int(k * SR):int(k * SR) + int(0.03 * SR)] += mouse()[:int(0.03 * SR)] * (0.6 + 0.4 * rng.random()); k += 0.06 + 0.07 * rng.random()
    return out
def key(): return mouse() * 0.9
def buzzer(): t = tt(int(0.6 * SR)); x = np.sign(np.sin(2 * np.pi * 110 * t)) + 0.5 * np.sign(np.sin(2 * np.pi * 116 * t)); return band(x, 100, 3000) * np.minimum(1, t / 0.01) * np.minimum(1, (0.6 - t) / 0.05) * 0.4
def correct(): return np.concatenate([bell(84, 0.14), bell(91, 0.9)]) * 0.9
def drumroll(d=1.5):
    out = np.zeros(int(d * SR)); k = 0.0
    while k < d: s = int(k * SR); seg = band(noise(int(0.05 * SR)), 300, 5000) * env(int(0.05 * SR), 0.001, 0.02); out[s:s + len(seg)] += seg[:len(out) - s] * (0.4 + 0.6 * k / d); k += 0.035
    return out
def applause(d=2.5):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 90)):
        s = int(rng.random() * (len(out) - 2000)); c = band(noise(900), 900, 7000) * env(900, 0.0005, 0.006); out[s:s + 900] += c * (0.5 + rng.random())
    t = tt(len(out)); return out * np.minimum(1, t / 0.3) * np.minimum(1, (d - t) / 0.8) * 0.6
def confetti(d=1.2):
    out = np.zeros(int(d * SR))
    for _ in range(140): s = int(rng.random() * (len(out) - 400)); out[s:s + 400] += band(noise(400), 3000, 12000) * env(400, 0.0003, 0.003) * rng.random()
    return out * np.exp(-tt(len(out)) * 1.5)
def gong(d=4.0):
    t = tt(int(d * SR)); x = np.zeros(len(t))
    for k, (r, a, dd) in enumerate([(1, 1, 1.6), (1.48, .6, 1.2), (2.03, .5, .9), (2.74, .4, .7), (3.6, .3, .5), (4.4, .25, .4)]):
        x += a * np.sin(2 * np.pi * 92 * r * t * (1 + 0.004 * np.sin(t * 3 + k))) * np.exp(-t / dd)
    return (x + band(noise(len(t)), 300, 5000) * np.exp(-t * 6) * 0.3) * np.minimum(1, t / 0.004) * 0.5
def ink():   # a drop, then the bloom of ink in water
    t = tt(int(0.9 * SR)); drop = np.sin(2 * np.pi * np.cumsum(900 + 1600 * np.exp(-t * 60)) / SR) * np.exp(-t * 35)
    bloom = band(noise(len(t)), 150, 1800) * np.exp(-t * 3) * np.minimum(1, t / 0.05) * 0.5
    return drop * 0.6 + bloom
def paper(d=0.6): n = int(d * SR); t = tt(n); return band(noise(n), 1500, 9000) * (0.4 + 0.6 * np.abs(np.sin(t * 40))) * np.sin(np.pi * t / d) * 0.5
def tear(d=0.8): n = int(d * SR); t = tt(n); x = band(noise(n), 800, 8000); return x * (0.5 + 0.5 * (rng.random(n) > 0.7)) * np.sin(np.pi * t / d) * 0.7
def lightswitch(): return mixs(click() * 1.2, thump(0.3))
def riser(d=1.5): n = int(d * SR); t = tt(n); return (band(noise(n), 1500, 12000) * (t / d) ** 2 + 0.4 * np.sin(2 * np.pi * np.cumsum(200 * 2 ** (3 * t / d)) / SR) * (t / d) ** 2) * 0.7
def impact(): return mixs(boom() * 0.8, slap() * 0.5)
def tick(): n = int(0.03 * SR); t = tt(n); return np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 300)
def cash(): return mixs(np.concatenate([bell(96, 0.08), bell(100, 0.7)]), click() * 0.5)
def segclick():  # the dragon's printed joints rubbing: tiny plastic clicks
    out = np.zeros(int(0.25 * SR))
    for k in range(3): s = int((0.02 + k * 0.06 + rng.random() * 0.02) * SR); c = band(noise(300), 2500, 11000) * env(300, 0.0002, 0.002); out[s:s + 300] += c * (0.6 + 0.4 * rng.random())
    return out
def sweep(): return mixs(whoosh(0.6) * 0.6, shimmer(1.0) * 0.4)
def heartbeat(): return np.concatenate([thump(0.7), np.zeros(int(0.12 * SR)), thump(0.5)])
FX = {k: v for k, v in globals().items() if callable(v) and k not in ('tt', 'hz', 'band', 'env', 'noise', 'mixs')}

def rain(d):
    n = int(d * SR); x = band(noise(n), 400, 9000) * 0.18
    for _ in range(int(d * 260)): s = int(rng.random() * (n - 300)); x[s:s + 300] += band(noise(300), 2000, 10000) * env(300, 0.0002, 0.002) * rng.random() * 0.6
    return x
def room(d): n = int(d * SR); return band(noise(n), 60, 600) * 0.05
def crowd(d): n = int(d * SR); return band(noise(n), 200, 2500) * 0.06 * (1 + 0.3 * np.sin(tt(n) * 2))
AMB = {'lluvia': rain, 'sala': room, 'publico': crowd, 'viento': lambda d: band(noise(int(d * SR)), 80, 900) * 0.12 * (1 + 0.5 * np.sin(tt(int(d * SR)) * 0.7))}

mix = np.zeros((N, 2))
def add(sig, start, g=1.0, pan=0.0):
    i = int(round(start * SR)); j = min(N, i + len(sig))
    if i < 0: sig = sig[-i:]; i = 0; j = min(N, len(sig))
    if j <= i: return
    s = sig[: j - i] * g; mix[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; mix[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41

for e in C.get('sfx', []): add(FX[e['tipo']](), e['t'], e.get('g', 0.3), e.get('pan', 0))
for a in C.get('ambiente', []):
    seg = AMB[a['tipo']](a.get('hasta', DUR) - a.get('desde', 0)); f = np.minimum(1, tt(len(seg)) / 0.8) * np.minimum(1, (len(seg) / SR - tt(len(seg))) / 0.8)
    add(seg * f, a.get('desde', 0), a.get('g', 1))

# the voice
voice = np.zeros(N)
vf = os.path.join(FILM, 'voz.wav')
if os.path.exists(vf):
    w = wave.open(vf); v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
    if w.getframerate() != SR: v = np.interp(np.arange(int(len(v) * SR / w.getframerate())) / SR, np.arange(len(v)) / w.getframerate(), v)
    voice[:min(N, len(v))] = v[:N] * C.get('voz', {}).get('gain', 1.0)
# the music: from a downbeat, ducked while the voice speaks
M = C.get('musica')
if M:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(M.get('desde', 0)), '-i', os.path.join(HERE, 'musica', M['archivo']), '-t', str(DUR + 1), '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    mu = np.frombuffer(raw, np.int16).reshape(-1, 2).astype(np.float32) / 32768; mu = mu[:N]
    if len(mu) < N: mu = np.vstack([mu, np.zeros((N - len(mu), 2))])
    t = tt(N); fade = np.minimum(1, t / M.get('fadein', 0.05)) * np.minimum(1, (DUR - t) / M.get('fadeout', 1.2))
    e = np.convolve(np.abs(voice), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); duck = 1 - M.get('duck', 0.5) * np.clip(e / (e.max() * 0.25 + 1e-9), 0, 1)
    duck = np.convolve(duck, np.ones(int(0.15 * SR)) / int(0.15 * SR), 'same')
    for ev in M.get('silencios', []):   # musical drops: the music dips out for a moment
        a, b = int(ev[0] * SR), int(ev[1] * SR); g = np.ones(N); g[a:b] = ev[2] if len(ev) > 2 else 0.1; g = np.convolve(g, np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same'); duck *= g
    mix += mu * (fade * duck * M.get('gain', 0.5))[:, None]
# extra music placed on the timeline (an edit's drop, a sting): {archivo, desde (in the track), en, hasta (on the timeline), gain, fadein, fadeout}
for X in C.get('musicas', []):
    d = X['hasta'] - X['en']
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(X.get('desde', 0)), '-i', os.path.join(HERE, 'musica', X['archivo']), '-t', str(d), '-ac', '2', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    seg = np.frombuffer(raw, np.int16).reshape(-1, 2).astype(np.float32) / 32768; tt2 = tt(len(seg))
    seg = seg * (np.minimum(1, tt2 / X.get('fadein', 0.05)) * np.minimum(1, (len(seg) / SR - tt2) / X.get('fadeout', 0.4)) * X.get('gain', 0.6))[:, None]
    i = int(X['en'] * SR); j = min(N, i + len(seg)); mix[i:j] += seg[: j - i]
mix += voice[:, None]
t = tt(N); mix *= (np.minimum(1, t / 0.005) * np.minimum(1, (DUR - t) / 0.3))[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.25) / np.tanh(1.25) * 0.92
tmp = os.path.join(FILM, 'mezcla-raw.wav')
with wave.open(tmp, 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=11', '-ar', str(SR), os.path.join(FILM, 'mezcla.wav')], check=True)
os.remove(tmp)
print('saved', os.path.join(FILM, 'mezcla.wav'), round(DUR, 2), 's')
