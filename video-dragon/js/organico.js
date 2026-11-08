// LÓNG, the organic cut: the dragon on a real-looking desk, filmed as if on a phone (handheld, focus pulls, quick
// zooms, jump cuts), a voice-over and captions that change face with every key word. The rooms change behind it:
// a gamer's desk at night, golden hour, lights out, a cool white morning, then Christmas.
// The timing comes from guion.json, written by voz/voz.py with the voice. window.__render(t), window.__dur.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../dragon/js/dragon.js';

const G = await (await fetch('js/guion.json')).json();
const FLYER = G.lines[G.lines.length - 1].t1 + 0.15;   // the closing flyer comes in as the voice ends
const DUR = FLYER + 3.6, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in: (t) => t * t * t, expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  back: (t) => { const c = 2.4, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const L = G.lines;
const word = (li, wi) => L[li].words[wi];
// shot k runs from the middle of the pause before line k to the middle of the pause after it
const B = L.map((l, i) => (i === 0 ? 0 : (L[i - 1].t1 + l.t0) / 2)); B.push(DUR);

/* ---------- renderer ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
const camera = new THREE.PerspectiveCamera(48, W / H, 0.03, 80);

/* ---------- the desk ---------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function noise1(seed) { const R = rng(seed), v = Array.from({ length: 512 }, R); return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(v[i & 511], v[(i + 1) & 511], u); }; }
function woodTextures() {
  const w = 1024, h = 2048, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  const rgh = document.createElement('canvas'); rgh.width = w; rgh.height = h; const g2 = rgh.getContext('2d'), img2 = g2.createImageData(w, h), d2 = img2.data;
  const n1 = noise1(3), n2 = noise1(7), n3 = noise1(11);
  for (let y = 0; y < h; y++) {
    const wob = n1(y * 0.004) * 60 + n2(y * 0.02) * 6;
    for (let x = 0; x < w; x++) {
      const plank = Math.floor(x / 256), px = x + wob + plank * 37;
      const ring = 0.5 + 0.5 * Math.sin(px * 0.11 + n3(px * 0.03 + plank * 9) * 6 + Math.sin(y * 0.003 + plank) * 3);
      const fine = n2(px * 0.9 + y * 0.002 + plank * 50);
      const k = Math.pow(ring, 2.2) * 0.55 + fine * 0.25 + (plank % 2) * 0.06;
      const gap = x % 256 < 2 ? 0.45 : 1;
      const i = (y * w + x) * 4;
      d[i] = (78 + 70 * k) * gap; d[i + 1] = (46 + 44 * k) * gap; d[i + 2] = (26 + 22 * k) * gap; d[i + 3] = 255;
      const r = 150 + 70 * fine - 40 * ring; d2[i] = d2[i + 1] = d2[i + 2] = r; d2[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); g2.putImageData(img2, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(1.2, 1);
  const tr = new THREE.CanvasTexture(rgh); tr.wrapS = tr.wrapT = THREE.RepeatWrapping; tr.repeat.copy(t.repeat);
  return [t, tr];
}
// a scanned walnut table top (Poly Haven, CC0): colour 4K, normal and roughness 2K, the grain along the desk
const texLoader = new THREE.TextureLoader();
const loadTex = (u, srgb) => new Promise((r) => texLoader.load(u, (t) => { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.repeat.set(1.55, 2.75); r(t); }));
const [woodMap, woodNor, woodRough] = await Promise.all([loadTex('tex/wood_diff.jpg', true), loadTex('tex/wood_nor.jpg'), loadTex('tex/wood_rough.jpg')]);
const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshPhysicalMaterial({ map: woodMap, normalMap: woodNor, normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: woodRough, roughness: 0.85, clearcoat: 0.3, clearcoatRoughness: 0.22 }));
desk.rotation.x = -Math.PI / 2; desk.position.z = -1; desk.receiveShadow = true; scene.add(desk);
// the desk's front edge, so low shots see a real board
const edge = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 0.1), new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.7 })); edge.position.set(0, -0.25, 3.5); scene.add(edge);

// the room behind: a wall that takes the mood's colours, far enough to go soft
const wallMat = new THREE.ShaderMaterial({
  uniforms: { a: { value: new THREE.Color() }, b: { value: new THREE.Color() }, k: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 a, b; uniform float k; varying vec2 vUv; void main(){ float g = smoothstep(0.0, 1.0, vUv.y); vec3 c = mix(b, a, g) * k; float v = 1.0 - 0.5 * pow(abs(vUv.x - 0.5) * 2.0, 2.0); gl_FragColor = vec4(c * v, 1.0); }',
});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), wallMat); wall.position.set(0, 6, -12); scene.add(wall);

// bokeh: soft discs of light in the room behind (the lens turns far lights into these)
function discTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.78, 'rgba(255,255,255,0.7)'); gr.addColorStop(0.9, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const disc = discTexture();
const NB = 70, bokeh = [];
const BR = rng(42);
for (let i = 0; i < NB; i++) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 }));
  const z = -6 - BR() * 5, s = 0.5 + BR() * 1.3;
  m.position.set((BR() - 0.5) * 16, 0.6 + BR() * 6, z); m.scale.setScalar(s); scene.add(m);
  bokeh.push({ m, base: m.position.clone(), s, seed: BR(), pick: BR() });
}
// fairy lights strung across the back, for Christmas
const fairy = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 26; i++) {
  const u = i / 25, x = -6 + u * 12, y = 2.6 + r * 1.3 - Math.sin(u * Math.PI) * 0.9;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.6, 1.2), toneMapped: false }));
  m.position.set(x, y, -3.6 - r * 0.8); m.visible = false; scene.add(m); fairy.push({ m, seed: Math.random() });
}

/* ---------- props: keyboard, mug, tape measure, gift ---------- */
const props = new THREE.Group(); scene.add(props);
const kb = new THREE.Group(); props.add(kb);
const kbBase = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.18, 1.05), new THREE.MeshStandardMaterial({ color: '#121318', roughness: 0.5, metalness: 0.3 })); kbBase.position.y = 0.09; kbBase.castShadow = kbBase.receiveShadow = true; kb.add(kbBase);
const keyGeo = new THREE.BoxGeometry(0.17, 0.08, 0.17); const keyMat = new THREE.MeshStandardMaterial({ color: '#1d1f27', roughness: 0.6 });
const keys = new THREE.InstancedMesh(keyGeo, keyMat, 15 * 5); let ki = 0; const km = new THREE.Matrix4();
for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) { km.makeTranslation(-1.47 + c * 0.21 + (r % 2) * 0.05, 0.22, -0.4 + r * 0.2); keys.setMatrixAt(ki++, km); }
keys.castShadow = true; kb.add(keys);
const kbGlow = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.03, 1.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.3, 2.5), toneMapped: false })); kbGlow.position.y = 0.015; kb.add(kbGlow);
kb.position.set(-0.6, 0, -2.3); kb.rotation.y = 0.12;
const mugPts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; mugPts.push(new THREE.Vector2(u < 0.08 ? u * 4 : 0.33 + 0.01 * Math.sin(u * 3), u * 0.78)); }
mugPts.push(new THREE.Vector2(0.3, 0.78), new THREE.Vector2(0.3, 0.06));
const mug = new THREE.Mesh(new THREE.LatheGeometry(mugPts, 48), new THREE.MeshPhysicalMaterial({ color: '#efe9df', roughness: 0.25, clearcoat: 0.8 })); mug.castShadow = true;
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.04, 12, 32, Math.PI * 1.2), mug.material); handle.position.set(0.36, 0.42, 0); handle.rotation.z = -Math.PI * 0.6; mug.add(handle);
mug.position.set(2.3, 0, -1.4); props.add(mug);
// the tape measure: 90 cm laid along the desk (6.4 units are the 88 cm of the dragon)
const CM = 6.4 / 88;
function tapeTexture() {
  const c = document.createElement('canvas'); c.width = 4096; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#f2c230'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#1a1405'; g.textAlign = 'center'; g.font = 'bold 44px Manrope, sans-serif';
  for (let mm = 0; mm <= 900; mm += 1) {
    const x = (mm / 900) * c.width, l = mm % 100 === 0 ? 70 : mm % 10 === 0 ? 46 : mm % 5 === 0 ? 30 : 18;
    g.fillRect(x - (mm % 10 === 0 ? 1.5 : 0.6), 0, mm % 10 === 0 ? 3 : 1.2, l);
    if (mm % 100 === 0 && mm) g.fillText(String(mm / 10), x, 118); else if (mm % 50 === 0 && mm) { g.font = 'bold 32px Manrope'; g.fillText(String(mm / 10), x, 112); g.font = 'bold 44px Manrope, sans-serif'; }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const tape = new THREE.Mesh(new THREE.BoxGeometry(90 * CM, 0.012, 0.32), [0, 0, new THREE.MeshPhysicalMaterial({ map: tapeTexture(), roughness: 0.4, clearcoat: 0.5 }), 0, 0, 0].map((m) => m || new THREE.MeshStandardMaterial({ color: '#d9a91f' })));
tape.position.set(-3.2 + 45 * CM, 0.006, 0.62); tape.receiveShadow = true; tape.visible = false; scene.add(tape);
const tapeCase = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.62), new THREE.MeshPhysicalMaterial({ color: '#1b1c20', roughness: 0.35, clearcoat: 0.6 })); tapeCase.position.set(-3.2 + 90 * CM + 0.38, 0.3, 0.62); tapeCase.castShadow = true; tapeCase.visible = false; scene.add(tapeCase);
// the gift box, open, with its lid leaning on it
const gift = new THREE.Group(); gift.visible = false; scene.add(gift);
const paper = new THREE.MeshPhysicalMaterial({ color: '#b3121f', roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#ff8a8a'), clearcoat: 0.3 });
const ribbon = new THREE.MeshPhysicalMaterial({ color: '#e9c46a', metalness: 0.7, roughness: 0.3 });
const inside = new THREE.MeshStandardMaterial({ color: '#2a0508', roughness: 0.9, side: THREE.BackSide });
const BX = 1.5, BY = 1.05;
[[0, BY / 2, BX / 2, 0], [0, BY / 2, -BX / 2, 0], [BX / 2, BY / 2, 0, Math.PI / 2], [-BX / 2, BY / 2, 0, Math.PI / 2]].forEach(([x, y, z, r]) => {
  const w = new THREE.Mesh(new THREE.BoxGeometry(BX + 0.04, BY, 0.04), paper); w.position.set(x, y, z); w.rotation.y = r; w.castShadow = w.receiveShadow = true; gift.add(w);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(0.2, BY + 0.005, 0.05), ribbon); rb.position.copy(w.position); rb.rotation.y = r; gift.add(rb);
});
const giftIn = new THREE.Mesh(new THREE.BoxGeometry(BX - 0.02, BY - 0.02, BX - 0.02), inside); giftIn.position.y = BY / 2; gift.add(giftIn);
const lid = new THREE.Group(); gift.add(lid);
const lidTop = new THREE.Mesh(new THREE.BoxGeometry(BX + 0.12, 0.06, BX + 0.12), paper); lidTop.castShadow = true; lid.add(lidTop);
[[0, 0.0, 0.2, 0.065, BX + 0.13], [0, 0.0, BX + 0.13, 0.065, 0.2]].forEach(([x, y, w, h, d]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ribbon); lid.add(r); });
for (const s of [-1, 1]) { const bow = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), ribbon); bow.position.set(s * 0.15, 0.12, 0); bow.rotation.set(0, s * 0.5, s * 0.6); lid.add(bow); }
lid.position.set(BX / 2 + 0.25, 0.75, 0.1); lid.rotation.set(0.1, 0.4, 1.25);

/* ---------- the dragons ---------- */
const main = createDragon(scene, { hq: true });
const extra = ['galaxia', 'plata', 'fuego'].map((c) => { const d = createDragon(scene, { hq: true }); d.setColor(c); d.group.visible = false; return d; });
[main, ...extra].forEach((d) => d.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }));
const spine = Array.from({ length: SEG + 1 }, () => V());
const spines = extra.map(() => Array.from({ length: SEG + 1 }, () => V()));

/* ---------- lights ---------- */
const lamp = new THREE.SpotLight('#ffd7a3', 60, 18, 0.75, 0.6, 2); lamp.position.set(3.2, 5.2, 2.2); lamp.target.position.set(0, 0, 0); scene.add(lamp, lamp.target);
lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.bias = -0.0004; lamp.shadow.radius = 6; lamp.shadow.camera.near = 1; lamp.shadow.camera.far = 14;
const monitor = new THREE.PointLight('#6f8cff', 14, 12, 2); monitor.position.set(-2.5, 2.2, -3); scene.add(monitor);
const fill = new THREE.HemisphereLight('#9fb4ff', '#2a1a10', 0.35); scene.add(fill);
const rim = new THREE.DirectionalLight('#ff9be0', 1.2); rim.position.set(-4, 3, -6); scene.add(rim);
const glowLight = new THREE.PointLight('#6dffb0', 0, 6, 2); scene.add(glowLight);

/* ---------- moods: what the room looks like in each shot ---------- */
const MOODS = {
  night: { wallA: '#1a1236', wallB: '#07060c', bokeh: ['#7a5cff', '#ff4fd8', '#39b8ff', '#ff6b6b', '#5ef0ff'], lamp: 55, lampC: '#ffcf9a', mon: 16, monC: '#6f8cff', fill: 0.3, rim: 1.4, rimC: '#ff7ad8', kb: 1, exp: 1.0, fairy: 0 },
  golden: { wallA: '#5a3216', wallB: '#140a05', bokeh: ['#ffb347', '#ffd27a', '#ff8c42', '#fff1c1', '#ff9f5a'], lamp: 85, lampC: '#ffc48a', mon: 4, monC: '#ffb070', fill: 0.45, rim: 1.6, rimC: '#ffb36b', kb: 0.25, exp: 1.05, fairy: 0 },
  dark: { wallA: '#05060a', wallB: '#010102', bokeh: ['#1a2a3a', '#101820', '#0a1a14', '#141414', '#0c1418'], lamp: 0, lampC: '#ffcf9a', mon: 0.4, monC: '#3040a0', fill: 0.03, rim: 0.1, rimC: '#304060', kb: 0.05, exp: 1.0, fairy: 0 },
  morning: { wallA: '#c9d6e3', wallB: '#55606e', bokeh: ['#ffffff', '#cfe8ff', '#e8fff8', '#d6e4ff', '#fff6e0'], lamp: 70, lampC: '#fff4e6', mon: 3, monC: '#cfe0ff', fill: 0.9, rim: 1.0, rimC: '#dff2ff', kb: 0.1, exp: 0.95, fairy: 0 },
  xmas: { wallA: '#3a1410', wallB: '#0a0504', bokeh: ['#ffcf6a', '#ff4a3a', '#5fd36a', '#ffe9b0', '#ff9a3a'], lamp: 60, lampC: '#ffcf9a', mon: 2, monC: '#ff9a5a', fill: 0.35, rim: 1.5, rimC: '#ff6a4a', kb: 0, exp: 1.0, fairy: 1 },
};
const moodAt = ['night', 'night', 'golden', 'golden', 'dark', 'morning', 'xmas', 'xmas'];
const cA = new THREE.Color(), cB = new THREE.Color();
function applyMood(t, si) {
  // the room eases from the last shot's mood into this one over the first 0.7 s, so the background changes alive
  const cur = MOODS[moodAt[si]], prev = MOODS[moodAt[Math.max(0, si - 1)]];
  const k = si === 0 ? 1 : E.inOut(prog(t, B[si], B[si] + 0.7));
  const mix = (f) => lerp(prev[f], cur[f], k);
  const col = (f, out) => out.set(prev[f]).lerp(cB.set(cur[f]), k);
  col('wallA', wallMat.uniforms.a.value); col('wallB', wallMat.uniforms.b.value);
  lamp.intensity = mix('lamp'); col('lampC', lamp.color); monitor.intensity = mix('mon'); col('monC', monitor.color);
  fill.intensity = mix('fill'); rim.intensity = mix('rim'); col('rimC', rim.color);
  kbGlow.material.color.setRGB(1.5, 0.3, 2.5).multiplyScalar(mix('kb') * (0.8 + 0.2 * Math.sin(t * 2))).offsetHSL((t * 0.05) % 1, 0, 0);
  renderer.toneMappingExposure = mix('exp');
  bokeh.forEach((b, i) => {
    const pa = prev.bokeh[Math.floor(b.pick * prev.bokeh.length)], pc = cur.bokeh[Math.floor(b.pick * cur.bokeh.length)];
    b.m.material.color.set(pa).lerp(cA.set(pc), k);
    const tw = 0.75 + 0.25 * Math.sin(t * (0.6 + b.seed * 1.4) + b.seed * 30);
    b.m.material.opacity = 0.55 * tw * (moodAt[si] === 'dark' ? lerp(1, 0.15, k) : 1);
    b.m.position.set(b.base.x + Math.sin(t * 0.2 + b.seed * 9) * 0.3, b.base.y + Math.sin(t * 0.15 + b.seed * 5) * 0.2, b.base.z);
  });
  const f = mix('fairy');
  fairy.forEach((p) => { p.m.visible = f > 0.01; p.m.material.color.setRGB(4, 2.6, 1.2).multiplyScalar(f * (0.6 + 0.4 * Math.sin(t * 3 + p.seed * 20))); });
}

/* ---------- post: depth of field, bloom, then a phone lens ---------- */
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const dof = new BokehPass(scene, camera, { focus: 3, aperture: 0.004, maxblur: 0.012 }); composer.addPass(dof);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.7, 0.9); composer.addPass(bloom);
composer.addPass(new OutputPass());
const lens = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, whip: { value: new THREE.Vector2() }, zoom: { value: 0 }, flash: { value: 0 }, time: { value: 0 }, dim: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 whip; uniform float zoom, flash, time, dim; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; vec3 c = vec3(0.0);
      if (length(whip) + zoom > 0.001) {
        for (int i = 0; i < 14; i++) { float f = float(i) / 13.0 - 0.5; c += texture2D(tDiffuse, 0.5 + d * (1.0 - zoom * 0.14 * (f + 0.5)) + whip * f).rgb; }
        c /= 14.0;
      } else c = texture2D(tDiffuse, vUv).rgb;
      c *= 1.0 - dim;
      c *= mix(1.0, smoothstep(1.0, 0.3, length(d * vec2(1.0, 0.75))), 0.4);
      c += (hash(vUv * vec2(1080.0, 1920.0) + fract(time * 7.0) * 100.0) - 0.5) * 0.03;
      c = mix(c, vec3(1.0), flash);
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(lens);

/* ---------- dragon on the desk ---------- */
const bodyY = (k) => 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025;
// lay the spine on the desk: the body rests, the head lifts and looks about
function onDesk(out, lift = 0.4, look = V(0, 0, 0), t = 0) {
  for (let k = 0; k <= SEG; k++) out[k].y = bodyY(k);
  const n = 6;
  for (let k = 0; k < n; k++) { const f = Math.pow(1 - k / n, 2); out[k].y += lift * f + Math.sin(t * 2.1 + 1) * 0.025 * f; out[k].x += look.x * f + Math.sin(t * 1.7) * 0.05 * f; out[k].z += look.z * f + Math.cos(t * 1.3) * 0.04 * f; }
}
function alongPath(c, tau, out) {
  out[0].copy(c(tau)); let prev = out[0].clone(), total = 0, k = 1, tt = tau, n = 0;
  while (k <= SEG && n++ < 40000) {
    tt -= 0.003; const q = c(tt); const seg = prev.distanceTo(q);
    while (k <= SEG && total + seg >= k * SPACING) { out[k].lerpVectors(prev, q, (k * SPACING - total) / seg); k++; }
    total += seg; prev = q;
  }
  for (; k <= SEG; k++) out[k].copy(out[k - 1]);
}
const dense = Array.from({ length: 600 }, () => V());
function resample(fn, out) {
  for (let i = 0; i < dense.length; i++) fn(i / (dense.length - 1), dense[i]);
  let acc = 0, j = 0; out[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) {
    const want = i * SPACING;
    while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { out[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; }
    if (j >= dense.length - 1) out[i].copy(dense[dense.length - 1]);
  }
}
// a loose coil on the desk, the head in the middle; it breathes and turns a little
function coil(out, t, cx = 0, cz = 0, rot = 0) {
  resample((u, o) => { const a = 0.6 + u * Math.PI * 4.4 + rot + Math.sin(t * 0.7 + u * 4) * 0.05; const r = 0.35 + u * 0.95; o.set(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r); }, out);
}

/* ---------- the camera: a phone in a hand ---------- */
const cam = { pos: V(), at: V(), fov: 48, focus: null };
function handheld(t, amt = 1) {
  const n = (f, p) => Math.sin(t * f + p) * 0.5 + Math.sin(t * f * 2.3 + p * 1.7) * 0.3 + Math.sin(t * f * 5.1 + p * 0.3) * 0.2;
  return { p: V(n(0.9, 0), n(1.1, 2), n(0.7, 4)).multiplyScalar(0.02 * amt), r: n(0.6, 1) * 0.007 * amt };
}

/* ---------- the shots, one per line of the script ---------- */
const tWord = (li, wi) => word(li, wi)[1];
const tLightsOff = tWord(4, 7) + 0.1;         // "luz" -> the click
const tGlow = tWord(4, 9);                    // "brilla"
function shot(t) {
  const si = B.findIndex((b, i) => t >= b && t < B[i + 1]); const s = Math.max(0, si);
  const u = t - B[s], len = B[s + 1] - B[s], p = clamp(u / len);
  let glow = 0, four = false, handAmt = 1, punch = 0;
  tape.visible = tapeCase.visible = s === 3; gift.visible = s >= 6; props.visible = s !== 6 && s !== 7; kb.visible = s <= 1 || s === 4;
  if (s === 0) {
    // HOOK: walking up to the desk, the dragon coiled, its head up and turning to us
    coil(spine, t, 0, 0.2, t * 0.15); onDesk(spine, lerp(0.12, 0.6, E.back(prog(t, 0.15, 0.75))) + 0.04 * Math.sin(t * 2), V(Math.sin(t * 1.3) * 0.1, 0, lerp(0, 0.2, E.out(prog(t, 0.15, 0.75)))), t);
    const k = E.out(p);
    cam.pos.set(lerp(-0.9, 0.5, k), lerp(3.2, 1.85, k), lerp(6.4, 3.5, k)); cam.at.set(0, lerp(0.25, 0.5, k), 0.25); cam.fov = 48;
    if (t > tWord(0, 8) - 0.05) punch = E.out(prog(t, tWord(0, 8) - 0.05, tWord(0, 8) + 0.15)) * 0.25;    // "obsesionado": a quick zoom
  } else if (s === 1) {
    // "mirad cómo se mueve": it slithers toward the lens, we are down at desk height
    const c = (q) => { const v = q - B[1]; return V(0.75 * Math.sin(1.9 * v) - 0.2, 0, -3.2 + 1.25 * v); };
    alongPath(c, t, spine); onDesk(spine, 0.32 + 0.06 * Math.sin(t * 3), V(0, 0, 0), t);
    const h = spine[0];
    cam.pos.set(0.55 + Math.sin(u * 0.6) * 0.2, 0.42, h.z + 2.1 + (1 - p) * 0.4); cam.at.set(h.x * 0.6, 0.3, h.z - 0.2); cam.fov = 46;
    cam.focus = camera.position.distanceTo(h);
    if (t > tWord(1, 7)) punch = E.out(prog(t, tWord(1, 7), tWord(1, 7) + 0.18)) * 0.3;
  } else if (s === 2) {
    // "cada pieza va articulada": macro along the body as it waves past
    const c = (q) => { const v = q - B[2]; return V(-3.4 + 1.35 * v, 0, 0.32 * Math.sin(2.6 * v)); };
    alongPath(c, t, spine); onDesk(spine, 0.28, V(), t);
    const m = spine[10];
    cam.pos.set(m.x + 0.5, 0.6, 1.35); cam.at.set(m.x - 0.1, 0.12, m.z); cam.fov = 40; handAmt = 0.7;
    cam.focus = camera.position.distanceTo(m);
  } else if (s === 3) {
    // "noventa centímetros": stretched out along a tape measure, the camera pans tail to head
    for (let k = 0; k <= SEG; k++) spine[k].set(-3.2 + k * SPACING, 0, 0.12 + Math.sin(k * 0.5 + t * 2) * 0.04 * (k / SEG));
    onDesk(spine, lerp(0.05, 0.35, E.out(prog(t, B[4] - 0.8, B[4]))), V(), t);
    const k = E.inOut(p), x = lerp(3.3, -3.0, k);
    cam.pos.set(x + 0.4, 1.9, 2.3); cam.at.set(x - 0.2, 0.05, 0.35); cam.fov = 44;
    cam.focus = camera.position.distanceTo(V(x - 0.2, 0.05, 0.4));
  } else if (s === 4) {
    // "apagas la luz... y brilla": from above, the room goes dark, then the dragon lights up
    coil(spine, t, 0, 0, 1.2 + t * 0.1); onDesk(spine, 0.45 + 0.05 * Math.sin(t * 2), V(0, 0, 0.1), t);
    const a = 0.3 + u * 0.18;
    cam.pos.set(Math.sin(a) * 1.6, lerp(3.6, 3.0, E.inOut(p)), Math.cos(a) * 1.6 + 0.6); cam.at.set(0, 0.1, 0); cam.fov = 46;
    glow = E.expo(prog(t, tGlow, tGlow + 0.35)) * (0.85 + 0.15 * Math.sin(t * 4));
    if (t > tGlow) punch = E.out(prog(t, tGlow, tGlow + 0.2)) * 0.18;
  } else if (s === 5) {
    // "cuatro colores": all four side by side, a slow push across their heads
    four = true;
    const zs = [-1.1, -0.37, 0.37, 1.1];
    [spine, ...spines].forEach((sp, i) => {
      for (let k = 0; k <= SEG; k++) sp[k].set(-2.2 + k * SPACING * 0.93, 0, zs[i] + Math.sin(k * 0.32 - t * 2.4 + i * 1.3) * 0.12 * Math.min(1, k / 6));
      onDesk(sp, 0.35 + 0.05 * Math.sin(t * 2 + i), V(0, 0, 0), t);
    });
    const k = E.inOut(p);
    cam.pos.set(lerp(-4.8, -4.2, k), lerp(2.7, 2.45, k), lerp(2.2, 3.0, k)); cam.at.set(lerp(-1.6, -0.9, k), 0.2, 0); cam.fov = 44;
    cam.focus = cam.pos.distanceTo(V(-2.0, 0.4, 0.4));
  } else if (s === 6) {
    // "para regalar en Navidad": it rises out of the gift box
    gift.position.set(0, 0, 0);
    const rise = E.out(prog(t, B[6] + 0.1, B[7] - 0.1)) * 1.6;
    const c = (q) => (q < 0 ? V(0.42 * Math.cos(q * 3.6), 0.25 + Math.max(-0.2, q * 0.06), 0.42 * Math.sin(q * 3.6))
      : q < 1 ? V(0.42 * (1 - q), 0.25 + q * 1.15, 0.25 * q * q) : V(0, 1.4 + (q - 1) * 0.35, 0.25 + (q - 1) * 0.9));
    alongPath(c, rise, spine);
    for (let k = 0; k < 4; k++) spine[k].x += Math.sin(t * 2.5) * 0.06 * (1 - k / 4);
    const a = -0.35 + u * 0.12;
    cam.pos.set(Math.sin(a) * 3.6, 1.5, Math.cos(a) * 3.6); cam.at.set(0, 0.95, 0); cam.fov = 44;
    cam.focus = camera.position.distanceTo(spine[0]);
  } else {
    // the link: next to the box, the dragon looks up at us
    gift.position.set(-1.6, 0, -1.4);
    coil(spine, t, 0.15, 0.3, 2.2 + t * 0.12); onDesk(spine, 0.6 + 0.05 * Math.sin(t * 2.2), V(Math.sin(t * 1.1) * 0.08, 0, 0.2), t);
    const k = E.out(p);
    cam.pos.set(lerp(0.9, 0.5, k), lerp(1.7, 1.35, k), lerp(3.2, 2.45, k)); cam.at.set(0.15, 0.5, 0.3); cam.fov = 46;
  }
  if (!cam.focus) cam.focus = cam.pos.distanceTo(spine[0]);
  return { s, glow, four, handAmt, punch };
}

/* ---------- captions, as in the reference: one or two words at a time, key words stacked and bigger ---------- */
// [line, first word, count, kind, options]; kind: 'w' plain words (split one or two at a time), 'stack' small line over a
// big italic serif, 'heavy' small line over a big bold sans (with an optional line under), 'multi' one colour per word
const CHUNKS = [
  [0, 0, 5, 'w'], [0, 5, 4, 'stack', { top: 3, mint: true }],
  [1, 0, 3, 'heavy', { top: 2 }], [1, 3, 3, 'stack', { top: 1 }], [1, 6, 2, 'w'], [1, 8, 3, 'stack', { top: 2, mint: true }],
  [2, 0, 2, 'w'], [2, 2, 2, 'stack', { top: 1 }], [2, 4, 2, 'w'], [2, 6, 2, 'w'], [2, 8, 3, 'stack', { top: 2, mint: true }],
  [3, 0, 2, 'w'], [3, 2, 3, 'heavy', { top: 1, under: 1 }],
  [4, 0, 5, 'w'], [4, 5, 3, 'stack', { top: 1 }], [4, 8, 2, 'stack', { top: 1, mint: true, glow: true }],
  [5, 0, 3, 'multi'], [5, 3, 3, 'w'], [5, 6, 2, 'stack', { top: 1 }],
  [6, 0, 2, 'w'], [6, 2, 2, 'stack', { top: 1, mint: true }], [6, 4, 2, 'w'], [6, 6, 2, 'heavy', { top: 1 }],
  [7, 0, 6, 'w'], [7, 6, 3, 'stack', { top: 2, mint: true }], [7, 9, 2, 'w'], [7, 11, 1, 'stack', { top: 0 }],
];
const clean = (w) => { const c = w.replace(/[.,¿?…]+$/g, '').replace(/^¿/, '').toLowerCase(); return c === '3d' ? '3D' : c; };
// plain runs become one word at a time, a short word (3 letters or less) riding with the next
const chunks = [];
CHUNKS.forEach(([li, w0, n, kind, o = {}]) => {
  const ws = L[li].words.slice(w0, w0 + n);
  if (kind === 'w') {
    let g = [];
    ws.forEach((w, i) => { g.push(w); const short = clean(w[0]).length <= 3 && i < ws.length - 1; if (!short) { chunks.push({ li, ws: g, kind: 'w', o }); g = []; } });
    if (g.length) chunks.push({ li, ws: g, kind: 'w', o });
  } else chunks.push({ li, ws, kind, o });
});
chunks.forEach((c, i) => { const nx = chunks[i + 1]; c.t0 = c.ws[0][1] - 0.03; c.t1 = nx && nx.li === c.li ? nx.ws[0][1] - 0.03 : L[c.li].t1 + 0.25; });
// where each kind sits: words at the middle, stacks a little higher, and they wander a touch so it feels edited
const capEl = document.getElementById('cap');
const MULTI = ['#ff3b3b', '#2fdc5a', '#b04bff'];
let built = null;
function build(c, i) {
  capEl.innerHTML = '';
  const lines = [];
  const line = (cls, text, ws) => { const d = document.createElement('span'); d.className = 'ln ' + cls; d.textContent = text; capEl.appendChild(d); lines.push({ d, t: ws[0][1] }); return d; };
  const txt = (ws) => ws.map((w) => clean(w[0])).join(' ');
  if (c.kind === 'w') line('sans', txt(c.ws), c.ws);
  else if (c.kind === 'multi') c.ws.forEach((w, k) => { const d = line('multi', clean(w[0]), [w]); d.style.color = MULTI[k % 3]; });
  else {
    const top = c.o.top ?? 1, under = c.o.under ?? 0;
    const head = c.ws.slice(0, top), main = c.ws.slice(top, c.ws.length - under), tail = c.ws.slice(c.ws.length - under);
    if (head.length) line('small', txt(head), head);
    const d = line(c.kind === 'stack' ? 'serif' : 'heavy', txt(main), main);
    if (c.o.mint) d.classList.add('mint');
    if (c.o.glow) d.style.textShadow = '0 0 24px rgba(63,227,194,.9), 0 0 70px rgba(63,227,194,.6)';
    if (tail.length) line('under', txt(tail), tail);
  }
  // keep the widest line inside the frame
  lines.forEach(({ d }) => { d.style.display = 'inline-block'; let px = parseFloat(getComputedStyle(d).fontSize); while (d.offsetWidth > 960 && px > 30) { px -= 4; d.style.fontSize = px + 'px'; } d.style.display = ''; });
  place(c);
  built = { c, lines };
}
// put the words where the shot leaves room: away from the dragon (its head counts most), inside the app's safe area,
// and not always in the same spot; plain words keep to the centre line, the stacked ones may sit left or right
let lastPlace = '';
const proj = V();
function place(c) {
  const w = capEl.offsetWidth, h = capEl.offsetHeight;
  const pts = [];
  const add = (sp, wgt) => sp.forEach((p, k) => { proj.copy(p).project(camera); if (proj.z < 1) pts.push([(proj.x * 0.5 + 0.5) * W, (-proj.y * 0.5 + 0.5) * H, k < 6 ? wgt * 4 : wgt]); });
  add(spine, 1); if (extra[0].group.visible) spines.forEach((sp) => add(sp, 0.6));
  const ys = c.kind === 'w' ? [560, 760, 1010, 1230, 1380] : [430, 640, 900, 1150, 1330];
  const xs = c.kind === 'w' ? [['center', (W - w) / 2]] : [['left', 70], ['center', (W - w) / 2], ['right', W - 70 - w]];
  let best = null;
  for (const y0 of ys) for (const [al, x0] of xs) {
    const y = y0 - h / 2; if (y < 300 || y + h > 1500) continue;
    let hit = 0; for (const [x, yy, wt] of pts) if (x > x0 - 40 && x < x0 + w + 40 && yy > y - 40 && yy < y + h + 40) hit += wt;
    const key = al + y0;
    const score = hit * 10 + Math.abs(y0 + 0 - 1050) * 0.02 + (key === lastPlace && c.kind !== 'w' ? 25 : 0) + (al !== 'center' ? 4 : 0);
    if (!best || score < best.score) best = { score, x0, y, al, key };
  }
  lastPlace = best.key;
  capEl.style.left = best.x0 + 'px'; capEl.style.top = best.y + 'px'; capEl.style.textAlign = best.al;
}
function captions(t) {
  const i = chunks.findIndex((k) => t >= k.t0 && t < k.t1);
  if (i < 0) { capEl.style.opacity = 0; built = null; return; }
  const c = chunks[i];
  if (!built || built.c !== c) build(c, i);
  capEl.style.opacity = 1;
  const out = E.in(prog(t, c.t1 - 0.08, c.t1));
  built.lines.forEach(({ d, t: tw }, k) => {
    // each line comes out of a blur as its word is said; the big ones settle from a little larger
    const big = d.classList.contains('serif') || d.classList.contains('heavy');
    const p = prog(t, tw - 0.04, tw + (big ? 0.2 : 0.12)), e = E.out(p);
    d.style.opacity = Math.min(1, p * 1.6) * (1 - out);
    d.style.filter = `blur(${((1 - e) * (big ? 16 : 9) + out * 10).toFixed(1)}px)`;
    d.style.transform = `translateY(${(1 - e) * (big ? 14 : 8)}px) scale(${lerp(big ? 1.12 : 0.94, 1, e) * (1 + out * 0.04)})`;
    if (big) d.style.letterSpacing = `${lerp(0.02, -0.035, e)}em`;
  });
}
function boxes() {}

/* ---------- the closing flyer: the real product photo, premium and calm ---------- */
const fl = document.getElementById('flyer'), $f = (sel) => fl.querySelector(sel);
const dust = [...fl.querySelectorAll('.dust i')];
function flyer(t) {
  const a = t - FLYER;
  if (a < 0) { fl.style.opacity = 0; return; }
  fl.style.opacity = 1;
  const bg = E.out(prog(a, 0, 0.6));
  $f('.veil').style.opacity = bg; $f('.veil').style.backdropFilter = `blur(${bg * 22}px) saturate(${1 + bg * 0.2}) brightness(${1 - bg * 0.45})`;
  const rv = (sel, t0, d = 0.6, y = 40, extra = '') => { const p = E.out(prog(a, t0, t0 + d)); const el = $f(sel); el.style.opacity = p; el.style.filter = `blur(${(1 - p) * 10}px)`; el.style.transform = `translateY(${(1 - p) * y}px) ${extra}`; return p; };
  rv('.kicker', 0.25, 0.7, -16); $f('.kicker').style.letterSpacing = `${lerp(0.7, 0.42, E.out(prog(a, 0.25, 1.0)))}em`;
  rv('.brand', 0.35, 0.7, -20);
  // the photo rises, tips back flat, then floats; a slow push in and a sweep of light across it
  const pp = E.out(prog(a, 0.12, 1.0));
  const card = $f('.photo');
  card.style.opacity = pp; card.style.filter = `blur(${(1 - pp) * 12}px)`;
  card.style.transform = `perspective(1400px) translateY(${(1 - pp) * 140 + Math.sin(a * 1.6) * 6}px) rotateX(${(1 - pp) * 16}deg) rotateY(${Math.sin(a * 0.9) * 2.5}deg) scale(${lerp(0.9, 1, pp)})`;
  $f('.photo img').style.transform = `scale(${1.04 + a * 0.012})`;
  $f('.shine').style.transform = `translateX(${lerp(-120, 160, E.inOut(prog(a, 0.9, 1.8)))}%) skewX(-18deg)`;
  const tp = E.back(prog(a, 1.0, 1.45)); const th = $f('.thumb');
  th.style.opacity = prog(a, 1.0, 1.15); th.style.transform = `rotate(${lerp(18, 7, tp)}deg) scale(${lerp(0.3, 1, tp)}) translateY(${Math.sin(a * 2 + 1) * 4}px)`;
  [...fl.querySelectorAll('.chip')].forEach((c, i) => { const p = E.back(prog(a, 1.25 + i * 0.12, 1.65 + i * 0.12)); c.style.opacity = clamp(p * 1.5); c.style.transform = `translateY(${(1 - p) * 26}px) scale(${lerp(0.7, 1, p)})`; });
  rv('.price', 1.7, 0.6, 30, `scale(${lerp(1.12, 1, E.out(prog(a, 1.7, 2.3)))})`);
  const cp = E.back(prog(a, 2.1, 2.5)); const cta = $f('.cta');
  cta.style.opacity = clamp(cp * 1.4); cta.style.transform = `scale(${lerp(0.6, 1, cp) * (a > 2.6 ? 1 + 0.03 * Math.max(0, Math.sin((a - 2.6) * 6)) : 1)})`;
  dust.forEach((d, i) => { const s = (i * 0.618) % 1, y = (1 - ((a * (0.05 + s * 0.06) + s) % 1)) * 1920, x = (s * 997) % 1080; d.style.transform = `translate(${x + Math.sin(a + i) * 20}px, ${y}px)`; d.style.opacity = bg * (0.25 + 0.5 * Math.abs(Math.sin(a * 2 + i))); });
}

/* ---------- one frame ---------- */
let lastS = -1;
function render(t) {
  cam.focus = null;
  const s = shot(t);
  const si = s.s;
  applyMood(t, si);
  // lights out: the click cuts the lamp; the glow brings a green light of its own
  if (si === 4) {
    const off = t >= tLightsOff ? 1 : 0;
    lamp.intensity = lerp(MOODS.golden.lamp, 0, off); monitor.intensity = lerp(4, 0.4, off); fill.intensity = lerp(0.45, 0.03, off); rim.intensity = lerp(1.6, 0.1, off);
    wallMat.uniforms.k.value = lerp(1, 0.12, off); scene.environmentIntensity = lerp(0.35, 0.015, off);
    bokeh.forEach((b) => (b.m.material.opacity *= lerp(1, 0.12, off)));
    renderer.toneMappingExposure = lerp(1.05, 0.95, off);
  } else { wallMat.uniforms.k.value = 1; scene.environmentIntensity = 0.35; }
  glowLight.intensity = s.glow * 2.5; glowLight.position.copy(spine[Math.floor(SEG / 3)]).add(V(0, 0.4, 0));
  if (s.s !== lastS) { main.setColor('arcoiris'); lastS = s.s; }
  extra.forEach((d, i) => { d.group.visible = s.four; if (s.four) d.update(spines[i], t, 0); });
  main.update(spine, t, s.glow * 0.55);
  // the phone: handheld, a quick zoom on key words, a whip at every cut
  const hh = handheld(t, s.handAmt);
  camera.position.copy(cam.pos).add(hh.p); camera.fov = cam.fov * (1 - s.punch); camera.updateProjectionMatrix();
  camera.lookAt(cam.at); camera.rotateZ(hh.r);
  let whip = 0, dir = 1;
  B.slice(1, -1).forEach((b, i) => { const d = t - b; if (Math.abs(d) < 0.12) { whip = Math.max(whip, 1 - Math.abs(d) / 0.12); dir = i % 2 ? -1 : 1; } });
  lens.uniforms.whip.value.set(whip * 0.09 * dir, whip * 0.02);
  lens.uniforms.zoom.value = s.punch * 1.2 * Math.exp(-Math.max(0, t % 100) * 0);
  lens.uniforms.time.value = t; lens.uniforms.dim.value = t < 0.08 ? 1 - t / 0.08 : 0;
  lens.uniforms.flash.value = si === 4 && t >= tGlow ? Math.exp(-(t - tGlow) * 16) * 0.12 : 0;
  // focus: the phone hunts for a moment after each cut, then holds
  const settle = E.out(prog(t, B[si], B[si] + 0.35));
  dof.uniforms.focus.value = lerp(cam.focus * 1.35, cam.focus, settle);
  dof.uniforms.aperture.value = 0.0035; dof.uniforms.maxblur.value = 0.011;
  bloom.strength = 0.3 + s.glow * 0.3; bloom.threshold = lerp(0.9, 0.7, s.glow);
  captions(t); flyer(t);
  composer.render();
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
await document.fonts.load('900 80px Han', '龍'); await document.fonts.load('600 30px Inter');
for (const f of ['700 80px Inter', '800 80px Inter', 'italic 400 80px Serif', '800 80px Manrope']) await document.fonts.load(f, 'Aáé');
const q = new URLSearchParams(location.search);
window.__dur = DUR;
// cues for the sound design (audio/organico.py): every caption, every cut, the switch and the glow
window.__cues = { chunks: chunks.map((c) => ({ t: +(c.ws[c.kind === 'w' || c.kind === 'multi' ? 0 : Math.min(c.ws.length - 1, (c.o.top ?? 1))][1]).toFixed(3), kind: c.kind })), cuts: B.slice(1, -1), lightsOff: tLightsOff, glow: tGlow, gift: B[6] + 0.1, flyer: FLYER, dur: DUR };
window.__render = (t) => render(t);
render(0);
window.__ready = true;
if (!q.has('record')) {
  const t0 = performance.now();
  const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
