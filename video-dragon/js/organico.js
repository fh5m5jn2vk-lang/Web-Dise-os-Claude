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
const DUR = G.dur, W = 1080, H = 1920;
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
const [woodMap, woodRough] = woodTextures();
const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshPhysicalMaterial({ map: woodMap, roughnessMap: woodRough, roughness: 0.75, clearcoat: 0.15, clearcoatRoughness: 0.5 }));
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
const main = createDragon(scene);
const extra = ['galaxia', 'plata', 'fuego'].map((c) => { const d = createDragon(scene); d.setColor(c); d.group.visible = false; return d; });
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
  for (let k = 0; k < n; k++) { const f = Math.pow(1 - k / n, 2); out[k].y += lift * f; out[k].x += look.x * f; out[k].z += look.z * f; }
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
  return { p: V(n(1.1, 0), n(1.3, 2), n(0.9, 4)).multiplyScalar(0.035 * amt), r: n(0.8, 1) * 0.012 * amt };
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
    coil(spine, t, 0, 0.2, t * 0.15); onDesk(spine, 0.55 + 0.05 * Math.sin(t * 2), V(Math.sin(t * 1.3) * 0.1, 0, 0.12), t);
    const k = E.out(p);
    cam.pos.set(lerp(-0.8, 0.35, k), lerp(3.4, 1.55, k), lerp(6.8, 2.9, k)); cam.at.set(0, 0.35, 0.2); cam.fov = 50;
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

/* ---------- captions: chunks of the spoken words, each with its own look and entrance ---------- */
// [line, first word, count, style, variant]
const CHUNKS = [
  [0, 0, 1, 'pop'], [0, 1, 3, 'pop'], [0, 4, 3, 'pop'], [0, 7, 1, 'pop'], [0, 8, 1, 'big', 'red shake'],
  [1, 0, 2, 'pop'], [1, 2, 1, 'serif'], [1, 3, 3, 'type'], [1, 6, 2, 'pop'], [1, 8, 3, 'marker'],
  [2, 0, 2, 'pop'], [2, 2, 2, 'big', 'stamp'], [2, 4, 2, 'pop'], [2, 6, 3, 'pop'], [2, 9, 2, 'marker'],
  [3, 0, 3, 'pop'], [3, 3, 2, 'count'],
  [4, 0, 3, 'pop'], [4, 3, 2, 'pop'], [4, 5, 3, 'type'], [4, 8, 2, 'glow'],
  [5, 0, 2, 'pop'], [5, 2, 1, 'rainbow'], [5, 3, 3, 'pop'], [5, 6, 2, 'marker'],
  [6, 0, 2, 'pop'], [6, 2, 2, 'serif', 'red'], [6, 4, 2, 'pop'], [6, 6, 2, 'big', 'stamp'],
  [7, 0, 3, 'pop'], [7, 3, 3, 'pop'], [7, 6, 3, 'big', 'stamp'], [7, 9, 2, 'pop'], [7, 11, 1, 'marker'],
];
const capEl = document.getElementById('cap');
const chunks = CHUNKS.map(([li, w0, n, style, variant = ''], i) => {
  const ws = L[li].words.slice(w0, w0 + n);
  const next = CHUNKS[i + 1]; const end = next && next[0] === li ? L[li].words[next[1]][1] : L[li].t1 + 0.22;
  return { li, ws, style, variant, t0: ws[0][1] - 0.04, t1: end - 0.04, text: ws.map((w) => w[0]).join(' ') };
});
const RAIN = ['#ffd23f', '#9be15d', '#38c6d9', '#5b7cff', '#b45cff', '#ff6fa8', '#ff8a3d'];
let built = null;
function build(c) {
  capEl.className = 's-' + c.style + ' ' + c.variant; capEl.innerHTML = '';
  const top = { pop: 1150, big: 1000, marker: 1080, serif: 1040, type: 1080, glow: 980, rainbow: 1040, count: 980 }[c.style];
  capEl.style.top = top + 'px';
  const parts = [];
  if (c.style === 'count') { capEl.innerHTML = '<span class="w"><b class="n">0</b><small> CM</small></span>'; parts.push(capEl.firstChild); }
  else if (c.style === 'type' || c.style === 'rainbow') {
    const txt = c.style === 'rainbow' ? c.text.replace(/[,.]$/, '') : c.text;
    [...txt].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'w'; s.style.margin = '0'; s.textContent = ch === ' ' ? ' ' : ch; if (c.style === 'rainbow') s.style.color = RAIN[i % RAIN.length]; capEl.appendChild(s); parts.push(s); });
    if (c.style === 'type') { const cur = document.createElement('span'); cur.className = 'cur'; capEl.appendChild(cur); }
  } else {
    c.ws.forEach((w) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = c.style === 'glow' ? w[0].replace(/[.]/g, '') : w[0]; capEl.appendChild(s); parts.push(s); });
  }
  if (c.style === 'marker') capEl.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M2 12 C 25 4, 45 18, 70 9 S 95 10, 98 7" fill="none" stroke="#ffe14d" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>');
  // squeeze to the safe width
  capEl.style.fontSize = ''; let px = parseFloat(getComputedStyle(capEl).fontSize);
  capEl.style.right = 'auto'; capEl.style.opacity = 0;
  while (capEl.offsetWidth > 960 && px > 30) { px -= 4; capEl.style.fontSize = px + 'px'; }
  capEl.style.right = '';
  built = { c, parts };
}
function captions(t) {
  const c = chunks.find((k) => t >= k.t0 && t < k.t1);
  if (!c) { capEl.style.opacity = 0; built = null; return; }
  if (!built || built.c !== c) build(c);
  capEl.style.opacity = 1;
  const a = t - c.t0, out = E.in(prog(t, c.t1 - 0.07, c.t1));
  const parts = built.parts;
  capEl.style.transform = `scale(${1 - out * 0.15})`; capEl.style.filter = out ? `blur(${out * 8}px)` : '';
  if (c.style === 'pop') {
    parts.forEach((s, i) => { const w = c.ws[i]; const p = prog(t, w[1] - 0.05, w[1] + 0.12); s.style.opacity = p > 0 ? 1 : 0; s.style.transform = `scale(${lerp(0.4, 1, E.back(p))}) translateY(${(1 - E.out(p)) * 30}px)`; s.classList.toggle('on', t >= w[1] && t < w[2] + 0.05); });
  } else if (c.style === 'big') {
    const p = prog(a, 0, 0.22);
    const shake = c.variant.includes('shake') ? Math.sin(a * 70) * 10 * Math.exp(-a * 3) : 0;
    parts.forEach((s) => { s.style.opacity = 1; s.style.transform = `translateX(${shake}px) rotate(${lerp(-14, -3, E.back(p))}deg) scale(${lerp(2.6, 1, E.out(p)) + Math.sin(a * 18) * 0.015})`; s.style.filter = `blur(${(1 - p) * 10}px)`; });
  } else if (c.style === 'serif') {
    parts.forEach((s, i) => { const p = prog(a, i * 0.08, i * 0.08 + 0.4); s.style.opacity = E.out(p); s.style.transform = `translateY(${(1 - E.out(p)) * 60}px) skewX(${(1 - p) * -18}deg)`; s.style.letterSpacing = `${(1 - E.out(p)) * 0.3}em`; s.style.filter = `blur(${(1 - p) * 12}px)`; });
  } else if (c.style === 'type') {
    const dur = Math.max(0.25, (c.t1 - c.t0) * 0.6), n = Math.ceil(parts.length * clamp(a / dur));
    parts.forEach((s, i) => { s.style.opacity = i < n ? 1 : 0; s.style.transform = i === n - 1 ? 'translateY(-6px)' : ''; });
    const cur = capEl.querySelector('.cur'); if (cur) cur.style.opacity = Math.floor(a * 6) % 2 ? 1 : 0.2;
  } else if (c.style === 'marker') {
    parts.forEach((s, i) => { const p = prog(a, i * 0.07, i * 0.07 + 0.25); s.style.opacity = p > 0 ? 1 : 0; s.style.transform = `rotate(${lerp(10, -4 + i * 2, E.elastic(p))}deg) scale(${lerp(0.3, 1, E.elastic(p))})`; });
    const path = capEl.querySelector('path'); if (path) { capEl.querySelector('svg').style.top = (capEl.offsetHeight - 10) + 'px'; path.style.strokeDashoffset = 1 - E.out(prog(a, 0.15, 0.5)); }
  } else if (c.style === 'glow') {
    const p = prog(a, 0, 0.35);
    parts.forEach((s, i) => { s.style.opacity = clamp(p * 2 - i * 0.3) * (0.85 + 0.15 * Math.sin(a * 30 + i)); s.style.transform = `scale(${lerp(0.7, 1, E.out(p))})`; s.style.filter = `blur(${(1 - p) * 20}px)`; });
  } else if (c.style === 'rainbow') {
    parts.forEach((s, i) => { const p = prog(a, i * 0.04, i * 0.04 + 0.25); s.style.opacity = p > 0 ? 1 : 0; s.style.transform = `translateY(${(1 - E.back(p)) * 120 + Math.sin(a * 8 + i) * 8}px) rotate(${Math.sin(i * 1.7) * 8 * (1 - p) + Math.sin(a * 6 + i) * 3}deg)`; });
  } else if (c.style === 'count') {
    const p = prog(a, 0, 0.55);
    parts[0].style.opacity = 1; parts[0].style.transform = `scale(${lerp(1.8, 1, E.back(prog(a, 0, 0.3)))})`;
    capEl.querySelector('.n').textContent = Math.round(88 * E.out(p));
  }
}
const hookEl = document.getElementById('hook'), linkEl = document.getElementById('link');
function boxes(t) {
  const hp = E.back(prog(t, 0.05, 0.35)), ho = E.in(prog(t, B[1] - 0.2, B[1]));
  hookEl.style.opacity = t < B[1] ? 1 - ho : 0; hookEl.style.transform = `translateX(-50%) scale(${lerp(0.5, 1, hp)}) rotate(${-2 + Math.sin(t * 3) * 0.5}deg)`;
  const lp = E.back(prog(t, tWord(7, 5), tWord(7, 5) + 0.3));
  linkEl.style.opacity = t >= tWord(7, 5) ? 1 : 0; linkEl.style.transform = `translateX(-50%) scale(${lerp(0.4, 1, lp) * (1 + 0.04 * Math.sin(t * 8))})`;
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
  captions(t); boxes(t);
  composer.render();
}

/* ---------- start ---------- */
for (const f of ['800 80px Manrope', '400 80px Anton', '400 80px ArchivoBlack', '400 80px Marker', '400 80px Bebas', 'italic 900 80px PlayfairI', '800 80px Syne']) await document.fonts.load(f, 'Aáé');
woodMap.needsUpdate = true;
const q = new URLSearchParams(location.search);
window.__dur = DUR;
window.__render = (t) => render(t);
render(0);
window.__ready = true;
if (!q.has('record')) {
  const t0 = performance.now();
  const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
