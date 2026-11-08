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
r2.setPixelRatio(1.5); r2.setSize(W, H, false); r2.toneMapping = THREE.NeutralToneMapping; r2.setClearColor(0x000000, 0);
const sc = new THREE.Scene();
const pm2 = new THREE.PMREMGenerator(r2); sc.environment = pm2.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.9;
const cam = new THREE.PerspectiveCamera(26, W / H, 0.1, 100); cam.position.set(0, 0, 30); cam.lookAt(0, 0, 0);
const key = new THREE.DirectionalLight('#fff1e2', 2.2); key.position.set(-6, 8, 10); sc.add(key);
const rim = new THREE.DirectionalLight('#ffffff', 1.6); rim.position.set(8, 4, -6); sc.add(rim);
const fill = new THREE.HemisphereLight('#ffffff', '#c9b8a8', 0.6); sc.add(fill);

const skin = new THREE.MeshPhysicalMaterial({ color: '#8a5336', roughness: 0.62, sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color('#d99a78'), specularIntensity: 0.35 });
const skinDark = new THREE.MeshPhysicalMaterial({ color: '#6e3f29', roughness: 0.6 });
const hairMat = new THREE.MeshStandardMaterial({ color: '#15100c', roughness: 1, envMapIntensity: 0.25 });
// the fade: a crisp hairline at the front, and on the sides and the back the hair thins out toward the skin in fine
// stubble, as a barber's skin fade does (dithered, so it reads as short hairs, not a blur)
const hairFade = hairMat.clone();
hairFade.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float hh; varying float vHH; varying vec3 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHH = hh; vP = position;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
    varying float vHH; varying vec3 vP;
    float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }`)
    .replace('void main() {', `void main() {
      if (vP.z > 0.3 && vHH < 0.0) discard;                                   // the front hairline
      if (abs(vP.x) > 0.78 && vP.y < 0.12 && vP.z > -0.35) discard;           // clear of the ears
      float side = smoothstep(0.25, 0.7, abs(vP.x)) + smoothstep(0.2, -0.45, vP.z);
      float dens = mix(1.0, smoothstep(-0.3, 0.68, vP.y), clamp(side, 0.0, 1.0));
      if (h3(floor(vP * 210.0)) > dens * 1.25) discard;`)
    .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(vec3(0.27, 0.16, 0.1), diffuseColor.rgb, smoothstep(0.15, 0.95, dens));');
};
const jacket = new THREE.MeshPhysicalMaterial({ color: '#a8171d', roughness: 0.6, sheen: 0.6, sheenColor: new THREE.Color('#ff8a7a') });
const white = new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.4 });
const dark = new THREE.MeshStandardMaterial({ color: '#2a1410', roughness: 0.7 });
const iris = new THREE.MeshPhysicalMaterial({ color: '#3a2216', roughness: 0.2, clearcoat: 1 });
const frameMat = new THREE.MeshPhysicalMaterial({ color: '#0c0c0e', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
const lensMat = new THREE.MeshPhysicalMaterial({ color: '#0a0c12', metalness: 0.6, roughness: 0.04, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 600] });
const silver = new THREE.MeshPhysicalMaterial({ color: '#e8eaee', metalness: 1, roughness: 0.16 });
const mesh = (g, m, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0], parent) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r); (parent || man).add(o); return o; };
const sph = new THREE.SphereGeometry(1, 64, 48);

/* ---------- sculpted parts: signed distance fields blended smoothly, meshed with surface nets ---------- */
const sdE = (p, c, r) => { const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2]; const k0 = Math.hypot(x, y, z), k1 = Math.hypot(x / r[0], y / r[1], z / r[2]); return k1 < 1e-6 ? -Math.min(...r) : (k0 * (k0 - 1)) / k1; };
const sdC = (p, a, b, r) => { const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const h = clamp((pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2)); const rr = Array.isArray(r) ? lerp(r[0], r[1], h) : r; return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - rr; };
const sdB = (p, c, b, r) => { const q = [Math.abs(p[0] - c[0]) - b[0], Math.abs(p[1] - c[1]) - b[1], Math.abs(p[2] - c[2]) - b[2]]; return Math.hypot(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0)) + Math.min(Math.max(q[0], q[1], q[2]), 0) - r; };
const smin = (a, b, k) => { const h = clamp(0.5 + (0.5 * (b - a)) / k); return lerp(b, a, h) - k * h * (1 - h); };
const smax = (a, b, k) => -smin(-a, -b, k);
const mir = (p) => [Math.abs(p[0]), p[1], p[2]];
function sculpt(f, lo, hi, res) {
  const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], h = Math.max(...ext) / res;
  const n = ext.map((e) => Math.ceil(e / h) + 1), [nx, ny, nz] = n, at = (i, j, k) => i + nx * (j + ny * k);
  const v = new Float32Array(nx * ny * nz); const P = [0, 0, 0];
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { P[0] = lo[0] + i * h; P[1] = lo[1] + j * h; P[2] = lo[2] + k * h; v[at(i, j, k)] = f(P); }
  const cid = new Int32Array(nx * ny * nz).fill(-1), pos = [], nor = [], idx = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], EG = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const cv = C.map((c) => v[at(i + c[0], j + c[1], k + c[2])]); let m = 0; cv.forEach((x, q) => { if (x < 0) m |= 1 << q; }); if (m === 0 || m === 255) continue;
    let sx = 0, sy = 0, sz = 0, cnt = 0;
    for (const [a, b] of EG) { if ((cv[a] < 0) === (cv[b] < 0)) continue; const tt = cv[a] / (cv[a] - cv[b]); sx += C[a][0] + (C[b][0] - C[a][0]) * tt; sy += C[a][1] + (C[b][1] - C[a][1]) * tt; sz += C[a][2] + (C[b][2] - C[a][2]) * tt; cnt++; }
    const x = lo[0] + (i + sx / cnt) * h, y = lo[1] + (j + sy / cnt) * h, z = lo[2] + (k + sz / cnt) * h;
    cid[at(i, j, k)] = pos.length / 3; pos.push(x, y, z);
    const e = h * 0.5, g = [f([x + e, y, z]) - f([x - e, y, z]), f([x, y + e, z]) - f([x, y - e, z]), f([x, y, z + e]) - f([x, y, z - e])], gl = Math.hypot(...g) || 1; nor.push(g[0] / gl, g[1] / gl, g[2] / gl);
  }
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const s0 = v[at(i, j, k)] < 0;
    if (s0 !== (v[at(i + 1, j, k)] < 0)) quad(cid[at(i, j - 1, k - 1)], cid[at(i, j, k - 1)], cid[at(i, j, k)], cid[at(i, j - 1, k)], s0);
    if (s0 !== (v[at(i, j + 1, k)] < 0)) quad(cid[at(i - 1, j, k - 1)], cid[at(i - 1, j, k)], cid[at(i, j, k)], cid[at(i, j, k - 1)], s0);
    if (s0 !== (v[at(i, j, k + 1)] < 0)) quad(cid[at(i - 1, j - 1, k)], cid[at(i, j - 1, k)], cid[at(i, j, k)], cid[at(i - 1, j, k)], s0);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}
[skin, skinDark].forEach((m) => { m.side = THREE.DoubleSide; });
const tee = new THREE.MeshPhysicalMaterial({ color: '#111114', roughness: 0.85, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#3c3c46'), side: THREE.DoubleSide });

const man = new THREE.Group(); sc.add(man);
const body = new THREE.Group(); man.add(body);
// a strong torso in a fitted black tee: broad delts, traps, a full chest, a V down to the waist
const torsoF = (p) => {
  const m = mir(p);
  let d = sdE(p, [0, -2.9, 0], [1.22, 1.2, 0.8]);
  d = smin(d, sdE(m, [0.52, -2.42, 0.36], [0.66, 0.44, 0.46]), 0.28);
  d = smin(d, sdC(m, [0.22, -1.72, -0.08], [1.18, -2.02, -0.06], 0.34), 0.32);
  d = smin(d, sdE(m, [1.38, -2.28, 0.0], [0.56, 0.56, 0.56]), 0.26);
  d = smin(d, sdE(p, [0, -4.1, 0], [1.02, 1.35, 0.72]), 0.45);
  d = smin(d, sdC(p, [0, -1.85, -0.04], [0, -1.6, -0.04], 0.56), 0.2);
  return d;
};
const torso = mesh(sculpt(torsoF, [-2.1, -5.6, -1.1], [2.1, -1.3, 1.2], 150), tee, [0, 0, 0], [1, 1, 1], [0, 0, 0], body);
mesh(new THREE.TorusGeometry(0.55, 0.07, 12, 48), tee, [0, -1.66, 0.02], [1, 1, 0.9], [Math.PI / 2 - 0.12, 0, 0], body);   // the crew neck
const neckF = (p) => smin(sdC(p, [0, -0.7, 0], [0, -1.85, -0.02], 0.5), sdC(mir(p), [0.1, -1.0, -0.15], [0.62, -1.75, -0.1], 0.22), 0.25);   // a thick neck, the traps rising into it
mesh(sculpt(neckF, [-1, -2.05, -0.8], [1, -0.4, 0.7], 80), skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], body);
// the silver chain, on the collarbones just in front of the collar
{
  const pts = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2, front = Math.max(0, Math.cos(a)); pts.push(V(Math.sin(a) * 0.62, -1.6 - front * front * 0.4, Math.cos(a) * 0.52 + front * 0.16)); }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const N = 130, link = new THREE.TorusGeometry(0.028, 0.009, 6, 14); link.scale(1.5, 1, 1);
  const im = new THREE.InstancedMesh(link, silver, N); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), tq = new THREE.Quaternion(), tg = V(), pp = V();
  for (let i = 0; i < N; i++) { curve.getPointAt(i / N, pp); curve.getTangentAt(i / N, tg); q.setFromUnitVectors(V(1, 0, 0), tg); tq.setFromAxisAngle(V(1, 0, 0), i % 2 ? Math.PI / 2 : 0); q.multiply(tq); m4.compose(pp, q, V(1, 1, 1)); im.setMatrixAt(i, m4); }
  body.add(im);
}
// the head: a sculpted face (forehead, brow ridge, eye sockets, cheekbones, a defined jaw tapering to the chin, a
// straight nose with nostrils, full lips with a cupid's bow, ears with a helix). The lower jaw is its own mesh on a
// hinge under the ears, so the mouth really opens: lips part, teeth and tongue show, the stubble hides the seam.
const faceF = (p) => {
  const m = mir(p);
  let d = sdE(p, [0, 0.12, -0.08], [0.84, 0.98, 0.94]);
  d = smin(d, sdE(p, [0, -0.2, 0.33], [0.6, 0.74, 0.6]), 0.32);
  d = smin(d, sdC(m, [0.47, -0.22, 0.0], [0.22, -0.75, 0.48], 0.15), 0.3);
  d = smin(d, sdE(p, [0, -0.84, 0.58], [0.2, 0.15, 0.18]), 0.16);
  d = smin(d, sdE(m, [0.43, -0.02, 0.62], [0.22, 0.14, 0.2]), 0.2);
  d = smin(d, sdC(m, [0.04, 0.3, 0.87], [0.42, 0.32, 0.77], 0.085), 0.14);
  d = smax(d, -sdE(m, [0.3, 0.13, 0.93], [0.15, 0.09, 0.1]), 0.08);
  d = smin(d, sdC(p, [0, 0.24, 0.92], [0, -0.07, 1.07], [0.05, 0.072]), 0.07);
  d = smin(d, sdE(p, [0, -0.11, 1.07], [0.095, 0.078, 0.082]), 0.05);
  d = smin(d, sdE(m, [0.083, -0.155, 0.99], [0.058, 0.047, 0.052]), 0.035);
  d = smax(d, -sdE(m, [0.048, -0.185, 1.035], [0.024, 0.014, 0.03]), 0.012);
  d = smin(d, sdE(p, [0, -0.425, 0.985], [0.19, 0.05, 0.075]), 0.045);
  d = smin(d, sdE(m, [0.048, -0.41, 1.005], [0.075, 0.035, 0.055]), 0.03);
  d = smin(d, sdE(p, [0, -0.54, 0.965], [0.17, 0.055, 0.075]), 0.045);
  d = smax(d, -sdE(p, [0, -0.482, 1.06], [0.205, 0.011, 0.12]), 0.012);
  d = smin(d, sdE(m, [0.84, -0.05, -0.08], [0.11, 0.24, 0.17]), 0.07);
  d = smax(d, -sdE(m, [0.91, -0.05, -0.06], [0.045, 0.15, 0.1]), 0.03);
  return d;
};
// the jaw: below a plane from the line between the lips back to the hinge under the ears
const jawRegion = (p) => smax(p[1] + 0.22 + 0.217 * (p[2] + 0.2), -(p[2] + 0.32), 0.04);
const faceUpF = (p) => smax(faceF(p), -jawRegion(p) - 0.004, 0.0);
const faceLowF = (p) => smax(faceF(p) + 0.006, jawRegion(p) - 0.06, 0.0);   // overlaps up inside the face, so no gap opens
const head = new THREE.Group(); head.position.set(0, -0.15, 0.05); body.add(head);
const hm = (g, m, p, s, r) => mesh(g, m, p, s, r, head);
// skin tones painted on the vertices: darker lips, warmer cheeks and nose
const faceSkin = skin.clone(); faceSkin.color.set('#ffffff'); faceSkin.vertexColors = true;
function paint(g) {
  const pa = g.attributes.position, col = new Float32Array(pa.count * 3), base = new THREE.Color('#8a5336'), lip = new THREE.Color('#5e2e22'), warm = new THREE.Color('#9a573a'), c = new THREE.Color();
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    const lp = Math.exp(-Math.pow((y + 0.48) / 0.07, 2)) * Math.exp(-Math.pow(x / 0.2, 4)) * (z > 0.85 ? 1 : 0);
    const ck = Math.exp(-Math.pow((y + 0.05) / 0.2, 2)) * Math.exp(-Math.pow((Math.abs(x) - 0.4) / 0.15, 2)) * 0.5 + Math.exp(-Math.pow((y + 0.1) / 0.12, 2)) * Math.exp(-Math.pow(x / 0.1, 2)) * 0.4;
    c.copy(base).lerp(warm, clamp(ck)).lerp(lip, clamp(lp * 0.85)); col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
hm(paint(sculpt(faceUpF, [-1.05, -0.9, -1.1], [1.05, 1.15, 1.2], 170)), faceSkin, [0, 0, 0], [1, 1, 1]);
const jawPivot = new THREE.Group(); jawPivot.position.set(0, -0.2, -0.15); head.add(jawPivot);
const jaw = new THREE.Group(); jaw.position.set(0, 0.2, 0.15); jawPivot.add(jaw);
const jm = (g, m, p, s, r) => mesh(g, m, p, s, r, jaw);
jm(paint(sculpt(faceLowF, [-1.0, -1.1, -0.5], [1.0, -0.15, 1.15], 150)), faceSkin, [0, 0, 0], [1, 1, 1]);
// inside the mouth: a dark cavity, upper and lower teeth in an arc, a tongue
const cavity = new THREE.MeshStandardMaterial({ color: '#2a0c0a', roughness: 0.8 });
const toothMat = new THREE.MeshPhysicalMaterial({ color: '#f3efe6', roughness: 0.25, clearcoat: 0.6 });
hm(sph, cavity, [0, -0.47, 0.76], [0.21, 0.09, 0.2]);
jm(sph, cavity, [0, -0.52, 0.76], [0.2, 0.08, 0.2]);
const toothRow = (y, parent, h) => { for (let k = -3; k <= 3; k++) { const a = k * 0.2, r = 0.2; const t = new THREE.Mesh(new THREE.BoxGeometry(0.052, h, 0.035), toothMat); t.position.set(Math.sin(a) * r, y, 0.75 + Math.cos(a) * r); t.rotation.y = a; parent.add(t); } };
toothRow(-0.465, head, 0.06); toothRow(-0.5, jaw, 0.05);
jm(sph, new THREE.MeshPhysicalMaterial({ color: '#b5524f', roughness: 0.45, clearcoat: 0.4 }), [0, -0.53, 0.8], [0.14, 0.035, 0.15]);
// the fade: a shell over the skull, cut and thinned in the shader
const hairGeo = (() => {
  const g = sculpt((p) => sdE(p, [0, 0.12, -0.08], [0.87, 1.012, 0.968]), [-1.0, -0.8, -1.15], [1.0, 1.2, 1.0], 120);
  const pa = g.attributes.position, hh = new Float32Array(pa.count);
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), side = Math.abs(x); hh[i] = y - (0.55 + (side > 0.45 ? (side - 0.45) * -0.25 : 0)); }
  g.setAttribute('hh', new THREE.Float32BufferAttribute(hh, 1)); return g;
})();
hairFade.side = THREE.DoubleSide;
const beardMat = hairMat.clone(); beardMat.side = THREE.DoubleSide; beardMat.color.set('#2a1c14');
beardMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvP = position;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;\nfloat h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }')
    .replace('void main() {', `void main() {
      float ax = abs(vP.x);
      float cheekLine = mix(-0.31, 0.06, smoothstep(0.28, 0.82, ax));                    // the groomed line across the cheek up to the sideburn
      float beard = smoothstep(cheekLine + 0.035, cheekLine - 0.035, vP.y) * step(-0.38, vP.z) * (1.0 - step(0.76, ax) * step(vP.z, 0.12) * step(-0.4, vP.y));
      float must = smoothstep(0.3, 0.26, ax) * smoothstep(-0.28, -0.32, vP.y) * smoothstep(-0.46, -0.42, vP.y) * step(0.72, vP.z);
      float e = pow(vP.x / 0.205, 2.0) + pow((vP.y + 0.485) / 0.07, 2.0);
      float lips = mix(1.0, smoothstep(0.85, 1.15, e), step(0.75, vP.z));
      float dens = max(beard, must) * lips;
      float n = h3(floor(vP * 330.0));
      if (n > dens * 0.985) discard;`)
    .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= 0.7 + 0.6 * h3(floor(vP * 330.0) + 7.0);');
};
const beardLift = (p) => 0.016 + 0.05 * Math.exp(-Math.pow((p[1] + 0.86) / 0.17, 2)) * Math.exp(-Math.pow(p[0] / 0.3, 2));
hm(sculpt((p) => faceUpF(p) - beardLift(p), [-1.05, -0.9, -0.6], [1.05, 0.1, 1.2], 130), beardMat, [0, 0, 0], [1, 1, 1]);
jm(sculpt((p) => faceLowF(p) - beardLift(p), [-1.0, -1.1, -0.5], [1.0, -0.15, 1.15], 120), beardMat, [0, 0, 0], [1, 1, 1]);
hm(hairGeo, hairFade, [0, 0, 0], [1, 1, 1]);
const brows = [-1, 1].map((s) => hm(new THREE.CapsuleGeometry(0.055, 0.26, 6, 12), hairMat, [s * 0.32, 0.4, 0.86], [1, 1, 0.7], [0, 0, Math.PI / 2 + s * 0.14]));
// sunglasses
{
  const lensShape = (wd, ht, r) => { const s = new THREE.Shape(), x = -wd / 2, y = -ht / 2; s.moveTo(x + r, y); s.lineTo(x + wd - r, y); s.quadraticCurveTo(x + wd, y, x + wd, y + r); s.lineTo(x + wd, y + ht - r * 0.6); s.quadraticCurveTo(x + wd, y + ht, x + wd - r, y + ht); s.lineTo(x + r, y + ht); s.quadraticCurveTo(x, y + ht, x, y + ht - r * 0.6); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const glasses = new THREE.Group(); glasses.position.set(0, 0.13, 0.95); head.add(glasses);
  [-1, 1].forEach((sd) => {
    const g = new THREE.Group(); g.position.set(sd * 0.3, 0, -0.03); g.rotation.y = sd * 0.25; glasses.add(g);
    const outer = lensShape(0.46, 0.3, 0.12), hole = lensShape(0.39, 0.235, 0.09); outer.holes.push(hole);
    mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24 }), frameMat, [0, 0, 0], [1, 1, 1], [0, 0, 0], g);
    mesh(new THREE.ExtrudeGeometry(lensShape(0.4, 0.245, 0.095), { depth: 0.02, bevelEnabled: false, curveSegments: 24 }), lensMat, [0, 0, 0.02], [1, 1, 1], [0, 0, 0], g);
  });
  mesh(new THREE.BoxGeometry(0.12, 0.04, 0.04), frameMat, [0, 0.07, 0.0], [1, 1, 1], [0, 0, 0], glasses);
  [-1, 1].forEach((sd) => { const a = V(sd * 0.53, 0.2, 0.88), b = V(sd * 0.84, 0.13, -0.08); const armM = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, a.distanceTo(b)), frameMat); armM.position.copy(a).add(b).multiplyScalar(0.5); armM.quaternion.setFromUnitVectors(V(0, 0, 1), b.clone().sub(a).normalize()); head.add(armM); });
}

// arms: big delts and biceps under a short tee sleeve, thick forearms, strong hands
const upperF = (p) => smin(smin(sdE(p, [0, -0.72, 0.14], [0.44, 0.64, 0.44]), sdE(p, [0, -0.68, -0.14], [0.42, 0.68, 0.42]), 0.2), smin(sdE(p, [0, 0, 0], [0.54, 0.52, 0.54]), sdC(p, [0, -1.15, 0], [0, -1.7, 0], 0.3), 0.3), 0.3);
const sleeveF = (p) => smax(sdC(p, [0, 0.15, 0], [0, -0.78, 0], [0.62, 0.56]), -(p[1] + 0.78), 0.04);
const foreF = (p) => smin(sdE(p, [0, -0.42, 0.03], [0.36, 0.55, 0.33]), sdC(p, [0, -0.15, 0], [0, -1.45, 0], [0.31, 0.22]), 0.25);
const upperG = sculpt(upperF, [-0.7, -1.95, -0.7], [0.7, 0.65, 0.7], 80), sleeveG = sculpt(sleeveF, [-0.75, -0.95, -0.75], [0.75, 0.8, 0.75], 70), foreG = sculpt(foreF, [-0.55, -1.75, -0.55], [0.55, 0.45, 0.55], 72);
function arm(side) {
  const sh = new THREE.Group(); sh.position.set(side * 1.45, -2.25, 0); body.add(sh);
  mesh(upperG, skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], sh);
  mesh(sleeveG, tee, [0, 0, 0], [1, 1, 1], [0, 0, 0], sh);
  const el = new THREE.Group(); el.position.set(0, -1.65, 0); sh.add(el);
  mesh(foreG, skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], el);
  const hd = new THREE.Group(); hd.position.set(0, -1.58, 0); hd.scale.setScalar(1.18); el.add(hd);
  mesh(sph, skin, [0, -0.15, 0], [0.28, 0.31, 0.17], [0, 0, 0], hd);
  const F = (len, x, rx = 0, rz = 0, y = -0.38) => { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, len, 6, 12), skin); f.position.set(x, y - len / 2, 0.02); f.rotation.set(rx, 0, rz); return f; };
  const shapes = { point: new THREE.Group(), palm: new THREE.Group(), thumb: new THREE.Group() };
  // pointing: the index out, the others curled, the thumb tucked
  shapes.point.add(F(0.42, 0.02 - side * 0.09, 0, 0, -0.32));
  for (let k = 1; k < 4; k++) shapes.point.add(Object.assign(F(0.12, 0.02 + side * (k - 1) * 0.09 - side * 0.0, 1.4, 0, -0.4), {}));
  shapes.point.add(F(0.16, -side * 0.2, 0, side * 0.6, -0.22));
  // open palm: four fingers out, a little apart, the thumb wide
  for (let k = 0; k < 4; k++) shapes.palm.add(F(0.3 - Math.abs(k - 1.5) * 0.04, -side * 0.13 + side * k * 0.09, 0, side * (k - 1.5) * 0.06, -0.36));
  shapes.palm.add(F(0.18, -side * 0.24, 0, side * 0.9, -0.18));
  // thumbs up: the fist with the thumb standing
  for (let k = 0; k < 4; k++) shapes.thumb.add(F(0.12, -side * 0.12 + side * k * 0.085, 1.5, 0, -0.38));
  shapes.thumb.add(F(0.2, -side * 0.24, 0, side * 3.0, -0.1));
  Object.values(shapes).forEach((g) => hd.add(g));
  return { sh, el, hd, shapes };
}
const armP = arm(-1), armR = arm(1);
man.position.set(2.45, -3.7, 0); man.rotation.y = -0.42; man.scale.setScalar(1.12);

/* ---------- gestures, eased by springs so every move overshoots a touch and settles, like a person ---------- */
// angles: [shoulder x, y, z], [elbow x, y, z], [hand x, y, z], hand shape
const POSE = {
  point:   { P: [[-0.35, 0.2, -2.2], [-0.25, 0, -0.5], [0.1, 0, -0.15], 'point'] },
  pointUp: { P: [[-0.3, 0.2, -2.65], [-0.2, 0, -0.2], [0.1, 0, -0.1], 'point'] },
  wave:    { P: [[-0.4, 0.2, -1.25], [-0.2, 0, -1.7], [0, 0, 0.2], 'palm'] },
  chest:   { P: [[-0.9, 0.35, -0.35], [-1.75, 0.3, 0.9], [0, 0.4, 0.2], 'palm'] },
  palm:    { P: [[-1.0, 0.35, -0.75], [-1.1, 0, -0.25], [-0.6, 0.3, 0.3], 'palm'] },
  raise:   { P: [[-0.45, 0.2, -1.05], [-0.15, 0, -2.0], [0, 0, 0], 'point'] },
  thumb:   { P: [[-0.7, 0.3, -1.0], [-0.4, 0, -1.55], [0, 0.5, 0], 'thumb'] },
  you:     { P: [[-1.45, 0.25, -0.55], [-0.35, 0, -0.15], [0.3, 0, 0], 'point'] },
  spread:  { P: [[-0.45, 0.2, -1.55], [-0.15, 0, -0.35], [-0.4, 0, 0], 'palm'], R: [[-0.45, -0.2, 1.4], [-0.15, 0, 0.35], [-0.4, 0, 0], 'palm'] },
  shrug:   { P: [[-0.25, 0.1, -0.85], [-0.6, 0, 1.0], [-0.9, 0, 0], 'palm'], R: [[-0.25, -0.1, 0.85], [-0.6, 0, -1.0], [-0.9, 0, 0], 'palm'] },
  both:    { P: [[-1.0, 0.35, -0.75], [-1.1, 0, -0.25], [-0.6, 0.3, 0.3], 'palm'], R: [[-1.0, -0.3, 0.55], [-1.1, 0, 0.25], [-0.6, -0.3, -0.3], 'palm'] },
};
const REST_R = [[0.15, 0, 0.25], [-0.9, 0, 0.3], [0, 0, 0.2], 'point'];
// what he does, when: the times are the spoken words
const GEST = [
  [0.1, 'wave'], [w(0, 3) - 0.1, 'point'], [w(0, 6) - 0.15, 'chest'],
  [w(1, 0) - 0.1, 'point'], [w(1, 7) - 0.1, 'point'],
  [w(2, 0) - 0.1, 'pointUp'], [w(2, 6) - 0.1, 'palm'],
  [w(3, 0) - 0.1, 'spread'],
  [w(4, 0) - 0.1, 'raise'], [w(4, 8) - 0.15, 'palm'],
  [w(5, 0) - 0.1, 'pointUp'], [w(5, 3) - 0.1, 'shrug'],
  [w(6, 0) - 0.1, 'both'], [w(6, 6) - 0.15, 'thumb'],
  [w(7, 0) - 0.1, 'pointUp'], [w(7, 9) - 0.1, 'you'],
  [END - 0.1, 'point'],
];
const gestAt = (t) => { let g = GEST[0]; for (const x of GEST) if (t >= x[0]) g = x; return g; };
// critically-damped-ish springs on every joint angle, stepped at 120 Hz from the last frame
const springs = new Map();
let simT = 0;
function spring(key, target, dt, k = 120, d = 15) {
  let s = springs.get(key); if (!s) { s = { x: target, v: 0 }; springs.set(key, s); }
  const steps = Math.max(1, Math.round(dt * 120));
  for (let i = 0; i < steps; i++) { const h = dt / steps; s.v += ((target - s.x) * k - s.v * d) * h; s.x += s.v * h; }
  return s.x;
}
function setArm(a, pose, dt, tag, jab) {
  const [S, El, Hd, shape] = pose;
  a.sh.rotation.set(spring(tag + 'sx', S[0] - jab * 0.12, dt), spring(tag + 'sy', S[1], dt), spring(tag + 'sz', S[2], dt));
  a.el.rotation.set(spring(tag + 'ex', El[0], dt), spring(tag + 'ey', El[1], dt), spring(tag + 'ez', El[2] + jab * 0.2, dt));
  a.hd.rotation.set(spring(tag + 'hx', Hd[0], dt, 160, 16), spring(tag + 'hy', Hd[1], dt, 160, 16), spring(tag + 'hz', Hd[2], dt, 160, 16));
  for (const k in a.shapes) a.shapes[k].visible = k === shape;
}
let lastT = 0, prevTalk = 0;
function presenter(t) {
  const dt = clamp(t - lastT, 0, 0.1) || 1 / 30; lastT = t;
  const mv = MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
  const talk = t < L[L.length - 1].t1 + 0.1 ? mv : 0;
  const onset = Math.max(0, talk - prevTalk); prevTalk = talk;
  // the mouth: opens with the voice, rounder or wider from syllable to syllable
  const vowel = 0.5 + 0.5 * Math.sin(t * 13.7 + Math.sin(t * 5.1) * 2);
  jawPivot.rotation.x = spring('jaw', talk * (0.065 + (1 - vowel) * 0.045), dt, 420, 30);
  jaw.scale.x = 1 - talk * vowel * 0.03;
  // emphasis on the key words: brows up, a nod, a little hop of the shoulders
  const kw = KEYTIMES.reduce((a, k) => Math.max(a, Math.exp(-Math.abs(t - k - 0.08) * 7) * (t > k - 0.15 ? 1 : 0)), 0);
  brows.forEach((b, i) => { b.position.y = spring('brow', 0.36 + kw * 0.08 + talk * 0.015, dt, 200, 18); b.rotation.z = Math.PI / 2 + (i ? 1 : -1) * (0.12 - kw * 0.1); });
  const g = gestAt(t), pose = POSE[g[1]], since = t - g[0];
  const jab = Math.exp(-Math.max(0, since) * 6) * (since > 0 ? Math.sin(Math.min(1, since * 5) * Math.PI) : 0);
  // the head: a nod on each new syllable, a glance at what he points to just after he points, then back to us
  const lookAt = (g[1] === 'point' || g[1] === 'pointUp') && since < 0.7 && since > 0.05 ? 1 : 0;
  head.rotation.x = spring('hx', Math.sin(t * 0.9) * 0.03 - kw * 0.08 + onset * 1.2 + (lookAt ? -0.12 : 0), dt, 140, 14);
  head.rotation.y = spring('hy', 0.18 + Math.sin(t * 0.6) * 0.05 + (lookAt ? (g[1] === 'point' ? 0.55 : 0.3) : 0) + (g[1] === 'you' ? -0.1 : 0), dt, 90, 14);
  head.rotation.z = spring('hz', Math.sin(t * 0.8 + 1) * 0.04 + (g[1] === 'shrug' ? 0.14 : 0) + (t > w(7, 9) ? 0.1 : 0), dt, 90, 14);
  // the body: breathes, sways, leans into the gesture and bounces on the emphasis
  const lean = { point: 0.06, pointUp: 0.03, palm: -0.04, chest: -0.05, shrug: 0, you: -0.06, both: -0.03, spread: 0, raise: 0.02, thumb: -0.03, wave: 0.03 }[g[1]] || 0;
  body.rotation.z = spring('bz', lean + Math.sin(t * 0.7) * 0.015, dt, 60, 11);
  body.rotation.x = spring('bx', (g[1] === 'you' ? 0.08 : 0) + kw * 0.04, dt, 60, 11);
  body.position.y = spring('by', Math.sin(t * 1.6) * 0.04 + kw * 0.1 + (g[1] === 'shrug' ? 0.12 : 0), dt, 120, 12);
  torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
  // the wave waves
  const pp = POSE[g[1]].P.map((x) => (Array.isArray(x) ? [...x] : x));
  if (g[1] === 'wave') pp[1][2] += Math.sin(t * 14) * 0.25 * Math.max(0, 1 - since / 0.9);
  if (t > END) { pp[0] = [-0.35, 0.2, -2.35]; }
  setArm(armP, pp, dt, 'P', jab);
  setArm(armR, POSE[g[1]].R || [REST_R[0], [REST_R[1][0] + talk * 0.15, 0, REST_R[1][2]], REST_R[2], 'point'], dt, 'R', 0);
  if (!POSE[g[1]].R) armR.shapes.point.visible = false, armR.shapes.palm.visible = true;
  r2.render(sc, cam);
}

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
