# The sound of the organic cut: the voice-over in front, a soft original beat underneath that ducks under the voice,
# and the sound effects on the picture (a whoosh at each cut, the light switch, the glow, the gift, the link).
# Reads ../js/guion.json and ../voz/voz.wav (python3 ../voz/voz.py first).   python3 organico.py -> organico.wav
import json, wave, numpy as np

SR = 44100
G = json.load(open('../js/guion.json')); DUR = G['dur']; Ls = G['lines']
DUR = json.load(open('cues-organico.json')).get('dur', DUR)   # the film runs on past the voice, into the flyer
N = int(DUR * SR); rng = np.random.default_rng(5)
B = [0] + [(Ls[i - 1]['t1'] + Ls[i]['t0']) / 2 for i in range(1, len(Ls))]
word = lambda li, wi: Ls[li]['words'][wi][1]
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4), len(x))
def shelf(x, f0, gain_db):  # a gentle presence lift above f0
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 + (10 ** (gain_db / 20) - 1) / (1 + (f0 / np.maximum(f, 1)) ** 2)
    return np.fft.irfft(X * g, len(x))

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
def add(buf, sig, start, gain=1.0, pan=0.0):
    i = int(round(start * SR)); j = min(N, i + len(sig))
    if i < 0 or j <= i: return
    s = sig[: j - i] * gain
    buf[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; buf[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41

# ---------- the beat: 92 BPM, warm keys over a soft trap groove ----------
BPM = 92; BEAT = 60 / BPM
def kick(g=1.0):
    t = tt(int(0.5 * SR)); f = 45 + 90 * np.exp(-t * 35)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * 1.5) * g
def snap(g=1.0):
    n = int(0.2 * SR); t = tt(n); return band(rng.normal(0, 1, n), 1200, 8000) * (np.exp(-t * 35) + 0.4 * np.exp(-t * 12)) * g
def hat(g=1.0):
    n = int(0.05 * SR); t = tt(n); return band(rng.normal(0, 1, n), 7000, 15000) * np.exp(-t * 80) * g
def keys(ms, dur, g=1.0):
    t = tt(int(dur * SR)); x = np.zeros(len(t))
    for m in ms:
        f = hz(m); x += (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + 0.15 * np.sin(6 * np.pi * f * t) * np.exp(-t * 6))
    x *= (1 + 0.08 * np.sin(2 * np.pi * 4.5 * t))            # a little tremolo, like an electric piano
    return x * np.minimum(1, t / 0.01) * np.exp(-t * 0.9) * g / len(ms)
def bass(m, dur, g=1.0):
    t = tt(int(dur * SR)); return np.sin(2 * np.pi * hz(m) * t) * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05) * g
CH = [([62, 65, 69, 72], 38), ([58, 62, 65, 69], 34), ([53, 57, 60, 64], 41), ([60, 64, 67, 71], 36)]   # Dm9 Bbmaj7 Fmaj7 Cmaj7
bar = 4 * BEAT; t = 0.0; b = 0
while t < DUR:
    ms, root = CH[b % 4]
    add(music, keys(ms, bar * 1.1), t, 0.5, -0.15); add(music, keys([m + 12 for m in ms[1:3]], bar * 0.5), t + 2.5 * BEAT, 0.18, 0.3)
    add(music, bass(root, bar * 0.45), t, 0.45); add(music, bass(root, bar * 0.4), t + 2.5 * BEAT, 0.4)
    for k in range(8):
        tk = t + k * BEAT / 2
        if k in (0, 5): add(music, kick(1), tk, 0.6)
        if k in (2, 6): add(music, snap(1), tk, 0.3, 0.1)
        add(music, hat(1), tk, 0.13 if k % 2 else 0.18, 0.35)
        if k == 7 and b % 2: [add(music, hat(1), tk + r * BEAT / 8, 0.1, 0.35) for r in range(4)]
    t += bar; b += 1

# ---------- the voice ----------
w = wave.open('../voz/voz.wav'); vsr = w.getframerate(); v = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
v = band(v, 90, 12000); v = shelf(v, 2500, 4)
v = np.tanh(v / np.max(np.abs(v)) * 2.2) / np.tanh(2.2)       # even it out, like a phone mic's compressor
room = np.zeros_like(v)
for d, g in ((.011, .22), (.017, .18), (.023, .14), (.031, .1)): s = int(d * SR); room[s:] += v[:-s] * g
v = (v + room)[:N]; voice = np.zeros(N); voice[:len(v)] = v

# ducking: the beat drops while the voice speaks
envv = np.convolve(np.abs(voice), np.ones(int(0.05 * SR)) / int(0.05 * SR), 'same')
duck = 1 - 0.55 * np.clip(envv / (envv.max() * 0.25), 0, 1)
duck = np.convolve(duck, np.ones(int(0.12 * SR)) / int(0.12 * SR), 'same')

# ---------- sound effects ----------
def whoosh(dur=0.32, g=1.0):
    n = int(dur * SR); t = tt(n); e = np.sin(np.pi * t / dur) ** 2
    return band(rng.normal(0, 1, n), 500, 7000) * e * g
def click(g=1.0):
    n = int(0.05 * SR); t = tt(n)
    return (band(rng.normal(0, 1, n), 1500, 9000) * np.exp(-t * 300) + 0.6 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 200)) * g
def shimmer(dur=1.6, g=1.0):
    t = tt(int(dur * SR)); x = np.zeros(len(t))
    for k, m in enumerate([86, 89, 93, 96, 98, 101]):
        st = k * 0.05; x += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(0, t - st) * 3) * (t > st)
    return x * g / 6
def pop(g=1.0):
    t = tt(int(0.15 * SR)); f = 400 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * g
def ding(g=1.0):
    t = tt(int(1.0 * SR)); return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 4)) * np.exp(-t * 4) * g
# the picture's cues, written by the recorder (node record.mjs --page organico)
C = json.load(open('cues-organico.json'))
def swish(dur=0.18, g=1.0, up=True):
    n = int(dur * SR); t = tt(n); x = rng.normal(0, 1, n)
    lo = band(x, 2500, 9000); e = (t / dur) ** 1.5 * np.exp(-t * 4) if up else np.exp(-t * 18)
    return lo * e * g
def tap(g=1.0, f=1600):
    n = int(0.06 * SR); t = tt(n); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + band(rng.normal(0, 1, n), 3000, 10000) * np.exp(-t * 160) * 0.4) * g
def bell(m, g=1.0, dur=0.9):
    t = tt(int(dur * SR)); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 9)) * np.exp(-t * 5) * np.minimum(1, t / 0.003) * g
def thump(g=1.0):
    t = tt(int(0.35 * SR)); f = 55 + 120 * np.exp(-t * 30); return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 1.6) * g
notes = [86, 89, 91, 93, 96, 98]
for k, c in enumerate(C['chunks']):
    t0 = c['t']; kind = c['kind']
    if kind == 'w': add(sfx, tap(1, 1500 + (k % 3) * 220), t0, 0.05, (k % 3 - 1) * 0.3)
    elif kind == 'stack': add(sfx, swish(0.22), t0 - 0.16, 0.16, 0.2); add(sfx, bell(notes[k % len(notes)]), t0, 0.07, -0.2)
    elif kind == 'heavy': add(sfx, thump(1), t0, 0.32); add(sfx, swish(0.2), t0 - 0.14, 0.14)
    elif kind == 'multi':
        for j in range(3): add(sfx, bell(notes[j * 2], 1, 0.5), t0 + j * 0.16, 0.07, -0.4 + j * 0.4)
for k, b0 in enumerate(C['cuts']): add(sfx, whoosh(), b0 - 0.16, 0.24, -0.5 if k % 2 else 0.5); add(sfx, thump(0.6), b0, 0.12)
add(sfx, thump(1), 0.15, 0.35); add(sfx, swish(0.5), 0.0, 0.18)       # the hook: the head rears up
F = C['flyer']                                                    # the closing flyer
add(sfx, whoosh(0.5), F - 0.3, 0.3); add(sfx, thump(1), F + 0.1, 0.4); add(sfx, shimmer(2.0), F + 0.15, 0.22)
add(sfx, pop(1), F + 1.0, 0.25)
for i in range(3): add(sfx, tap(1, 1700 + i * 300), F + 1.25 + i * 0.12, 0.08)
add(sfx, bell(93, 1, 1.2), F + 1.7, 0.12); add(sfx, bell(98, 1, 1.4), F + 2.1, 0.12)
add(sfx, pop(1), word(0, 8), 0.25)                            # "obsesionado"
add(sfx, click(1), C['lightsOff'], 0.6)                       # the light switch
add(sfx, shimmer(), C['glow'], 0.35); add(sfx, thump(1), C['glow'], 0.25)   # it glows
add(sfx, pop(1), B[6] + 0.1, 0.3); add(sfx, shimmer(1.2), B[6] + 0.2, 0.15)   # out of the box
# the beat stops for the dark, and comes back with the glow
gate = np.ones(N); a, z = int(C['lightsOff'] * SR), int(C['glow'] * SR)
gate[a:z] = 0.08; gate = np.convolve(gate, np.ones(int(0.04 * SR)) / int(0.04 * SR), 'same')

mix = music * (duck * gate * 0.55)[:, None] + voice[:, None] * 1.0 + sfx
t = tt(N); mix *= (np.minimum(1, t / 0.01) * np.minimum(1, (DUR - t) / 0.8))[:, None]
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.4) / np.tanh(1.4) * 0.9
with wave.open('organico.wav', 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
print('saved organico.wav', round(DUR, 2), 's')
