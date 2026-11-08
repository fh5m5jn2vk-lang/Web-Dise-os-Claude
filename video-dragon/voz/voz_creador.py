# The voice-over in a creator's style: quick and energetic, short punchy pauses, a slower beat on the reveals, a brighter
# pitch and a "creator mic" sound (tight low end, presence, compression). A free Spanish voice (Piper davefx), not a copy
# of anyone's voice. Each phrase is synthesised on its own, so the word times are exact enough for captions and lips.
#   python3 voz_creador.py <voices dir>  ->  voz.wav, ../js/guion.json   (then python3 boca.py)
import sys, json, wave, subprocess, re, numpy as np
from piper import PiperVoice, SynthesisConfig
VOICES = sys.argv[1]
GUION = [
    "Vale, tengo que enseñaros esto, porque me tiene obsesionado.",
    "Es un dragón impreso en 3D... y mirad cómo se mueve.",
    "Cada pieza va articulada. Lo mueves, y parece que está vivo.",
    "Y mide casi noventa centímetros.",
    "Pero lo mejor es esto. Apagas la luz... y brilla.",
    "Hay cuatro colores, y no sabía cuál pillar.",
    "Para regalar en Navidad, es que no falla.",
    "Os lo dejo en el link de mi perfil. ¿Cuál elegiríais vosotros?",
]
SLOW = {'y brilla.': 0.95, 'porque me tiene obsesionado.': 0.82, 'es que no falla.': 0.84}   # the reveals land a beat slower
voice = PiperVoice.load(f"{VOICES}/es_ES-davefx-medium.onnx"); SR = voice.config.sample_rate
def say(text, ls):
    a = np.concatenate([c.audio_int16_array for c in voice.synthesize(text, syn_config=SynthesisConfig(length_scale=ls, noise_scale=0.85, noise_w_scale=1.0))])
    nz = np.where(np.abs(a) > 500)[0]; return a[max(0, nz[0] - 150): nz[-1] + 700]
track, lines, t = [np.zeros(int(0.12 * SR), np.int16)], [], 0.12
for li, text in enumerate(GUION):
    if li: track.append(np.zeros(int(0.17 * SR), np.int16)); t += 0.17
    phrases = [p.strip() for p in re.findall(r'[^,.?…]+(?:\.\.\.|[,.?…])?', text) if p.strip()]
    words, t0 = [], t
    for k, ph in enumerate(phrases):
        a = say(ph, SLOW.get(ph.lower().lstrip('¿'), 0.76)); dur = len(a) / SR
        ws = ph.split(); wl = np.array([len(x) + 2 for x in ws], float); ed = np.concatenate([[0], np.cumsum(wl) / wl.sum()]) * dur
        words += [[x, round(t + ed[j], 3), round(t + ed[j + 1], 3)] for j, x in enumerate(ws)]
        track.append(a); t += dur
        if k < len(phrases) - 1:
            g = 0.3 if ph.endswith('...') else (0.06 if ph.endswith(',') else 0.12)
            track.append(np.zeros(int(g * SR), np.int16)); t += g
    lines.append({"text": text, "t0": round(t0, 3), "t1": round(t, 3), "words": words})
track.append(np.zeros(int(1.0 * SR), np.int16)); t += 1.0
with wave.open('voz-cruda.wav', 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(np.concatenate(track).tobytes())
# brighter and younger (pitch up, same timing), then the creator-mic chain
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'voz-cruda.wav', '-af',
  'rubberband=pitch=1.07:formant=preserved,highpass=f=95,equalizer=f=300:t=q:w=1.2:g=-2.5,equalizer=f=3200:t=q:w=1.0:g=4,equalizer=f=9000:t=q:w=1.0:g=2,acompressor=threshold=-20dB:ratio=4:attack=4:release=60:makeup=4,alimiter=limit=0.95',
  '-ar', str(SR), 'voz.wav'], check=True)
json.dump({"dur": round(t, 3), "lines": lines}, open("../js/guion.json", "w"), ensure_ascii=False, indent=1)
for l in lines: print(f"{l['t0']:6.2f}-{l['t1']:6.2f}  {l['text']}")
print("total", round(t, 2))
