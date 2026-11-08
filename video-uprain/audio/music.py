# Original music for films 2, 3 and 4, made from scratch (no samples, no third-party rights).
#   python3 music.py  ->  colores.wav (film 2), truco.wav (film 3), regalo.wav (film 4)
import numpy as np, wave

SR = 44100
rng = np.random.default_rng(7)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

class Track:
    def __init__(self, dur): self.dur = dur; self.n = int(SR * dur); self.out = np.zeros((self.n, 2))
    def add(self, sig, start, gain=1.0, pan=0.0):
        i = int(start * SR); j = min(self.n, i + len(sig))
        if j <= i or i < 0: return
        s = sig[: j - i] * gain
        self.out[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; self.out[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41
    def reverb(self, wet=0.4):
        w = np.zeros_like(self.out)
        for d, g in ((.029, .5), (.047, .42), (.071, .36), (.101, .3), (.139, .25), (.187, .2), (.241, .15), (.317, .11), (.41, .08)):
            s = int(d * SR); w[s:, 0] += self.out[:-s, 1] * g; w[s:, 1] += self.out[:-s, 0] * g * .93
        self.out = self.out + w * wet
    def save(self, name, fade_in=0.02, fade_out=1.2):
        t = np.arange(self.n) / SR
        self.out *= (np.minimum(1, t / fade_in) * np.minimum(1, (self.dur - t) / fade_out))[:, None]
        self.out = np.tanh(self.out / np.max(np.abs(self.out)) * 1.3) / np.tanh(1.3) * 0.89
        with wave.open(name, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((self.out * 32767).astype(np.int16).tobytes())
        print('saved', name)

def env(n, a=.005, d=.2): tt = np.arange(n) / SR; return np.minimum(1, tt / a) * np.exp(-tt / d)
def kick(g=1.0, dur=.45):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = 46 + 110 * np.exp(-tt * 38); ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-tt * 7) + .3 * np.sin(ph * 2) * np.exp(-tt * 30)) * g
def noise(dur): return rng.normal(0, 1, int(dur * SR))
def hp(x, a=.6):  # one-pole high-pass
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = x[i] - acc
    return y
def lp(x, a=.1):
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
NOISE_HP = hp(noise(0.6), .5); NOISE_HP2 = hp(noise(0.12), .2)
def clap(): x = NOISE_HP[: int(.25 * SR)].copy(); n = len(x); tt = np.arange(n) / SR; e = sum(np.exp(-np.maximum(0, tt - o) * 60) * (tt >= o) for o in (0, .011, .022)) + .5 * np.exp(-tt * 14); return x * e * .5
def hat(open_=False): x = NOISE_HP2.copy() if not open_ else hp(noise(.3), .15); return x * env(len(x), .001, .09 if open_ else .022) * .22
def saw(f, n, det=(-.08, .08)):
    tt = np.arange(n) / SR; s = np.zeros(n)
    for d in det: ff = f * 2 ** (d / 12); s += 2 * ((tt * ff) % 1) - 1
    return s / len(det)
def pluck(m, dur=.35, g=1.0):
    n = int(dur * SR); s = saw(hz(m), n); s = lp(s, .35); return s * env(n, .002, .12) * g * .5
def pad(ms, dur, g=1.0, bright=.06):
    n = int(dur * SR); tt = np.arange(n) / SR; s = np.zeros(n)
    for m in ms: s += lp(saw(hz(m), n), bright)
    e = np.minimum(1, tt / .6) * np.minimum(1, (dur - tt) / .6)
    return s * e / len(ms) * g
def sub(m, dur, g=1.0): n = int(dur * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * hz(m) * tt) * np.minimum(1, tt / .01) * np.minimum(1, (dur - tt) / .05) * g
def riser(dur, g=1.0):
    x = hp(noise(dur), .3); n = len(x); tt = np.arange(n) / SR
    return x * (tt / dur) ** 2.5 * g * .25
def impact(g=1.0):
    n = int(1.8 * SR); tt = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 9)) * tt) * np.exp(-tt * 2.4)
    air = hp(noise(1.8), .4) * np.exp(-tt * 3.5) * .25
    return (boom + air) * g
def piano(m, dur=3.0, vel=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(m)
    sig = sum(a * np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * tt) * np.exp(-tt * d * (0.6 + f / 900)) for k, a, d in [(1, 1, 1.6), (2, .45, 2.4), (3, .2, 3.4), (4, .1, 4.6)])
    return sig * np.minimum(1, tt / .004) * vel * .22
def bell(m, dur=2.0, g=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 2.2) * g * .15

# ---------------- film 2: "Cuatro colores", 120 BPM house, a colour change every two bars ----------------
def colores():
    T = Track(21.0); b = 0.5; bar = 2.0
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]]   # Am7 Fmaj7 Cmaj7 G6(#11)
    roots = [45, 41, 48, 43]
    T.add(riser(2.0, 1.2), 0.0, 1.0)
    T.add(pad(chords[0], 2.2, .5, .03), 0.0, .7)
    for k in range(4): T.add(impact(.9), 2.0 + 4 * k - 0.02, .9)
    T.add(impact(1.1), 17.0, 1.0)
    for i in range(int((17.0 - 2.0) / b)):
        t = 2.0 + i * b; seg = min(3, int((t - 2.0) // 4)); beat = i % 4
        T.add(kick(), t, .95)
        if beat in (1, 3): T.add(clap(), t, .7, .05)
        T.add(hat(), t + b / 2, .7, .3); T.add(hat(), t + b / 4, .25, -.3)
        if i % 8 == 7: T.add(hat(True), t + b / 2, .6, .2)
        # sidechained bass on the off-beats
        T.add(sub(roots[seg], b * .45, .55), t + b / 2, 1.0)
        # pluck arpeggio, two per beat
        ch = chords[seg]
        for j in range(2): T.add(pluck(ch[(i * 2 + j) % 4] + 12, .3, .55), t + j * b / 2, 1.0, (j - .5) * .6)
    for k in range(4): T.add(pad(chords[k], 4.1, .35, .02), 2.0 + 4 * k, 1.0)
    for k in range(4): T.add(riser(1.0, .8), 2.0 + 4 * k + 3.0, 1.0)
    # the end card: a held chord and a few bells
    T.add(pad([57, 60, 64, 69, 72], 4.0, .6, .04), 17.0, 1.0)
    for i, m in enumerate([76, 79, 81, 84]): T.add(bell(m, 2.5, 1.2), 17.2 + i * .25, 1.0, (i - 1.5) * .4)
    T.reverb(.35); T.save('colores.wav', fade_out=1.5)

# ---------------- film 3: "El truco de luz", a ticking build, a freeze at 9.0 s, the drop at 11.5 s ----------------
def truco():
    T = Track(20.0)
    for i in range(int(9.0 / .5)):  # the clock: a tick every half second, getting louder
        t = .25 + i * .5; x = hp(noise(.03), .7) * env(int(.03 * SR), .0005, .006)
        T.add(x, t, .8 + .7 * (t / 9), (-.4 if i % 2 else .4)); T.add(sub(26, .18, .5), t, 1.0)
    T.add(pad([38, 45, 50, 57], 9.0, 1.2, .035), 0.0, 1.0)
    T.add(riser(3.2, 1.3), 5.8, 1.0)
    for t in (2.6, 5.0): T.add(impact(.6), t, .6)
    # 9.0: everything stops; a single high bell rings in the silence
    T.add(bell(88, 2.4, 1.3), 9.05, 1.0, .2); T.add(bell(81, 2.4, .9), 9.6, 1.0, -.2)
    T.add(riser(2.0, 1.0), 9.5, 1.0)
    T.add(impact(1.3), 11.5, 1.0)
    b = 60 / 100
    for i in range(int((17.0 - 11.5) / (b / 2))):
        t = 11.5 + i * b / 2
        if i % 4 == 0: T.add(kick(1.1), t, 1.0)
        if i % 4 == 2: T.add(clap(), t, .6)
        T.add(hat(), t + b / 4, .45, .3 if i % 2 else -.3)
        T.add(sub(38 if (i // 8) % 2 == 0 else 41, b / 2 * .9, .45), t, 1.0)
        T.add(pluck([62, 65, 69, 72][i % 4] + 12, .25, .4), t, 1.0, ((i % 3) - 1) * .5)
    T.add(pad([50, 53, 57, 62], 6.0, .45, .04), 11.5, 1.0)
    T.add(impact(.9), 17.0, .9)
    T.add(pad([50, 57, 62, 65, 69], 3.0, .55, .05), 17.0, 1.0)
    T.reverb(.4); T.save('truco.wav', fade_out=1.4)

# ---------------- film 4: "El regalo", warm lo-fi at 80 BPM ----------------
def regalo():
    T = Track(20.0); b = 60 / 80; bar = 4 * b
    prog = [([53, 57, 60, 64], 41), ([52, 55, 59, 62], 40), ([50, 53, 57, 60], 38), ([48, 52, 55, 59], 36)]
    crackle = np.zeros(T.n); idx = rng.integers(0, T.n, 900); crackle[idx] = rng.normal(0, .5, len(idx)); T.add(lp(crackle, .5) * .4, 0, 1.0)
    pos = 0.0; k = 0
    while pos < 18.0:
        ch, root = prog[k % 4]
        for j, m in enumerate(ch): T.add(piano(m, 3.4, .55 + .1 * (j == 0)), pos + j * .018, 1.0, (j - 1.5) * .25)
        T.add(pad(ch, bar + .4, .5, .025), pos, 1.0); T.add(sub(root, bar, .25), pos, 1.0)
        T.add(piano(root, 3.6, .7), pos, 1.0, -.1); T.add(piano(ch[2] + 12, 1.5, .35), pos + 2 * b, 1.0, .3)
        if pos >= bar - .01:  # the beat comes in on bar two
            for i in range(4):
                t = pos + i * b
                if i in (0, 2): T.add(lp(kick(.9), .3), t, .8)
                if i in (1, 3): T.add(lp(clap(), .25), t, .45, .05)
                T.add(hat(), t + b / 2, .35, .25)
        pos += bar; k += 1
    for i, m in enumerate([84, 88, 91, 96]): T.add(bell(m, 3.0, 1.0), 0.2 + i * .35, 1.0, (i - 1.5) * .4)
    for i, m in enumerate([77, 81, 84, 89]): T.add(bell(m, 3.0, 1.0), 15.6 + i * .3, 1.0, (i - 1.5) * .4)
    T.add(pad([53, 57, 60, 64, 69], 4.5, .45, .03), 15.5, 1.0)
    T.reverb(.5); T.save('regalo.wav', fade_out=1.8)

if __name__ == '__main__':
    colores(); truco(); regalo()
