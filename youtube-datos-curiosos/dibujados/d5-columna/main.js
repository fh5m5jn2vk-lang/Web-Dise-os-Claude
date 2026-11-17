// «¡Ahora mismo eres más bajo que esta mañana!». Papel recortado en stop-motion sobre cartón: un muñeco de papel junto a
// una cinta métrica, una ventana de papel con el Sol, y una ficha con su columna (vértebras y discos azules). Durante el
// día los discos se aplastan y el muñeco encoge (−1 cm); de noche se tumba, sale la Luna y los discos se hinchan; por la
// mañana se levanta más alto (+1 cm) y por la tarde vuelve a encoger. Todo se mueve a 12 pasos por segundo, con temblor.
import { clamp, lerp, prog, E } from '../kit/util.js';
import { tiempos, capas, sonido } from '../kit/capas.js';
import { titere, defs, svgEl as el } from '../kit/titere.js';

const T = await tiempos(), DUR = T.G.dur;
const MOUTH = await (await fetch('boca.json')).json();
const C = capas(T, { keys: ['bajo', 'columna', 'aplastan', 'centimetro', 'noche', 'hinchar', 'alto'], top: 190, dur: DUR });
const A = sonido();
const svg = document.getElementById('scene'); defs(svg);
const cam = el('g', {}, svg);
const P = { filter: 'url(#paper)' };
// el cartón
el('rect', { x: -300, y: -300, width: 1680, height: 2520, fill: '#c89f74' }, cam);
for (let i = 0; i < 60; i++) el('path', { d: `M${(i * 137) % 1300 - 100} ${(i * 263) % 2100} l${30 + (i % 5) * 12} ${(i % 3) - 1}`, stroke: '#b98f64', 'stroke-width': 3, opacity: 0.6 }, cam);
// la ventana: cielo de día, de tarde o de noche, con el Sol o la Luna
const win = el('g', {}, cam);
el('rect', { x: 690, y: 420, width: 320, height: 300, fill: '#fffdf6', ...P }, win);
const cielo = el('rect', { x: 708, y: 438, width: 284, height: 264, fill: '#8fd3ff' }, win);
const astro = el('circle', { cx: 780, cy: 520, r: 44, fill: '#ffd43b', ...P }, win);
const luna = el('g', { opacity: 0 }, win); el('circle', { cx: 900, cy: 520, r: 44, fill: '#f4f1de', ...P }, luna); el('circle', { cx: 925, cy: 505, r: 40, fill: '#203a6b' }, luna);
el('path', { d: 'M850 438 L850 702 M708 570 L992 570', stroke: '#fffdf6', 'stroke-width': 14 }, win);
// la cinta métrica
const cinta = el('g', {}, cam);
el('rect', { x: 600, y: 520, width: 70, height: 1260, fill: '#ffd43b', ...P }, cinta);
for (let i = 0; i <= 63; i++) el('rect', { x: 600, y: 1760 - i * 20, width: i % 5 ? 22 : 40, height: 4, fill: '#1d1a2b' }, cinta);
// la marca de la cabeza en la cinta
const marca = el('g', {}, cam); el('path', { d: 'M560 0 L600 -18 L600 18 Z', fill: '#ff3b4e', ...P }, marca); el('rect', { x: 600, y: -3, width: 70, height: 6, fill: '#ff3b4e' }, marca);
const marca0 = el('rect', { x: 600, y: 0, width: 70, height: 4, fill: '#2e7bd6', opacity: 0 }, cam);
// la ficha de la columna
const ficha = el('g', { opacity: 0 }, cam);
el('rect', { x: 720, y: 830, width: 300, height: 700, fill: '#fffdf6', ...P, transform: 'rotate(3 870 1180)' }, ficha);
const verts = [], discos = [];
for (let i = 0; i < 6; i++) { verts.push(el('rect', { x: 790, y: 0, width: 160, height: 64, rx: 26, fill: '#f1e3c8', stroke: '#c9b48c', 'stroke-width': 6, ...P }, ficha)); if (i < 5) discos.push(el('ellipse', { cx: 870, cy: 0, rx: 70, ry: 14, fill: '#4aa3ff', ...P }, ficha)); }
const flechas = el('g', { opacity: 0 }, ficha);
[800, 940].forEach((x) => el('path', { d: `M${x} 860 L${x} 930 M${x - 18} 912 L${x} 932 L${x + 18} 912`, stroke: '#ff3b4e', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, flechas));
// la cama (de noche)
const cama = el('g', { opacity: 0 }, cam);
el('rect', { x: 90, y: 1500, width: 900, height: 120, fill: '#ff8fb1', ...P }, cama); el('rect', { x: 110, y: 1440, width: 200, height: 80, rx: 30, fill: '#fffdf6', ...P }, cama);
el('rect', { x: 90, y: 1620, width: 30, height: 120, fill: '#8a5a2b', ...P }, cama); el('rect', { x: 960, y: 1620, width: 30, height: 120, fill: '#8a5a2b', ...P }, cama);
// el muñeco de papel, con piernas
const persona = el('g', {}, cam);
const nino = titere(persona, { style: 'papel', skin: '#e9b38f', hair: '#3a2418', hairStyle: 'kid', shirt: '#2e9bff', shirt2: '#1d6fd0', line: '#1d1a2b' });
const piernas = el('g', P); nino.root.insertBefore(piernas, nino.root.firstChild);
el('rect', { x: -100, y: 340, width: 90, height: 290, rx: 20, fill: '#30304a' }, piernas); el('rect', { x: 10, y: 340, width: 90, height: 290, rx: 20, fill: '#30304a' }, piernas);
el('rect', { x: -116, y: 610, width: 112, height: 46, rx: 20, fill: '#ff3b4e' }, piernas); el('rect', { x: 4, y: 610, width: 112, height: 46, rx: 20, fill: '#ff3b4e' }, piernas);
const zz = el('g', { opacity: 0 }, cam);
[[700, 1300, 70], [770, 1210, 90], [860, 1100, 110]].forEach(([x, y, s]) => { const t = el('text', { x, y, 'font-family': 'Marker', 'font-size': s, fill: '#fffdf6' }, zz); t.textContent = 'z'; });
const noche = el('rect', { x: -300, y: -300, width: 1680, height: 2520, fill: '#0b1530', opacity: 0, 'pointer-events': 'none' }, cam);
cam.appendChild(win); cam.appendChild(zz);   // la ventana y las zetas se ven sobre la oscuridad

// tiempos
const at = (w, n) => T.at(w, n);
const tSpine = at('discos') - 0.2, tSquash = at('aplastan'), tPeso = at('peso'), tShrink = at('pierdes'), tCm = at('centímetro');
const tNight = at('noche') - 0.25, tLie = at('tumbado') - 0.1, tSwell = at('hinchar'), tMorn = at('mañana', 2) - 0.1, tUp = at('levantarás'), tAlto = at('alto'), tTarde = at('tarde') - 0.1, tBajo2 = at('bajo', 2);
C.item('<div class="tag yel">¿MÁS BAJO?</div>', 150, 520, -0.3, tSpine, 'stamp', -6);
C.item('<div class="tag">PESO</div>', 760, 750, tPeso - 0.05, tNight, 'pop', 5);
C.item('<div class="tag red">−1 CM</div>', 690, 1840 - 1300, tCm - 0.05, tNight, 'stamp', -5);
C.item('<div class="tag" style="background:#7dffc4">+1 CM</div>', 690, 540, tAlto - 0.05, tTarde, 'stamp', 5);
C.item('<div class="tag red">−1 CM</div>', 690, 560, tBajo2 - 0.05, DUR, 'stamp', -5);

const MV = (t) => MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const BASEY = 1745, HEAD = 270 + 660;   // pies en BASEY; altura del muñeco en unidades locales
function render(t) {
  // stop-motion: 12 pasos por segundo, cada uno un poco movido
  const q = Math.floor(t * 12), tq = q / 12, jx = (rnd(q) - 0.5) * 5, jy = (rnd(q + 9) - 0.5) * 5, jr = (rnd(q + 4) - 0.5) * 1.4;
  // altura: 1 por la mañana; encoge con el día, crece de noche
  let alto = 1;
  alto -= 0.045 * E.inOut(prog(tq, tShrink, tCm + 0.2));
  alto += 0.045 * E.inOut(prog(tq, tSwell - 0.3, tSwell + 0.4));
  alto -= 0.045 * E.inOut(prog(tq, tTarde, tBajo2 + 0.1));
  const sc = 1.25;
  // de pie o tumbado
  const lie = t >= tLie && t < tUp ? E.back(prog(tq, tLie, tLie + 0.4)) : t >= tUp ? 1 - E.out(prog(tq, tUp, tUp + 0.35)) : 0;
  const px = 380 + jx, footY = BASEY + jy;
  const sl = lerp(1, 0.78, lie); persona.setAttribute('transform', `translate(${lerp(px, 960, lie)} ${lerp(footY, 1460, lie)}) rotate(${lerp(jr, -90, lie)}) scale(${sc * sl}, ${sc * alto * sl}) translate(0 -660)`);
  nino.set({ x: 0, y: 0, s: 1, lean: 0, mouth: t < T.END ? MV(t) : 0, smile: 0.7, blink: (lie > 0.5 && t < tMorn) || ((tq * 0.5) % 1) < 0.05 ? 1 : 0, look: 0.6, brows: t >= tShrink && t < tNight ? -0.3 : 0.3, armF: [170, 210], armB: [-170, 210] });
  // la marca de la cabeza
  const headY = footY - HEAD * sc * alto;
  marca.setAttribute('transform', `translate(0 ${headY})`); marca.setAttribute('opacity', lie > 0.05 ? 0 : 1);
  marca0.setAttribute('y', BASEY - HEAD * sc); marca0.setAttribute('opacity', t > tShrink ? 0.9 : 0);
  // la ficha de la columna
  ficha.setAttribute('opacity', t >= tSpine ? 1 : 0);
  const fk = E.back(prog(tq, tSpine, tSpine + 0.3)); ficha.setAttribute('transform', `translate(${(1 - fk) * 500} 0)`);
  const squash = lerp(1, 0.4, E.inOut(prog(tq, tSquash, tSquash + 0.5))) + lerp(0, 0.6, E.inOut(prog(tq, tSwell - 0.3, tSwell + 0.4))) - lerp(0, 0.6, E.inOut(prog(tq, tTarde, tBajo2)));
  let y = 920; verts.forEach((v, i) => { v.setAttribute('y', y); y += 64; if (i < 5) { const h = 28 * squash; discos[i].setAttribute('cy', y + h / 2 + 2); discos[i].setAttribute('ry', h / 2); y += h + 4; } });
  flechas.setAttribute('opacity', t >= tPeso - 0.1 && t < tNight ? 1 : 0);
  // el cielo de la ventana
  const sunset = clamp(prog(tq, tShrink, tCm + 0.3) - prog(tq, tMorn, tMorn + 0.3) + prog(tq, tTarde, tTarde + 0.4));
  const night = t >= tNight && t < tMorn ? E.out(prog(tq, tNight, tNight + 0.3)) : 0;
  cielo.setAttribute('fill', night > 0.5 ? '#203a6b' : sunset > 0.5 ? '#ff9e6b' : '#8fd3ff');
  astro.setAttribute('opacity', night > 0.5 ? 0 : 1); astro.setAttribute('cy', 520 + sunset * 110); astro.setAttribute('cx', 780 + sunset * 120);
  luna.setAttribute('opacity', night > 0.5 ? 1 : 0);
  noche.setAttribute('opacity', night * 0.55);
  cama.setAttribute('opacity', lie > 0.05 ? 1 : 0);
  zz.setAttribute('opacity', t >= tSwell && t < tMorn ? 1 : 0); zz.setAttribute('transform', `translate(0 ${-((tq * 30) % 30)})`);
  C.update(t, night > 0.5);
}
await document.fonts.load('400 60px Marker', 'Aá0¡¿'); await document.fonts.ready;
A.forItems(C.IT);
A.fx(0, 'paper', 0.35); A.fx(0.05, 'thump', 0.2);
A.fx(tSpine, 'paper', 0.3); A.rattle(tSquash, 5, 0.09, 0.25); A.fx(tSquash + 0.05, 'thump', 0.25);
A.fx(tShrink, 'swish', 0.2); A.fx(tNight, 'lightswitch', 0.4); A.fx(tLie, 'paper', 0.3); A.fx(tSwell, 'pop', 0.22);
A.fx(tMorn, 'bell', 0.25); A.fx(tUp, 'paper', 0.3); A.fx(tTarde, 'swish', 0.2);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = render;
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
