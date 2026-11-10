// LÓNG · «Llevaba años buscando este objeto legendario…». 2D pixel art, a retro RPG: the hero walks down a torch-lit
// dungeon to a glowing chest, opens it and raises the golden dragon over his head (item get!), its stats come up (88 cm,
// moves piece by piece), the secret ability is unlocked in the dark (it glows) and LEVEL UP. Drawn on a 180×320 canvas and
// blown up six times with no smoothing; the dragon is the 3D one made pixel by the same blow-up. The dialogue box is the
// caption, typed as he speaks. The real photo at the end, sharp. Voice VelionF, chiptune-ish effects, no music.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: [], dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const tOpen = T.at('legendario') - 0.1, tGet = ln(1) - 0.05, tStat = ln(2) - 0.05, tSecret = ln(3) - 0.05, tGlow = T.at('brilla') - 0.06, tReal = ln(5) - 0.04;
const cv = document.getElementById('px'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
const W = 180, H = 320;
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
// a sprite from a string map: each character is a palette entry, '.' is clear
const spr = (rows, pal) => ({ rows, pal, w: rows[0].length, h: rows.length });
const draw = (s, x, y, flip = false, k = 2) => { for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const c = s.rows[j][flip ? s.w - 1 - i : i]; if (c !== '.') R(x + i * k, y + j * k, k, k, s.pal[c]); } };
const PAL = { k: '#1a1028', s: '#f2c29b', h: '#5b2d1a', r: '#ff3b4e', d: '#b51f33', b: '#3a5ed6', w: '#ffffff', y: '#ffd43b', g: '#8a8a9a' };
const HERO = [   // 16 wide, standing, two walking frames by the legs
  spr(['.....hhhhh......', '....hhhhhhh.....', '....hssssshh....', '....sksskss.....', '....sssssss.....', '.....s.ss.s.....', '....rrrrrrr.....', '...rrrrrrrrr....', '..srrrrrrrrrs...', '..s.rrrrrrr.s...', '....rrrrrrr.....', '....bbbbbbb.....', '....bb...bb.....', '....bb...bb.....', '....kk...kk.....', '...kkk...kkk....'], PAL),
  spr(['.....hhhhh......', '....hhhhhhh.....', '....hssssshh....', '....sksskss.....', '....sssssss.....', '.....s.ss.s.....', '....rrrrrrr.....', '...rrrrrrrrr....', '..srrrrrrrrrs...', '..s.rrrrrrr.s...', '....rrrrrrr.....', '....bbbbbbb.....', '...bb.....bb....', '..bb.......bb...', '..kk.......kk...', '.kkk.......kkk..'], PAL),
];
const HERO_UP = spr(['..s.........s...', '..s..hhhhh..s...', '..s.hhhhhhh.s...', '..s.hssssshhs...', '..ssksskss.ss...', '....sssssss.....', '.....s.ss.s.....', '....rrrrrrr.....', '...rrrrrrrrr....', '...rrrrrrrrr....', '....rrrrrrr.....', '....bbbbbbb.....', '....bb...bb.....', '....bb...bb.....', '....kk...kk.....', '...kkk...kkk....'], PAL);
const CHEST = spr(['..yyyyyyyyyyyy..', '.ydddddddddddddy', 'ydddddddddddddddy'.slice(0, 16), 'ykkkkkkyykkkkkky'.slice(0, 16), 'ydddddykkyddddddy'.slice(0, 16), 'ydddddddddddddddy'.slice(0, 16), 'ydddddddddddddddy'.slice(0, 16), 'yyyyyyyyyyyyyyyy'], { y: '#ffd43b', d: '#8a4a1f', k: '#1a1028' });
const CHEST_OPEN = spr(['yyyyyyyyyyyyyyyy', 'ykkkkkkkkkkkkkky', 'ydddddddddddddddy'.slice(0, 16), 'ydddddddddddddddy'.slice(0, 16), 'yyyyyyyyyyyyyyyy'], { y: '#ffd43b', d: '#8a4a1f', k: '#1a1028' });
// the dragon, from the 3D sprites, small enough to become pixels when blown up
const frames = (n, k) => Array.from({ length: k }, (_, i) => { const im = new Image(); im.src = `../sprites/${n}/${String(i).padStart(3, '0')}.png`; return im; });
const GOLD = frames('cuelga-oro', 30), GLOW = frames('cuelga-luminoso-glow', 30), COIL = frames('enrollado-oro', 1), GLOWC = frames('enrollado-luminoso-glow', 1);
const MOUTH = await (await fetch('boca.json')).json();
function dungeon(t, scroll, dark) {
  const wall = dark ? '#141024' : '#2a2140', wall2 = dark ? '#0f0c1c' : '#221a36', floor = dark ? '#16121f' : '#3b2f52', floor2 = dark ? '#120f1a' : '#33284a';
  R(0, 0, W, H, '#0d0b1a');
  for (let y = 40; y < 200; y += 8) for (let x = -16; x < W + 16; x += 16) R(x - (scroll % 16) + ((y / 8) % 2) * 8, y, 15, 7, (x + y) % 32 ? wall : wall2);
  for (let y = 200; y < H; y += 10) for (let x = -20; x < W + 20; x += 20) R(x - (scroll % 20) + ((y / 10) % 2) * 10, y, 19, 9, (x * 3 + y) % 40 ? floor : floor2);
  R(0, 236, W, 22, dark ? '#3a0d1c' : '#8f1d32'); R(0, 236, W, 2, dark ? '#5a1426' : '#c22a45'); R(0, 256, W, 2, dark ? '#5a1426' : '#c22a45');
  [[30, 120], [150, 120]].forEach(([x, y], i) => { const tx = x - (scroll % 120); R(tx, y, 4, 14, '#5a3a1a'); if (!dark) { const f = Math.sin(t * 17 + i * 3) > 0; R(tx - 1, y - 7, 6, 7, f ? '#ffd43b' : '#ff8a1f'); R(tx, y - 10, 4, 4, f ? '#ff8a1f' : '#ffd43b'); } });
}
function box(x, y, w, h) { R(x - 2, y - 2, w + 4, h + 4, '#ffffff'); R(x, y, w, h, '#1d1a5a'); R(x, y, w, 2, '#3b37a0'); }
function text(s, x, y, size, color = '#fff', align = 'left') { g.font = `${size}px Pix`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'top'; g.fillText(s, x, y); }
function wrap(s, x, y, w, size, color) { g.font = `${size}px Pix`; const words = s.split(' '); let line = '', yy = y; for (const wd of words) { const tt = line ? line + ' ' + wd : wd; if (g.measureText(tt).width > w && line) { text(line, x, yy, size, color); line = wd; yy += size + 4; } else line = tt; } if (line) text(line, x, yy, size, color); }
function said(li, t) { const l = T.line(li); return l.words.filter((w) => t >= w[1] - 0.03).map((w) => w[0]).join(' '); }
function render(t) {
  const dark = t >= tSecret && t < tReal, walking = t < tOpen;
  const scroll = walking ? t * 34 : tOpen * 34;
  dungeon(t, scroll, dark);
  // the chest comes to him
  const chestX = 118, heroX = walking ? lerp(-10, 70, prog(t, 0, tOpen)) : 70;
  const open = t >= tOpen;
  draw(open ? CHEST_OPEN : CHEST, chestX, open ? 240 : 234);
  if (!open && !dark) { const s = Math.sin(t * 8) > 0; R(chestX + 12, 226 - (t * 20) % 10, 2, 2, '#ffd43b'); R(chestX + 22, 222 - (t * 26) % 12, 2, 2, s ? '#fff' : '#ffd43b'); R(chestX + 4, 224 - (t * 17) % 9, 2, 2, '#fff'); }
  // the hero, walking, then the item over his head
  const getting = t >= tGet;
  if (!getting) draw(HERO[walking ? Math.floor(t * 8) % 2 : 0], heroX, 218);
  else draw(HERO_UP, heroX, 218);
  // the golden dragon: out of the chest, then up in his hands, then glowing in the dark
  const fi = Math.floor(t * (t >= T.at('mueve') && t < tSecret ? 36 : 16)) % 30;
  if (open && !getting) { const u = E.out(prog(t, tOpen, tGet)); g.drawImage(COIL[0], chestX - 14, 206 - u * 34, 62, 54); }
  if (getting) {
    const hx = heroX + 16, swing = t >= T.at('mueve') - 0.1 && t < tGlow;
    if (swing) {   // «se mueve pieza a pieza»: hanging from his hands, swinging
      const k = 0.125; g.drawImage(GOLD[fi], hx + 10 - 165 * k, 170 - 125 * k - 4, 360 * k, 1000 * k);
    } else {   // the item over his head, coiled: it reads as a dragon at any size
      const glowOn = dark && t >= tGlow, im = glowOn ? GLOWC[0] : COIL[0], bob = Math.sin(t * 5) * 2, w = 96, h = 84;
      if (glowOn) { g.save(); g.shadowColor = '#5dffb0'; g.shadowBlur = 14; }
      g.drawImage(im, hx - w / 2, 142 + bob, w, h);
      if (glowOn) g.restore();
    }
    if (t < tGet + 0.6 && !dark) { const r = (t - tGet) * 70; for (let a = 0; a < 8; a++) R(hx + Math.cos(a * 0.785) * r, 168 + Math.sin(a * 0.785) * r, 2, 2, '#ffd43b'); }
  }
  // the dark: only the glow lights him
  if (dark) { g.save(); g.globalAlpha = t >= tGlow ? 0.35 : 0.75; R(0, 0, W, H, '#05040b'); g.restore(); if (t >= tGlow) { g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(96, 210, 2, 96, 210, 80); gr.addColorStop(0, 'rgba(93,255,176,0.55)'); gr.addColorStop(1, 'rgba(93,255,176,0)'); g.fillStyle = gr; g.fillRect(0, 100, W, 180); g.restore(); } }
  // the windows: the title, the item, its stats, the secret
  if (t < tGet) { box(10, 16, 160, 34); text('MAZMORRA', 90, 22, 8, '#ffd43b', 'center'); text('NIVEL 88', 90, 36, 8, '#fff', 'center'); }
  if (getting && t < tReal) {
    box(8, 16, 164, 100);
    text('¡OBJETO', 90, 22, 10, '#ffd43b', 'center'); text('LEGENDARIO!', 90, 36, 10, '#ffd43b', 'center');
    text('DRAGON', 16, 56, 8, '#fff'); R(52, 53, 2, 1, '#fff'); R(51, 54, 2, 1, '#fff'); /* the font squeezes Ó to lowercase height: a full O with its accent drawn above */ text('ARTICULADO', 16, 66, 8, '#fff');
    if (t >= T.at('ochenta')) { text('LONG.', 16, 82, 8, '#8a8aff'); text('88 CM', 100, 82, 8, '#ffd43b'); }
    if (t >= T.at('mueve')) { text('HAB.', 16, 94, 8, '#8a8aff'); text('PIEZA A', 100, 94, 8, '#5dffb0'); text('PIEZA', 100, 104, 8, '#5dffb0'); }
    if (t >= tSecret) { R(10, 120, 160, 20, '#000'); R(12, 122, 156, 16, '#1d1a5a'); text(t >= tGlow ? 'SECRETA: BRILLA' : 'SECRETA: ?????', 90, 126, 8, t >= tGlow ? '#5dffb0' : '#fff', 'center'); }
  }
  // LEVEL UP
  if (t >= tGlow + 0.4 && t < tReal) { const p = E.back(prog(t, tGlow + 0.4, tGlow + 0.7)); g.save(); g.translate(90, 160); g.scale(p, p); text('LEVEL UP!', 0, -6, 14, Math.floor(t * 10) % 2 ? '#ffd43b' : '#fff', 'center'); g.restore(); }
  // the dialogue box: what he says, typed out
  const li = [0, 1, 2, 3, 4].reduce((a, i) => (t >= ln(i) - 0.05 ? i : a), 0);
  if (t < tReal) { box(8, 268, 164, 44); const s = said(li, t); wrap(s, 14, 274, 152, 8, '#fff'); if (Math.floor(t * 3) % 2) R(160, 304, 5, 4, '#ffd43b'); }
  // talking: the head bobs with the voice (one pixel)
  // the real one
  const rp = E.back(prog(t, tReal, tReal + 0.35)), real = document.getElementById('real');
  real.style.opacity = clamp((t - tReal) * 8); real.style.transform = `scale(${lerp(1.15, 1, rp)})`;
  document.getElementById('flash').style.opacity = Math.max(0.55 * Math.exp(-Math.max(0, t - tGet) * 9) * (t >= tGet ? 1 : 0), 0.5 * Math.exp(-Math.max(0, t - tReal) * 10) * (t >= tReal ? 1 : 0));
  C.update(t);
}
await Promise.all([...GOLD, ...GLOW, ...COIL, ...GLOWC, ...document.images].map((im) => im.decode().catch(() => {})));
await document.fonts.load('8px Pix', 'Aá¡!');
// effects: footsteps, the chest, the item jingle, blips as the text types
for (let x = 0.1; x < tOpen; x += 0.25) A.fx(x, 'tap', 0.1, 0);
A.fx(tOpen, 'thump', 0.3); A.fx(tOpen + 0.05, 'shimmer', 0.25);
A.fx(tGet, 'correct', 0.4); A.fx(tGet + 0.12, 'bell', 0.3); A.fx(tGet + 0.25, 'bell', 0.22);
T.words.forEach((w) => { if (w.t0 < tReal) A.fx(w.t0, 'tick', 0.06, 0.2); });
A.fx(T.at('ochenta'), 'pop', 0.2); A.rattle(T.at('mueve'), 8, 0.1, 0.26);
A.fx(tSecret, 'riser', 0.25); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.4, 'correct', 0.32); A.fx(tGlow + 0.45, 'confetti', 0.2);
A.fx(tReal, 'impact', 0.3); A.fx(T.at('link'), 'click', 0.36);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
