# Voice-overs for the six films, from a script file per film, with free Spanish voices (Piper: davefx, sharvard M/F).
# Each phrase is synthesised on its own (so the word times are exact enough for captions and lips), then the line goes
# through a style chain: creador (bright, punchy), narrador (deep, warm, a little hall), tele (game-show host),
# trailer (deep and big), nota (a phone voice note), susurro (a real whisper: the voice's spectral envelope driven by
# breath noise instead of the vocal cords, then close-mic warmth).
#   python3 voz.py <film dir> [voices dir]  ->  <film>/voz.wav, <film>/tiempos.json
# guion.json: { "inicio": 0.3, "voz": {defaults}, "lineas": [ { "texto": ..., "voz": {overrides}, "pausa": 0.2, "id": ... } ] }
#   voz keys: modelo (davefx|sharvard), hablante (M|F), estilo, velocidad (length scale), tono (pitch ratio), lentas {phrase: speed}
import sys, os, json, re, wave, subprocess, tempfile, numpy as np
from piper import PiperVoice, SynthesisConfig

FILM = sys.argv[1]
VOICES = sys.argv[2] if len(sys.argv) > 2 else '/tmp/claude-0/-home-user-Web-Dise-os-Claude/1d309b57-4453-5a0e-9183-ca1f1f412642/scratchpad/voices'
G = json.load(open(os.path.join(FILM, 'guion.json')))
OUT_SR = 44100
_models = {}
def model(name):
    if name not in _models: _models[name] = PiperVoice.load(f'{VOICES}/es_ES-{name}-medium.onnx')
    return _models[name]

STYLES = {
    'creador':  'highpass=f=95,equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1:g=4,equalizer=f=9000:t=q:w=1:g=2,acompressor=threshold=-20dB:ratio=4:attack=4:release=60:makeup=4',
    'narrador': 'highpass=f=60,equalizer=f=140:t=q:w=1:g=3,equalizer=f=2500:t=q:w=1.2:g=1.5,equalizer=f=7000:t=q:w=1:g=-2,acompressor=threshold=-22dB:ratio=3:attack=10:release=120:makeup=4,aecho=0.8:0.6:60|110:0.18|0.1',
    'tele':     'highpass=f=110,equalizer=f=2800:t=q:w=1:g=5,equalizer=f=200:t=q:w=1:g=-2,acompressor=threshold=-24dB:ratio=5:attack=3:release=50:makeup=6,aecho=0.8:0.7:35|70:0.15|0.08',
    'trailer':  'highpass=f=50,equalizer=f=110:t=q:w=1:g=4,equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-24dB:ratio=4:attack=8:release=150:makeup=5,aecho=0.8:0.55:90|160:0.22|0.12',
    'nota':     'highpass=f=280,lowpass=f=6500,equalizer=f=1800:t=q:w=1:g=3,acompressor=threshold=-22dB:ratio=4:attack=5:release=80:makeup=5',
    'susurro':  'highpass=f=120,equalizer=f=220:t=q:w=1:g=4,equalizer=f=5500:t=q:w=1.5:g=-3,acompressor=threshold=-26dB:ratio=3:attack=10:release=150:makeup=6',
}

def synth(text, v):
    m = model(v.get('modelo', 'davefx'))
    spk = None
    if v.get('hablante') is not None and m.config.num_speakers > 1: spk = m.config.speaker_id_map[v['hablante']]
    cfg = SynthesisConfig(speaker_id=spk, length_scale=v.get('velocidad', 0.8), noise_scale=v.get('ruido', 0.8), noise_w_scale=1.0)
    a = np.concatenate([c.audio_float_array for c in m.synthesize(text, syn_config=cfg)])
    nz = np.where(np.abs(a) > 0.015)[0]
    return a[max(0, nz[0] - 150): nz[-1] + 700], m.config.sample_rate

def whisper(x, sr):
    # LPC whisper: per 25 ms frame, keep the vocal tract filter, replace the excitation with noise of the same energy
    n, hop, order = int(0.025 * sr), int(0.0125 * sr), 18
    win = np.hanning(n); out = np.zeros(len(x) + n); rng = np.random.default_rng(1)
    for i in range(0, len(x) - n, hop):
        f = x[i:i + n] * win
        r = np.correlate(f, f, 'full')[n - 1:n + order]
        if r[0] < 1e-8: continue
        # Levinson-Durbin
        a = np.zeros(order + 1); a[0] = 1; e = r[0]
        for k in range(1, order + 1):
            acc = r[k] + np.dot(a[1:k], r[k - 1:0:-1]); kk = -acc / e
            prev = a.copy(); a[1:k] = prev[1:k] + kk * prev[k - 1:0:-1]; a[k] = kk
            e *= (1 - kk * kk)
        g = np.sqrt(max(e, 1e-12) / n)
        noise = rng.normal(0, 1, n) * g
        y = np.zeros(n)
        for t in range(n):   # all-pole synthesis
            s = noise[t]
            for k in range(1, min(order, t) + 1): s -= a[k] * y[t - k]
            y[t] = s
        out[i:i + n] += y * win
    out = out[:len(x)]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.8

def style_chain(x, sr, v):
    # pitch (same tempo) then the style's EQ/dynamics, with ffmpeg; returns float array at OUT_SR
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        with wave.open(src, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        chain = []
        tono = v.get('tono', 1.0)
        if abs(tono - 1) > 1e-3: chain.append(f'rubberband=pitch={tono}:formant=preserved')
        chain.append(STYLES[v.get('estilo', 'creador')])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', ','.join(chain), '-ar', str(OUT_SR), '-ac', '1', dst], check=True)
        with wave.open(dst) as f: y = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
    return y

base = G.get('voz', {})
t = 0.0 if 'en' in G['lineas'][0] else G.get('inicio', 0.3)
track = [np.zeros(int(t * OUT_SR), np.float32)]
lines = []
for li, L in enumerate(G['lineas']):
    v = {**base, **L.get('voz', {})}
    if 'en' in L: gap = max(0.0, L['en'] - t); track.append(np.zeros(int(gap * OUT_SR), np.float32)); t += gap   # placed on the beat
    elif li: gap = L.get('pausa', 0.2); track.append(np.zeros(int(gap * OUT_SR), np.float32)); t += gap
    text = L['texto']
    phrases = [p.strip() for p in re.findall(r'[^,.?!…]+(?:\.\.\.|[,.?!…])?', text) if p.strip()]
    words, t0, parts = [], t, []
    for k, ph in enumerate(phrases):
        sp = v.get('lentas', {}).get(ph.lower().strip('¿¡'), v.get('velocidad', 0.8))
        a, sr = synth(ph, {**v, 'velocidad': sp})
        if v.get('estilo') == 'susurro': a = whisper(a, sr)
        parts.append((a, sr, ph))
        if k < len(phrases) - 1:
            g = 0.32 if ph.endswith('...') else (0.07 if ph.endswith(',') else 0.13)
            g *= v.get('pausas', 1.0)
            parts.append((np.zeros(int(g * sr), np.float32), sr, None))
    sr = parts[0][1]
    raw = np.concatenate([p[0] for p in parts])
    y = style_chain(raw, sr, v)
    # word times from each phrase's place in the raw line, scaled to the processed length
    scale = len(y) / OUT_SR / (len(raw) / sr); pos = 0.0
    for a, s, ph in parts:
        dur = len(a) / s
        if ph:
            ws = ph.split(); wl = np.array([len(x) + 2 for x in ws], float); ed = np.concatenate([[0], np.cumsum(wl) / wl.sum()]) * dur
            words += [[x, round(t + (pos + ed[j]) * scale, 3), round(t + (pos + ed[j + 1]) * scale, 3)] for j, x in enumerate(ws)]
        pos += dur
    track.append(y); t += len(y) / OUT_SR
    lines.append({'id': L.get('id', li), 'texto': text, 't0': round(t0, 3), 't1': round(t, 3), 'words': words, 'quien': L.get('quien')})
fin = G.get('duracion', t + G.get('final', 0.8)); track.append(np.zeros(max(0, int((fin - t) * OUT_SR)), np.float32)); t = max(t, fin)
x = np.concatenate(track); x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
with wave.open(os.path.join(FILM, 'voz.wav'), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(OUT_SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
json.dump({'dur': round(t, 3), 'lines': lines}, open(os.path.join(FILM, 'tiempos.json'), 'w'), ensure_ascii=False, indent=1)
for l in lines: print(f"{l['t0']:6.2f}-{l['t1']:6.2f}  {l['quien'] or ''} {l['texto']}")
print('total', round(t, 2))
