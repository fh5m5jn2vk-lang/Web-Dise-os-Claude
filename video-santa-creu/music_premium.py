# 30 s of slow piano over a warm pad: elegant, unhurried, no drums.
import numpy as np, wave
SR = 44100; DUR = 30.0; N = int(SR * DUR); t = np.arange(N) / SR
out = np.zeros((N, 2)); rng = np.random.default_rng(3)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain; out[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; out[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41
def piano(m, dur=3.5, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(m)
    partials = [(1, 1.0, 1.6), (2, .45, 2.4), (3, .2, 3.4), (4, .1, 4.6), (5, .05, 6.0)]
    sig = sum(a * np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * tt) * np.exp(-tt * d * (0.6 + f / 900)) for k, a, d in partials)
    atk = np.minimum(1, tt / .004); hammer = rng.normal(0, 1, n) * np.exp(-tt * 120) * .03
    return (sig * atk + hammer) * vel * .22
def pad(ms, dur):
    n = int(dur * SR); tt = np.arange(n) / SR; sig = np.zeros(n)
    for m in ms:
        for det in (-.07, .07):
            f = hz(m) * 2 ** (det / 12); sig += np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * 2 * f * tt)
    e = np.minimum(1, tt / 1.8) * np.minimum(1, (dur - tt) / 1.8)
    return sig * e / len(ms) * .05
beat = 60 / 72
prog = [([50, 57, 62, 64, 66, 69], [38, 45]),   # D maj9
        ([47, 54, 59, 61, 62, 66], [35, 42]),   # B m9
        ([43, 50, 55, 59, 62, 66], [31, 38]),   # G maj7
        ([45, 52, 57, 59, 64, 69], [33, 40])]   # A sus
bar = 4 * beat; pos = 0.6; ci = 0
while pos < DUR - 2:
    notes, bass = prog[ci % 4]
    add(pad(notes[:4], bar + 1.6), pos - .2, 1.0)
    add(piano(bass[0], 5, .9), pos, 1.0, -.15); add(piano(bass[1], 5, .5), pos + beat * 2, 1.0, -.1)
    arp = [notes[2], notes[3], notes[4], notes[5], notes[4], notes[3], notes[2], notes[4]]
    for k, m in enumerate(arp):
        if pos < 3.0 and k % 2: continue      # sparser under the title
        add(piano(m + 12 if k == 3 and ci % 2 else m, 3, .55 + .15 * (k % 4 == 0)), pos + k * beat / 2, 1.0, (k % 3 - 1) * .35)
    pos += bar; ci += 1
# final chord
for i, m in enumerate([50, 57, 62, 66, 69, 74]): add(piano(m, 6, .8), 26.0 + i * .06, 1.0, (i - 2.5) * .15)
add(pad([50, 57, 62, 66], 4.5), 25.6, 1.4)
# a low swell under the name, airy swells into each cut
n = int(2.5 * SR); tt = np.arange(n) / SR
add(np.sin(2 * np.pi * 41 * tt) * np.minimum(1, tt / .3) * np.exp(-tt * 1.2) * .5, .3, 1.0)
def swell(length):
    n = int(length * SR); x = rng.normal(0, 1, n); y = np.zeros(n); acc = 0; prev = 0
    for i in range(n): acc += .5 * (x[i] - acc); y[i] = x[i] - acc   # high-pass: an airy hiss
    return y * (np.linspace(0, 1, n) ** 3) * .05
for c in (3.9, 8.0, 12.8, 18.8, 22.4, 25.8): add(swell(1.4), c - 1.4, 1.0, .2)
# room: a short diffuse reverb from several taps
wet = np.zeros_like(out)
for d, g in ((.023, .5), (.041, .42), (.067, .36), (.097, .3), (.131, .26), (.179, .2), (.233, .16), (.311, .12)):
    s = int(d * SR); wet[s:, 0] += out[:-s, 1 if d * 1000 % 2 > 1 else 0] * g; wet[s:, 1] += out[:-s, 0] * g * .9
out = out * .8 + wet * .55
out *= np.minimum(1, (DUR - t) / 2.5)[:, None] * np.minimum(1, t / .2)[:, None]
out /= np.max(np.abs(out)) * 1.15
with wave.open('music_premium.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('ok')
