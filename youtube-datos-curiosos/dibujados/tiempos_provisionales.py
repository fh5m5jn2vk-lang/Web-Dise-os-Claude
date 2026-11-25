# Tiempos provisionales de cada palabra, estimados por su longitud, para montar y revisar la animación antes de tener
# la voz. Cuando se genera la voz de verdad (voz.py), su tiempos.json sustituye a este y la animación se vuelve a
# sincronizar sola al grabar, porque cada gesto está atado a una palabra, no a un segundo.
#   python3 tiempos_provisionales.py <vídeo>   ->  <vídeo>/tiempos.json (con "provisional": true)
import sys, os, json, re
F = sys.argv[1]
G = json.load(open(os.path.join(F, 'guion.json')))
CPS = 16.5                     # caracteres hablados por segundo (lo que salía con VelionF, ya recortada y acelerada)
t = 0.05; lines = []
for li, L in enumerate(G['lineas']):
    subs = []
    txt = re.sub(r'\{([^|}]*)\|([^}]*)\}', lambda m: (subs.append((m.group(1), m.group(2))), f'\x01{len(subs) - 1}\x01')[1], L['texto'])
    words = []
    for chunk in txt.split():
        disp = re.sub(r'\x01(\d+)\x01', lambda m: subs[int(m.group(1))][0], chunk)
        say = re.sub(r'\x01(\d+)\x01', lambda m: subs[int(m.group(1))][1], chunk)
        d = (len(say) + 1) / CPS
        words.append([disp, round(t, 3), round(t + d * 0.92, 3)]); t += d
        if re.search(r'[,:;]$', disp): t += 0.1
        if disp.endswith('…'): t += 0.22
    lines.append({'id': f'l{li + 1}', 'texto': re.sub(r'\{([^|}]*)\|[^}]*\}', r'\1', L['texto']), 't0': words[0][1], 't1': words[-1][2], 'words': words})
    t += 0.15
dur = round(t + 0.5, 3)
json.dump({'dur': dur, 'provisional': True, 'lines': lines}, open(os.path.join(F, 'tiempos.json'), 'w'), ensure_ascii=False, indent=1)
print(F, 'provisional', dur, 's')
