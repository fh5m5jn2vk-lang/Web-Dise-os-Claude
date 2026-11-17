// «¡Los tiburones son más antiguos que los árboles!». Dibujos animados planos: arriba la orilla y el cielo, abajo el mar.
// El tiburón nada desde el primer fotograma; la orilla está pelada (450 millones de años) hasta que brota el primer árbol
// (390); cinco calaveras de las extinciones se tachan una a una, un meteorito cae sobre un dinosaurio y el tiburón sigue
// tan pancho; al final crece el bosque y al tiburón le cuelgan una medalla de veterano.
import { clamp, lerp, prog, E } from '../kit/util.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: ['tiburones', 'arboles', '450', '390', 'cinco', 'dinosaurios', 'veteranos'], top: 1520, dur: DUR });
const A = sonido();
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at = {}, p = null) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); return e; };
const svg = document.getElementById('scene');
const INK = '#1d1a2b', LW = 7;
const S = (fill, extra = {}) => ({ fill, stroke: INK, 'stroke-width': LW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
svg.innerHTML = `<defs>
  <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#d9f2ff"/></linearGradient>
  <linearGradient id="mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f9be0"/><stop offset="1" stop-color="#103a7a"/></linearGradient>
  <radialGradient id="fuego"><stop offset="0" stop-color="#fff3a6"/><stop offset=".5" stop-color="#ff8a1f"/><stop offset="1" stop-color="#ff3b4e" stop-opacity="0"/></radialGradient></defs>`;
const cam = el('g', {}, svg);
// cielo, sol, nubes
el('rect', { x: -200, y: -200, width: 1480, height: 1130, fill: 'url(#cielo)' }, cam);
el('circle', S('#ffd43b', { cx: 900, cy: 260, r: 70 }), cam);
const nubes = [[180, 330, 1], [640, 210, 0.8]].map(([x, y, s]) => { const g = el('g', {}, cam); [[0, 0, 50], [55, -20, 60], [115, 0, 48]].forEach(([dx, dy, r]) => el('circle', { cx: dx, cy: dy, r, fill: '#fff' }, g)); g.dataset.x = x; g.dataset.y = y; g.dataset.s = s; return g; });
// la orilla: roca pelada, que luego se cubre de hierba
const orilla = el('path', S('#b98a5a', { d: 'M-200 840 Q120 790 360 820 Q620 850 880 800 Q1080 770 1280 810 L1280 960 L-200 960 Z' }), cam);
const hierba = el('path', S('#6cc551', { d: 'M-200 836 Q120 786 360 816 Q620 846 880 796 Q1080 766 1280 806 L1280 850 Q1080 812 880 842 Q620 892 360 862 Q120 832 -200 880 Z', opacity: 0 }), cam);
// los árboles (el primero en el centro, luego el bosque)
function arbol(x, y, s, cara = false) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(0)` }, cam);
  el('path', S('#8a5a2b', { d: 'M-26 0 L-18 -200 L18 -200 L26 0 Z' }), g);
  [[-70, -230, 80], [70, -230, 80], [0, -310, 100]].forEach(([cx, cy, r]) => el('circle', S('#4caf50', { cx, cy, r }), g));
  el('circle', { cx: 0, cy: -270, r: 120, fill: '#4caf50' }, g);
  if (cara) { [-34, 34].forEach((ex) => { el('circle', S('#fff', { cx: ex, cy: -270, r: 18, 'stroke-width': 5 }), g); el('circle', { cx: ex + 4, cy: -268, r: 8, fill: INK }, g); }); el('path', S('none', { d: 'M-24 -222 Q0 -206 24 -222', 'stroke-width': 6 }), g); }
  return { g, x, y, s };
}
const bosque = [[150, 860, 0.55], [330, 850, 0.7], [760, 840, 0.62], [960, 830, 0.5]].map(([x, y, s]) => arbol(x, y, s));
const primero = arbol(560, 850, 0.85, true);
// el dinosaurio, en la orilla
const dino = el('g', { opacity: 0 }, cam);
el('path', S('#9b6ad6'.replace('9b6ad6', '7fbf4a'), { d: 'M0 0 Q-10 -90 60 -110 L80 -250 Q90 -300 130 -290 Q160 -280 150 -250 L120 -100 Q190 -80 230 -40 Q300 -10 360 0 Q250 10 220 0 L200 50 L170 50 L160 10 L80 10 L70 50 L40 50 L30 5 Q10 5 0 0 Z' }), dino);
el('circle', { cx: 135, cy: -268, r: 6, fill: INK }, dino);
const dinoX = el('g', { opacity: 0 }, dino); ['M124 -278 l20 20', 'M144 -278 l-20 20'].forEach((d) => el('path', S('none', { d, 'stroke-width': 5 }), dinoX));
// el meteorito
const meteo = el('g', { opacity: 0 }, cam);
el('ellipse', { cx: 0, cy: 0, rx: 190, ry: 70, fill: 'url(#fuego)', transform: 'rotate(-35) translate(120 0)' }, meteo);
el('circle', S('#7a5a3a', { cx: 0, cy: 0, r: 46 }), meteo);
const boom = el('circle', { cx: 640, cy: 800, r: 10, fill: '#fff3a6', opacity: 0 }, cam);
// el mar
el('rect', { x: -200, y: 930, width: 1480, height: 1200, fill: 'url(#mar)' }, cam);
const ola = el('path', { d: '', fill: '#2f9be0', stroke: INK, 'stroke-width': LW }, cam);
const burbujas = Array.from({ length: 10 }, (_, i) => el('circle', { r: 6 + (i % 3) * 4, fill: 'none', stroke: '#cfeeff', 'stroke-width': 4, opacity: 0.8 }, cam));
// el tiburón
const tib = el('g', {}, cam), cuerpo = el('g', {}, tib);
const cola = el('path', S('#5b7c99', { d: 'M30 110 L-70 20 L-40 110 L-70 200 Z' }), cuerpo);
el('path', S('#5b7c99', { d: 'M250 46 L300 -46 L345 50 Z' }), cuerpo);
el('path', S('#5b7c99', { d: 'M0 110 Q120 28 300 38 Q430 44 530 112 Q430 178 300 184 Q130 190 0 110 Z' }), cuerpo);
el('path', { d: 'M70 125 Q260 196 490 136 Q300 178 70 125 Z', fill: '#eef3f6' }, cuerpo);
el('path', S('#4a6a86', { d: 'M290 160 L240 238 L360 172 Z' }), cuerpo);
['M372 92 q-10 26 0 52', 'M392 90 q-10 26 0 52', 'M412 92 q-10 24 0 48'].forEach((d) => el('path', S('none', { d, 'stroke-width': 5 }), cuerpo));
el('path', S('#fff', { d: 'M440 138 Q478 152 512 130 Q478 168 440 138 Z', 'stroke-width': 5 }), cuerpo);
const ojo = el('ellipse', S('#fff', { cx: 445, cy: 96, rx: 17, ry: 17, 'stroke-width': 5 }), cuerpo), pupila = el('circle', { cx: 450, cy: 98, r: 8, fill: INK }, cuerpo);
const gafas = el('g', { opacity: 0 }, cuerpo); el('rect', S('#1d1a2b', { x: 418, y: 82, width: 60, height: 32, rx: 10 }), gafas); el('path', S('none', { d: 'M418 92 L360 84' }), gafas);
const medalla = el('g', { opacity: 0 }, cuerpo); el('path', S('#ff3b4e', { d: 'M330 150 L310 230 L350 222 L370 150 Z' }), medalla); el('circle', S('#ffd43b', { cx: 330, cy: 250, r: 34 }), medalla);
const mt = el('text', { x: 330, y: 262, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 30, fill: INK }, medalla); mt.textContent = '★';

// pegatinas
const tL2 = T.line(1).t0, tL3 = T.line(2).t0, tL4 = T.line(3).t0, tL5 = T.line(4).t0;
C.hook('TIBURONES <em>&gt;</em><br>ÁRBOLES', -0.3, tL2 - 0.05);
const tArb = T.at('arboles', 2), t450 = T.at('450'), t390 = T.at('390');
C.item('<div class="sticker">HACE 450<br>MILLONES DE AÑOS</div>', 290, 160, t450 - 0.05, tL3 - 0.05, 'stamp', -4);
C.item('<div class="sticker" style="background:#7dffc4">HACE 390<br>MILLONES DE AÑOS</div>', 290, 160, t390 - 0.05, tL4 - 0.1, 'stamp', 4);
C.item('<div class="sticker" style="background:#fff">¿ÁRBOLES?<br>TODAVÍA NO</div>', 620, 520, T.at('nadaban') + 0.1, tL3 - 0.2, 'pop', 6);
const calaveras = Array.from({ length: 5 }, (_, i) => C.item(`<div class="sticker" style="font-size:64px;padding:16px 22px;background:#fff">💀<br><span style="font-size:40px;color:#2e9b4a">✓</span></div>`, 70 + i * 190, 210, T.at('sobrevivido') + 0.15 + i * 0.28, tL5 - 0.15, 'stamp', (i % 2 ? 5 : -5)));
C.item('<div class="stamp" style="background:#fff">SOBREVIVIÓ</div>', 260, 460, T.at('extinciones') + 0.05, T.at('dinosaurios') - 0.2, 'slam', -6);
C.item('<div class="sticker" style="background:#ff3b4e;color:#fff">VETERANO</div>', 300, 1270, T.at('veteranos') - 0.1, DUR, 'stamp', -5);

function render(t) {
  // cámara: un pequeño golpe de zoom en cada frase, como en los dibujos animados
  const beats = [0, tL2, tL3, tL4, tL5]; let z = 1;
  beats.forEach((b) => { const a = t - b; if (a >= 0 && a < 0.5) z = Math.max(z, 1 + 0.05 * Math.exp(-a * 8)); });
  const shake = t > T.at('dinosaurios') + 0.05 && t < T.at('dinosaurios') + 0.6 ? Math.sin(t * 90) * 14 * Math.exp(-(t - T.at('dinosaurios')) * 6) : 0;
  cam.setAttribute('transform', `translate(${540 + shake} 960) scale(${z}) translate(-540 -960)`);
  nubes.forEach((g, i) => g.setAttribute('transform', `translate(${(+g.dataset.x + t * (12 + i * 8)) % 1300 - 100} ${g.dataset.y}) scale(${g.dataset.s})`));
  // olas y burbujas
  let d = 'M-200 940'; for (let x = -200; x <= 1280; x += 60) d += ` Q${x + 30} ${930 + Math.sin(t * 3 + x * 0.02) * 14} ${x + 60} ${940 + Math.sin(t * 3 + (x + 60) * 0.02) * 6}`; ola.setAttribute('d', d + ' L1280 990 L-200 990 Z');
  // el tiburón nada en ocho, con la cola que bate
  const sx = 280 + Math.sin(t * 0.7) * 120, sy = 1180 + Math.sin(t * 1.4) * 40, ang = Math.cos(t * 0.7) * 6;
  tib.setAttribute('transform', `translate(${sx} ${sy}) rotate(${ang})`);
  cola.setAttribute('transform', `rotate(${Math.sin(t * 9) * 12} 30 110)`);
  const look = t > tL3 && t < tL4 ? -1 : 0;   // mira hacia arriba cuando sale el árbol
  pupila.setAttribute('cy', 98 + look * 6); pupila.setAttribute('cx', 450 + look * -2);
  ojo.setAttribute('ry', (t * 0.45) % 1 < 0.04 ? 3 : 17);
  burbujas.forEach((b, i) => { const ph = (t * 0.5 + i * 0.13) % 1; b.setAttribute('cx', sx + 520 + Math.sin(i * 7 + t * 3) * 14); b.setAttribute('cy', sy + 80 - ph * 260); b.setAttribute('opacity', (1 - ph) * 0.8); });
  gafas.setAttribute('opacity', t > T.at('dinosaurios') + 0.3 ? 1 : 0);
  medalla.setAttribute('opacity', t > T.at('veteranos') - 0.1 ? 1 : 0);
  // la orilla: pelada hasta que sale el primer árbol
  hierba.setAttribute('opacity', clamp((t - t390 + 0.2) * 4) * (t >= T.at('aparecieron') - 0.3 ? 1 : 0));
  const grow = (a, x, y, s, k) => a.g.setAttribute('transform', `translate(${x} ${y}) scale(${s * k})`);
  const k1 = t >= T.at('aparecieron') - 0.3 ? E.back(prog(t, T.at('aparecieron') - 0.3, T.at('aparecieron') + 0.15)) : 0;
  grow(primero, primero.x, primero.y, primero.s, k1);
  bosque.forEach((a, i) => { const t0 = T.at('bosque') - 0.35 + i * 0.12; grow(a, a.x, a.y, a.s, t >= t0 ? E.back(prog(t, t0, t0 + 0.35)) : 0); });
  // el dinosaurio y el meteorito
  const tD = T.at('dinosaurios');
  dino.setAttribute('opacity', t > T.at('también') - 0.2 && t < tL5 + 0.2 ? 1 : 0);
  dino.setAttribute('transform', `translate(${760 + (t > tD + 0.25 ? 0 : 0)} ${800}) scale(${t > tD + 0.25 ? 0.62 * 1 : 0.62}, ${t > tD + 0.25 ? 0.62 * lerp(1, 0.35, E.out(prog(t, tD + 0.25, tD + 0.4))) : 0.62})`);
  dinoX.setAttribute('opacity', t > tD + 0.3 ? 1 : 0);
  const mp = prog(t, tD - 0.45, tD + 0.25); meteo.setAttribute('opacity', mp > 0 && mp < 1 ? 1 : 0);
  meteo.setAttribute('transform', `translate(${lerp(1250, 860, E.in(mp))} ${lerp(-150, 780, E.in(mp))})`);
  const bp = prog(t, tD + 0.25, tD + 0.8); boom.setAttribute('cx', 860); boom.setAttribute('r', 20 + bp * 420); boom.setAttribute('opacity', bp > 0 && bp < 1 ? (1 - bp) * 0.9 : 0);
  document.getElementById('flash').style.opacity = t > tD + 0.25 ? 0.7 * Math.exp(-(t - tD - 0.25) * 9) : 0;
  C.update(t);
}
A.fx(0, 'swish', 0.25); A.fx(0.05, 'impact', 0.22);
A.forItems(C.IT);
A.fx(T.at('aparecieron') - 0.3, 'pop', 0.35); A.fx(T.at('aparecieron') - 0.25, 'bell', 0.12);
A.fx(T.at('dinosaurios') - 0.5, 'riser', 0.2); A.fx(T.at('dinosaurios') + 0.25, 'impact', 0.45); A.fx(T.at('dinosaurios') + 0.25, 'boom', 0.3);
for (let i = 0; i < 4; i++) A.fx(T.at('bosque') - 0.35 + i * 0.12, 'pop', 0.22, -0.4 + i * 0.25);
A.fx(T.at('veteranos'), 'correct', 0.3);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, ambiente: [{ tipo: 'viento', desde: 0, hasta: DUR, g: 0.5 }] };
window.__dur = DUR; window.__render = render;
await document.fonts.load('400 60px Bungee', 'ÁÍ0'); await document.fonts.ready;
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
