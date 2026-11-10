// LÓNG · POV: «¡Me ha llegado esto y mira lo que hace!». First person: your own hands at a desk, an open cardboard box
// with the Luminoso coiled inside. The right hand takes it by the head and lifts it out (the body hangs and swings as a
// verlet chain), shakes it so every piece moves, winds it round the forearm like a bracelet; the left hand switches the
// desk lamp off and it glows on your wrist. The real photo at the end. Voice VelionF (no dead air), effects, no music.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';

const G = await (await fetch('tiempos.json')).json();
const MOUTH = await (await fetch('boca.json')).json();
const L = G.lines, W = 1080, H = 1920;
const END = L[L.length - 1].t1 + 0.15, DUR = Math.max(G.dur, END + 0.45);
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
// the moments
const tReach = 0.2, tGrab = w(0, 5) - 0.05;   // «mira»: the hand has it by the head
const tWrap = w(2, 2);                        // «pones»: round the forearm
const tLum = 0, tOff = w(3, 4) + 0.06, tGlow = tOff + 0.16, tOn = 1e9;
const tCols = 1e9, tCols1 = 1e9;
const tReal = B[5] - 0.03;
const DARK = (t) => (t >= tOff && t < tReal ? 1 : 0);
const COLS = ['metal', 'orojo', 'azulmorado', 'azulverde', 'oro', 'plata', 'pastel', 'luminoso'];
const SWC = ['#7b3fe4,#4f6ee8,#c9b54a,#5aa64a', '#ffcf3a,#ff8a1f,#e8322f', '#8a3ff0,#4a4ff0,#2f3fd0', '#3aa84a,#2d8f7a,#2f6fd0', '#ffe27a,#f5c021,#e0a800', '#f4f6f9,#a3aab4,#e9ecf1', '#fff3a6,#ffd1e8,#c9f0ff', '#f4f7ee,#dfe9d5'];
/* =========================================================================================
   the presenter
   ========================================================================================= */
const c2 = document.getElementById('gl2');
const r2 = new THREE.WebGLRenderer({ canvas: c2, antialias: true, alpha: true, preserveDrawingBuffer: true });
r2.setPixelRatio(1.5); r2.setSize(W, H, false); r2.toneMapping = THREE.NeutralToneMapping; r2.setClearColor(0x000000, 0);
const sc = new THREE.Scene();
const pm2 = new THREE.PMREMGenerator(r2); sc.environment = pm2.fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.9;
const cam = new THREE.PerspectiveCamera(26, W / H, 0.1, 100); cam.position.set(0, 0, 30); cam.lookAt(0, 0, 0);
const key = new THREE.DirectionalLight('#fff1e2', 2.2); key.position.set(5, 11, 7); sc.add(key);
const rim = new THREE.DirectionalLight('#ffffff', 1.6); rim.position.set(8, 4, -6); sc.add(rim);
const fill = new THREE.HemisphereLight('#ffffff', '#c9b8a8', 0.6); sc.add(fill);
const bounce = new THREE.DirectionalLight('#ffd9b8', 0.5); bounce.position.set(-3, 2, 8); sc.add(bounce);   // warm light bounced off a desk, from below
const faceGlow = new THREE.PointLight('#5dffb0', 0, 30, 1.6); sc.add(faceGlow);   // the Luminoso's glow on his face, in the dark
r2.shadowMap.enabled = true; r2.shadowMap.type = THREE.PCFSoftShadowMap;
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 50 }); key.target.position.set(0, 0, 2); sc.add(key.target);

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
  const shapes = { point: new THREE.Group(), palm: new THREE.Group(), thumb: new THREE.Group(), grip: new THREE.Group() };
  // the grip: a fist round the dragon's neck, the thumb wrapped over the fingers
  for (let k = 0; k < 4; k++) shapes.grip.add(F(0.14, -side * 0.13 + side * k * 0.087, 1.55, 0, -0.36));
  shapes.grip.add(F(0.17, -side * 0.17, 0.9, side * 1.25, -0.2));
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
// below the tee: hips and legs in dark jeans (the wide shots reach down to the thighs)
const denim = new THREE.MeshPhysicalMaterial({ color: '#2c3a52', roughness: 0.88, sheen: 0.5, sheenRoughness: 0.8, sheenColor: new THREE.Color('#6d7fa3') });
const hipsF = (p) => { const m = mir(p); return smin(smin(sdE(p, [0, -5.75, 0], [1.2, 0.85, 0.76]), sdE(p, [0, -6.45, 0], [1.12, 0.7, 0.7]), 0.3), sdC(m, [0.6, -6.6, 0.02], [0.66, -13.6, 0.08], [0.5, 0.36]), 0.22); };
mesh(sculpt(hipsF, [-1.6, -14, -1.0], [1.6, -5.0, 1.0], 110), denim, [0, 0, 0], [1, 1, 1], [0, 0, 0], man);
man.position.set(1.2, -0.75, 0); man.rotation.y = -0.3; man.scale.setScalar(1.12);
man.traverse((o) => { if (o.isMesh) { const hairy = o.material === hairFade || o.material === beardMat || o.material === hairMat; o.castShadow = !hairy; o.receiveShadow = true; } });
// first person: the body stands where the camera is, facing into the room; only the arms are drawn
man.position.set(0, 5.35, 5.0); man.rotation.y = Math.PI;
body.children.forEach((c) => { if (c !== armP.sh && c !== armR.sh) c.visible = false; });
man.children.forEach((c) => { if (c !== body) c.visible = false; });
// the desk, the open box, the lamp
const tl = new THREE.TextureLoader();
const tex = (u, srgb) => new Promise((r) => tl.load(u, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.4); t.anisotropy = 8; r(t); }));
const [wd, wn] = await Promise.all([tex('../../tex/wood_diff.jpg', true), tex('../../tex/wood_nor.jpg')]);
const desk = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 9), new THREE.MeshPhysicalMaterial({ map: wd, normalMap: wn, roughness: 0.7, clearcoat: 0.3 })); desk.position.set(0, -0.15, 0.8); desk.receiveShadow = true; sc.add(desk);
const BOX = { x: 0.55, z: 1.9, w: 2.6, d: 2.0, h: 1.05 };
const card = new THREE.MeshStandardMaterial({ color: '#c8965a', roughness: 0.9 }), cardIn = new THREE.MeshStandardMaterial({ color: '#a8743e', roughness: 0.95, side: THREE.DoubleSide });
const box = new THREE.Group(); box.position.set(BOX.x, 0, BOX.z); sc.add(box);
const slab = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; box.add(o); return o; };
slab(BOX.w, 0.06, BOX.d, 0, 0.03, 0, cardIn);
slab(BOX.w, BOX.h, 0.06, 0, BOX.h / 2, -BOX.d / 2, card); slab(BOX.w, BOX.h, 0.06, 0, BOX.h / 2, BOX.d / 2, card);
slab(0.06, BOX.h, BOX.d, -BOX.w / 2, BOX.h / 2, 0, card); slab(0.06, BOX.h, BOX.d, BOX.w / 2, BOX.h / 2, 0, card);
[[0, BOX.h, -BOX.d / 2, BOX.w, 0.8, -1.1, 'x'], [0, BOX.h, BOX.d / 2, BOX.w, 0.8, 1.1, 'x'], [-BOX.w / 2, BOX.h, 0, BOX.d, 0.7, 1.1, 'z'], [BOX.w / 2, BOX.h, 0, BOX.d, 0.7, -1.1, 'z']].forEach(([x, y, z, len, wid, ang, ax]) => {
  const g = new THREE.Group(); g.position.set(x, y, z); box.add(g); const f = new THREE.Mesh(new THREE.BoxGeometry(ax === 'x' ? len : 0.04, 0.04, ax === 'x' ? wid : len), card);
  if (ax === 'x') { f.position.set(0, 0, Math.sign(z) * wid / 2); g.rotation.x = ang * Math.sign(z) * -1 * -1; } else { f.position.set(Math.sign(x) * wid / 2, 0, 0); f.geometry = new THREE.BoxGeometry(wid, 0.04, len); g.rotation.z = -ang * Math.sign(x) * -1; }
  f.castShadow = true; g.add(f); });
const tape = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, BOX.d + 0.02), new THREE.MeshStandardMaterial({ color: '#d9c39a', roughness: 0.6 })); tape.position.set(0, 0.005, 0); box.add(tape);
const lamp = new THREE.Group(); lamp.position.set(-3.0, 0, 0.4); sc.add(lamp);
const metal = new THREE.MeshPhysicalMaterial({ color: '#2a2c33', metalness: 0.8, roughness: 0.35 });
const lm = (g, m, p, r = [0, 0, 0]) => { const o = new THREE.Mesh(g, m); o.position.set(...p); o.rotation.set(...r); o.castShadow = true; lamp.add(o); return o; };
lm(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 32), metal, [0, 0.06, 0]);
const button = lm(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16), new THREE.MeshStandardMaterial({ color: '#ff3b4e' }), [0.28, 0.15, 0.2]);
lm(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12), metal, [0.3, 1.1, 0], [0, 0, -0.25]);
lm(new THREE.ConeGeometry(0.45, 0.6, 32, 1, true), metal, [0.75, 2.1, 0.3], [0, 0, 2.2]);
const bulbM = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: new THREE.Color('#ffd9a0'), emissiveIntensity: 2 }); lm(new THREE.SphereGeometry(0.16, 16, 12), bulbM, [0.95, 1.95, 0.35]);
const lampL = new THREE.SpotLight('#ffd9a0', 40, 12, 0.9, 0.6, 1.6); lampL.position.set(-2.1, 1.95, 0.75); lampL.target.position.set(0.4, 0, 1.9); lampL.castShadow = true; lampL.shadow.mapSize.set(1024, 1024); sc.add(lampL, lampL.target);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.9, 32), new THREE.MeshPhysicalMaterial({ color: '#ff3b4e', roughness: 0.3, clearcoat: 1 })); mug.position.set(2.9, 0.45, 0.9); mug.castShadow = true; sc.add(mug);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: '#d8c8b4', roughness: 1 })); wall.position.set(0, 5, -3.6); wall.receiveShadow = true; sc.add(wall);
r2.setClearColor('#cdbca8', 1);
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
/* =========================================================================================
   the dragon in his hand
   ========================================================================================= */
const K = 8.4 / (SEG * SPACING);            // the 88 cm dragon at his scale: his head is ~2.2 units (23 cm)
const SP = SPACING * K;                     // world distance between spine points
const dragon = createDragon(sc, { hq: true }); dragon.group.scale.setScalar(K);
dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
const P = Array.from({ length: SEG + 1 }, () => V()), Q = P.map(() => V()), S = P.map(() => V()), BRW = P.map(() => V()), loc = P.map(() => V());
const GRAV = 52, DAMP = 0.991;
const tmp = V(), tmp2 = V(), grip = V();
const manInv = new THREE.Matrix4();
let headDir = V(-0.55, 0.62, 0.56).normalize();
// the neck in his fist: the head out of the top, looking out and a little toward us; the body hangs from below the fist
function pinAt(i, out) {
  if (i === 1) return out.copy(grip);
  if (i === 0) return out.copy(grip).addScaledVector(headDir, SP);
  return out.copy(grip).add(tmp2.set(0.02, -SP, 0.02));
}
const pinned = (i) => i <= 2;
function link(i, j, d, exact) {
  const a = P[i], b = P[j]; tmp.subVectors(b, a); const len = tmp.length() || 1e-6;
  if (!exact && len >= d) return;
  const pa = pinned(i), pb = pinned(j); if (pa && pb) return;
  const diff = (len - d) / len, wa = pa ? 0 : pb ? 1 : 0.5, wb = pb ? 0 : pa ? 1 : 0.5;
  a.addScaledVector(tmp, diff * wa); b.addScaledVector(tmp, -diff * wb);
}
function step(h) {
  for (let i = 0; i <= SEG; i++) {
    if (pinned(i)) { pinAt(i, P[i]); Q[i].copy(P[i]); continue; }
    const vx = (P[i].x - Q[i].x) * DAMP, vy = (P[i].y - Q[i].y) * DAMP, vz = (P[i].z - Q[i].z) * DAMP;
    Q[i].copy(P[i]); P[i].x += vx; P[i].y += vy - GRAV * h * h; P[i].z += vz;
  }
  for (let it = 0; it < 8; it++) {
    for (let i = 0; i < SEG; i++) link(i, i + 1, SP, true);
    for (let i = 0; i < SEG - 1; i++) link(i, i + 2, SP * 1.55, false);   // the joints bend, but never fold flat
    for (let i = 3; i <= SEG; i++) { const inBox = Math.abs(P[i].x - BOX.x) < BOX.w / 2 - 0.1 && Math.abs(P[i].z - BOX.z) < BOX.d / 2 - 0.1; const fl = (inBox ? 0.1 : 0.02) + 0.18; if (P[i].y < fl) P[i].y = fl; }
    for (let i = 3; i <= SEG; i++) {   // and it stays in front of his chest
      tmp.copy(P[i]).applyMatrix4(manInv);
      if (Math.abs(tmp.x) < 1.55 && tmp.y < -1.6 && tmp.y > -7.5 && tmp.z < 1.2) { tmp.z = 1.2; P[i].copy(tmp.applyMatrix4(man.matrixWorld)); }
    }
  }
}
function hangReset() { for (let i = 0; i <= SEG; i++) { P[i].copy(grip).add(tmp.set(0.03 * i * (i % 2 ? 1 : -1) * 0.1, -i * SP, 0.05)); Q[i].copy(P[i]); } }
function simulate(dt, n) { const k = n || Math.max(1, Math.round(dt * 240)); for (let s = 0; s < k; s++) step(n ? 1 / 240 : dt / k); }
// exact spacing along a polyline (the dragon's body never stretches)
function resample(pts, n, out) {
  out[0].copy(pts[0]); let acc = 0, k = 1;
  for (let i = 1; i < n && k <= SEG; i++) {
    const seg = pts[i].distanceTo(pts[i - 1]);
    while (k <= SEG && acc + seg >= k * SP) { out[k].lerpVectors(pts[i - 1], pts[i], seg > 1e-9 ? (k * SP - acc) / seg : 0); k++; }
    acc += seg;
  }
  for (; k <= SEG; k++) out[k].copy(out[k - 1]).addScaledVector(tmp.subVectors(out[k - 1], out[k - 2]).normalize(), SP);
}
// wound round his forearm: the head on the back of his fist, then two turns up toward the elbow
const BRP = Array.from({ length: 260 }, () => V());
function bracelet(out) {
  let n = 0;
  for (let i = 0; i <= 10; i++) { const u = i / 10; armP.hd.localToWorld(BRP[n++].set(0, lerp(-0.5, 0.02, u), lerp(0.31, 0.37, u))); }
  for (let i = 1; i <= 240; i++) { const u = i / 240, a = u * 2.2 * Math.PI * 2, r = lerp(0.47, 0.62, u); armP.el.localToWorld(BRP[n++].set(Math.sin(a) * r, lerp(-1.45, -0.1, u), Math.cos(a) * r)); }
  resample(BRP, n, out);
}
// a glow round the Luminoso, a cheap bloom
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(125,255,190,0.9)'); g.addColorStop(0.35, 'rgba(90,255,170,0.35)'); g.addColorStop(1, 'rgba(60,255,160,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 })); halo.scale.setScalar(5); sc.add(halo);

/* =========================================================================================
   his arms: inverse kinematics to a target for each hand, the targets eased by springs
   ========================================================================================= */
const UA = 1.65, LA = 1.58 + 0.24;          // upper arm; forearm to the middle of the fist (arm units)
const bodyInv = new THREE.Matrix4(), mB = new THREE.Matrix4();
const iT = V(), iS = V(), iD = V(), iU = V(), iV = V(), iE = V(), iL = V(), iW = V(), iX = V(), iY = V(), iP = V(), dU = V();
function ik(a, target, pole) {
  body.updateWorldMatrix(true, false); bodyInv.copy(body.matrixWorld).invert();
  iT.copy(target).applyMatrix4(bodyInv); iS.copy(a.sh.position);
  iD.subVectors(iT, iS); const d = clamp(iD.length(), Math.abs(UA - LA) + 0.03, UA + LA - 0.03); iU.copy(iD).normalize();
  iP.copy(pole).transformDirection(bodyInv); iV.copy(iP).addScaledVector(iU, -iP.dot(iU)).normalize();
  const cosA = clamp((UA * UA + d * d - LA * LA) / (2 * UA * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
  dU.copy(iU).multiplyScalar(cosA).addScaledVector(iV, sinA);              // the upper arm
  iE.copy(iS).addScaledVector(dU, UA);                                      // the elbow
  iL.copy(iS).addScaledVector(iU, d).sub(iE).normalize();                   // the forearm
  iW.copy(iL).addScaledVector(dU, -iL.dot(dU)).normalize();
  iY.copy(dU).negate(); iX.crossVectors(iY, iW);
  mB.makeBasis(iX, iY, iW); a.sh.quaternion.setFromRotationMatrix(mB);
  a.el.rotation.set(-Math.acos(clamp(dU.dot(iL), -1, 1)), 0, 0);
}
let SNAP = false;   // after a jump in time (a test frame), springs land on their targets at once
function sp(key, x, dt, k = 110, d = 14) { if (SNAP) { springs.set(key, { x, v: 0 }); return x; } return spring(key, x, dt, k, d); }
const spV = (key, v, dt, k, d) => v.set(sp(key + 'x', v.x, dt, k, d), sp(key + 'y', v.y, dt, k, d), sp(key + 'z', v.z, dt, k, d));
const shake = (t, t0, len, amp, hz) => (t < t0 || t > t0 + len ? 0 : amp * Math.sin((t - t0) * hz * Math.PI * 2) * Math.sin(Math.PI * (t - t0) / len));
// the hand that holds it (his right, on the left of the picture)
function targetP(t, o) {   // world: into the box, the head in the fist, up in front of your eyes, shaken, then the bracelet
  if (t < tGrab) { const u = E.inOut(prog(t, tReach, tGrab)); o.set(lerp(2.2, BOX.x + 0.15, u), lerp(1.4, 0.75, u), lerp(3.4, BOX.z + 0.25, u)); }
  else if (t < tWrap - 0.2) { const u = E.out(prog(t, tGrab, tGrab + 0.8)); o.set(lerp(BOX.x + 0.15, 0.9, u), lerp(0.75, 3.15, u), lerp(BOX.z + 0.25, 1.45, u)); o.x += shake(t, w(1, 7) - 0.05, 1.25, 0.42, 2.6); }
  else { const u = E.inOut(prog(t, tWrap - 0.2, tWrap + 0.45)); o.set(lerp(0.9, 0.8, u), lerp(3.15, 2.95, u), lerp(1.45, 1.75, u)); }
}
// the free hand (his left, on the right of the picture): [from, x, y, z, hand shape]
const GESTR = [   // the left hand: [from, x, y, z (world), shape]
  [0.0, -1.7, 1.2, 3.2, 'palm'],
  [w(1, 0) - 0.1, -0.9, 2.6, 2.4, 'point'],       // «lo sacas de la caja»: at it
  [w(2, 0) - 0.1, -1.3, 1.6, 3.0, 'palm'],
  [w(3, 2) - 0.12, -2.68, 0.55, 0.62, 'point'],   // «apagas»: the lamp's button
  [tGlow + 0.1, -1.0, 1.9, 3.0, 'palm'],
];
const gestAtR = (t) => { let g = GESTR[0]; for (const x of GESTR) if (t >= x[0]) g = x; return g; };
const HROT = { point: [0.15, 0, 0.1], palm: [-0.5, 0.4, 0.2], thumb: [0, 0.6, 0], grip: [0.2, 1.3, 0.1] };
const tP = V(), tR = V(), poleP = V(0.7, -1, 0.3).normalize(), poleR = V(-0.7, -1, 0.3).normalize();

/* =========================================================================================
   one frame of the presenter and the dragon
   ========================================================================================= */
let lastT = -1, prevTalk = 0, wasWrapped = false, curCol = '';
function presenter(t) {
  const jumped = lastT < 0 || t < lastT || t - lastT > 0.1; const dt = jumped ? 1 / 30 : Math.max(1e-4, t - lastT); lastT = t; SNAP = jumped;
  const mv = MOUTH.v[Math.min(MOUTH.v.length - 1, Math.max(0, Math.round(t * MOUTH.fps)))] || 0;
  const talk = t < L[L.length - 1].t1 + 0.1 ? mv : 0;
  const onset = Math.max(0, talk - prevTalk); prevTalk = talk;
  const vowel = 0.5 + 0.5 * Math.sin(t * 13.7 + Math.sin(t * 5.1) * 2);
  jawPivot.rotation.x = sp('jaw', talk * (0.075 + (1 - vowel) * 0.05), dt, 420, 30);
  jaw.scale.x = 1 - talk * vowel * 0.03;
  const kw = KEYTIMES.reduce((a, k) => Math.max(a, Math.exp(-Math.abs(t - k - 0.08) * 7) * (t > k - 0.15 ? 1 : 0)), 0);
  brows.forEach((b, i) => { b.position.y = sp('brow', 0.36 + kw * 0.09 + talk * 0.015, dt, 200, 18); b.rotation.z = Math.PI / 2 + (i ? 1 : -1) * (0.12 - kw * 0.1); });
  const g = gestAtR(t), since = t - g[0];
  // he looks at the dragon when he shows it, and back at us
  const showing = false;
  head.rotation.x = sp('hx', Math.sin(t * 0.9) * 0.03 - kw * 0.08 + onset * 1.2 + (showing ? 0.1 : 0), dt, 140, 14);
  head.rotation.y = sp('hy', 0.3 + Math.sin(t * 0.6) * 0.05 + (showing ? -0.45 : 0), dt, 90, 14);
  head.rotation.z = sp('hz', Math.sin(t * 0.8 + 1) * 0.04 + (t > END ? 0.08 : 0), dt, 90, 14);
  body.rotation.z = sp('bz', Math.sin(t * 0.7) * 0.015 + kw * 0.02, dt, 60, 11);
  body.rotation.x = sp('bx', kw * 0.04 + (g[4] === 'point' && g[3] > 3 ? 0.06 : 0), dt, 60, 11);
  body.position.y = sp('by', Math.sin(t * 1.6) * 0.04 + kw * 0.1, dt, 120, 12);
  torso.scale.y = 1 + Math.sin(t * 1.6) * 0.012;
  // the hands
  targetP(t, tP); spV('tp', tP, dt, 140, 15);
  tR.set(g[1], g[2], g[3]);
  if (t > tOff - 0.25 && t < tOff + 0.1) tR.y -= 0.18 * Math.sin(prog(t, tOff - 0.25, tOff + 0.1) * Math.PI);   // the press
  spV('tr', tR, dt, 110, 14);
  man.updateMatrixWorld(true);
  ik(armP, tP, poleP); ik(armR, tR, poleR);
  const wrapped = t >= tWrap && t < tOn;
  const hr = wrapped ? [0, 0, 0] : HROT.grip;
  armP.hd.rotation.set(sp('phx', hr[0], dt, 160, 16), sp('phy', hr[1], dt, 160, 16), sp('phz', hr[2], dt, 160, 16));
  const rr = HROT[g[4]]; armR.hd.rotation.set(sp('rhx', rr[0], dt, 160, 16), sp('rhy', -rr[1], dt, 160, 16), sp('rhz', -rr[2], dt, 160, 16));
  for (const k in armP.shapes) armP.shapes[k].visible = k === 'grip';
  for (const k in armR.shapes) armR.shapes[k].visible = k === g[4];
  man.updateMatrixWorld(true); manInv.copy(man.matrixWorld).invert();
  armP.hd.localToWorld(grip.set(0, -0.2, 0.06));
  // the dragon: hanging (physics), being wound on, worn as a bracelet, hanging again for the 88 cm
  if (t < tGrab) {   // coiled in the box, the head up a little
    const n = 600; for (let i = 0; i <= SEG; i++) { const u = i / SEG, a = 0.6 + u * Math.PI * 4.3, r = 0.28 + u * 0.66; P[i].set(BOX.x + Math.cos(a) * r, 0.1 + 0.17 + (i < 4 ? (4 - i) * 0.09 : 0), BOX.z + Math.sin(a) * r * 0.85); Q[i].copy(P[i]); }
  } else {
    if (jumped && t > tGrab + 0.9) { hangReset(); simulate(0, 480); }
    if (!wrapped || t < tWrap + 1.2) simulate(dt);
  }
  let spine = P;
  if (wrapped) {
    bracelet(BRW);
    for (let i = 0; i <= SEG; i++) S[i].lerpVectors(P[i], BRW[i], E.inOut(clamp((t - tWrap - (i / SEG) * 0.55) / 0.6)));
    resample(S, SEG + 1, S); spine = S;
  }
  wasWrapped = wrapped;
  for (let i = 0; i <= SEG; i++) loc[i].copy(spine[i]).multiplyScalar(1 / K);
  // colour
  const col = 'luminoso';
  if (col !== curCol) { dragon.setColor(col); curCol = col; }
  const off = DARK(t), glow = off ? E.expo(prog(t, tGlow, tGlow + 0.45)) * (0.88 + 0.12 * Math.sin(t * 4)) : 0;
  dragon.update(loc, t, glow * 1.1);
  // the lights
  key.intensity = lerp(1.6, 0.05, off); rim.intensity = lerp(0.8, 0.08, off); fill.intensity = lerp(0.55, 0.02, off); bounce.intensity = lerp(0.4, 0.02, off); sc.environmentIntensity = lerp(0.7, 0.04, off);
  lampL.intensity = lerp(40, 0, off); bulbM.emissiveIntensity = lerp(2, 0, off); r2.setClearColor(off ? '#07080a' : '#cdbca8', 1);
  tmp.copy(spine[14]).lerp(spine[26], 0.5); faceGlow.position.copy(tmp).add(tmp2.set(0.2, 0.3, 0.6)); faceGlow.intensity = glow * 14;
  halo.position.copy(tmp); halo.material.opacity = glow * 0.55; halo.scale.setScalar(4.5 + glow * 0.8);
  // the camera
  camShot(t); r2.render(sc, cam);
}
// the shots: a cut on each new line, a slow push inside each
function camShot(t) {
  const up = E.inOut(prog(t, tGrab, tGrab + 0.8)), brace = E.inOut(prog(t, tWrap - 0.2, tWrap + 0.5));
  const look = V(lerp(0.5, 0.65, up), lerp(0.6, 1.6, up), lerp(1.7, 1.2, up)); look.lerp(V(0.6, 2.2, 1.5), brace);
  const punch = [w(0, 5), w(1, 7), tGlow].reduce((a, k) => a + (t >= k ? Math.exp(-(t - k) * 6) * (1 - Math.exp(-(t - k) * 30)) : 0), 0);
  cam.fov = 58 - punch * 4; cam.position.set(Math.sin(t * 1.3) * 0.05, 5.35 + Math.sin(t * 1.9) * 0.04, 5.0 + Math.sin(t * 1.1) * 0.03);
  cam.lookAt(look); cam.rotation.z += Math.sin(t * 0.9) * 0.012; cam.updateProjectionMatrix();
}

/* =========================================================================================
   the caption: big, centred, word by word
   ========================================================================================= */
const KEYS = new Set(['llegado', 'mira', 'caja', 'mueve', 'pieza', 'pulsera', 'luz', 'brilla', 'verdad', 'perfil']);
const clean = (x) => x.replace(/[.,:¿?¡!…]+/g, '');
const KEYTIMES = [];
const CHUNKS = [];
L.forEach((l) => { let cur = []; l.words.forEach((wd, i) => { cur.push(wd); if (KEYS.has(clean(wd[0]).toLowerCase())) KEYTIMES.push(wd[1]); if (/[.,!?]$/.test(wd[0]) || cur.length >= 4 || i === l.words.length - 1) { CHUNKS.push(cur); cur = []; } }); });
const capEl = document.getElementById('cap'); let shownCh = null;
function captions(t) {
  if (t >= tReal + 0.1) { capEl.style.opacity = 0; return; }   // the real photo's label says it
  let ch = null; for (const c of CHUNKS) if (t >= c[0][1] - 0.04) ch = c;
  if (!ch || t > END) { capEl.style.opacity = 1 - prog(t, END, END + 0.2); if (!ch) return; }
  else capEl.style.opacity = 1;
  if (ch !== shownCh) { capEl.innerHTML = ch.map((wd) => `<span class="w${KEYS.has(clean(wd[0]).toLowerCase()) ? ' k' : ''}">${clean(wd[0])}</span>`).join(' '); shownCh = ch; }
  capEl.classList.toggle('dark', !!DARK(t));
  [...capEl.children].forEach((s, i) => {
    const a = t - (ch[i][1] - 0.04), p = E.back(prog(a, 0, 0.22)), nextT = i + 1 < ch.length ? ch[i + 1][1] - 0.04 : ch[i][2];
    s.style.opacity = a < 0 ? 0 : 1; s.style.transform = `translateY(${(1 - p) * 26}px) scale(${lerp(0.7, 1, p)})`;
    s.classList.toggle('cur', a >= 0 && t < nextT + 0.05);
  });
}

/* =========================================================================================
   what pops up
   ========================================================================================= */
const itemsEl = document.getElementById('items');
const ITEMS = [];
function item(html, x, y, t0, t1, kind = 'pop', rot = 0) { const d = document.createElement('div'); d.className = 'it'; d.innerHTML = html; itemsEl.appendChild(d); const it = { d, x, y, t0, t1, kind, rot }; ITEMS.push(it); return it; }
item('<div class="sticker">SE MUEVE<br>ENTERO</div>', 600, 1180, w(1, 7) - 0.03, B[2] - 0.05, 'pop', 5);
item('<div class="stamp">¡PULSERA!</div>', 120, 1120, w(2, 4) - 0.02, B[3] - 0.05, 'stamp', -7);
item('<div class="glowtag">BRILLA EN LA<br>OSCURIDAD<small>color Luminoso</small></div>', 560, 1200, tGlow + 0.15, tReal - 0.05, 'pop', -4);
const ruleEl = document.getElementById('rule');
const pj = V();
const toScreen = (p) => { pj.copy(p).project(cam); return [(pj.x + 1) * W / 2, (1 - pj.y) * H / 2]; };
function animItems(t) {
  ITEMS.forEach((it) => {
    const a = t - it.t0, d = it.d;
    if (a < 0 || t > it.t1 + 0.25) { d.style.opacity = 0; return; }
    const out = E.in(prog(t, it.t1, it.t1 + 0.22));
    let x = it.x, y = it.y, s = 1, r = it.rot, o = 1, blur = 0;
    if (it.kind === 'pop') { const p = E.back(prog(a, 0, 0.32)); s = lerp(0.3, 1, p); o = clamp(a * 7); r += (1 - p) * 10; }
    else if (it.kind === 'stamp') { const p = E.out(prog(a, 0, 0.16)); s = lerp(2.4, 1, p); o = clamp(a * 8); blur = (1 - p) * 6; x += Math.sin(a * 60) * 4 * Math.exp(-a * 8); }
    else if (it.kind === 'rise') { const p = E.out(prog(a, 0, 0.5)); y += (1 - p) * 120; o = p; blur = (1 - p) * 8; }
    y += Math.sin(t * 1.3 + it.x * 0.01) * 4;
    o *= 1 - out; s *= 1 - out * 0.15;
    d.style.opacity = o; d.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
    d.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
  });
  const rp = E.back(prog(t, tReal, tReal + 0.35)); const real = document.getElementById('real');
  real.style.opacity = clamp((t - tReal) * 8); real.style.transform = `scale(${lerp(1.18, 1, rp)})`;
  document.getElementById('flash').style.opacity = 0.5 * Math.exp(-Math.max(0, t - tReal) * 10) * (t >= tReal ? 1 : 0);
}

/* ---------- film grain on the light background ---------- */
const gctx = document.getElementById('grain').getContext('2d'), gimg = gctx.createImageData(540, 960);
function grain(t) { return; let s = Math.floor(t * 24) * 9301 + 49297; for (let i = 0; i < gimg.data.length; i += 4) { s = (s * 233280 + 49297) % 233280; const v = (s / 233280) * 255; gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v; gimg.data[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

/* ---------- one frame ---------- */
function render(t) { if (t < tReal + 0.25) presenter(t); captions(t); animItems(t); grain(t); }

await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['800 60px Inter', 'italic 400 60px Serif', '400 60px Anton', '500 30px Mono', '900 60px Han']) await document.fonts.load(f, 'Aá0龍');
window.__dur = DUR;
// the sound: the VelionF voice and an effect on everything that happens; no music (the owner adds it)
const SFX = [], fx = (t, tipo, g = 0.3, pan = 0) => SFX.push({ t: +t.toFixed(3), tipo, g, pan });
ITEMS.forEach((it) => {
  if (it.kind === 'stamp') { fx(it.t0, 'thump', 0.5); fx(it.t0, 'slap', 0.38); }
  else if (it.kind === 'pop') { fx(it.t0, 'pop', 0.3, 0.2); fx(it.t0 + 0.03, 'bell', 0.05); }
  else if (it.kind === 'rise') fx(it.t0 - 0.05, 'whoosh', 0.16);
});
// the pieces clicking as it swings
const rattle = (t0, n, gap, g) => { for (let i = 0; i < n; i++) fx(t0 + i * gap + (i % 3) * 0.013, 'segclick', g * (1 - i / (n + 2)), -0.4 + (i % 4) * 0.12); };
fx(0.05, 'paper', 0.3); fx(tGrab, 'tap', 0.3); rattle(tGrab + 0.1, 8, 0.11, 0.3);
rattle(w(1, 7) - 0.05, 10, 0.1, 0.32);
fx(tWrap, 'swish', 0.3, -0.2); rattle(tWrap + 0.1, 8, 0.11, 0.26);
fx(tOff - 0.02, 'click', 0.4); fx(tOff, 'lightswitch', 0.5); fx(tGlow, 'shimmer', 0.42); fx(tGlow + 0.05, 'sweep', 0.22);
fx(tReal, 'impact', 0.3); fx(tReal + 0.05, 'shimmer', 0.2); fx(w(5, 6), 'click', 0.34);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: SFX };
window.__render = (t) => render(t);
render(0);
window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
