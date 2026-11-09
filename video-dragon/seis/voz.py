# Voice-overs for the films, from a script file per film. Two free engines:
#   kokoro (default): Kokoro-82M (Apache 2.0) through kokoro-onnx, natural whole-sentence prosody; Spanish voices
#     em_alex, em_santa (male), ef_dora (female). Not a copy of anyone's voice.
#   piper: davefx, sharvard M/F (medium quality), kept for comparison.
#   eleven: ElevenLabs (paid, needs an API key; the session's proxy adds it to requests to api.elevenlabs.io). Uses a
#     stock voice from the ElevenLabs library by its voice id ("voz_id"), never a clone of a real person's voice.
#     Lines are cached by text and settings in the scratchpad, so re-running a film spends no credits.
#   archivo: one recording of the whole script, made elsewhere (e.g. in the ElevenLabs app with the user's own voice).
#     Whisper finds each line in it; the line is cut out and placed on the film's timeline like a synthesised one.
#     Lines with a fixed start ("en") that run past the next line's start are sped up to fit (at most 1.3x).
# Each line is synthesised whole, goes through a light style chain (creador, narrador, tele, trailer, nota, susurro:
# a real whisper made by driving the voice's spectral envelope with breath noise), and its words are timed by
# faster-whisper on the finished audio, aligned to the script's words (so captions and lips land on the syllable).
#   python3 voz.py <film dir>  ->  <film>/voz.wav, <film>/tiempos.json
# guion.json: { "inicio": 0.3, "duracion"?: s, "final"?: s, "voz": {defaults}, "lineas": [ { "texto", "voz": {...}, "pausa" | "en", "id", "quien" } ] }
#   voz keys: motor (kokoro|piper|eleven), voz (em_alex|ef_dora|em_santa) or modelo/hablante for piper, estilo, velocidad, tono (pitch ratio)
#   archivo keys: archivo (path to the recording, relative to the film dir); lines from one recording share it
#   eleven keys: voz_id, modelo (eleven_multilingual_v2 | eleven_v3), estabilidad, similitud, estilo_ia, velocidad (0.7-1.2)
#     eleven_v3 is the expressive model: "etiqueta" (e.g. "[excited]") goes before the line, only to the voice, never
#     into the captions; v3 takes stability 0, 0.5 or 1 and no speed, so use "tempo" for pace.
#   any engine: "recorte" (s): every silence inside a line longer than this is cut down to it, as an editor's jump cuts
#     would (no dead air); "tempo": speed the finished line up (pitch kept), e.g. 1.06
import sys, os, json, re, wave, subprocess, tempfile, difflib, unicodedata, numpy as np

FILM = sys.argv[1]
SCR = '/tmp/claude-0/-home-user-Web-Dise-os-Claude/1d309b57-4453-5a0e-9183-ca1f1f412642/scratchpad'
G = json.load(open(os.path.join(FILM, 'guion.json')))
OUT_SR = 44100

_k = None
def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(f'{SCR}/kokoro/kokoro-v1.0.onnx', f'{SCR}/kokoro/voices-v1.0.bin')
    return _k
_p = {}
def piper(name):
    from piper import PiperVoice
    if name not in _p: _p[name] = PiperVoice.load(f'{SCR}/voices/es_ES-{name}-medium.onnx')
    return _p[name]
_w = None
def whisper_model():
    global _w
    if _w is None:
        from faster_whisper import WhisperModel
        _w = WhisperModel('base', device='cpu', compute_type='int8')
    return _w

STYLES = {
    'creador':  'highpass=f=80,equalizer=f=250:t=q:w=1.2:g=-1.5,equalizer=f=3500:t=q:w=1:g=2.5,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=90:makeup=2',
    'narrador': 'highpass=f=60,equalizer=f=140:t=q:w=1:g=2.5,equalizer=f=7000:t=q:w=1:g=-1.5,acompressor=threshold=-20dB:ratio=2.5:attack=12:release=140:makeup=2,aecho=0.8:0.6:55|100:0.16|0.08',
    'tele':     'highpass=f=100,equalizer=f=3000:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3.5:attack=4:release=60:makeup=3,aecho=0.8:0.7:30|60:0.12|0.06',
    'trailer':  'highpass=f=45,equalizer=f=110:t=q:w=1:g=3.5,equalizer=f=3000:t=q:w=1:g=1.5,acompressor=threshold=-22dB:ratio=3:attack=10:release=160:makeup=3,aecho=0.8:0.55:85|150:0.2|0.1',
    'nota':     'highpass=f=260,lowpass=f=7000,equalizer=f=1800:t=q:w=1:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=6:release=80:makeup=3',
    'susurro':  'highpass=f=120,equalizer=f=220:t=q:w=1:g=3,equalizer=f=6000:t=q:w=1.5:g=-2,acompressor=threshold=-24dB:ratio=2.5:attack=12:release=160:makeup=4',
}

def eleven(text, v):
    import hashlib, base64, requests
    model = v.get('modelo', 'eleven_multilingual_v2')
    if model == 'eleven_v3':
        body = {'text': (v.get('etiqueta', '') + ' ' + text).strip(), 'model_id': model,
                'voice_settings': {'stability': v.get('estabilidad', 0.5), 'similarity_boost': v.get('similitud', 0.8), 'use_speaker_boost': True}}
    else:
        body = {'text': text, 'model_id': model,
                'voice_settings': {'stability': v.get('estabilidad', 0.38), 'similarity_boost': v.get('similitud', 0.8),
                                   'style': v.get('estilo_ia', 0.4), 'use_speaker_boost': True, 'speed': v.get('velocidad', 1.05)}}
    key = hashlib.sha1(json.dumps([v['voz_id'], body], sort_keys=True).encode()).hexdigest()[:16]
    os.makedirs(f'{SCR}/eleven', exist_ok=True); mp3 = f'{SCR}/eleven/{key}.mp3'
    if not os.path.exists(mp3):
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voz_id']}?output_format=mp3_44100_128",
                          json=body, headers={'xi-api-key': os.environ.get('ELEVENLABS_API_KEY', 'proxy')}, timeout=120)
        r.raise_for_status(); open(mp3, 'wb').write(r.content)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', str(OUT_SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768, OUT_SR

_rec = {}
def recording(path):
    # the whole recording, its words timed by whisper once
    if path not in _rec:
        pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(OUT_SR), '-'], capture_output=True, check=True).stdout
        y = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
        idx = (np.arange(int(len(y) * 16000 / OUT_SR)) * OUT_SR / 16000).astype(int)
        segs, _ = whisper_model().transcribe(y[idx], language='es', word_timestamps=True, beam_size=5)
        _rec[path] = (y, [(w.word.strip(), w.start, w.end) for sg in segs for w in sg.words], [])
    return _rec[path]

def from_recording(text, v):
    # find this line's words in the recording, after the lines already taken from it, and cut them out
    path = os.path.join(FILM, v['archivo']); y, ww, used = recording(path)
    start = used[-1] if used else 0
    sw = [norm(w) for w in text.split()]; cand = [norm(w[0]) for w in ww[start:]]
    sm = difflib.SequenceMatcher(a=sw, b=cand, autojunk=False)
    blocks = [b for b in sm.get_matching_blocks() if b.size]
    if not blocks: raise SystemExit(f'no encuentro en la grabación: {text}')
    i0, i1 = start + blocks[0].b, start + blocks[-1].b + blocks[-1].size - 1
    used.append(i1 + 1)
    prev_end = ww[i0 - 1][2] if i0 > 0 else 0.0
    next_start = ww[i1 + 1][1] if i1 + 1 < len(ww) else len(y) / OUT_SR
    t0 = max(prev_end, ww[i0][1] - 0.12); t1 = min(next_start, ww[i1][2] + 0.25)
    return y[int(t0 * OUT_SR):int(t1 * OUT_SR)].copy(), OUT_SR

def fit(y, slot):
    # speed a line up (pitch kept) so it ends before the next fixed start
    k = min(1.3, len(y) / OUT_SR / slot)
    if k <= 1.0: return y
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        with wave.open(src, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(OUT_SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', f'rubberband=tempo={k:.4f}', dst], check=True)
        with wave.open(dst) as f: return np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768

def tighten(y, maxgap):
    # cut every silence inside the line down to maxgap seconds (kept half on each side, 6 ms crossfades)
    hop = int(0.01 * OUT_SR); n = len(y) // hop
    if n < 3: return y
    rms = np.array([np.sqrt(np.mean(y[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    quiet = 20 * np.log10(rms + 1e-7) < 20 * np.log10(rms.max() + 1e-7) - 34
    keep = int(maxgap / 0.01); out = []; i = 0; last = 0; fade = int(0.006 * OUT_SR)
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and j - i > keep:          # an inner pause, longer than allowed
                a = (i + keep // 2) * hop; b = (j - (keep - keep // 2)) * hop
                seg = y[last:a].copy()
                if out and len(seg) > fade: seg[:fade] *= np.linspace(0, 1, fade)
                if len(seg) > fade: seg[-fade:] *= np.linspace(1, 0, fade)
                out.append(seg); last = b
            i = j
        else: i += 1
    seg = y[last:].copy()
    if out and len(seg) > fade: seg[:fade] *= np.linspace(0, 1, fade)
    out.append(seg)
    return np.concatenate(out)

def stretch(y, k):
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        with wave.open(src, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(OUT_SR); f.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', f'rubberband=tempo={k:.4f}', dst], check=True)
        with wave.open(dst) as f: return np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768

def synth(text, v):
    if v.get('motor', 'kokoro') == 'archivo':
        a, sr = from_recording(text, v)
    elif v.get('motor', 'kokoro') == 'eleven':
        a, sr = eleven(text, v)
    elif v.get('motor', 'kokoro') == 'kokoro':
        a, sr = kokoro().create(text, voice=v.get('voz', 'em_alex'), speed=v.get('velocidad', 1.1), lang='es')
        a = np.asarray(a, np.float32)
    else:
        from piper import SynthesisConfig
        m = piper(v.get('modelo', 'davefx')); spk = m.config.speaker_id_map[v['hablante']] if v.get('hablante') and m.config.num_speakers > 1 else None
        cfg = SynthesisConfig(speaker_id=spk, length_scale=v.get('velocidad', 0.8), noise_scale=0.8, noise_w_scale=1.0)
        a = np.concatenate([c.audio_float_array for c in m.synthesize(text, syn_config=cfg)]); sr = m.config.sample_rate
    nz = np.where(np.abs(a) > 0.012)[0]
    return a[max(0, nz[0] - 200): nz[-1] + 900], sr

def whisperize(x, sr):
    n, hop, order = int(0.025 * sr), int(0.0125 * sr), 18
    win = np.hanning(n); out = np.zeros(len(x) + n); rng = np.random.default_rng(1)
    for i in range(0, len(x) - n, hop):
        f = x[i:i + n] * win; r = np.correlate(f, f, 'full')[n - 1:n + order]
        if r[0] < 1e-8: continue
        a = np.zeros(order + 1); a[0] = 1; e = r[0]
        for k in range(1, order + 1):
            acc = r[k] + np.dot(a[1:k], r[k - 1:0:-1]); kk = -acc / e
            prev = a.copy(); a[1:k] = prev[1:k] + kk * prev[k - 1:0:-1]; a[k] = kk; e *= (1 - kk * kk)
        g = np.sqrt(max(e, 1e-12) / n); ex = rng.normal(0, 1, n) * g; y = np.zeros(n)
        for t in range(n):
            s = ex[t]
            for k in range(1, min(order, t) + 1): s -= a[k] * y[t - k]
            y[t] = s
        out[i:i + n] += y * win
    out = out[:len(x)]; return out / (np.max(np.abs(out)) + 1e-9) * 0.8

def chain(x, sr, v):
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        with wave.open(src, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        c = []
        if abs(v.get('tono', 1.0) - 1) > 1e-3: c.append(f"rubberband=pitch={v['tono']}:formant=preserved")
        c.append(STYLES[v.get('estilo', 'creador')])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', ','.join(c), '-ar', str(OUT_SR), '-ac', '1', dst], check=True)
        with wave.open(dst) as f: return np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768

norm = lambda w: ''.join(ch for ch in unicodedata.normalize('NFD', w.lower()) if ch.isalnum() and unicodedata.category(ch) != 'Mn')
def time_words(y, text):
    # whisper's words on the finished audio, matched to the script's words; gaps filled by interpolation
    idx = (np.arange(int(len(y) * 16000 / OUT_SR)) * OUT_SR / 16000).astype(int); a16 = y[idx].astype(np.float32)
    segs, _ = whisper_model().transcribe(a16, language='es', word_timestamps=True, beam_size=5)
    ww = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    sw = text.split(); dur = len(y) / OUT_SR
    times = [None] * len(sw)
    sm = difflib.SequenceMatcher(a=[norm(w) for w in sw], b=[norm(w[0]) for w in ww], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (ww[blk.b + k][1], ww[blk.b + k][2])
    # unmatched words: spread between their matched neighbours by length
    i = 0
    while i < len(sw):
        if times[i] is None:
            j = i
            while j < len(sw) and times[j] is None: j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0; t1 = times[j][0] if j < len(sw) else dur
            if t1 <= t0: t1 = t0 + 0.08 * (j - i)
            lens = np.array([len(w) + 1 for w in sw[i:j]], float); ed = t0 + np.concatenate([[0], np.cumsum(lens) / lens.sum()]) * (t1 - t0)
            for k in range(i, j): times[k] = (ed[k - i], ed[k - i + 1])
            i = j
        else: i += 1
    return [[w, round(a, 3), round(b, 3)] for w, (a, b) in zip(sw, times)]

base = G.get('voz', {})
t = 0.0 if 'en' in G['lineas'][0] else G.get('inicio', 0.3)
track = [np.zeros(int(t * OUT_SR), np.float32)]; lines = []
for li, L in enumerate(G['lineas']):
    v = {**base, **L.get('voz', {})}
    if 'en' in L: gap = max(0.0, L['en'] - t); track.append(np.zeros(int(gap * OUT_SR), np.float32)); t += gap
    elif li: gap = L.get('pausa', 0.2); track.append(np.zeros(int(gap * OUT_SR), np.float32)); t += gap
    a, sr = synth(L['texto'], v)
    if v.get('estilo') == 'susurro': a = whisperize(a, sr)
    y = chain(a, sr, v)
    if v.get('recorte'): y = tighten(y, v['recorte'])
    if v.get('tempo') and abs(v['tempo'] - 1) > 1e-3: y = stretch(y, v['tempo'])
    nxt = G['lineas'][li + 1] if li + 1 < len(G['lineas']) else None
    if v.get('motor') in ('archivo', 'eleven') and nxt and 'en' in nxt: y = fit(y, max(0.3, nxt['en'] - t - 0.06))
    elif v.get('motor') in ('archivo', 'eleven') and not nxt and 'duracion' in G: y = fit(y, max(0.3, G['duracion'] - t - 0.05))  # the last line ends inside the film
    words = [[w, round(t + a0, 3), round(t + b0, 3)] for w, a0, b0 in time_words(y, L['texto'])]
    lines.append({'id': L.get('id', li), 'texto': L['texto'], 't0': round(t, 3), 't1': round(t + len(y) / OUT_SR, 3), 'words': words, 'quien': L.get('quien')})
    track.append(y); t += len(y) / OUT_SR
fin = G.get('duracion', t + G.get('final', 0.8)); track.append(np.zeros(max(0, int((fin - t) * OUT_SR)), np.float32)); t = max(t, fin)
x = np.concatenate(track); x = x / (np.max(np.abs(x)) + 1e-9) * 0.9
with wave.open(os.path.join(FILM, 'voz.wav'), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(OUT_SR); f.writeframes((x * 32767).astype(np.int16).tobytes())
json.dump({'dur': round(t, 3), 'lines': lines}, open(os.path.join(FILM, 'tiempos.json'), 'w'), ensure_ascii=False, indent=1)
for l in lines: print(f"{l['t0']:6.2f}-{l['t1']:6.2f}  {l['quien'] or ''} {l['texto']}")
print('total', round(t, 2))
