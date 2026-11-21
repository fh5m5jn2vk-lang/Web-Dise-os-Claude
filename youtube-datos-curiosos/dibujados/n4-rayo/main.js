// «¡Un rayo está cinco veces más caliente que el Sol!». Cómic con viñetas: una página de cuatro viñetas con tramas de
// puntos, tinta negra gruesa y onomatopeyas; la cámara entra en cada viñeta como en un cómic animado. 1: el rayo cae
// («¡KRA-KOOM!») con el cartel del dato. 2: el Sol sudando y su termómetro (5.500 °C). 3: el rayo revienta su termómetro
// (28.000 °C). 4: el aire estalla en ondas y llega el trueno («¡BUUUM!»); al final la página entera.
import { clamp, lerp, prog, E } from '../kit/util.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: ['rayo', 'cinco', 'sol', '5.500', '28.000', 'explota', 'trueno'], top: 1500, dur: DUR });
const A = sonido();
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at = {}, p = null, txt = null) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); if (txt !== null) e.textContent = txt; return e; };
const svg = document.getElementById('scene');
const K = '#111', LW = 9, YE = '#fff200', CY = '#29abe2', MA = '#ff3d8b', RED = '#ff3b2f';
svg.innerHTML = `<defs>
  <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="3.4" fill="#000" opacity=".22"/></pattern>
  <pattern id="dotsY" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#ffd400"/><circle cx="9" cy="9" r="5" fill="#ff9d00"/></pattern>
  <pattern id="dotsC" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#1b2a52"/><circle cx="9" cy="9" r="4" fill="#2f4c8f"/></pattern>
  <pattern id="dotsR" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="#ff7a1a"/><circle cx="9" cy="9" r="5" fill="#ff3b2f"/></pattern>
  <filter id="paperg"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 -.06 .06"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>`;
const cam = el('g', {}, svg);
el('rect', { x: -1200, y: -1200, width: 3480, height: 6400, fill: '#f4ecd8' }, cam);
// las viñetas: [x, y, w, h]
const P = [[40, 110, 1000, 640], [40, 780, 485, 560], [555, 780, 485, 560], [40, 1370, 1000, 470]];
// en vertical: cada viñeta ocupa todo el ancho, una debajo de otra; el dibujo de cada una se escala a su viñeta
const NP = [[40, 60, 1000, 1000], [40, 1100, 1000, 860], [40, 2000, 1000, 860], [40, 2900, 1000, 900]];
const clip = P.map((p, i) => {
  const n = NP[i], c = el('clipPath', { id: 'v' + i }, svg.querySelector('defs')); el('rect', { x: n[0], y: n[1], width: n[2], height: n[3] }, c);
  const k = Math.min(n[2] / p[2], n[3] / p[3]) * (i === 0 ? 1 : 0.98), tx = n[0] + (n[2] - p[2] * k) / 2 - p[0] * k, ty = n[1] + (n[3] - p[3] * k) / 2 - p[1] * k;
  const outer = el('g', { 'clip-path': `url(#v${i})` }, cam);
  el('rect', { x: n[0], y: n[1], width: n[2], height: n[3], fill: ['#1b2a52', '#ffd400', '#ff7a1a', '#cfe9ff'][i] }, outer);
  return el('g', { transform: `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(4)})` }, outer);
});
const marco = (i) => el('rect', { x: NP[i][0], y: NP[i][1], width: NP[i][2], height: NP[i][3], fill: 'none', stroke: K, 'stroke-width': 12 }, cam);
const S = (fill, extra = {}) => ({ fill, stroke: K, 'stroke-width': LW, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
// onomatopeya: texto grueso con contorno negro y sombra
function ono(parent, txt, x, y, size, fill, rot = -8) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, parent);
  el('text', { x: 8, y: 10, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': size, fill: K }, g, txt);
  el('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': size, fill, stroke: K, 'stroke-width': size * 0.07, 'paint-order': 'stroke' }, g, txt);
  return g;
}
const estallido = (parent, cx, cy, r, fill) => { let d = ''; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * 0.7 : r; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(0) + ' ' + (cy + Math.sin(a) * rr * 0.8).toFixed(0); } return el('path', S(fill, { d: d + 'Z' }), parent); };
function cartel(parent, txt, x, y, w, h, rot = -2) {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot})` }, parent);
  el('rect', S(YE, { x: 0, y: 0, width: w, height: h }), g);
  txt.split('\n').forEach((l, i) => el('text', { x: w / 2, y: 62 + i * 62, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 50, fill: K }, g, l));
  return g;
}
// 1: la tormenta y el rayo
const v1 = clip[0];
el('rect', { x: -600, y: -600, width: 2300, height: 2000, fill: 'url(#dotsC)' }, v1);
const lluvia = el('g', { stroke: '#9fc4ff', 'stroke-width': 5, opacity: 0.7 }, v1);
for (let i = 0; i < 60; i++) el('path', { d: `M${(i * 97) % 1080} ${-100 + (i * 53) % 1100} l-18 50` }, lluvia);
const nubes1 = el('g', {}, v1); [[120, 220, 1.1], [560, 190, 1.3], [880, 240, 0.9]].forEach(([x, y, s]) => [[0, 0, 70], [70, -30, 85], [160, 0, 70], [80, 30, 75]].forEach(([dx, dy, r]) => el('circle', S('#8a96b8', { cx: x + dx * s, cy: y + dy * s, r: r * s }), nubes1)));
const rayoD = 'M560 250 L470 470 L560 470 L450 760 L700 420 L600 420 L690 250 Z';
const rayo1 = el('path', S(YE, { d: rayoD, 'stroke-width': 12 }), v1);
const brillo1 = el('path', { d: rayoD, fill: 'none', stroke: '#fffbd0', 'stroke-width': 40, opacity: 0.5, filter: 'blur(14px)' }, v1);
const kra = el('g', {}, v1); estallido(kra, 270, 560, 190, MA); ono(kra, 'KRA-', 270, 540, 84, YE, -10); ono(kra, 'KOOM!', 270, 630, 84, YE, -10);
const cart1 = cartel(v1, '¡5 VECES MÁS\nCALIENTE QUE EL SOL!', 520, 560, 450, 150, 3);
// 2: el Sol sudando
const v2 = clip[1];
el('rect', { x: -900, y: 0, width: 2400, height: 2000, fill: 'url(#dotsY)' }, v2);
const sol = el('g', { transform: 'translate(250 1060)' }, v2);
for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; el('path', S('#ffe14d', { d: `M${Math.cos(a - 0.15) * 120} ${Math.sin(a - 0.15) * 120} L${Math.cos(a) * 185} ${Math.sin(a) * 185} L${Math.cos(a + 0.15) * 120} ${Math.sin(a + 0.15) * 120}` }), sol); }
el('circle', S('#ffd000', { r: 125 }), sol);
el('path', S(K, { d: 'M-70 -30 Q-45 -55 -20 -30 M20 -30 Q45 -55 70 -30', fill: 'none' }), sol);
el('path', S('#fff', { d: 'M-50 40 Q0 75 50 40 Q0 20 -50 40 Z' }), sol);
const gotas = el('g', {}, sol); [[95, -60], [110, -10]].forEach(([x, y]) => el('path', S('#7fd3ff', { d: `M${x} ${y} q12 22 0 32 q-12 -10 0 -32 Z`, 'stroke-width': 5 }), gotas));
const term = (parent, x, y, h, color) => { const g = el('g', { transform: `translate(${x} ${y})` }, parent); el('rect', S('#fff', { x: -22, y: -h, width: 44, height: h, rx: 22 }), g); el('circle', S(color, { cx: 0, cy: 18, r: 38 }), g); const f = el('rect', { x: -12, y: 0, width: 24, height: 0, fill: color }, g); return { g, f, h }; };
const t2 = term(v2, 440, 1230, 330, RED);
const lab2 = el('g', { opacity: 0 }, v2); el('rect', S('#fff', { x: 70, y: 820, width: 380, height: 90, rx: 10 }), lab2); el('text', { x: 260, y: 885, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 56, fill: K }, lab2, '5.500 °C');
// 3: el rayo y su termómetro que revienta
const v3 = clip[2];
el('rect', { x: -400, y: 0, width: 2400, height: 2000, fill: 'url(#dotsR)' }, v3);
const rayo3 = el('path', S(YE, { d: 'M760 830 L690 1030 L770 1030 L680 1290 L900 990 L810 990 L880 830 Z', 'stroke-width': 11 }), v3);
const t3 = term(v3, 960, 1240, 380, RED);
const boom3 = el('g', { opacity: 0 }, v3); estallido(boom3, 960, 880, 110, YE); ono(boom3, '¡PLAF!', 960, 900, 46, RED, 8);
const lab3 = el('g', { opacity: 0 }, v3); el('rect', S('#fff', { x: 580, y: 1200, width: 330, height: 90, rx: 10 }), lab3); el('text', { x: 745, y: 1265, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 52, fill: RED }, lab3, '28.000 °C');
// 4: el aire explota: ondas y el trueno
const v4 = clip[3];
el('rect', { x: -600, y: 800, width: 2300, height: 1600, fill: '#cfe9ff' }, v4); el('rect', { x: -600, y: 800, width: 2300, height: 1600, fill: 'url(#dots)' }, v4);
const ondas = [0, 1, 2, 3].map(() => el('ellipse', { cx: 540, cy: 1600, rx: 10, ry: 8, fill: 'none', stroke: K, 'stroke-width': 10 }, v4));
const moles = Array.from({ length: 14 }, (_, i) => el('circle', S(i % 2 ? CY : '#fff', { r: 22, 'stroke-width': 6 }), v4));
const rayo4 = el('path', S(YE, { d: 'M560 1380 L510 1520 L560 1520 L500 1690 L640 1490 L585 1490 L630 1380 Z', 'stroke-width': 10 }), v4);
const bum = el('g', { opacity: 0 }, v4); estallido(bum, 540, 1610, 330, YE); ono(bum, '¡BUUUM!', 540, 1650, 130, RED, -6);
const trueno = el('g', { opacity: 0 }, v4); el('rect', S('#fff', { x: 70, y: 1400, width: 300, height: 80 }), trueno); el('text', { x: 220, y: 1458, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 48, fill: K }, trueno, 'EL TRUENO');
// las viñetas que aún no se han leído están tapadas
const tapas = [1, 2, 3].map((i) => { const n = NP[i], g = el('g', {}, cam); el('rect', { x: n[0], y: n[1], width: n[2], height: n[3], fill: '#fffaf0' }, g); el('rect', { x: n[0], y: n[1], width: n[2], height: n[3], fill: 'url(#dots)' }, g); el('text', { x: n[0] + n[2] / 2, y: n[1] + n[3] / 2 + 90, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 260, fill: '#e2d6bb', stroke: K, 'stroke-width': 8, 'paint-order': 'stroke' }, g, '?'); return g; });
P.forEach((_, i) => marco(i));
el('rect', { x: -1200, y: -1200, width: 3480, height: 6400, fill: '#000', filter: 'url(#paperg)', opacity: 0.6, 'pointer-events': 'none' }, cam);

const at = (w, n) => T.at(w, n);
const t5 = at('5.500'), t28 = at('28.000'), tEx = at('explota'), tTr = at('trueno'), tL2 = T.line(1).t0, tL3 = T.line(2).t0, tL4 = T.line(3).t0;
// la cámara: viñeta a viñeta, y la página entera al final
const SHOTS = [[0, 540, 960, 1.0], [tL2 - 0.25, 540, 1680, 1.0], [tL3 - 0.25, 540, 2580, 1.0], [tL4 - 0.25, 540, 3500, 1.0], [T.END - 0.4, 540, 1930, 0.5]];
function camAt(t) {
  let a = SHOTS[0], b = null;
  for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i][0]) { a = SHOTS[i]; b = SHOTS[i - 1] || null; }
  const k = b ? E.inOut(prog(t, a[0], a[0] + 0.4)) : 1, from = b || a;
  return [lerp(from[1], a[1], k), lerp(from[2], a[2], k), lerp(from[3], a[3], k)];
}
function render(t) {
  let [x, y, s] = camAt(t);
  const shake = (t0, k) => (t > t0 && t < t0 + 0.5 ? Math.sin(t * 80) * k * Math.exp(-(t - t0) * 7) : 0);
  const sx = shake(0, 12) + shake(tTr, 22), sy = shake(tEx, 10);
  cam.setAttribute('transform', `translate(${540 + sx} ${960 + sy}) scale(${s}) translate(${-x} ${-y})`);
  // 1: el rayo parpadea y llueve
  const fl = t < 0.5 ? (Math.floor(t * 20) % 2 ? 1 : 0.4) : 0.85 + Math.sin(t * 9) * 0.15;
  rayo1.setAttribute('opacity', fl); brillo1.setAttribute('opacity', 0.5 * fl);
  lluvia.setAttribute('transform', `translate(${-((t * 300) % 90) * 0.36} ${(t * 300) % 90})`);
  kra.setAttribute('transform', `translate(270 560) scale(${E.back(prog(t, -0.3, 0.1)) * (1 + Math.sin(t * 6) * 0.02)}) translate(-270 -560)`);
  const cp = E.back(prog(t, at('cinco') - 0.1, at('cinco') + 0.2)); cart1.setAttribute('transform', `translate(520 560) rotate(3) scale(${cp})`);
  // 2: el termómetro del Sol sube hasta 5.500
  const k2 = E.out(prog(t, tL2 + 0.3, t5 + 0.2)); t2.f.setAttribute('y', -t2.h * 0.45 * k2); t2.f.setAttribute('height', t2.h * 0.45 * k2);
  lab2.setAttribute('opacity', t > t5 - 0.05 ? 1 : 0); lab2.setAttribute('transform', `translate(260 865) scale(${E.back(prog(t, t5 - 0.05, t5 + 0.2))}) translate(-260 -865)`);
  gotas.setAttribute('transform', `translate(0 ${(t * 40) % 20})`);
  sol.setAttribute('transform', `translate(250 1060) rotate(${Math.sin(t * 2) * 4})`);
  // 3: el termómetro del rayo sube a tope y revienta
  const k3 = E.in(prog(t, tL3 + 0.4, t28 + 0.1)); t3.f.setAttribute('y', -t3.h * k3); t3.f.setAttribute('height', t3.h * k3);
  boom3.setAttribute('opacity', t > t28 + 0.1 ? 1 : 0); boom3.setAttribute('transform', `translate(960 880) scale(${E.back(prog(t, t28 + 0.1, t28 + 0.35))}) translate(-960 -880)`);
  lab3.setAttribute('opacity', t > t28 ? 1 : 0);
  rayo3.setAttribute('opacity', 0.8 + Math.sin(t * 13) * 0.2);
  // 4: el aire se expande en ondas y estalla
  const k4 = prog(t, tL4 + 0.2, tTr + 0.8);
  ondas.forEach((o, i) => { const u = (k4 * 2.2 + i * 0.25) % 1; o.setAttribute('rx', 30 + u * 600); o.setAttribute('ry', 24 + u * 260); o.setAttribute('opacity', t > tL4 ? (1 - u) : 0); });
  moles.forEach((m, i) => { const a = (i / 14) * Math.PI * 2, r = 60 + E.out(prog(t, tEx - 0.1, tEx + 0.5)) * 420 + Math.sin(t * 9 + i) * 6; m.setAttribute('cx', 540 + Math.cos(a) * r); m.setAttribute('cy', 1610 + Math.sin(a) * r * 0.5); });
  bum.setAttribute('opacity', t > tTr - 0.05 ? 1 : 0); bum.setAttribute('transform', `translate(540 1610) scale(${E.back(prog(t, tTr - 0.05, tTr + 0.25))}) translate(-540 -1610)`);
  trueno.setAttribute('opacity', t > tTr ? 1 : 0);
  document.getElementById('flash').style.opacity = Math.max(t < 0.45 ? (Math.floor(t * 20) % 2 ? 0.55 : 0) : 0, t > tTr - 0.05 ? 0.6 * Math.exp(-(t - tTr + 0.05) * 9) : 0);
  tapas.forEach((g, i) => { const t0 = SHOTS[i + 1][0] + 0.1, k = E.in(prog(t, t0, t0 + 0.3)); g.setAttribute('opacity', 1 - k); const n = NP[i + 1]; g.setAttribute('transform', `translate(${n[0] + n[2] / 2} ${n[1] + n[3] / 2}) scale(${1 + k * 0.15}) translate(${-(n[0] + n[2] / 2)} ${-(n[1] + n[3] / 2)})`); });
  C.update(t);
}
await document.fonts.load('400 60px Bungee', '¡KRA°0Á'); await document.fonts.ready;
A.fx(0, 'impact', 0.45); A.fx(0.02, 'boom', 0.3);
A.fx(at('cinco') - 0.1, 'pop', 0.25);
[tL2, tL3, tL4].forEach((t) => { A.fx(t - 0.25, 'swish', 0.25); A.fx(t - 0.15, 'paper', 0.2); });
A.fx(tL2 + 0.3, 'riser', 0.12); A.fx(t5, 'bell', 0.2);
A.fx(tL3 + 0.4, 'riser', 0.2); A.fx(t28 + 0.1, 'impact', 0.35); A.fx(t28 + 0.1, 'slap', 0.3);
A.fx(tEx, 'whoosh', 0.3); A.fx(tTr - 0.05, 'boom', 0.55); A.fx(tTr - 0.05, 'impact', 0.4);
A.fx(T.END - 0.35, 'swish', 0.2);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, ambiente: [{ tipo: 'lluvia', desde: 0, hasta: DUR, g: 0.5 }], musica: { archivo: 'n4-rayo.wav', gain: 0.28, duck: 0.55, fadein: 0.05, fadeout: 0.6, silencios: [[tTr - 0.1, tTr + 0.5, 0.1]] } };
window.__dur = DUR; window.__render = render;
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
