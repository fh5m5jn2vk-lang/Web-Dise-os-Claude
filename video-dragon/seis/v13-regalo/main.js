// LÓNG · «¿No sabes qué regalar esta Navidad?». A red gift with a gold ribbon on a wooden table, fairy lights out of
// focus behind, snow. It shakes, the lid flies off on «¡mira esto!», the dragon rises out of it in a spiral (Oro y rojo,
// the Christmas one), runs through the eight colours, glows in the dark, and the honest urgency: 7-12 working days, so
// order in time. Voice VelionF, lo-fi, effects. window.__render(t), window.__dur.
import { stage, V, E, clamp, lerp, prog, COLS, SWC } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const S = await stage({ set: 'regalo', bloom: 0.32 });
const C = capas(T, { keys: ['regalar', 'navidad', 'esto', 'ochenta', 'centímetros', 'mueve', 'colores', 'brilla', 'oscuridad', 'días', 'tiempo', 'perfil'], top: 1210, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const tOpen = T.at('mira') - 0.04, tRise0 = tOpen + 0.35, tRise1 = ln(1) + 1.6;
const tC0 = T.at('ocho', 2) - 0.05, tC1 = ln(3) - 0.1, tDark = ln(3) + 0.05, tGlow = T.at('brilla') - 0.05, tLight = ln(4) - 0.05, tEnd = T.END + 0.05;

C.hook('¿NO SABES QUÉ<br><em>REGALAR</em>?', 0.03, tOpen - 0.02);
C.item('<div class="badge">88 CM <small>articulado</small></div>', 40, 860, T.at('ochenta'), ln(2) - 0.05, 'slam', -4);
const sws = C.item(`<div class="sws8">${SWC.map((c) => `<i style="background:linear-gradient(135deg,${c})"></i>`).join('')}</div>`, 120, 430, tC0 - 0.08, tDark, 'rise');
C.item('<div class="glowtag">BRILLA EN LA<br>OSCURIDAD<small>color Luminoso</small></div>', 225, 420, tGlow + 0.3, tLight, 'pop', -3);
C.item('<div class="chip">entrega en <b>7-12 días</b> laborables</div>', 150, 420, T.at('tarda'), tEnd - 0.05, 'left');
C.item('<div class="sticker">¡PÍDELO<br>CON TIEMPO!</div>', 330, 560, T.at('pídelo'), tEnd - 0.05, 'stamp', -5);
C.item('<div class="btn">link en mi perfil</div>', 285, 960, T.at('link'), tEnd - 0.05, 'pop');
C.endCard(tEnd);
C.flash(tOpen, 0.35); C.flash(tLight, 0.3);

// snow, light and slow, over everything
const sx = document.getElementById('snow').getContext('2d');
const FL = Array.from({ length: 140 }, (_, i) => { const h = (k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; return { x: h(1) * 540, y: h(2) * 960, r: 0.8 + h(3) * 2.2, v: 18 + h(4) * 40, w: h(5) * 6 }; });
function snow(t, k) { sx.clearRect(0, 0, 540, 960); sx.fillStyle = 'rgba(255,255,255,0.75)'; FL.forEach((f) => { const y = (f.y + t * f.v) % 980 - 10, x = f.x + Math.sin(t * 0.8 + f.w) * 12; sx.globalAlpha = k * (0.4 + f.r / 4); sx.beginPath(); sx.arc(x, y, f.r, 0, 6.283); sx.fill(); }); sx.globalAlpha = 1; }

function shot(t) {
  const P = S.P, L = S.L;
  // the box shakes before it opens; the lid flies off
  const shake = t < tOpen ? Math.sin(t * 46) * 0.035 * (Math.max(0, Math.sin((t - 0.25) * 4.2)) ** 2) : 0;
  L.box.rotation.z = shake; L.box.position.y = Math.abs(shake) * 0.6;
  const lu = prog(t, tOpen, tOpen + 0.7);
  L.lid.position.set(lu * 2.6, 1.5 + Math.abs(shake) * 0.6 + lu * 3.4 - lu * lu * 1.2, lu * 2.2); L.lid.rotation.set(lu * 1.8, lu * 0.8, shake + lu * -2.2);
  L.lid.visible = lu < 1;
  const u = E.out(prog(t, tRise0, tRise1));
  P.rise(t, u, { base: 1.5, height: 2.6, r: 0.66, turns: 2.4 });
  S.dragon.group.visible = t >= tOpen + 0.06;   // inside the box until the lid goes
  if (t < ln(1)) { const k = prog(t, 0, ln(1)); return { cp: V(lerp(0.4, 0.2, k), lerp(2.6, 2.7, k), lerp(7.2, 6.2, k)), ca: V(0, lerp(1.0, 1.6, E.inOut(prog(t, tOpen, ln(1)))), 0), fov: 38 }; }
  if (t < ln(2)) { const k = E.inOut(prog(t, ln(1), ln(2))); return { cp: V(lerp(1.4, 0.9, k), lerp(2.8, 4.1, k), lerp(6.4, 6.0, k)), ca: V(0, lerp(2.5, 3.5, k), 0), fov: 40 }; }
  if (t < tDark) { const k = prog(t, ln(2), tDark), a = lerp(0.2, 1.1, k); return { cp: V(Math.sin(a) * 6.0, 3.9, Math.cos(a) * 6.0), ca: V(0, 3.4, 0), fov: 40 }; }
  if (t < tLight) { const k = E.inOut(prog(t, tDark, tLight)); return { cp: V(lerp(1.8, 1.2, k), lerp(4.0, 4.1, k), lerp(6.4, 5.6, k)), ca: V(0, 3.4, 0), fov: 38 }; }
  const k = E.inOut(prog(t, tLight, DUR)); return { cp: V(lerp(-0.8, -0.2, k), lerp(3.6, 3.4, k), lerp(7.0, 8.0, k)), ca: V(0, 2.9, 0), fov: 40 };
}

function render(t) {
  const s = shot(t), dark = t >= tDark && t < tLight;
  const lk = dark ? lerp(1, 0.05, E.out(prog(t, tDark, tDark + 0.3))) : 1;
  S.L.lights(lk);
  let col = 'orojo';
  if (t >= tC0 && t < tC1) col = COLS[Math.min(7, Math.floor((t - tC0) / ((tC1 - tC0) / 8)))];
  else if (t >= tC1 && t < tLight) col = 'luminoso';
  const glow = dark ? E.expo(prog(t, tGlow - 0.2, tGlow + 0.4)) * (0.9 + 0.1 * Math.sin(t * 3)) : 0;
  S.frame(t, { ...s, col, glow, exposure: dark ? 0.95 : 1, glowLight: 1.2 });
  sws.d.querySelectorAll('i').forEach((c, i) => { const ti = tC0 + i * ((tC1 - tC0) / 8); c.style.opacity = t >= ti ? 1 : 0.25; c.classList.toggle('on', t >= ti && t < ti + (tC1 - tC0) / 8); c.style.transform = `scale(${t >= ti && t < ti + (tC1 - tC0) / 8 ? 1.2 : 1})`; });
  snow(t, dark ? 0.25 : 1);
  C.update(t, dark);
}

for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0龍¿');
A.forItems(C.IT);
A.fx(0.25, 'thump', 0.25); A.fx(0.95, 'thump', 0.25); A.fx(1.6, 'thump', 0.25);
A.fx(tOpen, 'impact', 0.36); A.fx(tOpen, 'confetti', 0.25); A.fx(tOpen + 0.05, 'whoosh', 0.22, 0.4);
A.fx(tRise0, 'riser', 0.2); A.rattle(tRise0 + 0.2, 10, 0.13, 0.26);
for (let i = 0; i < 8; i++) A.fx(tC0 + i * ((tC1 - tC0) / 8), 'tick', 0.14 + i * 0.012, -0.4 + i * 0.1);
A.fx(tDark, 'lightswitch', 0.5); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.05, 'sweep', 0.22);
A.fx(tLight, 'lightswitch', 0.4); A.fx(tLight + 0.02, 'bell', 0.16);
A.fx(T.at('link'), 'click', 0.4); A.fx(T.at('link') + 0.3, 'cash', 0.28); A.fx(tEnd, 'impact', 0.28); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '849.mp3', desde: 0, gain: 0.45, duck: 0.55, fadein: 0.02, fadeout: 1.2, silencios: [[tDark, tGlow + 0.1, 0.2]] }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
