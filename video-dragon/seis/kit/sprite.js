// LÓNG · sprites of the 3D dragon on a transparent background, for the 2D films: ?pose=cuelga|enrollado|estirado
// &col=<palette>&glow=0|1&w=&h=&n=<frames in the loop>. window.__render(i) draws frame i of the loop.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';
const q = new URLSearchParams(location.search), pose = q.get('pose') || 'cuelga', col = q.get('col') || 'metal', glow = +(q.get('glow') || 0);
const W = +(q.get('w') || 360), H = +(q.get('h') || 1000), N = +(q.get('n') || 30);
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
R.setPixelRatio(1); R.setSize(W, H); R.setClearColor(0x000000, 0); R.toneMapping = THREE.ACESFilmicToneMapping;
const sc = new THREE.Scene(); sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = glow ? 0.15 : 0.6;
const key = new THREE.DirectionalLight('#fff1e2', glow ? 0.4 : 2.4); key.position.set(3, 5, 6); sc.add(key);
const rim = new THREE.DirectionalLight('#ffd0f0', glow ? 0.2 : 1.6); rim.position.set(-5, 2, -4); sc.add(rim);
sc.add(new THREE.HemisphereLight('#ffffff', '#806050', glow ? 0.1 : 0.6));
const dragon = createDragon(sc, { hq: true }); dragon.setColor(col);
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), dense = Array.from({ length: 700 }, () => new THREE.Vector3());
const resample = (n) => { spine[0].copy(dense[0]); let acc = 0, k = 1; for (let i = 1; i < n && k <= SEG; i++) { const d = dense[i].distanceTo(dense[i - 1]); while (k <= SEG && acc + d >= k * SPACING) { spine[k].lerpVectors(dense[i - 1], dense[i], (k * SPACING - acc) / d); k++; } acc += d; } for (; k <= SEG; k++) spine[k].copy(spine[k - 1]).add(new THREE.Vector3(0, -SPACING, 0)); };
let cam;
if (pose === 'cuelga') { cam = new THREE.OrthographicCamera(-W / H * 3.9, W / H * 3.9, 3.9, -3.9, 0.1, 50); cam.position.set(0, 0, 12); cam.lookAt(0, 0, 0); }
else if (pose === 'enrollado') { cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50); cam.position.set(0, 3.6, 5.6); cam.lookAt(0, 0.3, 0); }
else { cam = new THREE.OrthographicCamera(-3.6, 3.6, 3.6 * H / W, -3.6 * H / W, 0.1, 50); cam.position.set(0, 1.2, 12); cam.lookAt(0, 0.25, 0); }
function render(i) {
  const t = (i / N) * Math.PI * 2;   // one loop
  if (pose === 'cuelga') {   // held by the head at the top, the body swinging below it
    for (let j = 0; j < dense.length; j++) { const u = j / (dense.length - 1), y = 3.25 - u * 7.0, k = u; dense[j].set(0.55 * Math.pow(k, 1.3) * Math.sin(t - u * 3.2) + 0.12 * Math.sin(2 * t - u * 6), y, 0.3 * k * Math.cos(t - u * 3.2)); }
    resample(dense.length);
    spine[0].add(new THREE.Vector3(0.34, -0.02, 0.1)); spine[1].add(new THREE.Vector3(0.11, 0, 0.04));   // the head in profile, it reads better
  } else if (pose === 'enrollado') {
    for (let j = 0; j < dense.length; j++) { const u = j / (dense.length - 1), a = 0.5 + u * Math.PI * 4.2 + t * 0.05, r = 0.33 + u * 0.92; dense[j].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
    resample(dense.length);
    const nf = (k) => (k <= 2 ? 1 : k < 8 ? Math.pow(1 - (k - 2) / 6, 2) : 0);
    for (let k = 0; k <= SEG; k++) spine[k].y = 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025 + nf(k) * (0.5 + 0.05 * Math.sin(t));
    for (let k = 0; k < 8; k++) { const f = nf(k); spine[k].z += 0.32 * f + (k <= 2 ? (2 - k) * 0.1 : 0); spine[k].x += Math.sin(t) * 0.06 * f; }
  } else {   // stretched out, slithering
    for (let k = 0; k <= SEG; k++) spine[k].set(-3.2 + k * SPACING, 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025, Math.sin(k * 0.45 - t) * 0.18 * (0.3 + k / SEG));
    for (let k = 0; k < 6; k++) { const f = Math.pow(1 - k / 6, 2); spine[k].y += 0.3 * f; }
  }
  dragon.update(spine, i / 30, glow);
  R.render(sc, cam);
}
window.__render = render; window.__n = N; render(0); window.__ready = true;
