# Música de fondo original para cada vídeo, compuesta por código (sin derechos de terceros).
#   python3 musica.py <vídeo> <estilo>   ->  musica/<vídeo>.wav (dura lo que el vídeo)
# Estilos: neon (pad y arpegio de sintetizador), tinta (pulsos pentatónicos tipo koto sobre un bordón),
#          cuaderno (ukelele punteado y palmas), comic (bajo, metales y batería con energía),
#          lapiz (piano suave), sombras (caja de música en 3/4).
import sys, os, json, wave, numpy as np
FILM, EST = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
DUR = json.load(open(os.path.join(HERE, FILM, 'tiempos.json')))['dur'] + 0.5
SR = 44100; N = int(DUR * SR); out = np.zeros((N, 2)); rng = np.random.default_rng(len(FILM))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
tt = lambda n: np.arange(n) / SR
def put(sig, at, g=1.0, pan=0.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if j <= i or i < 0: return
    s = sig[:j - i] * g; out[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.41; out[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.41
def lp(x, k):
    y = np.empty_like(x); a = 0.0
    for i in range(len(x)): a += k * (x[i] - a); y[i] = a
    return y
def pluck(m, d=0.9, bright=0.5):   # Karplus-Strong
    n = int(d * SR); p = max(2, int(SR / hz(m))); buf = rng.uniform(-1, 1, p); y = np.empty(n)
    for i in range(n): y[i] = buf[i % p]; buf[i % p] = (buf[i % p] + buf[(i + 1) % p]) * (0.5 * (0.985 + 0.014 * bright))
    return y * 0.5
def sine(m, d, dec=3.0, harm=((1, 1),), atk=0.004):
    t = tt(int(d * SR)); f = hz(m)
    return sum(a * np.sin(2 * np.pi * f * k * t) for k, a in harm) * np.exp(-t * dec) * np.minimum(1, t / atk)
def saw(m, d, cut=0.08, det=0.1):
    t = tt(int(d * SR)); x = sum(((hz(m) * 2 ** (dd / 12) * t) % 1) * 2 - 1 for dd in (-det, det)) / 2
    return lp(x, cut)
def env(n, a, r): t = tt(n); return np.minimum(1, t / a) * np.minimum(1, (n / SR - t) / r)
def kick(): t = tt(int(0.4 * SR)); f = 45 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
def snare(): n = int(0.22 * SR); x = rng.normal(0, 1, n); x = x - lp(x, 0.25); return x * np.exp(-tt(n) * 18) * 0.35 + np.pad(sine(62, 0.2, 25), (0, n - int(0.2 * SR))) * 0.3
def hat(): n = int(0.05 * SR); x = rng.normal(0, 1, n); x = x - lp(x, 0.6); return x * np.exp(-tt(n) * 80) * 0.15
def clap():
    n = int(0.2 * SR); x = rng.normal(0, 1, n); x = x - lp(x, 0.3); e = sum(np.exp(-np.maximum(0, tt(n) - k) * 60) * (tt(n) >= k) for k in (0, .01, .02)); return x * e * 0.2

CH = {   # progresiones (raíz MIDI + acorde)
    'menor': [(57, [0, 3, 7, 10]), (53, [0, 4, 7, 11]), (48, [0, 4, 7, 9]), (55, [0, 4, 7, 10])],
    'mayor': [(48, [0, 4, 7, 11]), (57, [0, 3, 7, 10]), (53, [0, 4, 7, 9]), (55, [0, 4, 7, 10])],
}
if EST == 'neon':
    bpm = 100; b = 60 / bpm; pos = 0; k = 0
    while pos < DUR:
        r, ch = CH['menor'][k % 4]
        pad = sum(saw(r + 12 + c, 4 * b + 0.6, 0.03, 0.15) for c in ch) / 4 * env(int((4 * b + 0.6) * SR), 0.8, 0.8); put(pad, pos, 0.5)
        for i in range(16):
            n = r + 24 + ch[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]] + (12 if i % 8 == 7 else 0)
            put(saw(n, b / 4 * 0.9, 0.18, 0.02) * env(int(b / 4 * 0.9 * SR), 0.003, 0.05), pos + i * b / 4, 0.18, (i % 2 - 0.5) * 0.6)
        for i in range(4): put(kick(), pos + i * b, 0.5); put(hat(), pos + i * b + b / 2, 0.8, 0.3)
        put(sine(r - 12, 4 * b, 0.4, ((1, 1), (2, 0.3))), pos, 0.35)
        pos += 4 * b; k += 1
elif EST == 'tinta':
    b = 60 / 76; pent = [0, 2, 4, 7, 9, 12, 14, 16]; root = 50; pos = 0.0; k = 0
    put(sine(root - 12, DUR, 0.02, ((1, 1), (2, 0.4), (3, 0.15)), 2.0) * env(N, 2, 1.5), 0, 0.25)
    while pos < DUR:
        for i in range(8):
            if rng.random() < 0.3 and i % 2: continue
            m = root + 12 + pent[(k * 3 + [0, 2, 4, 3, 5, 4, 2, 1][i]) % 8]
            put(pluck(m, 1.6, 0.9), pos + i * b / 2, 0.55, (i % 3 - 1) * 0.5)
        put(sine(root + pent[k % 5], 3.0, 1.0, ((1, 1), (3, 0.2))), pos, 0.2)
        pos += 4 * b; k += 1
elif EST == 'cuaderno':
    bpm = 112; b = 60 / bpm; pos = 0; k = 0
    while pos < DUR:
        r, ch = CH['mayor'][k % 4]
        for i, pat in enumerate([0, 1, 2, 1, 3, 1, 2, 1]):
            put(pluck(r + 12 + ch[pat], 0.7, 0.7), pos + i * b / 2, 0.55, (pat - 1.5) * 0.3)
        for i in range(4):
            put(sine(r - 12 + (7 if i % 2 else 0), b * 0.9, 4, ((1, 1), (2, 0.3))), pos + i * b, 0.35)
            if i % 2: put(clap(), pos + i * b, 0.7, 0.1)
            put(hat(), pos + i * b + b / 2, 0.6, -0.3)
        pos += 4 * b; k += 1
elif EST == 'comic':
    bpm = 124; b = 60 / bpm; pos = 0; k = 0
    while pos < DUR:
        r, ch = CH['menor'][k % 4]
        for i in range(8): put(saw(r - 12 + (12 if i % 4 == 3 else 0), b / 2 * 0.9, 0.12, 0.05) * env(int(b / 2 * 0.9 * SR), 0.004, 0.04), pos + i * b / 2, 0.4)
        for i in (0, 3, 6):   # metales: acordes cortos a contratiempo
            st = sum(saw(r + 12 + c, 0.22, 0.25, 0.12) for c in ch[:3]) / 3 * env(int(0.22 * SR), 0.005, 0.08); put(st, pos + i * b / 2, 0.35, 0.15)
        for i in range(4): put(kick(), pos + i * b, 0.6); put(snare() if i % 2 else hat(), pos + i * b + (0 if i % 2 else b / 2), 0.6)
        pos += 4 * b; k += 1
elif EST == 'lapiz':
    b = 60 / 88; pos = 0; k = 0
    piano = lambda m, d=2.5: sine(m, d, 1.2 + hz(m) / 900, ((1, 1), (2, 0.4), (3, 0.15), (4, 0.06)), 0.004) * 0.6
    while pos < DUR:
        r, ch = CH['mayor'][k % 4]
        put(piano(r - 12, 3.5), pos, 0.6, -0.2)
        for i, c in enumerate([0, 2, 1, 3, 2, 1, 3, 2]): put(piano(r + 12 + ch[c], 1.8), pos + i * b / 2, 0.42, (c - 1.5) * 0.3)
        pos += 4 * b; k += 1
elif EST == 'sombras':
    b = 60 / 84; pos = 0; k = 0
    caja = lambda m: sine(m, 1.6, 2.8, ((1, 1), (2.76, 0.25), (5.4, 0.08)), 0.002)
    mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 74, 72, 69]
    while pos < DUR:
        r, ch = CH['mayor'][k % 4]
        for i in range(3): put(caja(r + 24 + ch[[0, 2, 1][i]]), pos + i * b, 0.25, -0.3)
        put(caja(mel[k % len(mel)] + 12), pos, 0.35, 0.3); put(caja(mel[(k + 5) % len(mel)] + 12), pos + 1.5 * b, 0.25, 0.3)
        put(sine(r, 3 * b, 1.0, ((1, 1), (2, 0.2))), pos, 0.25)
        pos += 3 * b; k += 1
# sala: unas reflexiones cortas
wet = np.zeros_like(out)
for d, g in ((0.029, 0.4), (0.053, 0.3), (0.087, 0.22), (0.131, 0.15), (0.197, 0.1)):
    s = int(d * SR); wet[s:, 0] += out[:-s, 1] * g; wet[s:, 1] += out[:-s, 0] * g
out = out + wet * 0.5
out *= (np.minimum(1, tt(N) / 0.05) * np.minimum(1, (DUR - tt(N)) / 1.0))[:, None]
out /= np.max(np.abs(out)) * 1.15
os.makedirs(os.path.join(HERE, 'musica'), exist_ok=True)
with wave.open(os.path.join(HERE, 'musica', FILM + '.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())
print('música', FILM, EST, round(DUR, 2), 's')
