// LÓNG · the Facebook cover: our own 3D dragon (Metalizado) slithering out of the dark toward the brand, a red rim
// light in the brand colour, a cool one opposite, a glossy floor that fades into the night, the seal 龍 as a
// watermark behind it. 1640×924: a phone shows all of it, a computer the middle 624 px.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createDragon, SEG, SPACING } from '../../dragon/js/dragon.js';

const W = 1640, H = 924, DPR = window.devicePixelRatio || 1;
const q = new URLSearchParams(location.search), P = (k, d) => (q.has(k) ? +q.get(k) : d);
const R = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
R.setPixelRatio(DPR); R.setSize(W, H, false); R.toneMapping = THREE.ACESFilmicToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const sc = new THREE.Scene();
sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.35;
// the backdrop: night, a red glow behind the words, a cool one behind the dragon, the seal as a watermark
const bg = document.createElement('canvas'); bg.width = 1640; bg.height = 924; const g = bg.getContext('2d');
g.fillStyle = '#07080c'; g.fillRect(0, 0, 1640, 924);
const glow = (x, y, r, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(7,8,12,0)'); g.fillStyle = gr; g.fillRect(0, 0, 1640, 924); };
glow(330, 470, 620, 'rgba(255,59,78,0.20)'); glow(1180, 380, 700, 'rgba(70,60,160,0.22)'); glow(1500, 700, 500, 'rgba(255,120,60,0.10)');
g.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 10; y < 924; y += 26) for (let x = 10; x < 1640; x += 26) { g.beginPath(); g.arc(x, y, 1.3, 0, 6.283); g.fill(); }
await document.fonts.load('900 600px Han', '龍');
g.save(); g.translate(1290, 470); g.rotate(-0.08); g.font = '900 760px Han'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(255,59,78,0.12)'; g.strokeText('龍', 0, 0); g.restore();
const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace; sc.background = bgTex;
const cam = new THREE.PerspectiveCamera(P('fov', 30), W / H, 0.05, 80);
// no visible floor: a contact shadow, and a pool of red light under the dragon that fades into the night
const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.55 }));
shadowFloor.rotation.x = -Math.PI / 2; shadowFloor.receiveShadow = true; sc.add(shadowFloor);
const pool = document.createElement('canvas'); pool.width = pool.height = 256; const pg = pool.getContext('2d');
const pr = pg.createRadialGradient(128, 128, 0, 128, 128, 128); pr.addColorStop(0, 'rgba(255,70,90,0.55)'); pr.addColorStop(0.45, 'rgba(255,59,78,0.18)'); pr.addColorStop(1, 'rgba(255,59,78,0)'); pg.fillStyle = pr; pg.fillRect(0, 0, 256, 256);
const poolM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pool), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: P('pool', 0.9) }));
poolM.rotation.x = -Math.PI / 2; poolM.position.set(P('cxd', 3.7), 0.005, P('czd', 0)); poolM.scale.setScalar(P('poolr', 6.5)); sc.add(poolM);
const key = new THREE.SpotLight('#fff1e2', 70, 30, 0.6, 0.6, 1.6); key.position.set(2.2, 8, 6); key.target.position.set(3.7, 0.4, 0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0005; sc.add(key, key.target);
const rimRed = new THREE.DirectionalLight('#ff3b4e', 4.2); rimRed.position.set(-5, 3, -4); sc.add(rimRed);
const rimBlue = new THREE.DirectionalLight('#5b86ff', 2.6); rimBlue.position.set(7, 3, -5); sc.add(rimBlue);
sc.add(new THREE.HemisphereLight('#9fb0ff', '#1a0f0a', 0.25));
// the dragon: coiled on the right, the head up and turned toward the words
const dragon = createDragon(sc, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
dragon.setColor(q.get('col') || 'metal');
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), dense = [];
const CX = P('cxd', 3.7), CZ = P('czd', 0), ROT = P('rot', 2.2);
for (let i = 0; i <= 900; i++) { const u = i / 900, a = 0.5 + u * Math.PI * 4.0 + ROT, r = 0.36 + u * 1.0; dense.push(new THREE.Vector3(CX + Math.cos(a) * r, 0, CZ + Math.sin(a) * r)); }
spine[0].copy(dense[0]); { let acc = 0, k = 1; for (let i = 1; i < dense.length && k <= SEG; i++) { const d = dense[i].distanceTo(dense[i - 1]); while (k <= SEG && acc + d >= k * SPACING) { spine[k].lerpVectors(dense[i - 1], dense[i], (k * SPACING - acc) / d); k++; } acc += d; } }
const nf = (i) => (i <= 2 ? 1 : i < 9 ? Math.pow(1 - (i - 2) / 7, 2) : 0);
for (let k = 0; k <= SEG; k++) spine[k].y = 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025 + nf(k) * P('lift', 0.95);
for (let k = 0; k < 9; k++) { const f = nf(k); spine[k].x += P('look', -0.55) * f; spine[k].z += P('fwd', 0.55) * f; }
dragon.update(spine, 0, 0);
// the camera
cam.position.set(P('cx', 1.2), P('cy', 2.5), P('cz', 7.6)); cam.lookAt(P('lx', 2.1), P('ly', 0.7), P('lz', 0)); cam.updateProjectionMatrix();
const comp = new EffectComposer(R, new THREE.WebGLRenderTarget(W * DPR, H * DPR, { type: THREE.HalfFloatType, samples: 4 }));
comp.setPixelRatio(DPR); comp.setSize(W, H); comp.addPass(new RenderPass(sc, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.32, 0.6, 0.8)); comp.addPass(new OutputPass());
comp.render();
// grain over everything, very light
const gc = document.getElementById('grain').getContext('2d'), gi = gc.createImageData(820, 462); let s = 12345;
for (let i = 0; i < gi.data.length; i += 4) { s = (s * 16807) % 2147483647; const v = (s / 2147483647) * 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v; gi.data[i + 3] = 255; } gc.putImageData(gi, 0, 0);
for (const f of ['800 60px Syne', '600 40px Manrope', '700 30px Manrope', '500 22px Mono', '900 60px Han']) await document.fonts.load(f, 'Aá龍');
window.__ready = true;
