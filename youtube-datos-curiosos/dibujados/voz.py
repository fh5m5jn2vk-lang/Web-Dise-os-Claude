# Voz en off de un vídeo dibujado: ElevenLabs (modelo expresivo v3, una etiqueta de emoción por frase), tiempos de cada
# palabra a partir de la alineación de ElevenLabs, y silencios recortados como cortes de montaje (sin tiempo muerto).
#   python3 voz.py <carpeta del vídeo>  ->  voz.wav y tiempos.json
# guion.json: { "voz": {"voice_id", "modelo", "estabilidad", "tempo"}, "lineas": [ {"texto", "etiqueta"} ] }
#   En el texto, {lo que se ve|lo que se dice}: p. ej. {2560|dos mil quinientos sesenta}. La etiqueta solo va a la voz.
import sys, os, json, re, wave, hashlib, subprocess, tempfile, requests, base64
import numpy as np

FILM = sys.argv[1]; SR = 44100
G = json.load(open(os.path.join(FILM, 'guion.json')))
V = {'voice_id': 'GXq4Jv31YgA7lk5pj1Cs', 'modelo': 'eleven_v3', 'estabilidad': 0.5, 'tempo': 1.06, 'inicio': 0.05, 'final': 0.55, **G.get('voz', {})}

# 1. el texto que se dice y, por cada palabra en pantalla, su tramo en ese texto
spoken = ''; toks = []
for li, L in enumerate(G['lineas']):
    if spoken: spoken += ' '
    if L.get('etiqueta'): spoken += L['etiqueta'] + ' '
    subs = []
    txt = re.sub(r'\{([^|}]*)\|([^}]*)\}', lambda m: (subs.append((m.group(1), m.group(2))), f'\x01{len(subs) - 1}\x01')[1], L['texto'])
    first = True
    for chunk in txt.split():
        disp = re.sub(r'\x01(\d+)\x01', lambda m: subs[int(m.group(1))][0], chunk)
        say = re.sub(r'\x01(\d+)\x01', lambda m: subs[int(m.group(1))][1], chunk)
        if not first: spoken += ' '
        toks.append({'w': disp, 'li': li, 'a': len(spoken), 'b': len(spoken) + len(say)}); spoken += say; first = False

# 2. síntesis (en caché: repetir no gasta créditos)
body = {'text': spoken, 'model_id': V['modelo'], 'voice_settings': {'stability': V['estabilidad'], 'similarity_boost': 0.8, 'use_speaker_boost': True}}
key = hashlib.sha1(json.dumps([V['voice_id'], body], sort_keys=True).encode()).hexdigest()[:12]
cache = os.path.join(FILM, f'.tts-{key}.json')
if not os.path.exists(cache):
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{V['voice_id']}/with-timestamps?output_format=mp3_44100_128",
                      json=body, headers={'xi-api-key': os.environ.get('ELEVENLABS_API_KEY', 'proxy')}, timeout=180)
    r.raise_for_status(); open(cache, 'w').write(r.text)
res = json.load(open(cache))
mp3 = base64.b64decode(res['audio_base64'])
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], input=mp3, capture_output=True, check=True).stdout
y = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
al = res['alignment']; st, en = al['character_start_times_seconds'], al['character_end_times_seconds']
if ''.join(al['characters']) != spoken: print('aviso: la alineación no coincide con el texto')

# 3. tiempos originales de cada palabra
words = []
for t in toks:
    a, b = t['a'], t['b'] - 1
    while a < b and spoken[a] in ' ¡¿"(': a += 1
    while b > a and spoken[b] in ' .,:;!?…")': b -= 1
    words.append({**t, 't0': st[a], 't1': en[b]})

# 4. cortes de montaje: los huecos largos se quedan en 0,1 s dentro de una frase y 0,16 s entre frases
keep = []; s0 = max(0.0, words[0]['t0'] - 0.03)
for w, nx in zip(words, words[1:]):
    gap = nx['t0'] - w['t1']; mx = 0.16 if nx['li'] != w['li'] else 0.1
    if gap > mx + 0.04:
        keep.append((s0, w['t1'] + mx * 0.6)); s0 = nx['t0'] - mx * 0.4
keep.append((s0, words[-1]['t1'] + 0.14))
def remap(t):
    acc = 0.0
    for a, b in keep:
        if t < a: return acc
        if t <= b: return acc + (t - a)
        acc += b - a
    return acc
fd = int(0.008 * SR); parts = []
for a, b in keep:
    seg = y[int(a * SR):int(b * SR)].copy()
    if len(seg) > 2 * fd: seg[:fd] *= np.linspace(0, 1, fd); seg[-fd:] *= np.linspace(1, 0, fd)
    parts.append(seg)
z = np.concatenate(parts)

# 5. un pelín más rápido, sin cambiar el tono
k = V['tempo']
if abs(k - 1) > 1e-3:
    with tempfile.TemporaryDirectory() as d:
        src, dst = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        with wave.open(src, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(z, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', f'rubberband=tempo={k:.4f}', dst], check=True)
        with wave.open(dst) as f: z = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(np.float32) / 32768
ini = V['inicio']
T = lambda t: round(ini + remap(t) / k, 3)
dur = round(ini + len(z) / SR + V['final'], 3)
out = np.concatenate([np.zeros(int(ini * SR)), z, np.zeros(int(V['final'] * SR))])
out = out / (np.max(np.abs(out)) + 1e-9) * 0.9
with wave.open(os.path.join(FILM, 'voz.wav'), 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((out * 32767).astype(np.int16).tobytes())
lines = []
for li, L in enumerate(G['lineas']):
    ws = [[w['w'], T(w['t0']), T(w['t1'])] for w in words if w['li'] == li]
    lines.append({'id': f'l{li + 1}', 'texto': re.sub(r'\{([^|}]*)\|[^}]*\}', r'\1', L['texto']), 't0': ws[0][1], 't1': ws[-1][2], 'words': ws})
json.dump({'dur': dur, 'lines': lines}, open(os.path.join(FILM, 'tiempos.json'), 'w'), ensure_ascii=False, indent=1)
for l in lines: print(f"{l['t0']:6.2f}-{l['t1']:6.2f}  {l['texto']}")
print('total', dur)
