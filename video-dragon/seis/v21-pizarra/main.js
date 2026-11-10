// LÓNG · «Te explico este dragón en diez segundos». 2D: a whiteboard. A 10-second countdown drawn at the top keeps people
// to the end; a doodle of a guy appears stroke by stroke holding the dragon, the only thing in colour on the board; the
// four points are written by hand as he says them (printed in 3D and moves, 88 cm with the arrow, eight colours scribbled
// in, and the board goes dark so it glows); the real photo is taped on at the end. Voice VelionF, marker sounds.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';
import { titere, defs, svgEl as el } from '../kit/titere.js';

const T = await tiempos(), DUR = T.G.dur;
const MOUTH = await (await fetch('boca.json')).json();
const C = capas(T, { keys: ['diez', 'segundos', '3d', 'mueve', 'ochenta', 'centímetros', 'colores', 'brilla', 'oscuridad', 'verdad', 'perfil'], top: 1430, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const t0 = ln(1) - 0.05, t1 = t0 + 10;   // the countdown runs over the four points
const tDark = T.at('brilla') - 0.15, tReal = ln(5) - 0.04;
const svg = document.getElementById('scene'); defs(svg);
svg.querySelector('defs').insertAdjacentHTML('beforeend', '<filter id="ng" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
const cam = el('g', {}, svg);
// the board
el('rect', { x: -300, y: -300, width: 1680, height: 2520, fill: '#fbfbf8' }, cam);
for (let x = 0; x <= 1080; x += 60) el('path', { d: `M ${x} -300 V 2220`, stroke: '#dfe8f0', 'stroke-width': 2 }, cam);
for (let y = 0; y <= 1920; y += 60) el('path', { d: `M -300 ${y} H 1380`, stroke: '#dfe8f0', 'stroke-width': 2 }, cam);
[[200, 520, 220, 60], [820, 1320, 260, 70]].forEach(([x, y, rx, ry]) => el('ellipse', { cx: x, cy: y, rx, ry, fill: '#e9e9e4', opacity: 0.5 }, cam));
const ink = (attrs, parent = cam) => el('path', Object.assign({ fill: 'none', stroke: '#1d1a2b', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, attrs), parent);
const write = (x, y, txt, size, color = '#1d1a2b', parent = cam) => { const g = el('g', {}, parent), tx = el('text', { x, y, 'font-family': 'Caveat', 'font-weight': 700, 'font-size': size, fill: color }, g); tx.textContent = txt; const clip = el('clipPath', { id: 'c' + Math.random().toString(36).slice(2) }, svg.querySelector('defs')); const r = el('rect', { x: x - 10, y: y - size, width: 0, height: size * 1.4 }, clip); g.setAttribute('clip-path', `url(#${clip.id})`); return { g, r, x, w: txt.length * size * 0.42 + 20 }; };
// the countdown at the top
const timer = el('g', { transform: 'translate(540 380)' }, cam);
el('circle', { r: 128, fill: '#fff', stroke: '#1d1a2b', 'stroke-width': 10 }, timer);
const arc = el('circle', { r: 128, fill: 'none', stroke: '#ff3b4e', 'stroke-width': 16, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 0, transform: 'rotate(-90)' }, timer);
const num = el('text', { y: 54, 'text-anchor': 'middle', 'font-family': 'Marker', 'font-size': 160, fill: '#1d1a2b' }, timer); num.textContent = '10';
const tlab = write(690, 395, 'segundos', 76, '#8b8781');
// the guy, in marker, and the dragon he holds (in colour)
const guy = titere(cam, { style: 'trazo', line: '#1d1a2b', lw: 8, hairStyle: 'kid', scale: 1.0 });
const shapes = [...guy.root.querySelectorAll('path, ellipse, circle, rect')]; shapes.forEach((s) => { s.setAttribute('pathLength', 1); s.setAttribute('stroke-dasharray', 1); });
const frame = (name, i) => `../sprites/${name}/${String(((i % 30) + 30) % 30).padStart(3, '0')}.png`;
const dragon = el('image', { width: 360, height: 1000 }, cam), dGlow = el('image', { width: 360, height: 1000, opacity: 0, filter: 'url(#glow)' }, cam);
// the four points, written on the right
const P1 = write(590, 660, '1 · impreso 3D', 88), P1b = write(590, 745, 'y se mueve entero', 72, '#ff3b4e');
const P2 = write(600, 900, '2 · 88 cm', 118);
const arrow = ink({ d: 'M 560 640 L 560 1520 M 528 682 L 560 640 L 592 682 M 528 1478 L 560 1520 L 592 1478', stroke: '#ff3b4e', 'stroke-width': 10 });
const P3 = write(590, 1060, '3 · 8 colores', 92);
const COL = ['#7b3fe4', '#ff8a1f', '#4a4ff0', '#2fae74', '#f5c021', '#c9ced6', '#ffb3d9', '#bfffd9'];
const dots = COL.map((c, i) => el('circle', { cx: 660 + (i % 4) * 112, cy: 1135 + Math.floor(i / 4) * 108, r: 0, fill: c, stroke: '#1d1a2b', 'stroke-width': 6 }, cam));
const dark = el('rect', { x: -300, y: -300, width: 1680, height: 2520, fill: '#0e1318', opacity: 0 }, cam);
cam.appendChild(dGlow);
const P4 = write(590, 1400, '4 · ¡brilla!', 108, '#7dffc4'); P4.g.setAttribute('filter', 'url(#ng)');
// the real one, taped on
const real = el('g', { opacity: 0 }, svg);
el('rect', { x: 90, y: 330, width: 900, height: 900, fill: '#fff', stroke: '#1d1a2b', 'stroke-width': 6, transform: 'rotate(-2 540 780)' }, real);
el('image', { href: 'img/real.jpg', x: 120, y: 360, width: 840, height: 840, preserveAspectRatio: 'xMidYMid slice', transform: 'rotate(-2 540 780)' }, real);
el('rect', { x: 120, y: 300, width: 220, height: 70, fill: '#f3e3b0', opacity: 0.85, transform: 'rotate(-12 230 335)' }, real);
el('rect', { x: 740, y: 1180, width: 220, height: 70, fill: '#f3e3b0', opacity: 0.85, transform: 'rotate(-8 850 1215)' }, real);
const rl = el('text', { x: 540, y: 1330, 'text-anchor': 'middle', 'font-family': 'Marker', 'font-size': 96, fill: '#1d1a2b' }, real); rl.textContent = 'así es el de verdad';
const rb = write(300, 1440, '→ link en mi perfil', 80, '#ff3b4e', real);
// the marker hand
const hand = el('g', { opacity: 0 }, svg);
el('path', { d: 'M 0 0 L 26 -70 L 60 -60 L 34 12 Z', fill: '#ff3b4e', stroke: '#1d1a2b', 'stroke-width': 6 }, hand);
el('path', { d: 'M 30 -66 q 30 -20 60 10 q 40 30 50 90 q -30 30 -90 10 q -20 -40 -20 -110 Z', fill: '#f2c29b', stroke: '#1d1a2b', 'stroke-width': 6 }, hand);

const MV = (t) => MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
const reveal = (w, a, b, t) => { const p = prog(t, a, b); w.r.setAttribute('width', p * w.w); return p; };
function render(t) {
  // a little push in on each point
  const z = 1 + 0.04 * Math.sin(Math.min(t, tReal) * 0.6);
  cam.setAttribute('transform', `translate(540 960) scale(${z}) translate(-540 -960)`);
  // the guy draws himself in
  const dp = E.inOut(prog(t, 0.0, 0.7)); shapes.forEach((s, i) => s.setAttribute('stroke-dashoffset', clamp(1 - dp * 1.4 + (i / shapes.length) * 0.4)));
  const shake = t >= T.at('mueve') - 0.1 && t < ln(2) ? Math.sin(t * 18) * 26 : 0;
  const g = guy.set({ x: 290, y: 1060 + Math.sin(t * 2) * 5, s: 1.45, mouth: t < T.END ? MV(t) : 0, smile: 0.8, blink: ((t * 0.4) % 1) < 0.04 ? 1 : 0, look: 0.6, brows: 0.3, armF: [150 + shake, -120], armB: [-150, 290], bendF: 1 });
  const hx = 290 + g.hf[0] * 1.45, hy = 1060 + g.hf[1] * 1.45, fi = Math.floor(t * (shake ? 40 : 18));
  const k = 0.92; const tf = `translate(${hx - 165 * k} ${hy - 125 * k}) scale(${k})`;
  dragon.setAttribute('href', frame('cuelga-metal', fi)); dragon.setAttribute('transform', tf); dragon.setAttribute('opacity', clamp((t - 0.35) * 5) * (t >= tDark ? 0 : 1));
  dGlow.setAttribute('href', frame('cuelga-luminoso-glow', fi)); dGlow.setAttribute('transform', tf); dGlow.setAttribute('opacity', t >= tDark && t < tReal ? E.out(prog(t, tDark, tDark + 0.3)) : 0);
  // the countdown
  const left = clamp(t1 - t, 0, 10), n = t < t0 ? 10 : Math.ceil(left - 1e-6);
  if (num.textContent !== String(n)) num.textContent = String(n);
  arc.setAttribute('stroke-dashoffset', t < t0 ? 0 : 1 - left / 10);
  const tick = t >= t0 ? Math.exp(-((t - t0) % 1) * 10) : 0; timer.setAttribute('transform', `translate(470 380) scale(${1 + tick * 0.08})`);
  timer.setAttribute('opacity', clamp((t - 0.2) * 4)); reveal(tlab, 0.3, 0.8, t);
  // the points, written as they are said
  reveal(P1, T.at('uno') - 0.05, T.at('3d') + 0.2, t); reveal(P1b, T.at('mueve') - 0.2, T.at('entero') + 0.3, t);
  reveal(P2, T.at('dos') - 0.05, T.at('ochenta') + 0.3, t); arrow.setAttribute('stroke-dashoffset', 1 - E.inOut(prog(t, T.at('ochenta') - 0.1, T.at('centímetros') + 0.2)));
  reveal(P3, T.at('tres') - 0.05, T.at('colores'), t);
  dots.forEach((d, i) => { const ti = T.at('ocho', 2) + i * 0.08, p = E.back(prog(t, ti, ti + 0.2)); d.setAttribute('r', 40 * p); });
  const dk = t >= tDark && t < tReal ? E.out(prog(t, tDark, tDark + 0.25)) : 0; dark.setAttribute('opacity', dk * 0.93);
  reveal(P4, T.at('cuatro') + 0.1, T.at('oscuridad'), t);
  // the marker hand follows whatever is being written
  const jobs = [[P1, T.at('uno') - 0.05, T.at('3d') + 0.2], [P1b, T.at('mueve') - 0.2, T.at('entero') + 0.3], [P2, T.at('dos') - 0.05, T.at('ochenta') + 0.3], [P3, T.at('tres') - 0.05, T.at('colores')], [P4, T.at('cuatro') + 0.1, T.at('oscuridad')]];
  let hp = null; for (const [w, a, b] of jobs) if (t >= a && t < b) { const p = prog(t, a, b); hp = [w.x + p * w.w, +w.r.getAttribute('y') + 60 + Math.sin(t * 40) * 6]; }
  hand.setAttribute('opacity', hp ? 1 : 0); if (hp) hand.setAttribute('transform', `translate(${hp[0]} ${hp[1]})`);
  // the real one
  const rp = E.back(prog(t, tReal, tReal + 0.35)); real.setAttribute('opacity', clamp((t - tReal) * 8)); real.setAttribute('transform', `translate(540 900) scale(${lerp(1.15, 1, rp)}) translate(-540 -900)`);
  const bg = svg.querySelector('rect'); if (t >= tReal) { dark.setAttribute('opacity', 0); }
  reveal(rb, T.at('link') - 0.05, T.at('perfil') + 0.3, t);
  if (t >= tReal) { [P1, P1b, P2, P3, P4].forEach((w) => w.g.setAttribute('opacity', 0)); arrow.setAttribute('opacity', 0); dots.forEach((d) => d.setAttribute('opacity', 0)); guy.root.setAttribute('opacity', 0); dragon.setAttribute('opacity', 0); timer.setAttribute('opacity', 0); tlab.g.setAttribute('opacity', 0); }
  else { [P1, P1b, P2, P3, P4].forEach((w) => w.g.setAttribute('opacity', 1)); arrow.setAttribute('opacity', 1); dots.forEach((d) => d.setAttribute('opacity', 1)); guy.root.setAttribute('opacity', 1); tlab.g.setAttribute('opacity', 1); }
  if (t < tReal) C.update(t, dk > 0.5); else document.getElementById('cap').style.opacity = 0;
}

const imgs = []; for (const n of ['cuelga-metal', 'cuelga-luminoso-glow']) for (let i = 0; i < 30; i++) { const im = new Image(); im.src = frame(n, i); imgs.push(im.decode().catch(() => {})); }
const ri = new Image(); ri.src = 'img/real.jpg'; imgs.push(ri.decode().catch(() => {})); await Promise.all(imgs);
for (const f of ['700 60px Caveat', '400 60px Marker', '800 60px Inter']) await document.fonts.load(f, 'Aá0¡·→');
// marker squeaks while writing, a tick each second of the countdown
const squeak = (a, b) => { for (let x = a; x < b; x += 0.16) A.fx(x, 'swish', 0.08, 0.3); };
[[T.at('uno') - 0.05, T.at('3d') + 0.2], [T.at('mueve') - 0.2, T.at('entero') + 0.3], [T.at('dos') - 0.05, T.at('ochenta') + 0.3], [T.at('tres') - 0.05, T.at('colores')], [T.at('cuatro') + 0.1, T.at('oscuridad')]].forEach(([a, b]) => squeak(a, b));
for (let s = 0; s < 10; s++) A.fx(t0 + s, 'tick', 0.16, 0);
A.fx(0.05, 'swish', 0.2); A.rattle(T.at('mueve') - 0.1, 7, 0.1, 0.28);
for (let i = 0; i < 8; i++) A.fx(T.at('ocho', 2) + i * 0.08, 'pop', 0.12 + i * 0.01, -0.4 + i * 0.1);
A.fx(tDark, 'lightswitch', 0.5); A.fx(tDark + 0.2, 'shimmer', 0.4);
A.fx(tReal, 'paper', 0.4); A.fx(tReal + 0.05, 'impact', 0.25); A.fx(T.at('link'), 'click', 0.34);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0_ = performance.now(); const loop = () => { render(((performance.now() - t0_) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
