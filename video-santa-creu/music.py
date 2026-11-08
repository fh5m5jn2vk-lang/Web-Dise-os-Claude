# A 24 s track built from scratch: warm pad chords, soft kick, shaker, door thump, whooshes on each cut.
import numpy as np, wave
SR = 44100; DUR = 24.0; N = int(SR * DUR)
t = np.arange(N) / SR
out = np.zeros((N, 2))
rng = np.random.default_rng(7)
def note(f): return 440.0 * 2 ** ((f - 69) / 12)
def env(n, a, r):  # attack, release in samples
    e = np.ones(n); a = min(a, n); r = min(r, n)
    e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig)); s = sig[: j - i] * gain
    out[i:j, 0] += s * (1 - pan) ** .5; out[i:j, 1] += s * (1 + pan) ** .5
def lowpass(x, a): # one-pole
    y = np.zeros_like(x); acc = 0.0
    for k in range(len(x)): acc += a * (x[k] - acc); y[k] = acc
    return y

# chords: Amaj9 · F#m9 · Dmaj9 · E6/9, 100 bpm -> 2.4 s a bar, two bars a chord
chords = [[57, 61, 64, 68, 71], [54, 57, 61, 64, 68], [50, 54, 57, 61, 64], [52, 56, 59, 61, 66]]
bar = 2.4
pos = 0.0; ci = 0
while pos < DUR:
    length = min(4.8, DUR - pos) + 1.5
    n = int(length * SR); tt = np.arange(n) / SR
    sig = np.zeros(n)
    for m in chords[ci % 4]:
        f = note(m)
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            sig += np.sin(2 * np.pi * ff * tt) * 0.5 + np.sin(2 * np.pi * 2 * ff * tt) * 0.12 + np.sin(2 * np.pi * 3 * ff * tt) * 0.04
    sig *= env(n, int(1.2 * SR), int(1.6 * SR)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * tt))
    add(sig / 30, pos, 1.0)
    # bass
    b = note(chords[ci % 4][0] - 12); bs = np.sin(2 * np.pi * b * tt) * env(n, int(.05 * SR), int(1.2 * SR))
    add(bs / 9, pos, 1.0 if pos >= 3.2 else 0.0)
    pos += 4.8; ci += 1

beat = 60 / 100
def kick():
    n = int(.45 * SR); tt = np.arange(n) / SR
    f = 52 + 90 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
def shaker():
    n = int(.09 * SR); return rng.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 60) * 0.25
def snap():
    n = int(.25 * SR); tt = np.arange(n) / SR
    return (rng.normal(0, 1, n) * np.exp(-tt * 25) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt * 30)) * .5
k = kick(); sh = np.diff(shaker(), prepend=0) * 3; sn = snap()
x = 3.2
while x < 19.8:
    add(k, x, .55)
    if x >= 9.6: add(sh, x + beat / 2, .22, .4)
    bi = round((x - 3.2) / beat)
    if x >= 6.4 and bi % 2 == 1: add(sn, x, .18, -.2)
    x += beat
# the door: a low thump and creak
n = int(1.6 * SR); tt = np.arange(n) / SR
thump = np.sin(2 * np.pi * (45 + 30 * np.exp(-tt * 8)) * tt) * np.exp(-tt * 3)
add(thump, .8, .7)
creak = np.sin(2 * np.pi * (180 + 60 * np.sin(2 * np.pi * 3 * tt)) * tt) * env(n, int(.2 * SR), int(.6 * SR)) * 0.08
add(creak, .85, .5, .3)
# riser into the first cut, whooshes on every cut
def whoosh(length, up=True):
    n = int(length * SR); noise = rng.normal(0, 1, n)
    a = np.linspace(.02, .35, n) if up else np.linspace(.35, .02, n)
    y = np.zeros(n); acc = 0.0
    for i in range(n): acc += a[i] * (noise[i] - acc); y[i] = acc
    return y * np.sin(np.linspace(0, np.pi, n)) ** 1.5
add(whoosh(2.2), 1.0, .5)
for c in (3.2, 6.45, 9.6, 13.25, 16.8, 19.85):
    add(whoosh(.7), c - .45, .55, -.3); add(k, c, .8)
# a bell-like shimmer on the end card
for i, m in enumerate([76, 81, 85, 88]):
    n = int(3 * SR); tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * note(m) * tt) * np.exp(-tt * 1.6) * .25, 21.0 + i * .12, .5, (i - 1.5) * .3)

# simple reverb-ish tail: a few delayed taps
wet = np.zeros_like(out)
for d, g in ((.031, .35), (.047, .3), (.083, .25), (.127, .2), (.191, .15)):
    s = int(d * SR); wet[s:] += out[:-s] * g
out = out + wet * .6
out *= np.minimum(1, (DUR - t) / 1.8)[:, None]  # fade out
out *= np.minimum(1, t / .15)[:, None]
out /= np.max(np.abs(out)) * 1.12
pcm = (out * 32767).astype(np.int16)
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music.wav', DUR, 's')
