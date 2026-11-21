// «¡Las nutrias se dan la mano para dormir!». Sombras chinescas: una pantalla de papel iluminada por detrás, marco de
// madera, siluetas negras movidas con varillas. Dos nutrias flotan boca arriba agarradas de la mano bajo la luna, con el
// cartel «¡SE DAN LA MANO!»; salen las zetas del sueño; la corriente tira de ellas y la cámara se acerca a las manos
// (con un corazón); crecen algas que envuelven a una como una manta; al alejarse, una balsa de cinco y el cartel «BALSA».
import { clamp, lerp, prog, E } from '../kit/util.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: ['nutrias', 'mano', 'dormir', 'corriente', 'algas', 'mantas', 'balsa'], top: 1530, dur: DUR });
const A = sonido();
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, at = {}, p = null, txt = null) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); if (txt !== null) e.textContent = txt; return e; };
const svg = document.getElementById('scene');
const INK = '#1a0f0a';
svg.innerHTML = `<defs>
  <radialGradient id="luz" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#fff1c2"/><stop offset=".45" stop-color="#ffc56b"/><stop offset=".8" stop-color="#e2772b"/><stop offset="1" stop-color="#8a3414"/></radialGradient>
  <filter id="papel"><feTurbulence type="fractalNoise" baseFrequency=".012 .9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .15  0 0 0 0 0  0 0 0 -.25 .2"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="borde"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="lejos"><feGaussianBlur stdDeviation="5"/></filter></defs>`;
const cam = el('g', {}, svg);
el('rect', { x: -800, y: -800, width: 2680, height: 3520, fill: 'url(#luz)' }, cam);
el('rect', { x: -800, y: -800, width: 2680, height: 3520, fill: '#000', filter: 'url(#papel)' }, cam);
const sil = (parent, blur = 'borde') => el('g', { fill: INK, filter: `url(#${blur})` }, parent);
// la luna: un recorte por donde pasa más luz
el('circle', { cx: 790, cy: 470, r: 120, fill: '#fff8de', opacity: 0.85 }, cam);
el('circle', { cx: 790, cy: 470, r: 160, fill: '#fff8de', opacity: 0.25 }, cam);
// estrellas recortadas
for (let i = 0; i < 9; i++) el('path', { d: `M${120 + (i * 113) % 860} ${280 + (i * 71) % 300} l8 18 l20 2 l-15 12 l5 20 l-18 -11 l-18 11 l5 -20 l-15 -12 l20 -2 Z`, fill: '#fff4cf', opacity: 0.7 }, cam);
// olas de fondo
const olaAtras = el('path', { fill: INK, opacity: 0.55, filter: 'url(#lejos)' }, cam);
// una nutria flotando boca arriba (mirando a la izquierda), con un brazo que se puede estirar
function nutria(parent) {
  const g = el('g', {}, parent), s = sil(g);
  el('path', { d: 'M-170 0 Q-150 -46 -60 -50 Q60 -54 150 -32 Q200 -22 232 4 Q200 26 140 30 Q20 42 -80 36 Q-150 32 -170 0 Z' }, s);
  el('circle', { cx: -188, cy: -12, r: 50 }, s); el('circle', { cx: -206, cy: -58, r: 13 }, s); el('path', { d: 'M-232 -22 l-16 5 l14 10 Z' }, s);
  el('path', { d: 'M150 -30 q30 -52 62 -62 q12 6 3 17 q-26 18 -38 52 Z' }, s);
  el('path', { d: 'M222 6 Q302 -12 336 20 Q292 34 226 22 Z' }, s);
  el('path', { d: 'M-70 -48 q4 -44 24 -56 q12 0 8 12 q-12 22 -10 46 Z' }, s);
  const brazo = el('path', { d: '', stroke: INK, 'stroke-width': 26, 'stroke-linecap': 'round', fill: 'none' }, s);
  const algas = el('g', { opacity: 0 }, g); el('path', { d: 'M-130 -60 Q-60 30 20 -58 Q80 34 140 -40', stroke: INK, 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#borde)' }, algas);
  return { g, brazo, algas };
}
const escena = el('g', {}, cam);
const N = [nutria(escena), nutria(escena), nutria(escena), nutria(escena), nutria(escena)];
// las varillas que mueven las siluetas
const varillas = el('g', { stroke: INK, 'stroke-width': 6, opacity: 0.8, filter: 'url(#borde)' }, cam);
const vs = N.map(() => el('path', {}, varillas));
// las algas que crecen del fondo
const kelp = el('g', {}, cam), kelps = [0, 1, 2].map((i) => el('path', { d: '', stroke: INK, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#borde)' }, kelp));
// olas delanteras
const olaDelante = el('path', { fill: INK, opacity: 0.8 }, cam);
const brillo = el('path', { fill: 'none', stroke: '#ffb35c', 'stroke-width': 4, opacity: 0.6 }, cam);
// las zetas, el corazón y la corriente
const zz = el('g', { fill: INK, 'font-family': 'Marker', opacity: 0 }, cam); ['z', 'z', 'Z'].forEach((c, i) => el('text', { x: 0, y: -i * 70, 'font-size': 60 + i * 24, 'data-i': i }, zz, c));
const corazon = el('path', { d: 'M0 0 C-30 -40 -80 -10 0 50 C80 -10 30 -40 0 0 Z', fill: '#c7261b', opacity: 0 }, cam);
const corriente = el('g', { opacity: 0, stroke: INK, 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', filter: 'url(#borde)' }, cam);
const flechasC = [0, 1, 2].map((i) => el('path', { d: '' }, corriente));
// los carteles colgados de varillas
function cartel(txt, w) {
  const g = el('g', {}, cam);
  el('path', { d: `M${-w / 2 + 40} -600 L${-w / 2 + 40} -70 M${w / 2 - 40} -600 L${w / 2 - 40} -70`, stroke: INK, 'stroke-width': 6, filter: 'url(#borde)' }, g);
  el('rect', { x: -w / 2, y: -80, width: w, height: 150, rx: 16, fill: INK, filter: 'url(#borde)' }, g);
  el('text', { x: 0, y: 30, 'text-anchor': 'middle', 'font-family': 'Marker', 'font-size': 88, fill: '#ffd98a' }, g, txt);
  return g;
}
const c1 = cartel('¡SE DAN LA MANO!', 860), c2 = cartel('UNA «BALSA»', 720);
// marco de madera del teatrillo (fijo, fuera de la cámara)
const marco = el('g', {}, svg);
el('path', { d: 'M0 0 H1080 V1920 H0 Z M46 46 V1874 H1034 V46 Z', fill: '#3b2416', 'fill-rule': 'evenodd' }, marco);
el('path', { d: 'M46 46 V1874 H1034 V46 Z', fill: 'none', stroke: '#5c3a22', 'stroke-width': 10 }, marco);

const at = (w, n) => T.at(w, n);
const tL2 = T.line(1).t0, tL3 = T.line(2).t0, tL4 = T.line(3).t0, tL5 = T.line(4).t0, tAlg = at('enrollan'), tBal = at('balsa');
function wavePath(t, y, amp, ph, k = 0.012) { let d = `M-300 ${y}`; for (let x = -300; x <= 1400; x += 40) d += ` L${x} ${(y + Math.sin(x * k + t * 1.6 + ph) * amp + Math.sin(x * k * 2.3 - t * 1.1) * amp * 0.4).toFixed(1)}`; return d + ' L1400 2400 L-300 2400 Z'; }
function render(t) {
  // cámara: plano general, acercamiento a las manos y alejamiento final con la balsa
  const zIn = E.inOut(prog(t, tL3 - 0.2, tL3 + 0.4)) * (1 - E.inOut(prog(t, tL4 - 0.2, tL4 + 0.4)));
  const zOut = E.inOut(prog(t, tL5 - 0.2, tL5 + 0.6));
  const s = 1 + zIn * 0.6 - zOut * 0.12, cx = 540, cy = lerp(1170, 1180, zIn) + zOut * 20;
  cam.setAttribute('transform', `translate(540 960) scale(${s}) translate(${-cx} ${-cy})`);
  olaAtras.setAttribute('d', wavePath(t, 1250, 20, 0));
  olaDelante.setAttribute('d', wavePath(t, 1305, 16, 2.2, 0.015)); brillo.setAttribute('d', wavePath(t, 1305, 16, 2.2, 0.015).split(' L1400 2400')[0]);
  // la corriente: empuja de lado a lado
  const pull = t > tL3 && t < tL4 + 0.3 ? Math.sin((t - tL3) * 3.2) * 60 : 0;
  // las nutrias: dos al principio (cabeza con cabeza), cinco en la balsa al final
  const balsa = zOut;
  N.forEach((n, i) => {
    let x, y = 1235, flip, show = 1;
    if (i < 2) { x = i === 0 ? 330 - pull * 0.6 : 750 + pull * 0.6; flip = i === 0 ? -1 : 1; }
    else { x = [i === 2 ? -260 : 0, 0, 0, 1340, 1630][i]; flip = i % 2 ? 1 : -1; show = balsa; }
    if (balsa > 0) { const bx = [60, 300, 540, 780, 1020][[1, 3, 0, 2, 4][i]]; x = lerp(x, bx, balsa); }
    const bob = Math.sin(t * 1.6 + x * 0.012) * 18, rot = Math.sin(t * 1.3 + i) * 4;
    const sc = lerp(1.05, 0.5, balsa);
    n.g.setAttribute('transform', `translate(${x} ${y + bob}) rotate(${rot}) scale(${flip * sc} ${sc})`);
    n.g.setAttribute('opacity', show);
    // el brazo estirado hacia la vecina (en coordenadas de la nutria)
    const reach = i < 2 ? 1 : balsa;
    n.brazo.setAttribute('d', reach > 0.05 ? `M-110 -46 Q-150 ${-130 - pull * 0.1} ${-250 - 40 * (1 - balsa)} -96` : '');
    vs[i].setAttribute('d', show > 0.05 ? `M${x} ${y + bob + 20} L${x + (i - 2) * 30} 2600` : '');
    vs[i].setAttribute('opacity', show);
    n.algas.setAttribute('opacity', i === 1 ? E.out(prog(t, tAlg + 0.2, tAlg + 0.6)) : 0);
  });
  // zetas del sueño
  const zOn = t > tL2 - 0.1 && t < tL3; zz.setAttribute('opacity', zOn ? 1 : 0);
  zz.setAttribute('transform', `translate(560 ${980 - ((t * 60) % 60)})`);
  // el corazón sobre las manos
  const hp = E.back(prog(t, at('agarran'), at('agarran') + 0.35)); corazon.setAttribute('opacity', t > at('agarran') && t < tL4 ? 1 : 0);
  corazon.setAttribute('transform', `translate(540 ${1030 + Math.sin(t * 4) * 6}) scale(${hp * 0.9})`);
  // la corriente
  corriente.setAttribute('opacity', t > at('corriente') - 0.2 && t < tL4 ? 1 : 0);
  flechasC.forEach((f, i) => { const x0 = 140 + ((t * 260 + i * 330) % 900), y0 = 1320 + i * 40; f.setAttribute('d', `M${x0} ${y0} q40 -26 80 0 t80 0 m-24 -20 l26 20 l-26 20`); });
  // las algas crecen desde abajo
  kelps.forEach((k, i) => { const g = E.out(prog(t, tAlg - 0.3 + i * 0.1, tAlg + 0.4)); const x0 = 700 + i * 60, h = 600 * g; k.setAttribute('d', g > 0.01 ? `M${x0} 1960 q${-40 + i * 20} ${-h * 0.3} 0 ${-h * 0.55} t0 ${-h * 0.45}` : ''); k.setAttribute('opacity', t < tL5 + 0.3 ? 1 : 1 - prog(t, tL5 + 0.3, tL5 + 0.6)); });
  // carteles: bajan colgados y suben al cambiar
  const c1y = lerp(-300, 430, E.back(prog(t, -0.3, 0.05))) - E.in(prog(t, tL2 + 0.2, tL2 + 0.6)) * 800;
  c1.setAttribute('transform', `translate(540 ${c1y}) rotate(${Math.sin(t * 2) * 2})`);
  const c2y = lerp(-400, 470, E.back(prog(t, tBal - 0.5, tBal)));
  c2.setAttribute('transform', `translate(540 ${c2y}) rotate(${Math.sin(t * 2) * 2})`);
  C.update(t);
}
await document.fonts.load('400 60px Marker', 'ÁÑ¡«»'); await document.fonts.ready;
A.fx(0, 'paper', 0.3); A.fx(0.05, 'thump', 0.18);
A.fx(tL2 - 0.1, 'paper', 0.2); A.fx(at('agarran'), 'pop', 0.25); A.fx(at('agarran') + 0.05, 'bell', 0.12);
A.fx(tAlg - 0.3, 'swish', 0.2); A.fx(tL5 - 0.2, 'whoosh', 0.18); A.fx(tBal - 0.2, 'paper', 0.3); A.fx(tBal, 'thump', 0.25);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, ambiente: [{ tipo: 'viento', desde: 0, hasta: DUR, g: 0.35 }], musica: { archivo: 'n6-nutrias.wav', gain: 0.3, duck: 0.5, fadein: 0.05, fadeout: 0.7 } };
window.__dur = DUR; window.__render = render;
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
