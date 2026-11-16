// LÓNG · «Esta palabra china tiene sesenta y cuatro trazos». Rice paper and a brush, unrolled like a long scroll: the
// brush paints the four-dragon character 𪚥 in two seconds while a counter runs to 64, an ensō rings it, «¿adivinas qué
// significa?»; lower down it is built again: one dragon 龍 (16 strokes), the first squeezes aside for a second (龖, 32),
// both drop for a third on top (龘, 48: «dragones volando»), and a fourth (𪚥, 64)… «significaba… ¡hablador!», a red
// seal stamped across it; then the brand: 龍 painted, «LÓNG» and its seal; then the real dragon, sketched and shown.
// Sources: Victor Mair, «A (troop / troupe of) dragon(s) tromping / flying», Language Log, 4 Dec 2023 (龖 32 strokes,
// 龘 48, the four-dragon character 64, a variant of zhé 讋 «loquacious; talkative», obsolete). Stroke data: Make Me a
// Hanzi / hanzi-writer-data (Arphic Public License).
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente, gsap } from '../kit/dibujo.js';
import { circulo, flecha, nube } from '../kit/garabatos.js';
import { clamp, prog, E } from '../kit/kit.js';

const T = await tiempos();
await Promise.all([fuente('cb', '../fonts/caveat-brush.ttf'), document.fonts.load('128px Brocha'), document.fonts.load('900 112px Han', '龍'), document.fonts.load('800 46px Poppins')]);
const H = await (await fetch('../kit/hanzi/9f8d.json')).json();
const J = await (await fetch('trazo.json')).json();
const DUR = +(T.END + 0.5).toFixed(3);
const D = pizarra('arroz', { mundo: [-2000, -1500, 5080, 9000], manga: '#6b1d1d' });
const { el, linea, dibuja, escribe, caracter, camara, camaraYa, aparece, fotoReal, salida } = D;
const RED = '#c62828', INK = '#17130f', A = sonido();

// a 龍 placed by an outer group we move ourselves: {x, y, sx, sy}, its box is 640 x 640 at scale 1
const LONGS = [];
function longEn(st, t0, dur, { mano = true, fantasma = false } = {}) {
  // no ink filter on the characters: Chrome skips the stroke masks inside a filtered group (strokes show too early)
  const g = el('g', {}, D.art), gi = el('g', {}, g), s = { ...st };
  if (fantasma) { const fg = el('g', { transform: 'scale(0.625) translate(0 900) scale(1 -1)', opacity: 0.1 }, gi); H.strokes.forEach((d) => el('path', { d, fill: INK }, fg)); }
  const r = caracter(H, { x: 0, y: 0, size: 640, t0, dur, g: gi, mano, color: INK, ancho: 140, hueco: 0.012, ease: 'power1.inOut' });
  const L = { g, s, keys: [], tStrokes: D.S.filter((q) => r.meds.includes(q.el)).map((q) => q.t0) };
  L.apply = () => g.setAttribute('transform', `translate(${L.s.x.toFixed(2)} ${L.s.y.toFixed(2)}) scale(${L.s.sx.toFixed(4)} ${L.s.sy.toFixed(4)})`);
  L.apply(); LONGS.push(L); return L;
}
function mueve(L, t0, dur, to, ease = 'power3.inOut') { const from = { ...(L.last || L.s) }; L.last = { ...from, ...to }; D.tl.fromTo(L.s, from, { ...L.last, duration: dur, ease, immediateRender: false }, t0); }

// A · the hook: the four-dragon character painted in two seconds, the counter running to 64
camaraYa({ x: 380, y: 660, s: 1.75, r: 0 });
camara(0.3, 1.2, { x: 540, y: 960, s: 1.0 }, 'power2.inOut');
const t64 = T.at('trazos');
const A4 = [[220, 440], [540, 440], [220, 760], [540, 760]].map(([x, y], i) => longEn({ x, y, sx: 0.5, sy: 0.5 }, 0.04 + i * ((t64 - 0.08) / 4), (t64 - 0.12) / 4, { fantasma: true }));
const tQ = T.at('adivinas');
dibuja(linea(circulo(540, 762, 400, 400, 0.25), { w: 34, color: RED, op: 0.92 }), tQ - 0.05, 0.6, { ease: 'power2.inOut' });
A.fx(t64, 'gong', 0.18);

// B · lower down the scroll: built again, one dragon at a time
const BY = 1840;
const tB = T.at('un');
camara(tB - 0.42, 0.45, { x: 540, y: BY + 320 + 140, s: 1.0 }, 'power2.inOut'); A.fx(tB - 0.42, 'whoosh', 0.16);
const b1 = longEn({ x: 220, y: BY, sx: 1, sy: 1 }, tB + 0.02, T.at('trazos', 2) - tB + 0.15);
const tDos = T.at('dos');
mueve(b1, tDos - 0.12, 0.3, { sx: 0.5 }); A.fx(tDos - 0.12, 'swish', 0.2);
const b2 = longEn({ x: 540, y: BY, sx: 0.5, sy: 1 }, tDos + 0.2, 0.95);
const tTres = T.at('tres');
mueve(b1, tTres - 0.1, 0.3, { y: BY + 320, sy: 0.5 }); mueve(b2, tTres - 0.1, 0.3, { y: BY + 320, sy: 0.5 }); A.fx(tTres - 0.1, 'swish', 0.2);
const b3 = longEn({ x: 380, y: BY, sx: 0.5, sy: 0.5 }, tTres + 0.18, 0.85);
// «dragones volando»: wind and a cloud
const tVol = T.at('volando');
dibuja([linea('M150 ' + (BY + 120) + ' q60 -50 120 0 t120 0', { w: 9 }), linea('M820 ' + (BY + 80) + ' q60 -50 120 0 t120 0', { w: 9 }), linea(nube(900, BY + 330, 0.9), { w: 7 })], T.at('dragones', 2) + 0.05, 0.75, { hueco: 0.03 });
const tCua = T.at('cuatro', 2);
mueve(b3, tCua - 0.1, 0.25, { x: 220 }); A.fx(tCua - 0.1, 'swish', 0.2);
const b4 = longEn({ x: 540, y: BY, sx: 0.5, sy: 0.5 }, tCua + 0.12, 0.72);
// «significaba…»: the camera leans in; «¡hablador!»: a red seal across it, «bla bla bla», he laughs
const tSig = T.at('significaba');
camara(tSig, 0.9, { x: 540, y: BY + 320 + 120, s: 1.18, r: -1.5 }, 'power1.inOut');
const tHab = T.at('hablador');
const sello = el('g', { transform: `translate(540 ${BY + 330}) rotate(-8)` }, D.sobre);
el('rect', { x: -330, y: -95, width: 660, height: 190, rx: 16, fill: RED, opacity: 0.93 }, sello);
el('rect', { x: -312, y: -77, width: 624, height: 154, rx: 10, fill: 'none', stroke: '#f6e7d6', 'stroke-width': 6 }, sello);
el('text', { x: 0, y: 40, 'text-anchor': 'middle', 'font-family': 'Brocha', 'font-size': 128, fill: '#f6e7d6' }, sello, 'HABLADOR');
aparece(sello, tHab - 0.02, { tipo: 'sello' }); A.fx(tHab, 'thump', 0.5); A.fx(tHab, 'slap', 0.32);
camara(tHab + 0.1, 0.25, { s: 1.08, r: 1.5 }, 'power2.out');
[[170, BY - 40], [880, BY - 10], [800, BY + 720]].forEach(([x, y], i) => escribe('bla bla', { x, y, size: 76, font: 'cb', color: INK, t0: tHab + 0.25 + i * 0.32, dur: 0.3, align: 'center', mano: false }));
salida(tHab - 0.3);
camara(tHab + 0.55, 0.5, { s: 1.04, r: -0.8 }, 'sine.inOut');

// C · the brand: 龍 painted again, «LÓNG», and its seal
const CY = 3200;
const tMarca = T.at('nuestra');
camara(tMarca - 0.35, 0.5, { x: 540, y: CY + 330, s: 1.0, r: 0 }, 'power2.inOut'); A.fx(tMarca - 0.35, 'whoosh', 0.16);
const c1 = longEn({ x: 340, y: CY, sx: 0.62, sy: 0.62 }, tMarca + 0.02, 0.85);
escribe('LÓNG', { x: 540, y: CY + 620, size: 190, font: 'cb', color: INK, t0: T.at('long') - 0.1, dur: 0.5, align: 'center' });
const seal = el('g', { transform: `translate(800 ${CY + 470}) rotate(4)` }, D.sobre);
el('rect', { x: -70, y: -70, width: 140, height: 140, rx: 10, fill: RED }, seal);
el('text', { x: 0, y: 44, 'text-anchor': 'middle', 'font-family': 'Han', 'font-weight': 900, 'font-size': 112, fill: '#f6e7d6' }, seal, '龍');
aparece(seal, T.at('dragon', 2) - 0.05, { tipo: 'sello' }); A.fx(T.at('dragon', 2), 'thump', 0.45);

// D · the real one
const DY = 4280;
const tV = T.at('asi'), tFoto = T.at('verdad') - 0.04;
camara(tV - 0.55, 0.5, { x: 540, y: DY + 370 + 200, s: 1.0 }, 'power2.inOut'); A.fx(tV - 0.55, 'whoosh', 0.16);
fotoReal(J, 'img/real.jpg', { x: 170, y: DY, w: 740, t0: tV - 0.15, dur: tFoto - tV + 0.1, tFoto, ancho: 4.2, color: INK, cinta: '#e8c99a' });
salida(tFoto - 0.02);
A.fx(tFoto, 'shimmer', 0.26);
escribe('link en mi perfil', { x: 540, y: DY + 870, size: 96, font: 'cb', color: INK, t0: T.at('link') - 0.08, dur: 0.6, align: 'center' });
dibuja(flecha(800, DY + 850, 930, DY + 920, -0.3).map((d) => linea(d, { w: 8 })), T.at('perfil') + 0.05, 0.3);

// the stroke counter: phase A counts to 64, phase B again to 64
const cont = document.createElement('div'); cont.id = 'cont'; cont.innerHTML = '<b>0</b><span>TRAZOS</span>'; document.getElementById('stage').appendChild(cont);
const tA = A4.flatMap((L) => L.tStrokes).sort((a, b) => a - b), tBs = [b1, b2, b3, b4].flatMap((L) => L.tStrokes).sort((a, b) => a - b);
const nB = cont.querySelector('b'), sp = cont.querySelector('span');
function contador(t) {
  let n, show, q = false;
  if (t < tB - 0.5) { n = tA.filter((x) => x <= t).length; show = 1 - prog(t, tB - 0.75, tB - 0.5); q = t >= tQ - 0.1; }
  else { n = tBs.filter((x) => x <= t).length; show = prog(t, tB - 0.1, tB + 0.1) * (1 - prog(t, tHab - 0.1, tHab + 0.1)); }
  cont.style.opacity = clamp(show) * (n > 0 ? 1 : 0);
  nB.textContent = q ? '¿?' : String(n); sp.textContent = q ? '¿QUÉ SIGNIFICA?' : 'TRAZOS';
  const pulse = n && [16, 32, 48, 64].includes(n) ? 1 + 0.12 * Math.exp(-(t - (t < tB - 0.5 ? tA : tBs)[n - 1]) * 8) : 1;
  cont.style.transform = `scale(${pulse.toFixed(3)})`;
}
[16, 32, 48, 64].forEach((k) => { if (tBs[k - 1] !== undefined) A.fx(tBs[k - 1], 'bell', 0.14); });

const K = capas(T, { keys: ['sesenta', 'cuatro', 'dieciseis', 'treinta', 'dos', 'cuarenta', 'ocho', 'volando', 'hablador', 'long', 'dragon', 'verdad', 'perfil'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.26) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); LONGS.forEach((L) => L.apply()); contador(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
