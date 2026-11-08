# The voice-over: one wav per line of the script with a free Spanish voice (Piper), then a timing file for the film.
#   python3 voz.py <voices dir>  ->  linea-*.wav, voz.wav (the whole track) and ../js/guion.json
import sys, json, wave, numpy as np
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
GAP = [0.0, 0.25, 0.3, 0.25, 0.35, 0.35, 0.3, 0.3]     # breath before each line
voice = PiperVoice.load(f"{VOICES}/es_ES-davefx-medium.onnx")
cfg = SynthesisConfig(length_scale=0.84, noise_scale=0.75, noise_w_scale=0.9)
SR = voice.config.sample_rate
track, lines, t = [], [], 0.15
track.append(np.zeros(int(0.15 * SR), np.int16))
for i, (text, gap) in enumerate(zip(GUION, GAP)):
    chunks = [c.audio_int16_array for c in voice.synthesize(text, syn_config=cfg)]
    a = np.concatenate(chunks)
    # trim the silence at both ends
    nz = np.where(np.abs(a) > 400)[0]; a = a[max(0, nz[0] - 200): nz[-1] + 1200]
    if gap: track.append(np.zeros(int(gap * SR), np.int16)); t += gap
    dur = len(a) / SR
    # word times, spread by length (spoken text is close enough to even per letter)
    words = text.split()
    # pauses in the audio: runs of 90 ms or more under a low level
    hop = int(0.01 * SR); lvl = np.array([np.sqrt(np.mean((a[i:i + hop] / 32768.0) ** 2)) for i in range(0, len(a) - hop, hop)])
    quiet = lvl < 0.07 * lvl.max(); gaps = []; qi = 0
    while qi < len(quiet):
        if quiet[qi]:
            j = qi
            while j < len(quiet) and quiet[j]: j += 1
            if j - qi >= 6 and qi > 5 and j < len(quiet) - 5: gaps.append(((qi + j) / 2 * hop / SR, qi * hop / SR, j * hop / SR))
            qi = j
        else: qi += 1
    # phrases end at punctuation; match the longest pauses to the phrase breaks, in order
    breaks = [k for k, x in enumerate(words[:-1]) if x[-1] in ',.?!;:']
    # each break takes the pause nearest to where it would fall if every letter took the same time
    cw = np.cumsum([len(x) + 2 for x in words]); chosen = []
    for k in breaks:
        exp = cw[k] / cw[-1] * dur
        cand = [g for g in gaps if g not in chosen and (not chosen or g[0] > chosen[-1][0]) and abs(g[0] - exp) < 0.45]
        if cand: chosen.append(min(cand, key=lambda g: abs(g[0] - exp)))
    gaps = chosen
    bounds = [(0.0, None)]
    if len(gaps) == len(breaks): bounds += [(g[2], k) for g, k in zip(gaps, breaks)]
    times = [None] * len(words)
    starts = [0] + [k + 1 for _, k in bounds[1:]]; ends = [k + 1 for _, k in bounds[1:]] + [len(words)]
    tstart = [b[0] for b in bounds]; tend = [g[1] for g in gaps] + [dur] if len(gaps) == len(breaks) else [dur]
    for s0, e0, ta, tb in zip(starts, ends, tstart, tend):
        ww = np.array([len(x) + 2 for x in words[s0:e0]], float); ed = ta + np.concatenate([[0], np.cumsum(ww) / ww.sum()]) * (tb - ta)
        for k in range(s0, e0): times[k] = (ed[k - s0], ed[k - s0 + 1])
    lines.append({"text": text, "t0": round(t, 3), "t1": round(t + dur, 3), "words": [[x, round(t + times[k][0], 3), round(t + times[k][1], 3)] for k, x in enumerate(words)]})
    print(len(breaks), 'breaks', len(gaps), 'pauses')
    track.append(a); t += dur
    with wave.open(f"linea-{i + 1}.wav", "wb") as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(a.tobytes())
track.append(np.zeros(int(1.2 * SR), np.int16)); t += 1.2
with wave.open("voz.wav", "wb") as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(np.concatenate(track).tobytes())
json.dump({"dur": round(t, 3), "lines": lines}, open("../js/guion.json", "w"), ensure_ascii=False, indent=1)
for l in lines: print(f"{l['t0']:6.2f}-{l['t1']:6.2f}  {l['text']}")
print("total", round(t, 2))
