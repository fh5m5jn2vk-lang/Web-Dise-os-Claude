# Música de fondo y efectos, compuestos desde cero (sin derechos de terceros).
#   python3 lib/musica.py 01-historia  -> build/<id>/musica.wav y build/<id>/efectos.wav
# Lee timeline.json (duración) y cues.json (cortes, golpes y tictacs que marca el reproductor).
import json, sys, wave, os
import numpy as np

ID = sys.argv[1]
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'build', ID)
T = json.load(open(os.path.join(D, 'timeline.json')))
C = json.load(open(os.path.join(D, 'cues.json')))
SR = 44100; DUR = T['dur']; N = int(SR * DUR) + SR
rng = np.random.default_rng(T['numero'] * 7 + 1)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def lowpass(x, k):
    # filtro de un polo (k entre 0 y 1: más bajo, más oscuro)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += k * (x[i] - acc); y[i] = acc
    return y
def put(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig))
    if j <= i: return
    s = sig[: j - i] * gain
    buf[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.414
    buf[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.414

# ---------- música ----------
# cada informe tiene su tonalidad y su tempo, el mismo carácter: pulso documental, oscuro, con brillo arriba
roots = {1: 45, 2: 43, 3: 47, 4: 44, 5: 46}           # La, Sol, Si, Sol#, La# (menores)
root = roots.get(T['numero'], 45); bpm = [104, 96, 100, 110, 102][(T['numero'] - 1) % 5]
beat = 60 / bpm; bar = beat * 4
prog = [[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 10]]   # i – VI – III – VII
mus = np.zeros((N, 2))

def kick():
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 46 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * .9
def hat(open_=False):
    n = int((.18 if open_ else .05) * SR); x = rng.normal(0, 1, n)
    x = x - lowpass(x, .55)
    return x * env(n, .001, .05 if open_ else .012) * .14
def clap():
    n = int(.25 * SR); x = rng.normal(0, 1, n); x = x - lowpass(x, .2)
    e = sum(env(n, .001, .012) * (np.arange(n) >= int(k * SR)) for k in (0, .011, .022)) + env(n, .001, .08) * .6
    return x * e * .16
def bass(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    raw = np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * 2 * f * t) + .12 * np.sign(np.sin(2 * np.pi * f * t))
    return raw * env(n, .006, dur * .55) * .32
def pad(ms, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in ms:
        for det in (-.08, .08):
            f = hz(m) * 2 ** (det / 12)
            s += np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t + .5) + .1 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.0)
    return s * e / len(ms) * .045
def pluck(m, dur=.5):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 3 * f * t)) * env(n, .002, .12) * .09

pos = 0.0; b = 0
while pos < DUR:
    ch = prog[b % 4]
    put(mus, pad([root + 12 + c for c in ch], bar + .8), pos - .1)
    for k in range(8):                       # bajo en corcheas con acento
        t = pos + k * beat / 2
        put(mus, bass(root - 12 + ch[0] + (12 if k == 7 else 0), beat / 2 * .95), t, 1.0 if k % 2 == 0 else .6)
    for k in range(4):
        t = pos + k * beat
        put(mus, kick(), t, .8 if k in (0, 2) else 0)
        if k in (1, 3): put(mus, clap(), t, 1.0, .1)
        for h in range(4): put(mus, hat(h == 2 and k == 3), t + h * beat / 4, .9 if h % 2 else .5, .35)
    arp = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[2], ch[3]]
    for k, a in enumerate(arp):              # arpegio arriba, más denso según avanza el vídeo
        if (b < 2 and k % 2) or (b % 4 == 3 and k > 5): continue
        put(mus, pluck(root + 24 + a), pos + k * beat / 2, 1.0, (k % 3 - 1) * .45)
    pos += bar; b += 1

# eco corto para dar espacio
wet = np.zeros_like(mus)
for d, g in ((.031, .35), (.057, .28), (.089, .22), (.137, .16), (.199, .1)):
    s = int(d * SR); wet[s:, 0] += mus[:-s, 1] * g; wet[s:, 1] += mus[:-s, 0] * g
mus = mus + wet * .6
mus *= np.minimum(1, np.arange(N) / (SR * .05))[:, None]
mus /= np.max(np.abs(mus)) * 1.25

# ---------- efectos ----------
fx = np.zeros((N, 2))
def whoosh(length=.42):
    n = int(length * SR); x = rng.normal(0, 1, n); y = np.empty(n); acc = 0.0
    for i in range(n):
        k = .02 + .5 * (i / n) ** 2; acc += k * (x[i] - acc); y[i] = acc
    y = y - lowpass(y, .03)
    return y * (np.linspace(0, 1, n) ** 2.2) * .9
def boom():
    n = int(.9 * SR); t = np.arange(n) / SR
    f = 38 + 70 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5) * .8 + rng.normal(0, 1, n) * np.exp(-t * 60) * .12
def hit():
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 70 + 160 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * .5 + rng.normal(0, 1, n) * np.exp(-t * 90) * .18
def tick(m):
    n = int(.04 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 160) * .22

put(fx, boom(), 0.0, 1.0)
for c in C['cortes']:
    put(fx, whoosh(), c - .42, .55, .3); put(fx, boom(), c, .55)
for g in C['golpes']:
    if g > .05: put(fx, hit(), g, .7, -.1)
for a, z in C['tics']:
    t = a; k = 0
    while t < z:
        put(fx, tick(84 + (k % 2) * 7 + min(12, k // 4)), t, .8, .2); t += .055 + .06 * ((t - a) / max(z - a, .1)) ** 2; k += 1
fx /= max(1e-6, np.max(np.abs(fx))) * 1.1

def save(name, x):
    x = x[: int(DUR * SR)]
    with wave.open(os.path.join(D, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
save('musica.wav', mus); save('efectos.wav', fx)
print(ID, 'música y efectos listos')
