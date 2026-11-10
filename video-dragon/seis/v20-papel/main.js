// LÓNG · paper cut-out, in stop motion. A green cutting mat seen from above, scraps and scissors about; a paper girl (white
// cut edge, a shadow, paper grain) holds the dragon, the 3D one turned into a cut-out; everything moves at 12 steps a
// second with a little jitter, as stop motion does. «¿Sabes qué es lo que más me preguntan? Si este dragón se mueve de
// verdad.» A paper tape for the 88 cm, eight paper circles, the desk lamp off and it glows, the real photo pinned down.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';
import { titere, defs, svgEl as el } from '../kit/titere.js';

const T = await tiempos(), DUR = T.G.dur;
const MOUTH = await (await fetch('boca.json')).json();
const C = capas(T, { keys: ['preguntan', 'mueve', 'verdad', 'pieza', 'gira', 'separado', 'ochenta', 'centímetros', 'colores', 'brilla', 'noche', 'perfil'], top: 230, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const tIn = 0.0, tWig = ln(1) - 0.05, tClose = ln(2) - 0.05, tCm = T.at('ochenta') - 0.05, tCols = T.at('ocho', 2) - 0.05, tDark = ln(4) - 0.05, tGlow = T.at('brilla') - 0.05, tReal = ln(5) - 0.04;
const svg = document.getElementById('scene'); defs(svg);
const cam = el('g', {}, svg);
// the cutting mat
el('rect', { x: -400, y: -400, width: 1880, height: 2720, fill: '#2f7d5a' }, cam);
for (let x = -400; x < 1480; x += 54) el('path', { d: `M ${x} -400 V 2320`, stroke: '#4c9c76', 'stroke-width': x % 270 === 0 ? 3 : 1.5, opacity: 0.8 }, cam);
for (let y = -400; y < 2320; y += 54) el('path', { d: `M -400 ${y} H 1480`, stroke: '#4c9c76', 'stroke-width': y % 270 === 0 ? 3 : 1.5, opacity: 0.8 }, cam);
const scrap = (pts, fill, rot) => el('polygon', { points: pts, fill, filter: 'url(#paper)', transform: `rotate(${rot} 540 960)` }, cam);
scrap('40,1500 260,1460 300,1700 70,1760', '#ffb3d9', -8); scrap('820,1560 1040,1520 1060,1760 860,1800', '#8fd3ff', 6); scrap('880,520 1060,500 1050,640 900,660', '#ffd43b', 10);
const scissors = el('g', { transform: 'translate(60 520) rotate(-30)' }, cam);
el('ellipse', { cx: 0, cy: 0, rx: 46, ry: 30, fill: 'none', stroke: '#ff3b4e', 'stroke-width': 16 }, scissors); el('ellipse', { cx: 0, cy: 80, rx: 46, ry: 30, fill: 'none', stroke: '#ff3b4e', 'stroke-width': 16 }, scissors);
el('path', { d: 'M 40 20 L 230 70 M 40 60 L 230 30', stroke: '#c9ced6', 'stroke-width': 14, 'stroke-linecap': 'round' }, scissors);
// the girl, cut out of paper
const girl = titere(cam, { style: 'papel', skin: '#e9b38f', hair: '#2b1d3a', hairStyle: 'mom', shirt: '#ffd43b', shirt2: '#e8b10a', line: '#1d1a2b' });
const frame = (name, i) => `../sprites/${name}/${String(((i % 30) + 30) % 30).padStart(3, '0')}.png`;
const dragon = el('image', { width: 360, height: 1000, filter: 'url(#paper)' }, cam), dGlow = el('image', { width: 360, height: 1000, opacity: 0, filter: 'url(#glow)' }, cam);
// the paper tape for the 88 cm and the eight circles
const tape = el('g', { opacity: 0 }, cam);
const tapeR = el('rect', { x: 0, y: 0, width: 110, height: 0, fill: '#ffd43b', filter: 'url(#paper)' }, tape);
const tapeT = el('g', {}, tape); for (let i = 0; i <= 22; i++) el('rect', { x: 0, y: i * 40, width: i % 5 ? 30 : 56, height: 4, fill: '#1d1a2b' }, tapeT);
const COL = ['#7b3fe4', '#ff8a1f', '#4a4ff0', '#2fae74', '#f5c021', '#d0d5dd', '#ffb3d9', '#c9ffe0'];
const circles = COL.map((c) => el('circle', { r: 58, fill: c, filter: 'url(#paper)', opacity: 0 }, cam));
const night = el('rect', { x: -400, y: -400, width: 1880, height: 2720, fill: '#06110c', opacity: 0 }, cam);
cam.appendChild(dGlow);
const gl = el('ellipse', { cx: 600, cy: 1100, rx: 520, ry: 620, fill: 'url(#gg)', opacity: 0, style: 'mix-blend-mode: screen' }, cam);
svg.querySelector('defs').insertAdjacentHTML('beforeend', '<radialGradient id="gg"><stop offset="0" stop-color="#7dffc0" stop-opacity="0.8"/><stop offset="1" stop-color="#3fd690" stop-opacity="0"/></radialGradient>');
// the real one, a print pinned to the mat
const real = el('g', { opacity: 0 }, svg);
el('rect', { x: 0, y: 0, width: 1080, height: 1920, fill: '#2f7d5a' }, real);
el('rect', { x: 110, y: 330, width: 860, height: 960, fill: '#fffdf6', filter: 'url(#paper)', transform: 'rotate(3 540 800)' }, real);
el('image', { href: 'img/real.jpg', x: 140, y: 360, width: 800, height: 800, preserveAspectRatio: 'xMidYMid slice', transform: 'rotate(3 540 800)' }, real);
const rt = el('text', { x: 540, y: 1250, 'text-anchor': 'middle', 'font-family': 'Marker', 'font-size': 78, fill: '#1d1a2b', transform: 'rotate(3 540 800)' }, real); rt.textContent = 'así es el de verdad';
el('circle', { cx: 540, cy: 360, r: 26, fill: '#ff3b4e', stroke: '#8a1020', 'stroke-width': 4 }, real);
const rl = el('g', { transform: 'translate(300 1430) rotate(-4)' }, real);
el('rect', { x: 0, y: 0, width: 520, height: 110, fill: '#ff3b4e', filter: 'url(#paper)' }, rl);
const rlt = el('text', { x: 260, y: 76, 'text-anchor': 'middle', 'font-family': 'Marker', 'font-size': 60, fill: '#fff' }, rl); rlt.textContent = 'link en mi perfil';

C.item('<div class="tag">¿?</div>', 760, 560, 0.3, tWig, 'pop', 8);
C.item('<div class="tag red">¡CLIC!</div>', 640, 880, T.at('pieza') - 0.05, tCm, 'stamp', -8);
C.item('<div class="tag">¡CLAC!</div>', 690, 1100, T.at('gira') + 0.1, tCm, 'stamp', 6);
C.item('<div class="tag red">88 CM</div>', 640, 760, T.at('ochenta'), tCols, 'pop', -5);

const MV = (t) => MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function render(t) {
  // stop motion: the picture moves in steps of 1/12 s, each step a little off
  const q = Math.floor(t * 12), tq = q / 12, jx = (rnd(q) - 0.5) * 6, jy = (rnd(q + 9) - 0.5) * 6, jr = (rnd(q + 4) - 0.5) * 1.6;
  const z = t < tClose ? 1.0 : t < tCm ? 1.35 : t < tDark ? 1.05 : 1.12, fx = t >= tClose && t < tCm ? 640 : 540, fy = t >= tClose && t < tCm ? 1020 : 1000;
  cam.setAttribute('transform', `translate(540 960) scale(${z}) translate(${-fx} ${-fy})`);
  const pin = E.back(prog(tq, tIn, tIn + 0.35)), wig = tq >= tWig && tq < tCm ? Math.sin(tq * 14) * 30 : 0;
  const g = girl.set({ x: 330 + jx + (1 - pin) * -500, y: 1060 + jy, s: 1.3, lean: jr + (1 - pin) * -20, mouth: t < T.END ? MV(t) : 0, smile: 0.8, blink: ((tq * 0.45) % 1) < 0.05 ? 1 : 0, look: 0.5, brows: 0.3, armF: [190 + wig, -150], armB: [-150, 290], bendF: 1 });
  const hx = 330 + jx + g.hf[0] * 1.3 + (1 - pin) * -500, hy = 1060 + jy + g.hf[1] * 1.3, fi = Math.floor(tq * 12 * (wig ? 2 : 1));
  const k = 1.0, tf = `translate(${hx - 165 * k} ${hy - 125 * k}) rotate(${jr * 2} 165 125) scale(${k})`;
  dragon.setAttribute('href', frame('cuelga-pastel', fi)); dragon.setAttribute('transform', tf); dragon.setAttribute('opacity', t >= tDark ? 0 : 1);
  dGlow.setAttribute('href', frame('cuelga-luminoso-glow', fi)); dGlow.setAttribute('transform', tf); dGlow.setAttribute('opacity', t >= tDark ? E.out(prog(tq, tGlow - 0.1, tGlow + 0.25)) : 0);
  // the tape unrolls beside it
  const tp = E.out(prog(tq, tCm, tCm + 0.5)); tape.setAttribute('opacity', tq >= tCm && tq < tCols + 0.2 ? 1 : 0); tape.setAttribute('transform', `translate(${hx + 150} ${hy - 120}) rotate(${jr})`); tapeR.setAttribute('height', 900 * tp); tapeT.setAttribute('opacity', tp > 0.95 ? 1 : 0);
  // eight paper circles land round her
  circles.forEach((c, i) => { const ti = tCols + i * 0.08, p = E.back(prog(tq, ti, ti + 0.25)), a = -0.4 + (i / 7) * 3.6, r = 330; c.setAttribute('opacity', tq >= ti && t < tDark ? 1 : 0); c.setAttribute('cx', 600 + Math.cos(a) * r + (rnd(i) - 0.5) * 40); c.setAttribute('cy', 1050 + Math.sin(a) * r * 1.3); c.setAttribute('r', 58 * p); });
  // the lamp goes off
  const dk = t >= tDark && t < tReal ? E.out(prog(tq, tDark, tDark + 0.25)) : 0; night.setAttribute('opacity', dk * 0.88);
  gl.setAttribute('opacity', t >= tGlow && t < tReal ? E.out(prog(tq, tGlow, tGlow + 0.3)) * 0.9 : 0); gl.setAttribute('cx', hx); gl.setAttribute('cy', hy + 360);
  // the real one
  const rp = E.back(prog(tq, tReal, tReal + 0.34)); real.setAttribute('opacity', t >= tReal ? 1 : 0); real.setAttribute('transform', `translate(540 900) scale(${lerp(1.2, 1, rp)}) rotate(${(1 - rp) * -6}) translate(-540 -900)`);
  if (t < tReal) C.update(t, dk > 0.5); else document.getElementById('cap').style.opacity = 0;
}
const imgs = []; for (const n of ['cuelga-pastel', 'cuelga-luminoso-glow']) for (let i = 0; i < 30; i++) { const im = new Image(); im.src = frame(n, i); imgs.push(im.decode().catch(() => {})); }
const ri = new Image(); ri.src = 'img/real.jpg'; imgs.push(ri.decode().catch(() => {})); await Promise.all(imgs);
await document.fonts.load('400 60px Marker', 'Aá0¡¿');
A.forItems(C.IT);
A.fx(0.0, 'paper', 0.35); A.fx(0.25, 'thump', 0.2);
A.rattle(T.at('mueve') - 0.05, 8, 0.1, 0.3); A.rattle(T.at('gira') - 0.05, 8, 0.1, 0.3);
A.fx(tClose, 'swish', 0.22); A.fx(tCm, 'tear', 0.3); for (let i = 0; i < 8; i++) A.fx(tCols + i * 0.08, 'paper', 0.14, -0.4 + i * 0.1);
A.fx(tDark, 'lightswitch', 0.5); A.fx(tGlow, 'shimmer', 0.42);
A.fx(tReal, 'paper', 0.4); A.fx(tReal + 0.04, 'thump', 0.25); A.fx(T.at('link'), 'click', 0.34);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
