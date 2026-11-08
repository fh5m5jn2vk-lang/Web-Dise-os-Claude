# Original music for the LÓNG ad, made from scratch with numpy (no samples, no third-party rights).
# 120 BPM, D minor pentatonic, 22 s, locked to js/film.js: gong at 0, groove from 2, lights out at 10 (silence and a riser),
# the drop at 11, a hit on every colour cut (14, 14.5, 15, 15.5), the four at 16, the offer at 17, the last gong at 21.
#   python3 music.py  ->  dragon.wav
import numpy as np, wave

SR = 44100; DUR = 22.0; BEAT = 0.5
rng = np.random.default_rng(11)
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR

def add(sig, start, gain=1.0, pan=0.0):
    i = int(round(start * SR)); j = min(N, i + len(sig))
    if i < 0 or j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * np.sqrt((1 - pan) / 2) * 1.41; R[i:j] += s * np.sqrt((1 + pan) / 2) * 1.41

def band(x, lo, hi):  # brick-ish FFT band-pass with soft edges
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

# ---------- instruments ----------
def kick808(note=38, dur=0.9, g=1.0):
    t = tt(int(dur * SR)); f = hz(note) + 160 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 3.2) + 0.5 * np.sin(ph) * np.exp(-t * 25)
    return np.tanh(x * 1.6) * g
def taiko(g=1.0, pitch=70):
    t = tt(int(0.7 * SR)); f = pitch + 60 * np.exp(-t * 20)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    skin = band(rng.normal(0, 1, len(t)), 150, 1800) * np.exp(-t * 18) * 0.5
    return (body + skin) * g
def clap(g=1.0):
    n = int(0.35 * SR); t = tt(n); x = rng.normal(0, 1, n)
    e = np.exp(-t * 22) + 0.6 * np.exp(-np.maximum(0, t - 0.012) * 40) * (t > 0.012) + 0.5 * np.exp(-np.maximum(0, t - 0.024) * 40) * (t > 0.024)
    return band(x, 900, 7000) * e * g
def hat(g=1.0, open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = tt(n)
    return band(rng.normal(0, 1, n), 7000, 16000) * np.exp(-t * (12 if open_ else 70)) * g
def pluck(m, dur=1.2, g=1.0, bright=0.5):
    # Karplus-Strong: a guzheng-like plucked string
    f = hz(m); p = int(SR / f); n = int(dur * SR)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for k in range(0, n, p):
        seg = buf.copy(); out[k:k + p] = seg[: max(0, min(p, n - k))]
        buf = 0.996 * (bright * seg + (1 - bright) * 0.5 * (seg + np.roll(seg, 1)))
    t = tt(n); return out * np.minimum(1, t / 0.002) * g
def lead(m, dur, g=1.0, slide_from=None):
    # an erhu-like bowed lead: saw with vibrato, filtered
    t = tt(int(dur * SR)); f0 = hz(m)
    f = f0 * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.25))
    if slide_from is not None: f = f * np.where(t < 0.12, (hz(slide_from) / f0) ** (1 - t / 0.12), 1)
    ph = np.cumsum(f) / SR; x = 2 * (ph % 1) - 1
    x = band(x, 200, 3200)
    e = np.minimum(1, t / 0.06) * np.minimum(1, (dur - t) / 0.12)
    return x * e * g
def pad(ms, dur, g=1.0):
    t = tt(int(dur * SR)); x = np.zeros(len(t))
    for m in ms:
        for d in (-0.08, 0, 0.07):
            ph = np.cumsum(np.full(len(t), hz(m) * 2 ** (d / 12))) / SR; x += 2 * (ph % 1) - 1
    x = band(x, 120, 2200); e = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5)
    return x * e * g / len(ms)
def gong(g=1.0, dur=4.0):
    t = tt(int(dur * SR)); x = np.zeros(len(t))
    for k, (r, a, d) in enumerate([(1, 1, 1.6), (1.48, .6, 1.2), (2.03, .5, .9), (2.74, .4, .7), (3.6, .3, .5), (4.4, .25, .4), (5.9, .2, .3)]):
        x += a * np.sin(2 * np.pi * 92 * r * t * (1 + 0.004 * np.sin(t * 3 + k))) * np.exp(-t / d)
    x += band(rng.normal(0, 1, len(t)), 300, 5000) * np.exp(-t * 6) * 0.3
    return x * np.minimum(1, t / 0.004) * g
def boom(g=1.0):
    t = tt(int(1.6 * SR)); f = 30 + 70 * np.exp(-t * 8)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) * 2) * g
def whoosh(dur=0.45, g=1.0, rev=False):
    n = int(dur * SR); t = tt(n); x = rng.normal(0, 1, n)
    x = band(x, 400, 9000); e = (t / dur) ** 2.5 if not rev else np.exp(-t * 7)
    return x * e * g
def riser(dur, g=1.0):
    n = int(dur * SR); t = tt(n); x = band(rng.normal(0, 1, n), 1500, 12000) * (t / dur) ** 2
    f = 200 * 2 ** (3 * t / dur); x += 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2
    return x * g
def click(g=1.0):
    n = int(0.03 * SR); t = tt(n); return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 300) + band(rng.normal(0, 1, n), 2000, 9000) * np.exp(-t * 250)) * g

# D minor pentatonic: D F G A C
D, F, G, A, C = 62, 65, 67, 69, 72
roots = {2: 38, 4: 41, 6: 36, 8: 45, 11: 38, 13: 41, 17: 38, 19: 36}

# ---------- arrangement ----------
add(gong(1.0, 5), 0.0, 0.55); add(boom(1), 0.0, 0.8)
for b, g in [(0, 1), (1.5, .7), (2, .8), (2.5, .7), (3, .9)]: add(taiko(g, 75), b * BEAT, 0.7)        # the hook's drums
for k, m in enumerate([D, F, G, A, C, D + 12, F + 12]): add(pluck(m, 1.0, 1, 0.6), 0.25 + k * 0.17, 0.32, -0.4 + k * 0.12)
add(riser(1.2), 0.8, 0.25); add(whoosh(0.45), 1.55, 0.35)

def groove(t0, t1, busy=1.0):
    t = t0
    while t < t1 - 1e-6:
        bar = int((t - t0) // 2); pos = (t - t0) % 2
        bt = round(pos / (BEAT / 2))                         # eighth notes in the bar, 0..7
        if bt in (0, 3, 6) or (busy > 1 and bt == 7): add(kick808(roots.get(int(t0 + bar * 2), 38), 0.8, 1), t, 0.55)
        if bt in (2, 6): add(clap(1), t, 0.33)
        add(hat(1), t, 0.12 if bt % 2 else 0.18, 0.3)
        if busy > 1 and bt == 7:
            for r in range(4): add(hat(1), t + r * BEAT / 8, 0.09, 0.3)
        t += BEAT / 2
groove(2, 9.5, 1)
for t in np.arange(9.5, 10, BEAT / 4): add(clap(0.6), t, 0.12 + (t - 9.5) * 0.4)   # a roll into the switch
# the guzheng melody over the groove
mel = [(D, 0), (F, .5), (G, .75), (A, 1), (C, 1.5), (A, 1.75), (G, 2), (F, 2.5), (D, 2.75), (C - 12, 3), (D, 3.5),
       (A, 4), (C, 4.25), (D + 12, 4.5), (C, 5), (A, 5.5), (G, 5.75), (A, 6), (F, 6.5), (G, 6.75), (D, 7)]
for m, b in mel: add(pluck(m, 1.1, 1, 0.55), 2 + b, 0.3, 0.25)
add(lead(A, 1.0, 1, slide_from=G), 6.0, 0.16, -0.2); add(lead(C + 0, 0.5, 1), 7.0, 0.16, -0.2); add(lead(D + 12, 1.4, 1, slide_from=C), 7.5, 0.16, -0.2)
add(lead(C, 0.5, 1), 9.0, 0.14, -0.2); add(lead(A, 0.5, 1), 9.5, 0.14, -0.2)
add(whoosh(0.4), 5.6, 0.3); add(taiko(1, 80), 6.0, 0.6)
# lights out: a click, near silence, a heartbeat and a riser into the drop
add(click(1), 10.0, 0.7); add(boom(0.6), 10.0, 0.25)
add(kick808(33, 0.4, 1), 10.25, 0.35); add(kick808(33, 0.4, 1), 10.45, 0.25)
add(riser(1.0), 10.0, 0.35); add(whoosh(0.9, 1), 10.1, 0.25)
# the drop
add(gong(1.0, 4), 11.0, 0.5); add(boom(1), 11.0, 0.9); add(taiko(1.2, 65), 11.0, 0.8)
groove(11, 14, 2)
add(pad([D, F, A], 3.0, 1), 11.0, 0.22); add(pad([C - 12, F, A], 1.0, 1), 13.0, 0.0)
for m, b in [(D + 12, 0), (C, .5), (A, 1), (G, 1.25), (A, 1.5), (C, 2), (D + 12, 2.5)]: add(pluck(m, 1, 1, 0.6), 11 + b, 0.3, 0.3)
add(lead(D + 12, 1.0, 1, slide_from=C), 11.0, 0.15); add(lead(F + 12, 1.0, 1, slide_from=D + 12), 12.0, 0.15); add(lead(D + 12, 1.0, 1, slide_from=F + 12), 13.0, 0.15)
add(whoosh(0.35), 13.65, 0.4)
# the colour cuts: a hit and a note each, the groove underneath
for k, t in enumerate([14, 14.5, 15, 15.5]):
    add(taiko(1, 70 + k * 6), t, 0.6); add(kick808(38 + [0, 3, 5, 7][k], 0.45, 1), t, 0.5); add(pluck([D, F, A, D + 12][k] + 12, 0.8, 1, 0.7), t, 0.35, -0.3 + k * 0.2)
    add(whoosh(0.3), t - 0.3, 0.3); add(clap(1), t + 0.25, 0.22); add(hat(1), t + 0.125, 0.12); add(hat(1), t + 0.375, 0.12)
# the four: half-time and a flourish
add(boom(0.7), 16, 0.6); add(clap(1), 16.5, 0.3)
for k, m in enumerate([D, F, G, A, C, D + 12, C, A]): add(pluck(m + 12, 0.7, 1, 0.6), 16 + k * 0.11, 0.24, 0.5 - k * 0.12)
add(whoosh(0.4), 16.6, 0.4)
# the offer: the groove again, then the last gong
add(gong(0.9, 4), 17.0, 0.35); add(taiko(1.1, 70), 17.0, 0.7)
groove(17, 21, 1)
add(pad([D, F, A], 4.0, 1), 17.0, 0.16)
for m, b in [(A, 0), (C, .5), (D + 12, 1), (C, 1.5), (A, 2), (G, 2.5), (F, 3), (G, 3.25), (A, 3.5)]: add(pluck(m, 1, 1, 0.5), 17 + b, 0.26, 0.2)
add(lead(D + 12, 1.5, 1, slide_from=C), 19.0, 0.13); add(lead(A, 1.4, 1, slide_from=C), 20.5, 0.13)
add(gong(1.0, 4), 21.0, 0.55); add(boom(1), 21.0, 0.7); add(pluck(D - 12, 2, 1, 0.4), 21.0, 0.4)

# ---------- mix: a short stereo reverb, glue and limit ----------
out = np.stack([L, R], 1)
wet = np.zeros_like(out)
for d, g in ((.031, .45), (.053, .38), (.079, .32), (.113, .26), (.151, .21), (.199, .16), (.263, .11), (.347, .08)):
    s = int(d * SR); wet[s:, 0] += out[:-s, 1] * g; wet[s:, 1] += out[:-s, 0] * g * .95
out = out + wet * 0.3
t = tt(N); out *= (np.minimum(1, t / 0.005) * np.minimum(1, (DUR - t) / 0.6))[:, None]
out = np.tanh(out / np.max(np.abs(out)) * 1.6) / np.tanh(1.6) * 0.92
with wave.open('dragon.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('saved dragon.wav')
