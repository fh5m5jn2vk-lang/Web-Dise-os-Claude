// V5 · "¿Cuánto cuesta?" A TV game show: an LED wall, swinging spotlights, a marquee of bulbs, the dragon turning on a
// pedestal, three podiums with prices, a countdown, the reveal with confetti and applause, a double offer, and the
// sale board. The host's voice drives every beat.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';

const TI = await (await fetch('tiempos.json')).json();
const LN = Object.fromEntries(TI.lines.map((l) => [l.id, l]));
const DUR = TI.dur;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), back: (t) => { const c = 2.2, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const word = (id, i) => LN[id].words[Math.min(i, LN[id].words.length - 1)][1];
const T_BRILLA = LN.l2.words.find((w) => w[0].startsWith('brilla'))?.[1] ?? LN.l2.t1 - 1;
const REVEAL = LN.l6.t0, BONUS = LN.l7.t0 + 0.15, BANNER = LN.l8.t0 - 0.1;
const $ = (s) => document.querySelector(s);

/* ---------- the dragon on its turntable ---------- */
const cv = $('#prod');
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(900, 760, false); R.setClearColor(0, 0);
R.toneMapping = THREE.ACESFilmicToneMapping;
const sc = new THREE.Scene(); sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.6;
const cam = new THREE.PerspectiveCamera(30, 900 / 760, 0.05, 50); cam.position.set(0, 1.55, 4.3); cam.lookAt(0, 0.62, 0);
const key = new THREE.SpotLight('#ffffff', 80, 14, 0.6, 0.6, 2); key.position.set(0, 6, 3); sc.add(key, key.target);
const rimA = new THREE.PointLight('#ff4fd8', 20, 9, 2); rimA.position.set(-3, 1.5, -1.5); sc.add(rimA);
const rimB = new THREE.PointLight('#3bd5ff', 20, 9, 2); rimB.position.set(3, 1.5, -1.5); sc.add(rimB);
const glowL = new THREE.PointLight('#6dffb0', 0, 5, 2); sc.add(glowL);
const dragon = createDragon(sc, { hq: true });
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), dense = Array.from({ length: 500 }, () => new THREE.Vector3());
function coil(t, rot) {
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.6 + u * Math.PI * 4.4 + rot, r = 0.32 + u * 0.92; dense[i].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  let acc = 0, j = 0; spine[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { spine[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + (i < 7 ? Math.pow(1 - i / 7, 2) * (0.72 + Math.sin(t * 2.4) * 0.06) : 0);
  for (let i = 0; i < 7; i++) { const f = Math.pow(1 - i / 7, 2); spine[i].z += 0.3 * f; }
}
function product(t, glow) {
  // the whole coil turns with the turntable
  const rot = t * 0.55; coil(t, 0);
  const c = Math.cos(rot), s = Math.sin(rot);
  for (const p of spine) { const x = p.x * c - p.z * s, z = p.x * s + p.z * c; p.x = x; p.z = z; }
  key.intensity = 80 * (1 - glow); rimA.intensity = 20 * (1 - glow * 0.9); rimB.intensity = 20 * (1 - glow * 0.9); sc.environmentIntensity = lerp(0.6, 0.02, glow);
  glowL.intensity = glow * 3; glowL.position.copy(spine[12]).add(new THREE.Vector3(0, 0.5, 0));
  dragon.update(spine, t, glow * 0.6);
  R.render(sc, cam);
}

/* ---------- the LED wall ---------- */
const led = $('#led').getContext('2d'), LW = 54, LH = 58;
function ledWall(t) {
  led.fillStyle = '#0d0020'; led.fillRect(0, 0, 540, 580);
  const rev = t - REVEAL, revOn = rev > 0 && rev < 2.5, dim = t > T_BRILLA - 0.1 && t < LN.l2.t1 + 0.3;
  for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
    const cx = x - LW / 2, cy = y - LH / 2, r = Math.hypot(cx, cy);
    let h = (r * 0.06 - t * 0.35) % 1, l = 0.35 + 0.25 * Math.sin(r * 0.4 - t * 4);
    if (t > LN.c3.t0 - 0.1 && t < REVEAL) { h = 0.13; l = 0.25 + 0.4 * Math.max(0, Math.sin((t - LN.c3.t0) * Math.PI * 2 * 0.9 - r * 0.2)); }
    if (revOn) { h = (0.12 + Math.floor(rev * 8) * 0.17 + r * 0.01) % 1; l = 0.45 + 0.35 * Math.sin(r * 0.6 - rev * 14); }
    if (dim) l *= 0.15;
    led.fillStyle = `hsl(${(h * 360 + 360) % 360},95%,${clamp(l, 0.04, 0.75) * 100}%)`;
    led.beginPath(); led.arc(x * 10 + 5, y * 10 + 5, 3.4, 0, Math.PI * 2); led.fill();
  }
}

/* ---------- spotlights, bulbs, crowd ---------- */
const beams = $('#beams'); const BC = ['#ff4fd8', '#3bd5ff', '#ffe066', '#9b5cff'];
BC.forEach((c, i) => { const b = document.createElement('div'); b.className = 'beam'; b.style.left = 120 + i * 230 + 'px'; b.style.background = `linear-gradient(180deg, ${c}, transparent 85%)`; b.style.clipPath = 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)'; beams.appendChild(b); });
const bulbsEl = $('#bulbs'); const BUL = [];
for (let i = 0; i < 44; i++) { const u = i / 44, per = 2 * (940 + 200); let d = u * per, x, y; if (d < 940) { x = d; y = 0; } else if (d < 1140) { x = 940; y = d - 940; } else if (d < 2080) { x = 940 - (d - 1140); y = 200; } else { x = 0; y = 200 - (d - 2080); } const b = document.createElement('div'); b.className = 'bulb'; b.style.left = x + 'px'; b.style.top = y + 'px'; bulbsEl.appendChild(b); BUL.push(b); }
const crowd = $('#crowd').getContext('2d');
const HEADS = Array.from({ length: 34 }, (_, i) => ({ x: (i % 17) * 66 + (i >= 17 ? 33 : 0) + 6, row: i >= 17 ? 1 : 0, ph: Math.sin(i * 7.1) * 10 }));
function drawCrowd(t) {
  crowd.clearRect(0, 0, 1080, 300);
  const cheer = clamp(Math.max(prog(t, REVEAL, REVEAL + 0.3) * (1 - prog(t, REVEAL + 3, REVEAL + 4)), prog(t, 0.2, 0.4) * (1 - prog(t, 1.6, 2.2))));
  HEADS.forEach((h) => {
    const yb = 120 + h.row * 90 + Math.sin(t * 6 + h.ph) * (3 + cheer * 10), col = h.row ? '#09000f' : '#14002a';
    crowd.fillStyle = col;
    crowd.beginPath(); crowd.ellipse(h.x + 30, yb + 120, 50, 70, 0, Math.PI, 0); crowd.fill();
    crowd.beginPath(); crowd.arc(h.x + 30, yb + 20, 26, 0, Math.PI * 2); crowd.fill();
    if (cheer > 0.3 && Math.sin(h.ph * 3) > 0) { crowd.fillRect(h.x + 4 + Math.sin(t * 9 + h.ph) * 6, yb - 60, 12, 80); }
  });
  // camera flashes in the audience after the reveal
  if (t > REVEAL && t < REVEAL + 3) for (let k = 0; k < 4; k++) { const s = Math.floor((t - REVEAL) * 6) + k * 13; const r = (Math.sin(s * 91.7) * 0.5 + 0.5); if (r > 0.6) { crowd.fillStyle = 'rgba(255,255,255,.85)'; crowd.beginPath(); crowd.arc((Math.sin(s * 37.1) * 0.5 + 0.5) * 1080, 120 + r * 120, 6 + r * 6, 0, Math.PI * 2); crowd.fill(); } }
}

/* ---------- confetti: launched at the reveal, a pure function of time ---------- */
const cf = $('#confetti').getContext('2d');
const CONF = Array.from({ length: 220 }, (_, i) => { const r = (k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); }; const side = i % 3; return { x0: side === 0 ? 540 : side === 1 ? -20 : 1100, y0: side === 0 ? 400 : 900, vx: (side === 0 ? (r(1) - 0.5) * 1400 : side === 1 ? 300 + r(1) * 700 : -300 - r(1) * 700), vy: -900 - r(2) * 1100, rot: r(3) * 20, c: ['#ffe066', '#ff4fd8', '#3bd5ff', '#3bff8a', '#ffffff', '#ff7a1f'][i % 6], w: 14 + r(4) * 14 }; });
function confetti(t) {
  cf.clearRect(0, 0, 1080, 1920); const a = t - REVEAL; if (a < 0 || a > 5) return;
  CONF.forEach((p) => { const drag = 1 - Math.exp(-a * 1.6); const x = p.x0 + p.vx * drag / 1.6 + Math.sin(a * 3 + p.rot) * 30, y = p.y0 + p.vy * drag / 1.6 + 260 * a * a * 0.5 + 200 * a; if (y > 1950) return; cf.save(); cf.translate(x, y); cf.rotate(p.rot + a * 6); cf.scale(1, Math.cos(a * 9 + p.rot)); cf.fillStyle = p.c; cf.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); cf.restore(); });
}

/* ---------- the sale board ---------- */
$('#banner').innerHTML = `<div style="position:absolute;left:34px;top:34px;width:400px;height:476px;border-radius:30px;overflow:hidden;border:5px solid #ffe066"><img src="../../img/producto-muneca.jpg" style="width:100%;height:100%;object-fit:cover"></div>
  <div style="position:absolute;left:470px;top:40px;right:30px"><div style="display:flex;align-items:center;gap:14px"><div style="width:66px;height:66px;border-radius:16px;background:#e5322d;display:grid;place-items:center;font:900 40px Han">龍</div><div style="font:400 56px Bungee;color:#fff">LÓNG</div></div>
  <div style="font:700 30px Inter;color:#d9cfff;margin-top:14px;line-height:1.25">Dragón articulado · 88 cm<br>Brilla en la oscuridad</div>
  <div style="font:400 100px/1 Bungee;color:#ffe066;margin-top:22px;text-shadow:0 6px 0 #c2410c">21,95€</div>
  <div style="font:400 40px Bungee;color:#ff7ac6;margin-top:12px">2 × 32,95€</div></div>
  <div id="bcta" style="position:absolute;left:470px;right:30px;bottom:34px;height:100px;border-radius:50px;background:#ffe066;color:#12002a;display:grid;place-items:center;font:400 38px Bungee">LINK EN MI PERFIL</div>`;

/* ---------- subtitles, broadcast style ---------- */
const subEl = $('#sub'); let shown = null;
function subs(t) {
  const l = TI.lines.find((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.3);
  if (!l) { subEl.style.opacity = 0; return; }
  if (shown !== l) { subEl.innerHTML = l.words.map((w) => `<span>${w[0]}</span>`).join(' '); shown = l; }
  subEl.style.opacity = 1;
  [...subEl.children].forEach((s, i) => { const on = t >= l.words[i][1] - 0.02; s.style.color = on ? '#ffe94d' : '#ffffff'; s.style.opacity = on ? 1 : 0.55; });
}

/* ---------- one frame ---------- */
const pods = [...document.querySelectorAll('.pod')];
function render(t) {
  const glow = t > T_BRILLA - 0.1 && t < LN.l2.t1 + 0.4 ? E.out(prog(t, T_BRILLA - 0.1, T_BRILLA + 0.3)) * (1 - prog(t, LN.l2.t1, LN.l2.t1 + 0.4)) : 0;
  ledWall(t); drawCrowd(t); confetti(t); subs(t);
  ['#led', '#floor', '#beams', '#bulbs', '#title', '#pedestal'].forEach((s) => { $(s).style.filter = glow > 0.01 ? `brightness(${1 - glow * 0.82})` : ''; });
  // the title slams in
  const tp = E.back(prog(t, 0.1, 0.45)); $('#title').style.transform = `scale(${lerp(2.6, 1, tp)}) rotate(${(1 - tp) * -6}deg)`; $('#title').style.opacity = clamp(t * 8);
  BUL.forEach((b, i) => { const on = (Math.floor(t * 8) + i) % 3 !== 0 || (t > REVEAL && t < REVEAL + 2 && Math.floor(t * 12) % 2); b.style.opacity = on ? 1 : 0.25; });
  // spotlights swing; at the questions they find each podium; at the reveal all hit C
  const tgtIdx = t > REVEAL ? 2 : t > LN.oc.t0 ? 2 : t > LN.ob.t0 ? 1 : t > LN.oa.t0 ? 0 : -1;
  [...beams.children].forEach((b, i) => {
    let ang = Math.sin(t * (0.7 + i * 0.13) + i * 1.7) * 22;
    if (tgtIdx >= 0 && t > LN.oa.t0 && t < LN.c3.t0 + 0.2 || t > REVEAL) { const px = 190 + tgtIdx * 350, bx = 120 + i * 230 + 130; ang = lerp(ang, Math.atan2(bx - px, 1300) * 57.3, 0.85); }
    b.style.transform = `rotate(${ang}deg)`; b.style.opacity = 0.5 * (1 - glow * 0.9) + (t > REVEAL && t < REVEAL + 2 ? 0.2 : 0);
  });
  // the podiums drop in on the question
  pods.forEach((p, i) => {
    const a = t - (LN.l3.t0 + 0.3 + i * 0.18), pp = E.back(prog(a, 0, 0.45));
    const hl = i === tgtIdx && t < LN.c3.t0 + 0.1 ? 1 : 0;
    let s = lerp(0.6, 1, pp) * (1 + hl * 0.07), o = clamp(a * 5), y = (1 - pp) * 160;
    if (t > REVEAL) { if (i === 2) s *= 1 + 0.12 * E.back(prog(t, REVEAL, REVEAL + 0.35)) + 0.03 * Math.sin((t - REVEAL) * 10); else o *= lerp(1, 0.45, prog(t, REVEAL + 0.1, REVEAL + 0.4)); }
    if (t > BANNER) { o *= 1 - prog(t, BANNER, BANNER + 0.3); y += E.in(prog(t, BANNER, BANNER + 0.3)) * 300; }
    p.style.opacity = a > 0 ? o : 0; p.style.transform = `translateY(${y}px) scale(${s})`;
    p.style.boxShadow = hl || (t > REVEAL && i === 2) ? `0 0 ${50 + 30 * Math.sin(t * 12)}px ${i === 2 ? '#ffe066' : ['#ff4fa3', '#3bd5ff'][i]}` : 'none';
    p.querySelector('.x').style.opacity = t > REVEAL + 0.05 && i < 2 ? E.out(prog(t, REVEAL + 0.05, REVEAL + 0.2)) : 0;
  });
  // the countdown
  const cd = t > LN.c3.t0 - 0.1 && t < REVEAL - 0.05; $('#count').style.opacity = cd ? 1 : 0;
  if (cd) { const n = t < LN.c2.t0 ? 3 : t < LN.c1.t0 ? 2 : 1; const t0 = [LN.c3.t0, LN.c2.t0, LN.c1.t0][3 - n]; $('#num').textContent = n; $('#ring').setAttribute('stroke-dashoffset', prog(t, t0, t0 + 1.0)); $('#count').style.transform = `scale(${lerp(1.3, 1, E.out(prog(t, t0, t0 + 0.2)))})`; }
  const cp = E.back(prog(t, REVEAL, REVEAL + 0.35)); $('#correct').style.opacity = t > REVEAL && t < BONUS + 0.3 ? clamp((t - REVEAL) * 6) * (1 - prog(t, BONUS, BONUS + 0.3)) : 0; $('#correct').style.transform = `scale(${lerp(0.3, 1, cp)}) rotate(${(1 - cp) * 10 - 4}deg)`;
  const bp = E.back(prog(t, BONUS, BONUS + 0.4)); $('#bonus').style.opacity = t > BONUS ? clamp((t - BONUS) * 5) * (1 - prog(t, BANNER, BANNER + 0.3)) : 0; $('#bonus').style.transform = `translateX(${(1 - bp) * 600}px) rotate(${-4 + Math.sin(t * 3) * 1}deg)`;
  // the sale board
  const ba = E.back(prog(t, BANNER + 0.15, BANNER + 0.55)); $('#banner').style.opacity = t > BANNER + 0.15 ? clamp((t - BANNER - 0.15) * 5) : 0; $('#banner').style.transform = `scale(${lerp(0.6, 1, ba)})`;
  $('#bcta').style.transform = `scale(${1 + 0.04 * Math.max(0, Math.sin(t * 7))})`; $('#bcta').style.background = Math.floor(t * 4) % 2 ? '#ffe066' : '#fff3a6';
  // the set: a slow push in, a jolt at the title and the reveal
  const jolt = (t0) => (t > t0 && t < t0 + 0.4 ? Math.sin((t - t0) * 70) * 10 * (1 - (t - t0) / 0.4) : 0);
  $('#set').style.transform = `translate(${jolt(0.3) + jolt(REVEAL)}px, ${jolt(REVEAL) * 0.6}px) scale(${1 + t * 0.002 + (t > LN.c3.t0 && t < REVEAL ? 0.04 * prog(t, LN.c3.t0, REVEAL) : 0)})`;
  product(t, glow);
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['400 60px Bungee', '800 60px Poppins', '700 40px Inter', '900 40px Han']) await document.fonts.load(f, 'Aá龍€');
const sfx = [
  { t: 0.1, tipo: 'impact', g: 0.45 }, { t: 0.2, tipo: 'applause', g: 0.35 }, { t: T_BRILLA - 0.1, tipo: 'shimmer', g: 0.35 }, { t: T_BRILLA - 0.12, tipo: 'lightswitch', g: 0.3 },
  ...[0, 1, 2].map((i) => ({ t: LN.l3.t0 + 0.3 + i * 0.18 + 0.3, tipo: 'thump', g: 0.3 })),
  ...['oa', 'ob', 'oc'].map((id, i) => ({ t: LN[id].t0, tipo: 'bell', g: 0.12, pan: (i - 1) * 0.6 })),
  ...['c3', 'c2', 'c1'].map((id) => ({ t: LN[id].t0, tipo: 'tick', g: 0.4 })), { t: LN.c3.t0, tipo: 'drumroll', g: 0.35 }, { t: LN.c2.t0 + 0.4, tipo: 'drumroll', g: 0.3 },
  { t: REVEAL, tipo: 'correct', g: 0.4 }, { t: REVEAL, tipo: 'confetti', g: 0.4 }, { t: REVEAL + 0.05, tipo: 'buzzer', g: 0.18 }, { t: REVEAL + 0.1, tipo: 'applause', g: 0.45 }, { t: REVEAL, tipo: 'impact', g: 0.35 },
  { t: BONUS, tipo: 'cash', g: 0.25 }, { t: BONUS, tipo: 'whoosh', g: 0.2 }, { t: BANNER + 0.15, tipo: 'whoosh', g: 0.25 }, { t: BANNER + 0.4, tipo: 'bell', g: 0.15 },
];
window.__cues = { dur: DUR, musica: { archivo: '849.mp3', desde: 4.0, gain: 0.45, duck: 0.5, fadein: 0.3, fadeout: 1.0, silencios: [[LN.c3.t0 - 0.1, REVEAL - 0.02, 0.25]] }, voz: { gain: 1 }, sfx, ambiente: [{ tipo: 'publico', desde: 0, hasta: DUR, g: 0.6 }] };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
