// «¡Si doblas un folio 42 veces, llega a la Luna!». Pixel art de videojuego: un chaval dobla un folio y la pila de papel
// crece; la cámara sube con ella por las nubes, un avión, el Everest (doblez 27) y el espacio hasta tocar la Luna (42).
// Marcador arriba (dobleces y grosor real: 0,1 mm × 2^n), el texto escrito en un cuadro de diálogo mientras se dice, y al
// final vuelve al suelo: «récord real: 12». Dibujado en un lienzo de 180×320 y ampliado seis veces sin suavizar.
import { clamp, lerp, prog, E } from '../kit/util.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: [], dur: DUR });
const A = sonido();
const cv = document.getElementById('px'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const W = 180, H = 320;
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const spr = (rows, pal) => ({ rows, pal, w: rows[0].length, h: rows.length });
const draw = (s, x, y, k = 1) => { for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const c = s.rows[j][i]; if (c !== '.') R(x + i * k, y + j * k, k, k, s.pal[c]); } };
const PAL = { k: '#1a1028', s: '#f2c29b', h: '#3b2416', r: '#2e9bff', d: '#1d5fb0', b: '#30304a', w: '#ffffff', y: '#ffd43b', p: '#ff6b8a' };
const KID = [
  spr(['....hhhhh...', '...hhhhhhh..', '...hsssssh..', '...sksskss..', '...sssssss..', '....s.pp.s..', '...rrrrrrr..', '..rrrrrrrrr.', '.srrrrrrrrrs', '.s.rrrrrrr.s', '...rrrrrrr..', '...bbbbbbb..', '...bb...bb..', '...bb...bb..', '...kk...kk..', '..kkk...kkk.'], PAL),
  spr(['....hhhhh...', '...hhhhhhh..', '...hsssssh..', '...sksskss..', '...sssssss..', '....s.ss.s..', '...rrrrrrr..', 'ssrrrrrrrrss', '..rrrrrrrrr.', '...rrrrrrr..', '...rrrrrrr..', '...bbbbbbb..', '...bb...bb..', '...bb...bb..', '...kk...kk..', '..kkk...kkk.'], PAL),
];
const SWEAT = spr(['.w.', 'www', '.w.'], { w: '#8fd3ff' });

// tiempos
const tF0 = T.at('cada') - 0.05, t10 = T.at('10', 2), t27 = T.at('27'), t42 = T.at('42', 2), tLuna = T.at('luna', 2), tRec = T.at('récord') - 0.1;
// dobleces a lo largo del vídeo
function folds(t) {
  if (t < tF0) return 0;
  if (t < T.at('10')) return Math.floor(lerp(0, 3, prog(t, tF0, tF0 + 1.2)));
  if (t < t10) return Math.floor(lerp(3, 10, prog(t, T.at('10') - 0.2, t10)));
  if (t < t27) return Math.floor(lerp(10, 27, E.inOut(prog(t, t10 + 0.3, t27))));
  if (t < tRec) return Math.floor(lerp(27, 42, E.inOut(prog(t, t42 - 0.2, tLuna - 0.3))));
  return 12;
}
// altura dibujada de la pila (en píxeles del mundo): lineal hasta 10, luego exponencial hasta el Everest (27) y la Luna (42)
const GROUND = 0, EVEREST = 560, MOON = 1880;
function alto(f) {
  if (f <= 10) return f * 2.2;
  if (f <= 27) return 22 * Math.pow(EVEREST / 22, (f - 10) / 17);
  return EVEREST * Math.pow((MOON - 30) / EVEREST, (f - 27) / 15);
}
const grosor = (f) => { const mm = 0.1 * Math.pow(2, f); if (mm < 10) return mm.toFixed(1).replace('.', ',') + ' MM'; if (mm < 1000) return Math.round(mm / 10) + ' CM'; if (mm < 1e6) return Math.round(mm / 1000) + ' M'; return Math.round(mm / 1e6).toLocaleString('es-ES') + ' KM'; };
// el mundo: y sube hacia arriba; la pantalla ve [camY, camY + 320)
const sy = (wy, camY) => H - 70 - (wy - camY);
let shownF = 0;
function sky(camY) {
  // del azul al negro del espacio según la altura
  for (let y = 0; y < H; y += 4) {
    const wy = camY + (H - 70 - y), k = clamp((wy - 500) / 600);
    const c = [lerp(110, 8, k), lerp(190, 10, k), lerp(255, 30, k)].map(Math.round);
    R(0, y, W, 4, `rgb(${c})`);
  }
}
const STARS = Array.from({ length: 140 }, (_, i) => [((i * 73) % 180), 650 + ((i * 197) % 1400), i % 7 === 0 ? 2 : 1]);
const CLOUDS = [[20, 180], [110, 240], [60, 330], [130, 400]];
function world(t, camY) {
  sky(camY);
  STARS.forEach(([x, wy, s]) => { const y = sy(wy, camY); if (y > -2 && y < H) R(x, y, s, s, (Math.floor(t * 4 + x) % 9) ? '#ffffff' : '#ffd43b'); });
  // nubes
  CLOUDS.forEach(([x, wy], i) => { const y = sy(wy, camY), xx = (x + t * (4 + i)) % 220 - 30; if (y > -20 && y < H + 20) { R(xx, y, 34, 8, '#fff'); R(xx + 6, y - 6, 20, 6, '#fff'); R(xx + 2, y + 8, 30, 2, '#cfe8ff'); } });
  // un avión
  { const y = sy(300, camY), x = 200 - ((t * 40) % 260); if (y > -10 && y < H) { R(x, y, 22, 4, '#e8eef5'); R(x + 16, y - 4, 4, 4, '#e8eef5'); R(x + 6, y + 4, 8, 2, '#9aa7b8'); R(x + 2, y + 1, 2, 1, '#2e9bff'); R(x + 6, y + 1, 2, 1, '#2e9bff'); R(x + 10, y + 1, 2, 1, '#2e9bff'); } }
  // el Everest a la derecha, con su nieve, a su altura
  { const base = sy(0, camY), top = sy(EVEREST, camY);
    for (let y = Math.max(0, Math.floor(top)); y < Math.min(H, base); y++) { const k = (y - top) / (base - top), w = 70 * k; R(180 - w - 10, y, w + 10, 1, k < 0.18 ? '#ffffff' : (y % 5 ? '#7d7f96' : '#6a6c82')); }
    const ly = top - 10; if (ly > 10 && ly < H - 60 && t > t10) { g.font = '8px Pix'; g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText('EVEREST', 176, ly); } }
  // la Luna arriba
  { const y = sy(MOON + 40, camY); if (y > -60) { g.save(); g.beginPath(); g.arc(90, y, 46, 0, Math.PI * 2); g.fillStyle = '#e9e6d6'; g.fill(); g.restore(); [[70, -14, 8], [104, 10, 11], [86, 22, 6], [110, -20, 5]].forEach(([x, dy, r]) => { g.beginPath(); g.arc(x, y + dy, r, 0, Math.PI * 2); g.fillStyle = '#c9c4ad'; g.fill(); }); } }
  // el suelo
  { const y = sy(0, camY); if (y < H + 10) { R(0, y, W, 6, '#4caf50'); R(0, y + 6, W, 80, '#7a4b2a'); for (let x = 0; x < W; x += 12) R(x + 3, y + 12 + (x % 24 ? 6 : 0), 4, 3, '#5d3820'); R(14, y - 26, 4, 26, '#7a4b2a'); R(4, y - 40, 24, 16, '#3d9a3f'); R(8, y - 46, 16, 6, '#3d9a3f'); } }
}
function hud(f) {
  R(0, 0, W, 30, '#0d0b1a'); R(0, 30, W, 2, '#ffd43b');
  g.font = '8px Pix'; g.textAlign = 'left'; g.fillStyle = '#8a8aff'; g.fillText('DOBLECES', 6, 12);
  g.fillStyle = '#ffd43b'; g.fillText(String(f).padStart(2, '0'), 78, 12);
  g.fillStyle = '#8a8aff'; g.fillText('GROSOR', 6, 25); g.fillStyle = '#5dffb0'; g.fillText(grosor(f), 64, 25);
  // barra hacia la Luna
  R(150, 6, 24, 20, '#1d1a5a'); R(152, 8 + 16 * (1 - f / 42), 20, 16 * (f / 42), '#5dffb0'); R(158, 2, 8, 4, '#e9e6d6');
}
function box(x, y, w, h) { R(x - 2, y - 2, w + 4, h + 4, '#ffffff'); R(x, y, w, h, '#1d1a5a'); R(x, y, w, 2, '#3b37a0'); }
function wrap(s, x, y, w) { g.font = '8px Pix'; g.textAlign = 'left'; g.fillStyle = '#fff'; const words = s.split(' '), lines = []; let line = ''; for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > w && line) { lines.push(line); line = wd; } else line = tt; } if (line) lines.push(line); lines.slice(-4).forEach((l, i) => g.fillText(l, x, y + i * 12)); }
function said(li, t) { return T.line(li).words.filter((w) => t >= w[1] - 0.12).map((w) => w[0]).join(' '); }
function banner(txt, t0, t1, t, color = '#ffd43b', y = 120) {
  if (t < t0 || t > t1) return; const p = E.back(prog(t, t0, t0 + 0.25)); g.save(); g.translate(90, y); g.scale(p, p);
  g.font = '16px Pix'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(txt, 2, 2); g.fillStyle = Math.floor(t * 8) % 2 ? color : '#fff'; g.fillText(txt, 0, 0); g.restore();
}
function render(t) {
  const f = folds(t), h = alto(f);
  // la cámara sigue la punta de la pila; al final vuelve al suelo
  let camY = Math.max(0, h - 150);
  if (t >= tRec) camY = lerp(camY, 0, E.inOut(prog(t, tRec, tRec + 0.5)));
  if (t >= tLuna - 0.3 && t < tRec) camY = MOON - 150;
  world(t, camY);
  // la pila de papel (o el bloque de 12 dobleces en el récord)
  const hs = t >= tRec ? 8 : h, base = sy(0, camY), top = base - hs;
  const px = 64, pw = t >= tRec ? 22 : f < 4 ? 26 - f * 4 : 14;
  if (hs > 0.5) { R(px, top, pw, base - top, '#fffdf6'); for (let y = Math.ceil(top) + 2; y < base; y += 3) R(px, y, pw, 1, '#d8d4c4'); R(px + pw - 2, top, 2, base - top, '#c9c4ad'); }
  else R(px - 6, base - 2, 30, 2, '#fffdf6');
  // el chaval al lado de la pila
  const ky = base - 32; if (ky < H + 10) { draw(KID[f !== shownF && t < tRec ? 1 : Math.floor(t * 2) % 2 && t < tF0 ? 1 : 0], px - 26, ky, 2); if (t >= tRec) draw(SWEAT, px - 4, ky - 6 + ((t * 10) % 4), 2); }
  shownF = f;
  // carteles
  banner('¿LUNA?', -1, tF0 - 0.1, t, '#ffd43b', 110);
  banner('x2', T.at('duplica') - 0.05, T.at('10') - 0.2, t, '#5dffb0', 130);
  banner('10 CM', T.at('centímetros') - 0.1, t10 + 0.7, t, '#5dffb0', 120);
  banner('>EVEREST', T.at('everest') - 0.2, t42 - 0.2, t, '#ffd43b', 120);
  banner('440.000 KM', T.at('kilómetros') - 0.3, tLuna - 0.35, t, '#5dffb0', 140);
  banner('¡LUNA!', tLuna - 0.3, tRec, t, '#ffd43b', 150);
  banner('RECORD: 12', tRec + 0.3, DUR, t, '#ff6b8a', 120);
  hud(f);
  // el cuadro de diálogo con lo que se dice
  const li = [0, 1, 2, 3, 4].reduce((a, i) => (t >= T.line(i).t0 - 0.05 ? i : a), 0);
  box(8, 254, 164, 58); wrap(said(li, t), 14, 268, 152); if (Math.floor(t * 3) % 2) R(160, 304, 5, 4, '#ffd43b');
  document.getElementById('flash').style.opacity = t >= tLuna - 0.3 ? 0.5 * Math.exp(-(t - tLuna + 0.3) * 8) : 0;
  C.update(t);
}
await document.fonts.load('8px Pix', 'Aá¡!0'); await document.fonts.load('16px Pix', 'A');
// sonido: un blip por doblez, fanfarrias en los hitos, el texto que se escribe
let prev = 0; for (let t = 0; t < DUR; t += 1 / 60) { const f = folds(t); if (f !== prev) { A.fx(t, f > prev ? 'tick' : 'swish', 0.18, -0.2 + (f % 5) * 0.1); prev = f; } }
T.words.forEach((w) => A.fx(w.t0, 'mouse', 0.05, 0.3));
A.fx(0.05, 'bell', 0.2); A.fx(T.at('duplica'), 'pop', 0.25); A.fx(T.at('centímetros'), 'correct', 0.25); A.fx(T.at('everest'), 'correct', 0.3);
A.fx(tLuna - 0.3, 'correct', 0.4); A.fx(tLuna - 0.15, 'confetti', 0.3); A.fx(tLuna - 0.3, 'shimmer', 0.25);
A.fx(tRec, 'whoosh', 0.3); A.fx(tRec + 0.3, 'buzzer', 0.15);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = render;
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
