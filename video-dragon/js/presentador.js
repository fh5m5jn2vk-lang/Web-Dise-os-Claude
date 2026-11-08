// LÓNG, presenter cut: a 3D presenter (tanned, dark buzzcut, no glasses) talks to camera from the bottom right and points
// at what he sells: a phone playing the real-looking dragon on a walnut desk, polaroids with the product photos, stamps,
// stickers, a checklist, the price. Clean light background with a dot grid. Captions top left, word by word.
// Timing from guion.json (the voice), the mouth from boca.json (its loudness). window.__render(t), window.__dur.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../dragon/js/dragon.js';

const G = await (await fetch('js/guion.json')).json();
const MOUTH = await (await fetch('js/boca.json')).json();
const L = G.lines, W = 1080, H = 1920;
const END = L[L.length - 1].t1 + 0.15, DUR = END + 3.4;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), in: (t) => t * t * t,
  back: (t) => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const w = (li, wi) => L[li].words[wi][1];
const B = L.map((l, i) => (i === 0 ? 0 : (L[i - 1].t1 + l.t0) / 2)); B.push(END);
const lineAt = (t) => { let i = 0; while (i < L.length - 1 && t >= B[i + 1]) i++; return i; };

/* =========================================================================================
   the phone: a walnut desk, a lamp and the dragon, filmed like a product video
   ========================================================================================= */
const phoneEl = document.createElement('div'); phoneEl.className = 'it'; phoneEl.id = 'phone';
phoneEl.innerHTML = '<div class="scr"><canvas width="412" height="852"></canvas><div class="island"></div><div class="ui"><i></i><i></i><i></i></div><div class="tag">@long.dragon</div></div>';
document.getElementById('items').appendChild(phoneEl);
const pCanvas = phoneEl.querySelector('canvas');
const pr = new THREE.WebGLRenderer({ canvas: pCanvas, antialias: true, preserveDrawingBuffer: true });
pr.setPixelRatio(1); pr.setSize(412, 852, false); pr.toneMapping = THREE.ACESFilmicToneMapping;
pr.shadowMap.enabled = true; pr.shadowMap.type = THREE.PCFSoftShadowMap;
const ps = new THREE.Scene(); ps.background = new THREE.Color('#0b0b0d');
const pm = new THREE.PMREMGenerator(pr); ps.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; ps.environmentIntensity = 0.35;
const pcam = new THREE.PerspectiveCamera(46, 412 / 852, 0.03, 60);
const tl = new THREE.TextureLoader();
const tex = (u, srgb) => new Promise((r) => tl.load(u, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.repeat.set(1.2, 2.1); r(t); }));
const [wd, wn, wr] = await Promise.all([tex('tex/wood_diff.jpg', true), tex('tex/wood_nor.jpg'), tex('tex/wood_rough.jpg')]);
const desk = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), new THREE.MeshPhysicalMaterial({ map: wd, normalMap: wn, roughnessMap: wr, roughness: 0.85, clearcoat: 0.3, clearcoatRoughness: 0.22 }));
desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; ps.add(desk);
const lamp = new THREE.SpotLight('#ffd7a3', 70, 16, 0.8, 0.65, 2); lamp.position.set(2.6, 5, 2.4); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.radius = 5; lamp.shadow.bias = -0.0004; ps.add(lamp, lamp.target);
const fillL = new THREE.HemisphereLight('#a8b8ff', '#2a1a10', 0.35); ps.add(fillL);
const rimL = new THREE.DirectionalLight('#ff9be0', 1.0); rimL.position.set(-4, 3, -5); ps.add(rimL);
const glowL = new THREE.PointLight('#6dffb0', 0, 5, 2); ps.add(glowL);
const dragon = createDragon(ps, { hq: true });
dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
const spine = Array.from({ length: SEG + 1 }, () => V());
const bodyY = (k) => 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025;
function onDesk(out, lift, t) {
  for (let k = 0; k <= SEG; k++) out[k].y = bodyY(k);
  for (let k = 0; k < 6; k++) { const f = Math.pow(1 - k / 6, 2); out[k].y += lift * f + Math.sin(t * 2.1 + 1) * 0.025 * f; out[k].x += Math.sin(t * 1.7) * 0.05 * f; out[k].z += (0.15 + Math.cos(t * 1.3) * 0.04) * f; }
}
function alongPath(c, tau, out) {
  out[0].copy(c(tau)); let prev = out[0].clone(), total = 0, k = 1, tt = tau, n = 0;
  while (k <= SEG && n++ < 40000) { tt -= 0.003; const q = c(tt); const s = prev.distanceTo(q); while (k <= SEG && total + s >= k * SPACING) { out[k].lerpVectors(prev, q, (k * SPACING - total) / s); k++; } total += s; prev = q; }
  for (; k <= SEG; k++) out[k].copy(out[k - 1]);
}
const dense = Array.from({ length: 600 }, () => V());
function coil(out, t, rot = 0) {
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.6 + u * Math.PI * 4.4 + rot + Math.sin(t * 0.7 + u * 4) * 0.05, r = 0.35 + u * 0.95; dense[i].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  let acc = 0, j = 0; out[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { out[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
}
const COLS = ['arcoiris', 'galaxia', 'plata', 'fuego'];
let curCol = '';
const tOff = w(4, 7) + 0.1, tGlow = w(4, 9);
function phoneShot(t) {
  const li = lineAt(t), u = t - B[li];
  let lift = 0.5, glow = 0, col = 'arcoiris', cpos, cat;
  const hand = V(Math.sin(t * 1.1) * 0.03, Math.sin(t * 1.4) * 0.025, 0);
  if (li === 1) {
    const c = (q) => { const v = q - B[1]; return V(0.7 * Math.sin(1.9 * v) - 0.1, 0, -3 + 1.2 * v); };
    alongPath(c, t, spine); onDesk(spine, 0.32, t); const h = spine[0];
    cpos = V(0.5, 0.75, h.z + 2.4); cat = V(h.x * 0.5, 0.25, h.z - 0.3);
  } else if (li === 2) {
    const c = (q) => { const v = q - B[2]; return V(-3 + 1.3 * v, 0, 0.3 * Math.sin(2.6 * v)); };
    alongPath(c, t, spine); onDesk(spine, 0.28, t); const m = spine[10];
    cpos = V(m.x + 0.5, 0.65, 1.4); cat = V(m.x - 0.1, 0.12, m.z);
  } else if (li === 3) {
    for (let k = 0; k <= SEG; k++) spine[k].set(-3.2 + k * SPACING, 0, Math.sin(k * 0.5 + t * 2) * 0.04 * (k / SEG));
    onDesk(spine, 0.3, t);
    const x = lerp(2.6, -2.6, E.inOut(prog(t, B[3], B[4])));
    cpos = V(x + 0.3, 2.3, 2.6); cat = V(x - 0.2, 0, 0.1);
  } else {
    coil(spine, t, li * 0.9 + t * 0.12); onDesk(spine, li === 0 ? lerp(0.12, 0.6, E.back(prog(t, 0.2, 0.8))) : 0.55, t);
    const a = 0.3 + li * 0.7 + u * 0.15, r = li === 4 ? 2.2 : 2.9;
    cpos = V(Math.sin(a) * r, li === 4 ? 2.9 : 1.7, Math.cos(a) * r + 0.3); cat = V(0, 0.35, 0.1);
    if (li === 5) col = COLS[Math.min(3, Math.max(0, Math.floor((t - w(5, 2)) / 0.32) + 1))] ?? 'arcoiris';
    if (li === 5 && t < w(5, 2)) col = 'arcoiris';
  }
  if (col !== curCol) { dragon.setColor(col); curCol = col; }
  const off = li === 4 && t >= tOff ? 1 : 0;
  if (li === 4) glow = E.expo(prog(t, tGlow, tGlow + 0.35)) * (0.85 + 0.15 * Math.sin(t * 4));
  lamp.intensity = 70 * (1 - off); fillL.intensity = lerp(0.35, 0.02, off); rimL.intensity = lerp(1, 0.08, off); ps.environmentIntensity = lerp(0.35, 0.01, off);
  glowL.intensity = glow * 2.5; glowL.position.copy(spine[12]).add(V(0, 0.4, 0));
  dragon.update(spine, t, glow * 0.55);
  pcam.position.copy(cpos).add(hand); pcam.lookAt(cat); pcam.updateProjectionMatrix();
  pr.render(ps, pcam);
}

/* =========================================================================================
   the presenter
   ========================================================================================= */
const c2 = document.getElementById('gl2');
const r2 = new THREE.WebGLRenderer({ canvas: c2, antialias: true, alpha: true, preserveDrawingBuffer: true });
r2.setPixelRatio(1); r2.setSize(W, H, false); r2.toneMapping = THREE.NeutralToneMapping; r2.setClearColor(0x000000, 0);
const sc = new THREE.Scene();
const pm2 = new THREE.PMREMGenerator(r2); sc.environment = pm2.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.9;
const cam = new THREE.PerspectiveCamera(26, W / H, 0.1, 100); cam.position.set(0, 0, 30); cam.lookAt(0, 0, 0);
const key = new THREE.DirectionalLight('#fff1e2', 2.2); key.position.set(-6, 8, 10); sc.add(key);
const rim = new THREE.DirectionalLight('#ffffff', 1.6); rim.position.set(8, 4, -6); sc.add(rim);
const fill = new THREE.HemisphereLight('#ffffff', '#c9b8a8', 0.6); sc.add(fill);

const skin = new THREE.MeshPhysicalMaterial({ color: '#a26846', roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color('#ffcfb0'), clearcoat: 0.1 });
const skinDark = new THREE.MeshPhysicalMaterial({ color: '#8a5537', roughness: 0.6 });
const hairMat = new THREE.MeshStandardMaterial({ color: '#17110d', roughness: 0.95 });
const hairCut = hairMat.clone(); hairCut.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float hh; varying float vHH;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHH = hh;'); sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vHH;').replace('void main() {', 'void main() {\n if (vHH < 0.0) discard;'); };
const jacket = new THREE.MeshPhysicalMaterial({ color: '#a8171d', roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#ff8a7a') });
const white = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.4 });
const dark = new THREE.MeshStandardMaterial({ color: '#2a1410', roughness: 0.7 });
const iris = new THREE.MeshPhysicalMaterial({ color: '#3a2216', roughness: 0.2, clearcoat: 1 });
const mesh = (g, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], parent) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); (parent || man).add(o); return o; };
const sph = new THREE.SphereGeometry(1, 64, 48);

const man = new THREE.Group(); sc.add(man);
// body: a rounded jacket with a white zip, a collar
const torso = mesh(new THREE.CapsuleGeometry(1.25, 1.7, 12, 32), jacket, [0, -3.2, 0], [1.28, 1, 0.78]);
mesh(new THREE.BoxGeometry(0.07, 2.6, 0.05), white, [0.0, -3.0, 0.99]);
mesh(new THREE.CylinderGeometry(0.56, 0.78, 0.42, 40), jacket, [0, -1.78, 0], [1, 1, 0.85]);
mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.8, 32), skin, [0, -1.35, 0]);
// head
const head = new THREE.Group(); head.position.set(0, -0.15, 0.05); man.add(head);
const hm = (g, m, p, s, r) => mesh(g, m, p, s, r, head);
hm(sph, skin, [0, 0, 0], [0.9, 1.04, 0.96]);
hm(sph, skin, [0, -0.42, 0.12], [0.64, 0.5, 0.7]);                       // jaw and chin
// buzzcut: a shell on the skull above a hairline, very short and dark
const hairGeo = (() => {
  const g = new THREE.SphereGeometry(1, 128, 96); const p = g.attributes.position, hh = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const front = Math.max(0, z), side = Math.abs(x); let line = z > 0 ? 0.52 - 0.08 * Math.exp(-Math.pow(side / 0.18, 2)) * 0 + (side > 0.45 ? (side - 0.45) * -0.2 : 0) : -0.45 + (z + 1) * 0.6; if (z > 0 && side > 0.62) line = lerp(0.45, 0.02, clamp((side - 0.62) / 0.25)); if (z < 0) line = lerp(0.05, -0.5, clamp(-z / 0.9)); if (z > 0 && z < 0.55 && side > 0.75) line = Math.min(line, 0.05 + (0.55 - z) * 0.0); hh[i] = y - line; }
  g.setAttribute('hh', new THREE.Float32BufferAttribute(hh, 1)); return g;   // cut in the shader, so the hairline is a clean curve
})();
hm(hairGeo, hairCut, [0, 0.01, -0.005], [0.912, 1.052, 0.972]);
[-1, 1].forEach((s) => {
  hm(sph, skinDark, [s * 0.86, -0.08, -0.05], [0.13, 0.27, 0.2], [0, s * 0.3, 0]);   // ears
  hm(sph, white, [s * 0.32, 0.1, 0.8], [0.17, 0.15, 0.1]);                           // eye whites
});
const pupils = [-1, 1].map((s) => hm(sph, iris, [s * 0.32, 0.1, 0.885], [0.085, 0.09, 0.04]));
const shines = [-1, 1].map((s) => hm(sph, white, [s * 0.3 + 0.03, 0.14, 0.92], [0.022, 0.022, 0.01]));
const lids = [-1, 1].map((s) => hm(sph, skin, [s * 0.32, 0.1, 0.81], [0.185, 0.165, 0.115]));
const brows = [-1, 1].map((s) => hm(new THREE.CapsuleGeometry(0.06, 0.26, 6, 12), hairMat, [s * 0.33, 0.34, 0.86], [1, 1, 0.7], [0, 0, Math.PI / 2 + s * 0.12]));
hm(sph, skin, [0, -0.1, 0.93], [0.11, 0.18, 0.14]);                                  // nose
hm(sph, skin, [0, -0.2, 0.98], [0.11, 0.09, 0.1]);
const mouth = new THREE.Group(); mouth.position.set(0, -0.5, 0.86); head.add(mouth);
const mIn = mesh(sph, dark, [0, 0, 0], [0.24, 0.05, 0.1], [0, 0, 0], mouth);
const teeth = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.05), white, [0, 0.03, 0.06], [1, 1, 1], [0, 0, 0], mouth);
const lipLo = mesh(new THREE.CapsuleGeometry(0.05, 0.3, 6, 12), skinDark, [0, -0.07, 0.06], [1, 1, 0.8], [0, 0, Math.PI / 2], mouth);
const lipUp = mesh(new THREE.CapsuleGeometry(0.045, 0.32, 6, 12), skinDark, [0, 0.07, 0.07], [1, 1, 0.8], [0, 0, Math.PI / 2], mouth);
// arms: the pointing one (toward the screen's left), and the other resting low
function arm(side) {
  const sh = new THREE.Group(); sh.position.set(side * 1.45, -2.25, 0); man.add(sh);
  mesh(new THREE.SphereGeometry(0.46, 32, 24), jacket, [0, 0, 0], [1, 1, 1], [0, 0, 0], sh);
  mesh(new THREE.CapsuleGeometry(0.38, 1.25, 10, 24), jacket, [0, -0.85, 0], [1, 1, 1], [0, 0, 0], sh);
  const el = new THREE.Group(); el.position.set(0, -1.65, 0); sh.add(el);
  mesh(new THREE.CapsuleGeometry(0.33, 1.05, 10, 24), jacket, [0, -0.7, 0], [1, 1, 1], [0, 0, 0], el);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 24), white, [0, -1.35, 0], [1, 1, 1], [0, 0, 0], el);   // the cuff
  const hd = new THREE.Group(); hd.position.set(0, -1.6, 0); el.add(hd);
  mesh(sph, skin, [0, -0.15, 0], [0.27, 0.3, 0.16], [0, 0, 0], hd);
  mesh(new THREE.CapsuleGeometry(0.075, 0.42, 6, 12), skin, [0.02, -0.62, 0.02], [1, 1, 1], [0, 0, 0], hd);     // index finger, pointing
  mesh(new THREE.CapsuleGeometry(0.08, 0.16, 6, 12), skin, [-side * 0.2, -0.3, 0.08], [1, 1, 1], [0, 0, side * 0.6], hd);   // thumb
  for (let k = 0; k < 3; k++) mesh(new THREE.CapsuleGeometry(0.075, 0.12, 6, 12), skin, [0.02 + side * (k + 1) * 0.09 - side * 0.0, -0.38, 0.09], [1, 1, 1], [1.4, 0, 0], hd);   // curled fingers
  return { sh, el, hd };
}
const armP = arm(-1), armR = arm(1);
man.position.set(2.45, -3.7, 0); man.rotation.y = -0.42; man.scale.setScalar(1.12);

// where on screen the arm points, per moment: the phone, the right column, the price
const target = new THREE.Vector2();
const tmpV = V();
function presenter(t) {
  const li = lineAt(t);
  const m = MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round((t - 0.15 + 0.15) * MOUTH.fps)))] || 0;    // the voice track starts 0.15 s in
  const talk = t < L[L.length - 1].t1 + 0.1 ? m : 0;
  // the mouth: open with the voice, a little wider on the louder syllables
  mIn.scale.set(0.24 + talk * 0.05, 0.03 + talk * 0.17, 0.1); mIn.position.y = -talk * 0.05;
  lipLo.position.y = -0.07 - talk * 0.17; teeth.visible = talk > 0.15; teeth.position.y = 0.03;
  lipUp.position.y = 0.07 + talk * 0.01;
  // blinks, eyes on the camera with glances at what he shows
  const bp = (t + 0.7) % 3.3, blink = bp < 0.13 ? Math.sin((bp / 0.13) * Math.PI) : 0;
  lids.forEach((l) => { l.scale.y = 0.165 * Math.max(0.05, blink); l.position.y = 0.1 + 0.16 * (1 - blink) * 0; l.visible = blink > 0.02; });
  const glance = [0.6, 0.9, 1.6, 0.4, 2.2, 0.5, 1.0, 0.3].map((g) => g)[li];
  const lookSide = ((t - B[li]) % 2.4) < 0.7 && t < END ? -0.02 : 0;
  pupils.forEach((p, i) => { p.position.x = (i ? 1 : -1) * 0.32 + lookSide + 0.02; });
  shines.forEach((p, i) => { p.position.x = (i ? 1 : -1) * 0.3 + 0.03 + lookSide; });
  // brows lift on the key words
  const kw = KEYTIMES.reduce((a, k) => Math.max(a, Math.exp(-Math.abs(t - k - 0.1) * 6) * (t > k - 0.2 ? 1 : 0)), 0);
  brows.forEach((b, i) => { b.position.y = 0.34 + kw * 0.07; b.rotation.z = Math.PI / 2 + (i ? 1 : -1) * (0.12 - kw * 0.08); });
  // head: talks with small nods, turns toward his content now and then
  head.rotation.x = Math.sin(t * 7.5) * 0.035 * talk + Math.sin(t * 0.9) * 0.03 - kw * 0.04;
  head.rotation.y = 0.2 + Math.sin(t * 0.6) * 0.06 + lookSide * 8;
  head.rotation.z = Math.sin(t * 0.8 + 1) * 0.04;
  torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
  man.position.y = -3.7 + Math.sin(t * 1.6) * 0.05 + kw * 0.06;
  man.rotation.z = Math.sin(t * 0.7) * 0.012;
  // the pointing arm: raised toward the current target, a beat on each key word
  const tgt = POINT[li] || [0.55, 0.35]; const end = t > END ? [0.5, 0.42] : tgt;
  target.set(lerp(target.x || end[0], end[0], 0.08), lerp(target.y || end[1], end[1], 0.08));
  const up = 1.9 + (0.55 - target.y) * 1.6, out = 0.5 + (0.55 - target.x) * 0.9;
  armP.sh.rotation.set(-0.35 - kw * 0.1, 0.2, -(up) + Math.sin(t * 2.2) * 0.03);
  armP.el.rotation.set(-0.25, 0, -0.35 - out * 0.4 + kw * 0.15);
  armP.hd.rotation.set(0.1, 0, -0.15 + Math.sin(t * 3) * 0.05);
  armR.sh.rotation.set(0.15, 0, 0.25 + Math.sin(t * 1.3) * 0.03); armR.el.rotation.set(-0.9 + talk * 0.15, 0, 0.3); armR.hd.rotation.set(0, 0, 0.2);
  r2.render(sc, cam);
}
const POINT = { 0: [0.3, 0.4], 1: [0.3, 0.45], 2: [0.65, 0.33], 3: [0.62, 0.3], 4: [0.65, 0.36], 5: [0.65, 0.33], 6: [0.66, 0.32], 7: [0.66, 0.3] };

/* =========================================================================================
   captions: header and the spoken phrase, top left; spoken words dark, the rest grey, key words in a red serif
   ========================================================================================= */
const HEADS = ['// 01 · el gancho', '// 02 · el producto', '// 03 · articulado', '// 04 · el tamaño', '// 05 · lo mejor', '// 06 · los colores', '// 07 · el regalo', '// 08 · dónde comprarlo'];
const KEYS = new Set(['obsesionado', 'dragón', '3d', 'mueve', 'articulada', 'vivo', 'noventa', 'centímetros', 'brilla', 'colores', 'navidad', 'falla', 'perfil', 'vosotros']);
const clean = (x) => x.replace(/[.,¿?…]+$/g, '').replace(/^¿/, '');
const KEYTIMES = [];
const PHR = L.map((l, li) => {
  const out = []; let cur = [];
  l.words.forEach((wd, i) => { cur.push(wd); const brk = /[.,?]$/.test(wd[0]) || cur.length >= 4; if (brk || i === l.words.length - 1) { out.push(cur); cur = []; } if (KEYS.has(clean(wd[0]).toLowerCase())) KEYTIMES.push(wd[1]); });
  return out;
});
const headEl = document.getElementById('head'), capEl = document.getElementById('capt');
let shownPh = null;
function captions(t) {
  const li = lineAt(t);
  if (t > END) { headEl.style.opacity = 1 - prog(t, END, END + 0.3); capEl.style.opacity = headEl.style.opacity; return; }
  headEl.textContent = HEADS[li]; headEl.style.opacity = 1; capEl.style.opacity = 1;
  const phs = PHR[li]; let ph = phs[0]; for (const p of phs) if (t >= p[0][1] - 0.05) ph = p;
  if (shownPh !== ph) {
    capEl.innerHTML = ph.map((wd) => `<span class="w${KEYS.has(clean(wd[0]).toLowerCase()) ? ' k' : ''}">${clean(wd[0])}</span>`).join('');
    shownPh = ph;
  }
  [...capEl.children].forEach((s, i) => { const on = t >= ph[i][1] - 0.03; s.classList.toggle('on', on); const p = prog(t, ph[i][1] - 0.03, ph[i][1] + 0.12); s.style.transform = `translateY(${(1 - E.out(p)) * 8}px)`; });
  const dark = li === 4 && t >= tOff ? 1 : 0;
  headEl.style.color = dark ? '#9aa3ad' : '#8b8781';
  [...capEl.children].forEach((s) => { if (!s.classList.contains('k')) s.style.color = s.classList.contains('on') ? (dark ? '#f2f2f2' : '#141414') : (dark ? '#4a4f57' : '#c9c5bf'); else s.style.color = s.classList.contains('on') ? '#ff4a3d' : (dark ? '#4a4f57' : '#c9c5bf'); });
}

/* =========================================================================================
   the things he shows: each comes in, holds and leaves, with its own entrance
   ========================================================================================= */
const itemsEl = document.getElementById('items');
const ITEMS = [];
function item(html, x, y, t0, t1, kind = 'pop', rot = 0, cls = '') {
  const d = document.createElement('div'); d.className = 'it ' + cls; d.innerHTML = html; itemsEl.appendChild(d);
  const it = { d, x, y, t0, t1, kind, rot }; ITEMS.push(it); return it;
}
const S1 = B[1], S2 = B[2], S3 = B[3], S4 = B[4], S5 = B[5], S6 = B[6], S7 = B[7];
const phone = { d: phoneEl, x: 110, y: 420, t0: 0.05, t1: END, kind: 'rise', rot: 0 }; ITEMS.push(phone);
item('<div class="pol"><div class="pin"></div><img src="img/producto-muneca.jpg"><span>el original</span></div>', 610, 430, 0.35, S1 + 0.1, 'drop', 6);
item('<div class="pol"><div class="pin"></div><img src="img/producto-colores.jpg"><span>todos los colores</span></div>', 640, 850, 0.65, S1 + 0.1, 'drop', -5);
item('<div class="stamp">¡OBSESIONADO!</div>', 120, 760, w(0, 8) - 0.02, S1, 'stamp', -9);
item('<div class="chip"><svg width="40" height="40" viewBox="0 0 100 100" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 18h56v22H22zM42 40h16l-8 14M18 70h64M24 82h52"/></svg>impreso en 3D</div>', 600, 500, w(1, 3) - 0.02, S2, 'slide');
item('<div class="sticker">¡MIRA CÓMO<br>SE MUEVE!</div>', 610, 680, w(1, 7) - 0.02, S2, 'pop', 5);
const chkCard = item('<div class="card"><div class="ttl">// articulado</div><div class="chk"><b>✓</b>CADA PIEZA GIRA</div><div class="chk"><b>✓</b>SIN PEGAMENTO</div><div class="chk"><b>✓</b>SÚPER FLEXIBLE</div></div>', 590, 470, w(2, 0) - 0.02, S3, 'slide');
item('<div class="stamp">¡PARECE VIVO!</div>', 600, 930, w(2, 9) - 0.02, S3, 'stamp', -7);
item('<div class="big" style="font-size:210px"><em>88</em> CM</div>', 585, 460, w(3, 1) - 0.02, S4, 'pop', -3);
const ruler = item('<div class="card" style="width:400px"><div class="ttl">// de la cabeza a la cola</div><div style="position:relative;height:30px;border-left:4px solid #141414;border-right:4px solid #141414"><div class="rf" style="position:absolute;left:0;top:13px;height:4px;width:0;background:#e0302f"></div></div><div style="display:flex;justify-content:space-between;font:600 24px Mono;color:#8b8781;margin-top:8px"><span>0</span><span>44</span><span>88 cm</span></div></div>', 600, 720, w(3, 3) - 0.02, S4, 'rise');
item('<div class="sticker" style="background:#1b1d22;color:#d9fff0;box-shadow:0 0 50px rgba(63,255,170,.45)">BRILLA EN LA<br>OSCURIDAD</div>', 600, 560, tGlow - 0.02, S5, 'pop', 4);
item('<div class="sw"><div><i style="background:linear-gradient(135deg,#ffd23f,#9be15d,#38c6d9,#5b7cff,#b45cff,#ff6fa8)"></i>Arcoíris</div><div><i style="background:linear-gradient(135deg,#7b45f0,#a37cff,#d8c25a,#3e5ee0)"></i>Galaxia</div><div><i style="background:linear-gradient(135deg,#f4f6f9,#a3aab4,#e9ecf1)"></i>Plata</div><div><i style="background:linear-gradient(135deg,#ffcf4a,#ff6a1f,#e8222f)"></i>Fuego</div></div>', 600, 470, w(5, 1) - 0.02, S6, 'slide');
item('<svg width="380" height="380" viewBox="0 0 100 100"><rect x="14" y="42" width="72" height="50" rx="4" fill="#d62b2b"/><rect x="8" y="30" width="84" height="16" rx="4" fill="#e63b3b"/><rect x="45" y="30" width="10" height="62" fill="#f2c94c"/><path d="M50 30c-10-16-26-12-20-2 4 6 20 2 20 2zm0 0c10-16 26-12 20-2-4 6-20 2-20 2z" fill="#f2c94c"/></svg>', 640, 440, w(6, 0) - 0.02, S7, 'drop', 6);
item('<div class="stamp">¡NO FALLA!</div>', 610, 870, w(6, 6) - 0.02, S7, 'stamp', -8);
item('<div class="price"><b>21,95 €</b><span>o 2 por 32,95 €</span></div>', 610, 460, w(7, 0) - 0.02, END, 'pop', -3);
const btn = item('<div class="btn">link en mi perfil</div>', 600, 860, w(7, 4) - 0.02, END, 'rise');
const cur = item('<svg class="cursor" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#141414" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>', 0, 0, w(7, 5) - 0.3, END, 'none');
item('<div class="bubble">¿cuál elegís? 👇</div>'.replace(' 👇', ''), 110, 1340, w(7, 9) - 0.02, END, 'pop', -2);
// snow for Christmas
const snow = document.createElement('div'); snow.id = 'snow'; snow.style.cssText = 'position:absolute;inset:0;opacity:0'; snow.innerHTML = Array.from({ length: 50 }, () => '<i></i>').join(''); itemsEl.appendChild(snow);
// the end card: the product photo, the price, the link; he points at it
const endc = item(`<div style="width:820px;text-align:center"><div style="font:500 28px Mono;color:#8b8781">// dragón articulado</div><div style="font:800 96px/1 Inter;letter-spacing:-0.05em;margin:10px 0 26px">LÓNG <span style="font:900 86px Han;color:#e0302f">龍</span></div>
  <div class="pol" style="display:inline-block;padding:18px 18px 70px;transform:rotate(-2deg)"><div class="pin"></div><img src="img/producto-muneca.jpg" style="width:620px;height:620px"><span>21,95 € · 2 por 32,95 €</span></div></div>`, 130, 300, END - 0.05, DUR + 1, 'rise');
const endBtn = item('<div class="btn" style="background:#e0302f">link en mi perfil</div>', 330, 1300, END + 0.7, DUR + 1, 'pop');

function animItems(t) {
  ITEMS.forEach((it) => {
    const a = t - it.t0, d = it.d;
    if (a < 0 || t > it.t1 + 0.25) { d.style.opacity = 0; return; }
    const out = E.in(prog(t, it.t1, it.t1 + 0.22));
    let x = it.x, y = it.y, s = 1, r = it.rot, o = 1, blur = 0;
    if (it.kind === 'pop') { const p = E.back(prog(a, 0, 0.35)); s = lerp(0.3, 1, p); o = clamp(a * 6); r += (1 - p) * 10; }
    else if (it.kind === 'drop') { const p = E.back(prog(a, 0, 0.45)); y -= (1 - p) * 140; r += (1 - p) * 14; o = clamp(a * 5); }
    else if (it.kind === 'stamp') { const p = E.out(prog(a, 0, 0.16)); s = lerp(2.4, 1, p); o = clamp(a * 8); blur = (1 - p) * 6; x += Math.sin(a * 60) * 4 * Math.exp(-a * 8); }
    else if (it.kind === 'slide') { const p = E.out(prog(a, 0, 0.45)); x += (1 - p) * 160; o = p; blur = (1 - p) * 10; }
    else if (it.kind === 'rise') { const p = E.out(prog(a, 0, 0.55)); y += (1 - p) * 120; o = p; blur = (1 - p) * 8; }
    // a slow float while it holds, then out
    y += Math.sin(t * 1.3 + it.x * 0.01) * 4;
    o *= 1 - out; s *= 1 - out * 0.15;
    d.style.opacity = o; d.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
    d.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
  });
  // the phone: a touch bigger while it is the star (line 2), and it steps aside at the end
  const big = E.inOut(prog(t, S1, S1 + 0.4)) * (1 - E.inOut(prog(t, S2, S2 + 0.4)));
  phone.d.style.transform += ` scale(${1 + big * 0.05})`;
  // the checklist ticks in one by one
  chkCard.d.querySelectorAll('.chk').forEach((c, i) => c.classList.toggle('on', t > w(2, 2) + i * 0.35));
  ruler.d.querySelector('.rf').style.width = (E.inOut(prog(t, w(3, 3), w(3, 4) + 0.4)) * 100) + '%';
  // the cursor glides to the button and taps it
  const cp = E.inOut(prog(t, w(7, 5) - 0.3, w(7, 5) + 0.15)), tap = t > w(7, 5) + 0.15 && t < w(7, 5) + 0.35;
  cur.x = lerp(960, 830, cp); cur.y = lerp(1180, 920, cp);
  cur.d.style.transform = `translate(${cur.x}px, ${cur.y}px) scale(${tap ? 0.85 : 1})`;
  if (tap) btn.d.firstChild.style.transform = 'scale(0.95)'; else btn.d.firstChild.style.transform = '';
  // the room goes dark with the lights
  const off = lineAt(t) === 4 && t >= tOff ? 1 : 0;
  document.getElementById('dim').style.opacity = off * 0.82;
  // snow over the gift
  const sa = t - w(6, 2);
  snow.style.opacity = sa > 0 && t < S7 + 0.3 ? E.out(prog(sa, 0, 0.5)) * (1 - prog(t, S7, S7 + 0.3)) : 0;
  if (sa > 0) [...snow.children].forEach((f, i) => { const s = (i * 0.618) % 1; f.style.transform = `translate(${(s * 1777) % 1080 + Math.sin(sa + i) * 25}px, ${((sa * (0.12 + s * 0.15) + s) % 1) * 1920}px) scale(${0.4 + s})`; f.style.opacity = 0.6 + 0.4 * s; });
}

/* ---------- film grain on the light background ---------- */
const gctx = document.getElementById('grain').getContext('2d'), gimg = gctx.createImageData(540, 960);
function grain(t) { let s = Math.floor(t * 24) * 9301 + 49297; for (let i = 0; i < gimg.data.length; i += 4) { s = (s * 233280 + 49297) % 233280; const v = (s / 233280) * 255; gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v; gimg.data[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

/* ---------- one frame ---------- */
function render(t) {
  animItems(t); captions(t); grain(t);
  if (t < END + 0.3) phoneShot(t);
  presenter(t);
}

await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['700 60px Inter', 'italic 400 60px Serif', '400 60px Anton', '500 30px Mono', '900 60px Han']) await document.fonts.load(f, 'Aá龍');
window.__dur = DUR;
window.__cues = {
  dur: DUR, end: END, lightsOff: tOff, glow: tGlow, cuts: B.slice(1, -1),
  items: ITEMS.filter((i) => i.kind !== 'none').map((i) => ({ t: +i.t0.toFixed(3), kind: i.kind })),
  ticks: [0, 1, 2].map((i) => +(w(2, 2) + i * 0.35).toFixed(3)), tap: +(w(7, 5) + 0.15).toFixed(3),
};
window.__render = (t) => render(t);
render(0);
window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
