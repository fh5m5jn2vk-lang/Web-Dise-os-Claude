// LÓNG · «Mi madre: "otro trasto no". Yo:». 2D, a flat cartoon in a kitchen: the mum, arms crossed, «¡otro trasto
// no!»; the kid already holding the dragon (the 3D one, as a sprite), shakes it ¡CLIC! ¡CLAC!, stretches it between
// them for the 88 cm, the light goes and it glows green on their faces; and then she has taken it, all smiles, while he
// sulks. The real photo at the end. Voice VelionF (no dead air), effects, no music. window.__render(t), window.__dur.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';
import { titere, defs, svgEl as el } from '../kit/titere.js';

const T = await tiempos(), DUR = T.G.dur;
const MOUTH = await (await fetch('boca.json')).json();
const C = capas(T, { keys: ['trasto', 'mueve', 'pieza', 'ochenta', 'centímetros', 'noche', 'brilla', 'quitado', 'verdad', 'perfil'], top: 250, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const tQ0 = T.at('otro') - 0.04, tQ1 = T.end('no'), tYo = T.at('yo') - 0.06, tShake = T.at('mueve') - 0.1, tCm = ln(2) - 0.05, tNight = T.at('noche') - 0.05, tGlow = T.at('brilla') - 0.05, tMom = ln(4) - 0.08, tReal = ln(5) - 0.04;
const svg = document.getElementById('scene'); defs(svg);
const cam = el('g', {}, svg);
// the kitchen
el('rect', { x: -400, y: -400, width: 1880, height: 2720, fill: '#ffd9b8' }, cam);
for (let x = -400; x < 1480; x += 90) el('rect', { x, y: -400, width: 40, height: 2720, fill: '#ffcfa8' }, cam);
const win = el('g', {}, cam);
el('rect', { x: 90, y: 420, width: 330, height: 300, rx: 16, fill: '#8fd3ff', stroke: '#1d1a2b', 'stroke-width': 8 }, win);
const sky = el('rect', { x: 94, y: 424, width: 322, height: 292, rx: 12, fill: '#8fd3ff' }, win);
const moon = el('circle', { cx: 330, cy: 500, r: 38, fill: '#fff6c8', opacity: 0 }, win);
el('path', { d: 'M 255 420 V 720 M 90 570 H 420', stroke: '#1d1a2b', 'stroke-width': 8 }, win);
el('ellipse', { cx: 170, cy: 500, rx: 54, ry: 22, fill: '#ffffff', opacity: 0.85 }, win);
el('rect', { x: 700, y: 520, width: 300, height: 20, rx: 8, fill: '#8a5a3c', stroke: '#1d1a2b', 'stroke-width': 6 }, cam);
el('path', { d: 'M 760 520 q -10 -70 20 -110 q 10 50 -6 110 Z M 790 520 q 20 -80 60 -100 q -10 60 -40 100 Z', fill: '#3fae6a', stroke: '#1d1a2b', 'stroke-width': 6 }, cam);
el('rect', { x: 870, y: 450, width: 80, height: 70, rx: 10, fill: '#ff8f8f', stroke: '#1d1a2b', 'stroke-width': 6 }, cam);
// the two of them
const mom = titere(cam, { skin: '#f0bf98', hair: '#5b2d1a', hairStyle: 'mom', shirt: '#4f7bff', shirt2: '#3a5ed6' });
const kid = titere(cam, { skin: '#f2c29b', hair: '#3a2418', hairStyle: 'kid', shirt: '#ff3b4e', shirt2: '#d62a3c' });
// the dragon: sprites of the 3D one
const img = (w, h) => el('image', { width: w, height: h, opacity: 0 }, cam);
const SP = { hang: 'cuelga-azulmorado', glow: 'cuelga-luminoso-glow', str: 'estirado-azulmorado' };
const dHang = img(360, 1000), dGlow = img(360, 1000), dStr = img(1000, 360), dMom = img(360, 1000);
dGlow.setAttribute('filter', 'url(#glow)');
const frame = (name, i) => `../sprites/${name}/${String(((i % 30) + 30) % 30).padStart(3, '0')}.png`;
// the counter in front, the night over it all, the green light of the dragon
el('rect', { x: -400, y: 1490, width: 1880, height: 1000, fill: '#c98a5a' }, cam);
el('rect', { x: -400, y: 1490, width: 1880, height: 34, fill: '#e2a874' }, cam);
el('rect', { x: -400, y: 1524, width: 1880, height: 10, fill: '#1d1a2b', opacity: 0.25 }, cam);
const night = el('rect', { x: -400, y: -400, width: 1880, height: 2720, fill: '#0b1030', opacity: 0 }, cam);
cam.appendChild(dGlow);
const gl = el('ellipse', { cx: 540, cy: 900, rx: 520, ry: 460, fill: 'url(#gg)', opacity: 0, style: 'mix-blend-mode: screen' }, cam);
svg.querySelector('defs').insertAdjacentHTML('beforeend', '<radialGradient id="gg"><stop offset="0" stop-color="#7dffc0" stop-opacity="0.95"/><stop offset="0.55" stop-color="#3fd690" stop-opacity="0.45"/><stop offset="1" stop-color="#3fd690" stop-opacity="0"/></radialGradient>');
const hearts = Array.from({ length: 9 }, (_, i) => { const h = el('text', { x: 0, y: 0, 'font-size': 70, fill: '#ff3b4e', stroke: '#1d1a2b', 'stroke-width': 4, 'font-family': 'Inter', 'font-weight': 900, opacity: 0 }, cam); h.textContent = '♥'; return h; });

C.item('<div class="bub">¡OTRO TRASTO NO!</div>', 60, 520, tQ0, tYo + 0.25, 'pop', -4);
C.item('<div class="sfx">¡CLIC!</div>', 560, 760, T.at('mueve'), tCm - 0.05, 'stamp', -10);
C.item('<div class="sfx" style="color:#5dffb0">¡CLAC!</div>', 600, 980, T.at('pieza', 2) - 0.05, tCm - 0.05, 'stamp', 8);
C.item('<div class="ruler">88 CM</div>', 160, 1560, T.at('ochenta'), tNight - 0.1, 'pop', -2);
C.item('<div class="sfx" style="color:#ffd43b;font-size:90px">¬¬</div>', 820, 600, tMom + 0.3, tReal, 'pop', 6);

const MV = (t) => MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
const blink = (t, ph) => { const x = (t * 0.37 + ph) % 1; return x < 0.04 ? Math.sin((x / 0.04) * Math.PI) : 0; };
function shot(t) {   // [focus x, y, zoom]
  if (t < tYo) return [545, 1080, lerp(1.0, 1.05, prog(t, 0, tYo))];
  if (t < ln(1)) { const u = E.out(prog(t, tYo, tYo + 0.18)); return [lerp(545, 700, u), lerp(1080, 930, u), lerp(1.05, 1.35, u)]; }
  if (t < tCm) return [640, 1040, lerp(1.16, 1.24, prog(t, ln(1), tCm))];
  if (t < tNight) return [545, 1070, lerp(1.0, 1.05, prog(t, tCm, tNight))];
  if (t < tMom) return [560, 1000, lerp(1.1, 1.18, prog(t, tNight, tMom))];
  return [500, 1060, lerp(1.02, 1.08, prog(t, tMom, DUR))];
}
function render(t) {
  const [fx, fy, z] = shot(t);
  cam.setAttribute('transform', `translate(540 960) scale(${z}) translate(${-fx} ${-fy})`);
  const mv = MV(t), quoting = t >= tQ0 && t < tQ1 + 0.05, momHas = t >= tMom, dark = t >= tNight && t < tMom;
  const bob = (ph) => Math.sin(t * 2.2 + ph) * 6;
  // the mum
  const momP = { x: 300, y: 1050 + bob(1), s: 1.3, lean: momHas ? Math.sin(t * 6) * 4 : 0, look: momHas ? 0.3 : 1, blink: blink(t, 0.3), mouth: quoting ? mv : momHas ? 0.15 + 0.1 * Math.sin(t * 9) : 0,
    smile: t < tShake ? -0.7 : t < tCm ? lerp(-0.7, 0.2, prog(t, tShake, tShake + 0.6)) : momHas ? 1 : 0.4, brows: t < tShake ? -1 : dark ? 1 : momHas ? 0.6 : 0.4, eyesBig: dark ? 1 : t >= tCm && t < tNight ? 0.6 : 0,
    head: momHas ? Math.sin(t * 6) * 6 : t < tShake ? -4 : 3,
    armF: momHas ? [210, -130 + Math.sin(t * 6) * 10] : t >= tCm && t < tNight ? [150, 60] : [-30, 150], armB: momHas ? [-150, 260] : [30, 140], bendF: momHas ? 1 : t >= tCm && t < tNight ? 1 : -1, bendB: t < tMom ? 1 : -1 };
  const hm = mom.set(momP);
  // the kid
  const shk = t >= tShake && t < tCm ? Math.sin((t - tShake) * 17) * 34 : 0;
  const kidP = { x: 760, y: 1075 + bob(0), s: 1.22, look: t < tYo ? -1 : -0.4, blink: blink(t, 0.7), mouth: quoting ? 0 : mv, smile: momHas ? -0.6 : 0.9, brows: momHas ? -1 : t < tYo ? -0.3 : 0.4,
    head: t >= tYo && t < ln(1) ? -8 : momHas ? 6 : 0, lean: momHas ? -3 : 0,
    armF: momHas ? [-30, 150] : [150, 290], armB: momHas ? [30, 140] : t >= tCm && t < tNight ? [-150, 70] : [-195 + shk, -135], bendF: momHas ? -1 : 1, bendB: momHas ? 1 : -1 };
  const hk = kid.set(kidP);
  // the dragon
  const fi = Math.floor(t * (t >= tShake && t < tCm ? 40 : 18));
  const toScene = (p, P) => [P.x + p[0] * P.s, P.y + p[1] * P.s];
  const place = (im, hand, k, show) => { im.setAttribute('opacity', show ? 1 : 0); if (!show) return; im.setAttribute('transform', `translate(${hand[0] - 165 * k} ${hand[1] - 125 * k}) scale(${k})`); };
  const kh = toScene(hk.hb, kidP), mh = toScene(hm.hf, momP);
  dHang.setAttribute('href', frame(SP.hang, fi)); place(dHang, kh, 0.95, t < tCm);
  dGlow.setAttribute('href', frame(SP.glow, fi)); place(dGlow, kh, 0.95, dark);
  dMom.setAttribute('href', frame(SP.hang, fi + 7)); place(dMom, mh, 0.95, momHas);
  // stretched between the mum's hand and his
  const kb = toScene(hk.hb, kidP), mf = toScene(hm.hf, momP);
  if (t >= tCm && t < tNight) { const k = 1.0, cx = (kb[0] + mf[0]) / 2, cy = (kb[1] + mf[1]) / 2; dStr.setAttribute('href', frame(SP.str, fi)); dStr.setAttribute('opacity', 1); dStr.setAttribute('transform', `translate(${cx + 500 * k} ${cy - 210 * k}) scale(${-k} ${k})`); }
  else dStr.setAttribute('opacity', 0);
  // night
  const nk = dark ? E.out(prog(t, tNight, tNight + 0.25)) : 0, gk = dark ? E.expo(prog(t, tGlow - 0.1, tGlow + 0.35)) : 0;
  night.setAttribute('opacity', nk * 0.84); sky.setAttribute('fill', dark ? '#1a2350' : '#8fd3ff'); moon.setAttribute('opacity', nk);
  gl.setAttribute('opacity', gk * (0.95 + 0.05 * Math.sin(t * 5))); gl.setAttribute('cx', 560); gl.setAttribute('cy', 900); gl.setAttribute('rx', 640); gl.setAttribute('ry', 560);
  // hearts round the mum
  hearts.forEach((h, i) => { const a = t - tMom - i * 0.08; if (a < 0 || t > tReal) { h.setAttribute('opacity', 0); return; } const ang = (i / 9) * Math.PI * 2; h.setAttribute('opacity', 1 - prog(a, 0.6, 1.3)); h.setAttribute('transform', `translate(${mh[0] + Math.cos(ang) * (120 + a * 160)} ${mh[1] - 200 + Math.sin(ang) * (90 + a * 100) - a * 120}) scale(${0.6 + 0.4 * Math.sin(i)})`); });
  // the real one
  const rp = E.back(prog(t, tReal, tReal + 0.35)), real = document.getElementById('real');
  real.style.opacity = clamp((t - tReal) * 8); real.style.transform = `scale(${lerp(1.15, 1, rp)})`;
  document.getElementById('flash').style.opacity = Math.max(0.5 * Math.exp(-Math.max(0, t - tReal) * 10) * (t >= tReal ? 1 : 0), 0.35 * Math.exp(-Math.max(0, t - tMom) * 10) * (t >= tMom ? 1 : 0));
  C.update(t, dark);
}

// load every sprite frame first, so no frame is drawn half-loaded
const names = [SP.hang, SP.glow, SP.str]; const imgs = [];
for (const n of names) for (let i = 0; i < 30; i++) { const im = new Image(); im.src = frame(n, i); imgs.push(im.decode().catch(() => {})); }
imgs.push(...[...document.images].map((im) => im.decode().catch(() => {}))); await Promise.all(imgs);
for (const f of ['400 60px Bungee', '800 60px Inter', '400 60px Anton']) await document.fonts.load(f, 'Aá0¡¬♥');
A.forItems(C.IT);
A.fx(0.02, 'pop', 0.25); A.fx(T.at('no'), 'thump', 0.4); A.fx(tYo, 'whoosh', 0.25, 0.4); A.fx(tYo + 0.05, 'swish', 0.2);
A.rattle(tShake, 10, 0.1, 0.32); A.fx(tCm, 'whoosh', 0.18); A.fx(T.at('ochenta'), 'tick', 0.2);
A.fx(tNight, 'lightswitch', 0.55); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.05, 'sweep', 0.22);
A.fx(tMom, 'swish', 0.25); A.fx(tMom + 0.1, 'bell', 0.16); A.fx(tMom + 0.2, 'pop', 0.2);
A.fx(tReal, 'impact', 0.3); A.fx(tReal + 0.05, 'shimmer', 0.22); A.fx(T.at('link'), 'click', 0.36);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
