// V1 · one shape, never cut. A button becomes a loader, a check, a dynamic island with the LÓNG logo, a player that plays
// the dragon, a size slider that stretches past its max, a night-mode toggle, liquid colour tabs, a chart that draws
// itself, a command palette, a toast, the sale card, and the button again: the last frame is the first.
// Everything is a pure function of time: seek(t) computes every style; springs are closed-form step responses summed
// per change. 123 BPM (the Mixkit track's measured tempo), 8 bars, something on every beat.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';

const TI = await (await fetch('tiempos.json')).json();
const BPM = 122.99461555506598, B = 60 / BPM, T = (b) => b * B;
const DUR = T(32), W = 1080, H = 1920, CX = 540, CY = 1010;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const RED = '#e5322d';

/* ---------- springs: closed-form step responses, one per change, summed ---------- */
function step(tau, w = 16, z = 0.82) { if (tau <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau)); }
// keys: [[t, value, w?], ...]; the first is the value at rest before anything happens
function spr(t, keys, w = 16, z = 0.82) { let v = keys[0][1]; for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * step(t - keys[i][0], keys[i][2] || w, z); return v; }
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function sprCol(t, keys, w = 14) { const ch = [0, 1, 2].map((k) => spr(t, keys.map(([tt, c]) => [tt, hex(c)[k]]), w)); return `rgb(${ch.map((v) => Math.round(clamp(v, 0, 255))).join(',')})`; }
// content that swaps inside a morphing container: its own window, in and out through a short blur
function win(t, a, b, inD = 0.16, outD = 0.1) { if (t < a - 0.001 || t > b + outD) return 0; const i = clamp((t - a) / inD), o = clamp((t - b) / outD); return (1 - Math.pow(1 - i, 3)) * (1 - o); }

/* ---------- the states on the beat grid ---------- */
const S = {
  btn: [420, 120, 60, '#111111', 2.0], load: [120, 120, 60, '#111111', 2.6], chk: [120, 120, 60, RED, 2.6],
  isl: [560, 100, 50, '#111111', 1.7], ply: [760, 700, 44, '#ffffff', 1.22], sld: [780, 200, 100, '#ffffff', 1.22],
  tog: [250, 140, 70, '#d6d1ca', 2.6], togOn: [250, 140, 70, '#111111', 2.6], tab: [820, 640, 44, '#ffffff', 1.16],
  cht: [820, 720, 44, '#ffffff', 1.16], cmd: [760, 112, 28, '#ffffff', 1.3], cmdL: [760, 430, 28, '#ffffff', 1.25], cmd1: [760, 230, 28, '#ffffff', 1.3],
  tst: [640, 124, 62, '#111111', 1.55], card: [780, 1080, 44, '#ffffff', 1.12],
};
const SEQ = [[0, 'btn'], [T(1) + 0.05, 'load'], [T(3), 'chk'], [T(4), 'isl'], [T(5), 'ply'], [T(12), 'sld'], [T(16), 'tog'], [T(17) + 0.04, 'togOn'], [T(18), 'tab'],
  [T(22), 'cht'], [T(24), 'cmd'], [T(25.25), 'cmdL'], [T(26.4), 'cmd1'], [T(28), 'tst'], [T(29), 'card'], [T(31), 'btn']];
const keysOf = (k) => SEQ.map(([t, s]) => [t, S[s][k]]);
const KW = keysOf(0), KH = keysOf(1), KR = keysOf(2), KC = SEQ.map(([t, s]) => [t, S[s][3]]), KCAM = keysOf(4);
// the slider stretches when dragged past its max: extra width while held, sprung back on release
const shapeEl = document.getElementById('shape'), world = document.getElementById('world'), stage = document.getElementById('stage');

/* ---------- the cursor: waypoints in screen space, sprung; presses and drags ---------- */
const sc = (dx, dy, cam) => [CX + dx * cam, CY + dy * cam];
const REST = [820, 1450];
const CUR = [[0, ...REST], [T(0.5), ...sc(30, 8, 2.0)], [T(1.6), 760, 1250], [T(4.5), ...sc(40, 6, 1.7)], [T(6.1), ...sc(6, 252, 1.22)],
  [T(8.4), null, null], [T(11.6), ...sc(-20, 34, 1.22)], [T(16.3), ...sc(14, 6, 2.6)], [T(18.6), ...sc(-90, 236, 1.16)], [T(19.6), ...sc(100, 236, 1.16)], [T(20.6), ...sc(290, 236, 1.16)],
  [T(22.5), ...sc(272, 60, 1.16)], [T(24.1), 880, 1420], [T(29.5), ...sc(30, 440, 1.12)], [T(31.2), ...REST]];
const PRESS = [[T(1), T(1) + 0.11], [T(5), T(5) + 0.1], [T(7), T(7) + 0.1], [T(9), T(11)], [T(13), T(15)], [T(17), T(17) + 0.1], [T(19), T(19) + 0.1], [T(20), T(20) + 0.1], [T(21), T(21) + 0.1], [T(30.2), T(30.2) + 0.12]];
const held = (t) => PRESS.some(([a, b]) => t >= a && t <= b);
// the scrub: from where the playhead is at T(9) to 0.86; the slider: from 40 cm past the max
const progAt = (t) => (t < T(7) ? 0 : clamp(0.06 + (t - T(7)) * 0.05, 0, 1));
const P0 = progAt(T(9)), TRACK = 664;
function dragScrub(t) { const u = prog(t, T(9.05), T(10.7)); return lerp(P0, 0.86, u * u * (3 - 2 * u)); }
function dragSlider(t) { const u = prog(t, T(13.05), T(14.6)); return lerp(40 / 88, 1.32, u * u * (3 - 2 * u)); }   // past 1 = past the max
function cursorAt(t) {
  const pts = CUR.filter((p) => p[1] != null); const kx = pts.map(([tt, x]) => [tt, x]), ky = pts.map(([tt, , y]) => [tt, y]);
  let x = spr(t, kx, 9, 0.9), y = spr(t, ky, 9, 0.9);
  // direct manipulation: while held, the cursor rides the value
  const camS = 1.22;
  if (t >= T(8.4) && t < T(9)) { const [kx2, ky2] = sc(-332 + P0 * TRACK, 176, camS); const u = prog(t, T(8.4), T(8.95)); x = lerp(x, kx2, u * u * (3 - 2 * u)); y = lerp(y, ky2, u * u * (3 - 2 * u)); }
  if (t >= T(9) && t <= T(11)) { const p = dragScrub(t); [x, y] = sc(-332 + p * TRACK, 176, camS); }
  if (t > T(11) && t < T(11.6)) { const [x0, y0] = sc(-332 + 0.86 * TRACK, 176, camS); const u = prog(t, T(11), T(11.6)); x = lerp(x0, x, u * u * (3 - 2 * u)); y = lerp(y0, y, u * u * (3 - 2 * u)); }
  if (t >= T(12.3) && t < T(13)) { const [kx2, ky2] = sc(-330 + (40 / 88) * 660, 36, 1.22); const u = prog(t, T(12.3), T(12.95)); x = lerp(x, kx2, u * u * (3 - 2 * u)); y = lerp(y, ky2, u * u * (3 - 2 * u)); }
  if (t >= T(13) && t <= T(15)) { const v = dragSlider(t); [x, y] = sc(-330 + v * 660, 36, 1.22); }
  if (t > T(15) && t < T(16.3)) { const [x0, y0] = sc(-330 + 1.32 * 660, 36, 1.22); const u = prog(t, T(15), T(15.8)); x = lerp(x0, x, u * u * (3 - 2 * u)); y = lerp(y0, y, u * u * (3 - 2 * u)); }
  return [x, y];
}

/* ---------- content layers ---------- */
const lay = (w, h, html) => { const d = document.createElement('div'); d.className = 'lay'; d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.marginLeft = -w / 2 + 'px'; d.style.marginTop = -h / 2 + 'px'; d.innerHTML = html; shapeEl.appendChild(d); return d; };
const L = {
  btn: lay(420, 120, '<div class="row" style="height:100%;justify-content:center;gap:16px;color:#fff;font:600 36px Geist;letter-spacing:-0.03em">Encontrar regalo<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>'),
  load: lay(120, 120, '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="26" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="7"/><circle class="arc" cx="60" cy="60" r="26" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="50 200" transform-origin="60 60"/></svg>'),
  chk: lay(120, 120, '<svg width="120" height="120" viewBox="0 0 120 120"><path class="ck" d="M40 62l14 14 28-32" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>'),
  isl: lay(560, 100, '<div class="row" style="height:100%;padding:0 22px;gap:18px;color:#fff"><div class="logo" style="width:60px;height:60px;font-size:36px">龍</div><div><div style="font:650 34px Geist;letter-spacing:-0.04em;line-height:1">LÓNG</div><div style="font:500 22px GeistMono;color:#9a948b;margin-top:6px">dragón articulado</div></div><div class="wave row" style="margin-left:auto;gap:5px;height:44px"></div></div>'),
  ply: lay(760, 700, `<div class="media" style="left:24px;top:24px;width:712px;height:380px;border-radius:28px"><img src="../../img/producto-muneca.jpg"><img src="../../img/producto-colores.jpg" style="object-position:50% 30%"></div>
    <div style="position:absolute;left:28px;top:424px;right:28px" class="row"><div class="logo" style="width:52px;height:52px;font-size:30px">龍</div><div style="margin-left:16px"><div style="font:650 38px Geist;letter-spacing:-0.04em;line-height:1">LÓNG</div><div style="font:500 24px Geist;color:#8d877f;margin-top:6px;letter-spacing:-0.02em">Dragón articulado · 88 cm</div></div><div class="mono" style="margin-left:auto;font:500 24px GeistMono;color:#8d877f" id="ptime">0:00</div></div>
    <div class="bar" style="left:48px;width:664px;top:522px"><i id="pfill"></i></div><div class="knob" id="pknob" style="top:526px"></div>
    <div class="row" style="position:absolute;left:0;right:0;top:572px;justify-content:center;gap:58px">
      <svg width="44" height="44" viewBox="0 0 24 24"><path d="M19 5v14l-10-7zM6 5v14" fill="#111" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>
      <div style="width:96px;height:96px;border-radius:50%;background:#111;display:grid;place-items:center"><svg width="40" height="40" viewBox="0 0 24 24"><path id="pp" fill="#fff"/></svg></div>
      <svg width="44" height="44" viewBox="0 0 24 24"><path d="M5 5v14l10-7zM18 5v14" fill="#111" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg></div>`),
  sld: lay(780, 200, `<div style="position:absolute;left:60px;top:36px;font:600 32px Geist;letter-spacing:-0.03em">Tamaño</div><div id="sval" style="position:absolute;right:60px;top:36px;font:650 32px Geist;letter-spacing:-0.03em">40 cm</div>
    <div class="bar" id="strack" style="left:60px;width:660px;top:122px"><i id="sfill"></i></div><div id="sticks" style="position:absolute;left:60px;top:144px;width:660px;height:14px"></div><div class="knob" id="sknob" style="top:126px;width:34px;height:34px;margin:-13px 0 0 -17px"></div>`),
  tog: lay(250, 140, '<div id="tknob" style="position:absolute;top:14px;height:112px;border-radius:56px;background:#fff;overflow:hidden"><div class="media" id="tmedia" style="inset:0;border-radius:56px;background:#0a0a0c"></div></div>'),
  tab: lay(820, 640, `<div class="media" id="tabmedia" style="left:24px;top:24px;width:772px;height:430px;border-radius:28px"></div>
    <div style="position:absolute;left:24px;right:24px;top:486px;height:118px;border-radius:59px;background:#f1eee9"><div id="tind" style="position:absolute;top:8px;height:102px;border-radius:51px;background:#111"></div>
    ${['Arcoíris|#7a5cff', 'Galaxia|#6b3fe0', 'Plata|#b9bec7', 'Fuego|#ff5a1f'].map((s, i) => `<div class="tab" style="left:${i * 193}px;width:193px"><span><b style="background:${s.split('|')[1]}"></b>${s.split('|')[0]}</span></div>`).join('')}</div>`),
  cht: lay(820, 720, `<div style="position:absolute;left:44px;top:40px;font:650 44px Geist;letter-spacing:-0.045em">Mide más que…</div><div style="position:absolute;left:44px;top:100px;font:500 26px Geist;color:#8d877f;letter-spacing:-0.02em">de la cabeza a la cola, en cm</div>
    <div style="position:absolute;left:44px;right:44px;top:616px;height:2px;background:#111"></div><div id="bars"></div><div id="tip" style="position:absolute;opacity:0;background:#111;color:#fff;border-radius:16px;padding:14px 20px;font:600 26px Geist;letter-spacing:-0.02em;white-space:nowrap"></div>`),
  cmd: lay(760, 430, `<div class="row" style="position:absolute;left:24px;right:24px;top:0;height:112px;gap:18px"><div class="mono" style="font:600 24px GeistMono;border:2px solid #d6d1ca;border-radius:10px;padding:6px 12px;color:#8d877f">⌘K</div><div id="q" style="font:500 36px Geist;letter-spacing:-0.03em;white-space:pre"></div><div id="caret" style="width:3px;height:40px;background:#111;margin-left:-14px"></div></div>
    <div style="position:absolute;left:24px;right:24px;top:110px;height:2px;background:#ece8e2"></div><div id="list"></div>`),
  tst: lay(640, 124, `<div class="row" style="height:100%;padding:0 28px;gap:20px;color:#fff"><div style="width:62px;height:62px;border-radius:50%;background:${RED};display:grid;place-items:center"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><div style="font:600 34px Geist;letter-spacing:-0.03em">Añadido al carrito</div><div style="margin-left:auto;font:650 34px Geist;letter-spacing:-0.03em">21,95 €</div></div>`),
  card: lay(780, 1080, `<div class="media" style="left:24px;top:24px;width:732px;height:600px;border-radius:30px"><img src="../../img/producto-muneca.jpg" style="opacity:1"></div>
    <div class="row" style="position:absolute;left:36px;top:654px;gap:18px"><div class="logo" style="width:66px;height:66px;font-size:40px">龍</div><div><div style="font:700 54px Geist;letter-spacing:-0.05em;line-height:1">LÓNG</div><div style="font:500 26px Geist;color:#8d877f;margin-top:8px;letter-spacing:-0.02em">Dragón articulado · 88 cm · brilla en la oscuridad</div></div></div>
    <div style="position:absolute;left:36px;top:782px;font:750 92px Geist;letter-spacing:-0.06em">21,95 €</div><div style="position:absolute;right:36px;top:812px;font:600 30px Geist;color:#111;background:#f1eee9;border-radius:999px;padding:12px 22px;letter-spacing:-0.02em">2 por 32,95 €</div>
    <div id="cbtn" style="position:absolute;left:36px;right:36px;top:924px;height:116px;border-radius:58px;background:#111;color:#fff;display:grid;place-items:center;font:650 38px Geist;letter-spacing:-0.035em">Link en mi perfil</div>`),
};
// the island's live waveform
const wave = L.isl.querySelector('.wave'); for (let i = 0; i < 9; i++) { const b = document.createElement('i'); b.style.cssText = 'display:block;width:6px;border-radius:3px;background:' + (i % 3 ? '#fff' : RED); wave.appendChild(b); }
// the slider's ruler
const ticks = L.sld.querySelector('#sticks'); for (let i = 0; i <= 22; i++) { const k = document.createElement('i'); k.style.cssText = `position:absolute;left:${(i / 22) * 100}%;top:0;width:2px;height:${i % 11 === 0 ? 14 : 8}px;background:#c9c3bb`; ticks.appendChild(k); }
// the chart's bars
const BARS = [['Lápiz', 18], ['Zapatilla', 30], ['Gato', 46], ['LÓNG', 88]];
const barsEl = L.cht.querySelector('#bars');
BARS.forEach(([n, v], i) => { const x = 44 + 40 + i * 180; barsEl.insertAdjacentHTML('beforeend', `<div class="b" style="position:absolute;left:${x}px;width:132px;bottom:${720 - 616}px;height:0;border-radius:18px 18px 4px 4px;background:${i === 3 ? RED : '#111'}"></div><div style="position:absolute;left:${x - 10}px;width:152px;text-align:center;top:632px;font:600 28px Geist;letter-spacing:-0.03em">${n}</div><div class="v" style="position:absolute;left:${x - 10}px;width:152px;text-align:center;font:650 30px Geist;letter-spacing:-0.03em;opacity:0">${v}</div>`); });
// the palette's list
const ITEMS = ['Calcetines navideños', 'Taza con tu nombre', 'Dragón articulado LÓNG', 'Vale de regalo'];
const listEl = L.cmd.querySelector('#list');
ITEMS.forEach((n, i) => listEl.insertAdjacentHTML('beforeend', `<div class="item" style="top:${128 + i * 72}px">${i === 2 ? '<div class="logo" style="width:40px;height:40px;font-size:24px;border-radius:11px;margin-right:16px">龍</div>' : ''}<span>${n}</span>${i === 2 ? '<small>21,95 €</small>' : ''}</div>`));
const QUERY = 'regalo original';

/* ---------- the dragon, live, inside the player, the tabs and the toggle knob ---------- */
const cv = document.createElement('canvas'); cv.width = 1158; cv.height = 645;
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(1158, 645, false);
R.toneMapping = THREE.NeutralToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.8;
const cam = new THREE.PerspectiveCamera(30, 1158 / 645, 0.05, 80);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#f3f1ee', roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const sun = new THREE.DirectionalLight('#ffffff', 2.2); sun.position.set(-3, 8, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 8; sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6; scene.add(sun);
const glowL = new THREE.PointLight('#6dffb0', 0, 5, 2); scene.add(glowL);
const dragon = createDragon(scene, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
function lay3d(tm) {
  // it swims a slow figure of eight on the floor, head up
  const c = (q) => new THREE.Vector3(2.0 * Math.sin(q * 0.9), 0, 1.1 * Math.sin(q * 1.8));
  spine[0].copy(c(tm)); let prev = spine[0].clone(), total = 0, k = 1, tt = tm, n = 0;
  while (k <= SEG && n++ < 30000) { tt -= 0.004; const q = c(tt); const s = prev.distanceTo(q); while (k <= SEG && total + s >= k * SPACING) { spine[k].lerpVectors(prev, q, (k * SPACING - total) / s); k++; } total += s; prev = q; }
  for (; k <= SEG; k++) spine[k].copy(spine[k - 1]);
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + (i < 6 ? Math.pow(1 - i / 6, 2) * (0.42 + Math.sin(tm * 2) * 0.04) : 0);
}
let curColor = '';
function draw3d(tm, color, glow, view) {
  if (color !== curColor) { dragon.setColor(color); curColor = color; }
  lay3d(tm);
  const dark = glow > 0.01;
  scene.background = dark ? new THREE.Color('#07080a') : new THREE.Color('#f3f1ee');
  floor.material.color.set(dark ? '#0b0c0e' : '#f3f1ee'); sun.intensity = dark ? 0.05 : 2.2; scene.environmentIntensity = dark ? 0.02 : 0.8;
  glowL.intensity = glow * 2.5; glowL.position.copy(spine[12]).add(new THREE.Vector3(0, 0.5, 0));
  dragon.update(spine, tm, glow * 0.6);
  if (view === 'knob') { cam.position.set(spine[0].x * 0.3, 2.6, spine[0].z + 2.6); cam.lookAt(spine[0].x * 0.7, 0.3, spine[0].z * 0.7); cam.fov = 34; }
  else { cam.position.set(0.3, 4.3, 4.9); cam.lookAt(0, 0.15, 0.1); cam.fov = 30; }
  cam.aspect = 1158 / 645; cam.updateProjectionMatrix();
  R.render(scene, cam);
}

/* ---------- captions: the spoken line, word by word, the key word in the accent ---------- */
const capEl = document.getElementById('cap'), brandEl = document.getElementById('brand');
const KEYS = new Set(['regalo', 'long,', 'long', 'mueve.', 'ochenta', 'brilla.', 'colores.', 'gato.', 'año?', 'resuelto.', 'veintiún']);
let shownLine = null;
function captions(t, dark) {
  const l = TI.lines.find((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.35);
  if (!l) { capEl.style.opacity = 0; return; }
  if (shownLine !== l) { capEl.innerHTML = l.words.map((w) => `<span>${w[0].replace(/^Long/, 'LÓNG')}</span>`).join(''); shownLine = l; }
  capEl.style.opacity = 1 - prog(t, l.t1 + 0.22, l.t1 + 0.35);
  [...capEl.children].forEach((s, i) => {
    const w = l.words[i], on = t >= w[1] - 0.03, key = KEYS.has(w[0].toLowerCase());
    s.style.color = on ? (key ? RED : dark ? '#f2f0ec' : '#111') : dark ? '#3d3b38' : '#c4bfb7';
    const p = prog(t, w[1] - 0.03, w[1] + 0.1); s.style.transform = `translateY(${(1 - p) * 6}px)`;
  });
}

/* ---------- seek(t): every style from time ---------- */
function seek(t) {
  t = ((t % DUR) + DUR) % DUR;
  // the canvas goes dark with the night toggle
  const dark = prog(t, T(17), T(17) + 0.25) * (1 - prog(t, T(18), T(18) + 0.3));
  const bg = sprCol(t, [[0, '#ebe8e3'], [T(17), '#141414'], [T(18), '#ebe8e3']], 14);
  stage.style.background = bg; document.body.style.background = bg;
  brandEl.style.color = dark > 0.5 ? '#6d6862' : '#8d877f';
  // the shape
  let w = spr(t, KW), h = spr(t, KH), r = spr(t, KR);
  const stretch = t >= T(13) && t <= T(15) ? Math.max(0, dragSlider(t) - 1) * 660 * 0.42 : 0;
  const stretchK = [[0, 0], [T(15), 0]]; // released: the extra width springs back (below)
  const rel = t > T(15) ? Math.max(0, dragSlider(T(15)) - 1) * 660 * 0.42 * (1 - step(t - T(15), 18, 0.8)) : 0;
  w += stretch + rel;
  const camS = spr(t, KCAM, 10, 0.86);
  world.style.transform = `scale(${camS})`;
  shapeEl.style.cssText = `left:${CX - w / 2}px;top:${CY - h / 2}px;width:${w}px;height:${h}px;border-radius:${r}px;background:${sprCol(t, KC)}`;
  // content windows
  const wins = { btn: Math.max(win(t, 0, T(1) + 0.04), win(t, T(31) + 0.14, DUR + 1)), load: win(t, T(1) + 0.14, T(3) - 0.02), chk: win(t, T(3) + 0.04, T(4) - 0.04), isl: win(t, T(4) + 0.12, T(5) - 0.03),
    ply: win(t, T(5) + 0.16, T(12) - 0.04), sld: win(t, T(12) + 0.14, T(16) - 0.04), tog: win(t, T(16) + 0.12, T(18) - 0.04), tab: win(t, T(18) + 0.16, T(22) - 0.04),
    cht: win(t, T(22) + 0.14, T(24) - 0.04), cmd: win(t, T(24) + 0.12, T(28) - 0.04), tst: win(t, T(28) + 0.12, T(29) - 0.04), card: win(t, T(29) + 0.16, T(31) - 0.04) };
  for (const k in L) { const o = wins[k] || 0; L[k].style.opacity = o; L[k].style.filter = o < 0.999 ? `blur(${((1 - o) * 10).toFixed(1)}px)` : 'none'; L[k].style.visibility = o > 0.001 ? 'visible' : 'hidden'; }
  // loader and check
  L.load.querySelector('.arc').setAttribute('transform', `rotate(${(t - T(1)) * 520})`);
  L.chk.querySelector('.ck').setAttribute('stroke-dashoffset', 1 - clamp((t - T(3) - 0.06) / 0.22));
  [...wave.children].forEach((b, i) => { b.style.height = (10 + 30 * Math.abs(Math.sin(t * 9 + i * 1.3)) * (0.5 + 0.5 * Math.sin(i))) + 'px'; });
  // the player
  const playing = t >= T(7);
  const pv = t >= T(9) && t <= T(11) ? dragScrub(t) : t > T(11) ? Math.min(1, 0.86 + (t - T(11)) * 0.05) : progAt(t);
  L.ply.querySelector('#pfill').style.width = pv * 100 + '%'; L.ply.querySelector('#pknob').style.left = 48 + pv * 664 + 'px';
  const ks = held(t) && t >= T(9) && t <= T(11) ? 1.35 : 1; L.ply.querySelector('#pknob').style.transform = `scale(${spr(t, [[0, 1], [T(9), 1.35], [T(11), 1]], 20)})`;
  const secs = Math.floor(pv * 88); L.ply.querySelector('#ptime').textContent = `0:${String(secs % 60).padStart(2, '0')}`;
  // play/pause morph: two bars become a triangle
  const pm2 = spr(t, [[0, 0], [T(7), 1]], 22, 0.85);
  const a = lerp(8, 6, pm2), bL = lerp(19, 10, pm2), bR = lerp(19, 14, pm2);
  L.ply.querySelector('#pp').setAttribute('d', pm2 < 0.5 ? `M7 5L19 12L7 19Z` : `M${lerp(7, 6, pm2)} 5h4v14h-4zM${lerp(13, 14, pm2)} 5h4v14h-4z`);
  // media in the player: the live dragon, then the photos (the scrub picks them)
  const imgs = L.ply.querySelectorAll('.media img');
  const mi = t < T(8) ? 0 : t < T(9) ? 1 : t <= T(11) ? (pv < 0.45 ? 0 : pv < 0.7 ? 1 : 2) : 2;
  const fadeTo = (i) => [...imgs].forEach((im, k) => { im.style.opacity = mi === k + 1 ? 1 : 0; });
  fadeTo(mi);
  // the slider
  const sv = t < T(13) ? 40 / 88 : t <= T(15) ? dragSlider(t) : 1 + (dragSlider(T(15)) - 1) * (1 - step(t - T(15), 18, 0.8));
  const svc = clamp(sv, 0, 1);
  L.sld.querySelector('#sfill').style.width = svc * 100 + '%';
  L.sld.querySelector('#sknob').style.left = 60 + sv * 660 - (sv > 1 ? (sv - 1) * 660 * 0.58 : 0) + 'px';
  L.sld.querySelector('#sknob').style.transform = `scale(${spr(t, [[0, 1], [T(13), 1.3], [T(15), 1]], 20)})`;
  L.sld.style.width = 780 + stretch + rel + 'px'; L.sld.style.marginLeft = -(780 + stretch + rel) / 2 + 'px';
  L.sld.querySelector('#strack').style.width = 660 + stretch + rel + 'px';
  L.sld.querySelector('#sval').textContent = Math.round(svc * 88) + ' cm';
  // the toggle: the knob's two edges ride different springs, so it stretches as it flips
  const lE = spr(t, [[0, 14], [T(17) + 0.02, 124, 13]], 13), rE = spr(t, [[0, 126], [T(17), 236, 24]], 24);
  const kn = L.tog.querySelector('#tknob'); kn.style.left = lE + 'px'; kn.style.width = rE - lE + 'px';
  // the tabs: a liquid indicator, leading edge ahead of the trailing one
  const tabX = (i) => 8 + i * 193, TW = 193 - 16;
  const tabSeq = [[0, 0], [T(19), 1], [T(20), 2], [T(21), 3]];
  const lead = (i0, i1) => (i1 > i0 ? 26 : 13), trail = (i0, i1) => (i1 > i0 ? 13 : 26);
  const leftK = tabSeq.map(([tt, i], k) => [tt, tabX(i), k ? trail(tabSeq[k - 1][1], i) : 0]);
  const rightK = tabSeq.map(([tt, i], k) => [tt, tabX(i) + TW, k ? lead(tabSeq[k - 1][1], i) : 0]);
  const ti = L.tab.querySelector('#tind'), tl = spr(t, leftK), tr = spr(t, rightK); ti.style.left = tl + 'px'; ti.style.width = tr - tl + 'px';
  const active = t < T(19) ? 0 : t < T(20) ? 1 : t < T(21) ? 2 : 3;
  L.tab.querySelectorAll('.tab').forEach((el, i) => { el.style.color = i === active ? '#fff' : '#111'; });
  // the chart draws itself on the beat, then the tooltip
  L.cht.querySelectorAll('.b').forEach((b, i) => { const hgt = (BARS[i][1] / 88) * 400 * spr(t, [[0, 0], [T(22.3 + i * 0.25), 1]], 15, 0.86); b.style.height = Math.max(0, hgt) + 'px'; });
  L.cht.querySelectorAll('.v').forEach((v, i) => { const hgt = (BARS[i][1] / 88) * 400; v.style.top = 616 - hgt - 46 + 'px'; v.style.opacity = prog(t, T(22.5 + i * 0.25), T(22.5 + i * 0.25) + 0.15); });
  const tip = L.cht.querySelector('#tip'); const to = prog(t, T(23) - 0.02, T(23) + 0.12) * (1 - prog(t, T(23.8), T(23.95)));
  tip.textContent = '88 cm · más largo que tu gato'; tip.style.opacity = to; tip.style.left = 44 + 40 + 3 * 180 + 66 - 360 + 'px'; tip.style.top = 616 - 400 - 120 + (1 - to) * 10 + 'px';
  // the palette: typing on the eighth notes, the list filters, enter
  const typed = Math.floor(clamp((t - T(24.5)) / (T(26.2) - T(24.5))) * QUERY.length);
  L.cmd.querySelector('#q').textContent = typed ? QUERY.slice(0, typed) : 'Buscar regalo…'; L.cmd.querySelector('#q').style.color = typed ? '#111' : '#a8a29a';
  L.cmd.querySelector('#caret').style.opacity = Math.floor(t * 4) % 2 ? 0.15 : 1;
  const filtered = t >= T(26.4);
  L.cmd.querySelectorAll('.item').forEach((it, i) => {
    const show = prog(t, T(25.25) + i * 0.06, T(25.25) + i * 0.06 + 0.15) * (filtered && i !== 2 ? 1 - prog(t, T(26.4), T(26.4) + 0.12) : 1);
    it.style.opacity = show; it.style.top = (filtered && i === 2 ? spr(t, [[0, 128 + 2 * 72], [T(26.4), 128]], 16) : 128 + i * 72) + 'px';
    const sel = i === 2 && t >= T(26.7);
    it.style.background = sel ? '#111' : 'transparent'; it.style.color = sel ? '#fff' : '#111';
    const sm = it.querySelector('small'); if (sm) sm.style.color = sel ? '#bdb7ae' : '#8d877f';
    if (sel) it.style.transform = `scale(${t >= T(27) && t < T(27) + 0.12 ? 0.97 : 1})`;
  });
  // the sale card's button presses with the click
  L.card.querySelector('#cbtn').style.transform = `scale(${t >= T(30.2) && t < T(30.2) + 0.14 ? 0.96 : 1})`;
  // the cursor
  const [cx, cy] = cursorAt(t); const cur = document.getElementById('cursor');
  const press = PRESS.reduce((m, [p0, p1]) => Math.max(m, t >= p0 && t <= p1 ? 1 : 0), 0);
  cur.style.transform = `translate(${cx - 6}px, ${cy - 4}px) scale(${spr(t, PRESS.flatMap(([p0, p1]) => [[p0, 0.86, 30], [p1, 1, 30]]).reduce((a, k) => a.concat([k]), [[0, 1]]), 30)})`;
  cur.querySelector('path').setAttribute('fill', dark > 0.5 ? '#fff' : '#111'); cur.querySelector('path').setAttribute('stroke', dark > 0.5 ? '#111' : '#fff');
  // the live dragon: where it is shown, it is drawn
  const media = wins.ply > 0.01 && mi === 0 ? L.ply.querySelector('.media') : wins.tab > 0.01 ? L.tab.querySelector('#tabmedia') : wins.tog > 0.01 && t > T(17) ? L.tog.querySelector('#tmedia') : null;
  if (media) {
    if (cv.parentNode !== media) media.prepend(cv);
    const color = ['arcoiris', 'galaxia', 'plata', 'fuego'][active];
    const glow = t > T(17) && t < T(18.1) ? prog(t, T(17) + 0.1, T(17) + 0.4) : 0;
    draw3d(t * (playing || t > T(12) ? 1 : 0.2) + 3, wins.tab > 0.01 ? color : 'arcoiris', glow, wins.tog > 0.01 ? 'knob' : 'wide');
  }
  captions(t, dark > 0.5);
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['600 40px Geist', '500 30px GeistMono', '900 40px Han']) await document.fonts.load(f, 'Aá龍');
const cues = { dur: DUR, musica: { archivo: '124-123bpm.wav', desde: 31.37, gain: 0.55, duck: 0.45, fadein: 0.02, fadeout: 0.5 }, voz: { gain: 1 }, sfx: [] };
PRESS.forEach(([a, b]) => { cues.sfx.push({ t: a, tipo: 'mouse', g: 0.35 }); if (b - a > 0.3) cues.sfx.push({ t: b, tipo: 'mouse', g: 0.25 }); });
SEQ.slice(1).forEach(([t0]) => cues.sfx.push({ t: t0, tipo: 'swish', g: 0.07, pan: 0.2 }));
for (let i = 1; i <= QUERY.length; i++) cues.sfx.push({ t: T(24.5) + ((T(26.2) - T(24.5)) * i) / QUERY.length - 0.01, tipo: 'key', g: 0.22 });
cues.sfx.push({ t: T(27), tipo: 'key', g: 0.35 }, { t: T(28), tipo: 'pop', g: 0.3 }, { t: T(29), tipo: 'bell', g: 0.1 }, { t: T(17), tipo: 'click', g: 0.3 }, { t: T(3), tipo: 'tap', g: 0.15 });
window.__cues = cues; window.__dur = DUR; window.__render = (t) => seek(t);
seek(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { seek((performance.now() - t0) / 1000); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
