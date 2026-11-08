// LÓNG: Hong Kong at night and the articulated crystal dragon, in one three.js scene.
// createScene(canvas) -> { setPose(name, w), setGlow(k), setColor(id), setPointer(x, y), setScroll(p), fly(k), pause(), resume() }
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export const COLORS = {
  aurora: { label: 'Aurora', body: ['#3fffd2', '#3aa8ff', '#ff4fd8', '#ffcf4a'], horn: '#f3d38a', eye: '#ffd36b' },
  jade: { label: 'Jade', body: ['#2fe39f', '#1fb37d', '#7dffcf', '#21a06f'], horn: '#e8c27a', eye: '#fff1a8' },
  rubi: { label: 'Rubí', body: ['#ff3b4e', '#c81d3a', '#ff8a5c', '#a5122d'], horn: '#f0c76b', eye: '#ffe08a' },
  obsidiana: { label: 'Obsidiana', body: ['#20232b', '#3a3f4c', '#15171d', '#4a4f5e'], horn: '#e8c27a', eye: '#ff4e3b' },
};

/* ---------------- the city ---------------- */
const FOG = new THREE.Color('#0a0f1c');

function buildingMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      attribute vec3 iScale; attribute float iSeed;
      varying vec3 vLocal; varying vec3 vN; varying float vSeed; varying float vDepth; varying float vH;
      void main(){
        vLocal = (position + vec3(0.0, 0.5, 0.0)) * iScale; vN = normal; vSeed = iSeed; vH = iScale.y;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 fogColor; uniform float fogDensity; uniform float lights; uniform float time;
      varying vec3 vLocal; varying vec3 vN; varying float vSeed; varying float vDepth; varying float vH;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed * 17.3) * 43758.5453); }
      void main(){
        vec3 facade = mix(vec3(0.018, 0.022, 0.035), vec3(0.04, 0.045, 0.065), vLocal.y / max(vH, 1.0));
        vec3 col = facade;
        if (abs(vN.y) < 0.5) {
          vec2 uv = vec2(abs(vN.x) > 0.5 ? vLocal.z : vLocal.x, vLocal.y);
          vec2 cell = floor(uv / vec2(0.55, 0.75)); vec2 f = fract(uv / vec2(0.55, 0.75));
          float win = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.78);
          float r = h(cell);
          float on = step(0.7, r) * step(1.2, vLocal.y);
          float blink = step(0.995, h(cell + floor(time * 0.25)));
          vec3 warm = vec3(1.0, 0.72, 0.42), cool = vec3(0.55, 0.8, 1.0), tv = vec3(0.6, 0.9, 1.0);
          vec3 wc = r > 0.93 ? tv : (r > 0.8 ? cool : warm);
          col += win * on * wc * (0.28 + 0.4 * h(cell * 1.7)) * lights * (1.0 - blink * 0.8);
          // a lit crown on some towers
          col += vec3(1.0, 0.25, 0.35) * smoothstep(vH - 1.2, vH - 0.2, vLocal.y) * step(0.86, fract(vSeed * 7.13)) * 0.9 * lights;
        }
        float fogF = 1.0 - exp(-fogDensity * fogDensity * vDepth * vDepth);
        gl_FragColor = vec4(mix(col, fogColor, clamp(fogF, 0.0, 1.0)), 1.0);
      }`,
  });
}

function neonTexture(text, color) {
  const vertical = text.length > 1;
  const c = document.createElement('canvas');
  c.width = vertical ? 128 : 160; c.height = vertical ? 128 * text.length + 40 : 160;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(8,6,10,0.92)'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = color; g.lineWidth = 5; g.shadowColor = color; g.shadowBlur = 18;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);
  g.fillStyle = '#fff'; g.font = `700 ${vertical ? 92 : 104}px "Noto Serif TC", "Songti TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowBlur = 26;
  [...text].forEach((ch, i) => { g.fillStyle = color; g.fillText(ch, c.width / 2, vertical ? 84 + i * 128 : c.height / 2 + 4); g.fillStyle = 'rgba(255,255,255,.85)'; g.shadowBlur = 0; g.fillText(ch, c.width / 2, vertical ? 84 + i * 128 : c.height / 2 + 4); g.shadowBlur = 26; });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex: t, aspect: c.width / c.height };
}

function buildCity(scene, uniforms) {
  const R = rng(20261108);
  const g = new THREE.BoxGeometry(1, 1, 1);
  const N = 900;
  const mesh = new THREE.InstancedMesh(g, buildingMaterial(uniforms), N);
  const scales = new Float32Array(N * 3), seeds = new Float32Array(N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  const placed = [];
  for (let i = 0; i < N; i++) {
    const band = R();
    const z = -150 - Math.pow(R(), 0.8) * 330;
    const x = (R() - 0.5) * (360 + (-z) * 0.9);
    const centre = Math.exp(-Math.pow(x / 140, 2));
    let hgt = 5 + Math.pow(R(), 2.4) * 24 + centre * Math.pow(R(), 1.6) * 40;
    if (i === 0) { hgt = 84; } // the tallest tower, on the harbour front
    const w = 3 + R() * 7, d = 3 + R() * 7;
    const px = i === 0 ? 34 : x, pz = i === 0 ? -175 : z;
    p.set(px, hgt / 2, pz); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (R() - 0.5) * 0.25);
    m.compose(p, q, s.set(w, hgt, d)); mesh.setMatrixAt(i, m);
    scales.set([w, hgt, d], i * 3); seeds[i] = R() * 10 + band;
    placed.push({ x: px, z: pz, w, d, h: hgt });
  }
  g.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 3));
  g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  mesh.frustumCulled = false; scene.add(mesh);

  // neon signs on the nearer buildings
  const words = ['龍', '酒家', '茶餐廳', '金舖', '夜市', '藥房', '押', '麻雀', '大押', '燒臘', '旺角', '九龍', '珠寶', '粥麵'];
  const colors = ['#ff3b5c', '#ff5fd2', '#39e6ff', '#ffcf4a', '#42ffa8', '#ff6a3d'];
  const signs = [];
  const near = placed.filter((b) => b.z > -240 && b.h > 12).slice(0, 46);
  near.forEach((b, i) => {
    const word = words[i % words.length], color = colors[(i * 5) % colors.length];
    const { tex, aspect } = neonTexture(word, color);
    const hgt = word.length > 1 ? 2.2 * word.length : 3.2, wid = hgt * aspect;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6), fog: true });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(wid, hgt), mat);
    sign.position.set(b.x + (R() - 0.5) * b.w * 0.6, Math.min(b.h - hgt / 2 - 1, 6 + R() * (b.h * 0.6)), b.z + b.d / 2 + 0.25);
    scene.add(sign); signs.push({ mat, seed: R() * 100 });
  });

  // the harbour: dark water with streaks of reflected light
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 300, 1, 1), new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec3 vW; varying float vDepth; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `
      uniform vec3 fogColor; uniform float fogDensity; uniform float lights; uniform float time;
      varying vec3 vW; varying float vDepth;
      float h(float x){ return fract(sin(x * 91.3) * 43758.5); }
      void main(){
        float col = floor(vW.x * 0.6);
        float streak = h(col) > 0.45 ? 1.0 : 0.0;
        float wave = 0.5 + 0.5 * sin(vW.z * 1.7 + time * 1.3 + h(col) * 20.0) * sin(vW.z * 0.37 - time * 0.6 + col);
        vec3 tint = h(col + 3.0) > 0.7 ? vec3(1.0, 0.3, 0.45) : (h(col + 7.0) > 0.6 ? vec3(0.35, 0.85, 1.0) : vec3(1.0, 0.7, 0.4));
        float fade = smoothstep(-6.0, -60.0, vW.z);
        float near = smoothstep(0.0, -150.0, vW.z);
        vec3 c = mix(vec3(0.02, 0.022, 0.04), vec3(0.05, 0.03, 0.06), near) + tint * streak * pow(wave, 3.0) * (0.35 + 0.9 * near) * fade * lights;
        float fogF = 1.0 - exp(-fogDensity * fogDensity * vDepth * vDepth);
        gl_FragColor = vec4(mix(c, fogColor, clamp(fogF, 0.0, 1.0)), 1.0);
      }`,
  }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, 0, -60); scene.add(water);

  // the Peak behind: layered dark ridges
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const x = -700 + i * (1400 / 60); const y = 40 + 70 * Math.exp(-Math.pow((x - 60 + k * 90) / (260 - k * 40), 2)) + 18 * Math.sin(i * 0.9 + k) + 10 * Math.sin(i * 2.3); pts.push(new THREE.Vector2(x, y)); }
    const shape = new THREE.Shape([new THREE.Vector2(-700, -10), ...pts, new THREE.Vector2(700, -10)]);
    const ridge = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: new THREE.Color('#060912').lerp(FOG, 0.35 + k * 0.2), fog: false }));
    ridge.position.set(0, 0, -420 + k * 40); scene.add(ridge);
  }

  // sky: light pollution low, deep navy high
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform float lights; varying vec3 vP; void main(){ float y = clamp(vP.y, -0.1, 1.0); vec3 low = mix(vec3(0.05,0.06,0.1), vec3(0.32, 0.12, 0.2), lights * 0.55); vec3 c = mix(low, vec3(0.012,0.016,0.035), smoothstep(-0.02, 0.35, y)); gl_FragColor = vec4(c, 1.0); }',
  }));
  scene.add(sky);

  // mist that drifts low over the harbour
  const mistTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g2 = c.getContext('2d'); const gr = g2.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(160,180,220,0.5)'); gr.addColorStop(1, 'rgba(160,180,220,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); return t; })();
  const mists = [];
  for (let i = 0; i < 14; i++) {
    const mm = new THREE.Mesh(new THREE.PlaneGeometry(160, 40), new THREE.MeshBasicMaterial({ map: mistTex, transparent: true, opacity: 0.07, depthWrite: false, fog: false }));
    mm.position.set((R() - 0.5) * 400, 4 + R() * 14, -60 - R() * 180); scene.add(mm); mists.push({ mm, v: 1 + R() * 2 });
  }

  // red lanterns floating over the water
  const lanterns = [];
  const lg = new THREE.SphereGeometry(0.35, 16, 12); lg.scale(1, 1.25, 1);
  for (let i = 0; i < 12; i++) {
    const l = new THREE.Mesh(lg, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.28, 0.16), toneMapped: false }));
    l.position.set((R() - 0.5) * 90, 2 + R() * 10, -45 - R() * 60); l.scale.setScalar(0.7); scene.add(l); lanterns.push({ l, y: l.position.y, s: R() * 10 });
  }
  return { signs, mists, lanterns };
}

/* ---------------- the dragon ---------------- */
const SEG = 34, SPACING = 0.19;

function gemMaterial(hex) {
  return new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.15, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 1, iridescenceIOR: 1.7, flatShading: true, emissive: new THREE.Color(hex), emissiveIntensity: 0.12, transparent: true, opacity: 0.94 });
}

function buildDragon(scene) {
  const root = new THREE.Group(); scene.add(root);
  const segs = [];
  const bodyGeo = new THREE.IcosahedronGeometry(1, 0);
  const finGeo = new THREE.ConeGeometry(0.5, 1, 4); finGeo.translate(0, 0.5, 0);
  const plateGeo = new THREE.OctahedronGeometry(1, 0);
  for (let i = 0; i < SEG; i++) {
    const u = i / (SEG - 1);
    const r = (0.2 + 0.12 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.95)) * (1 - 0.72 * Math.pow(u, 1.6));
    const grp = new THREE.Group();
    const mat = gemMaterial('#3fffd2');
    const body = new THREE.Mesh(bodyGeo, mat); body.scale.set(r * 1.05, r * 0.92, SPACING * 0.95); grp.add(body);
    const fin = new THREE.Mesh(finGeo, mat); fin.scale.set(r * 0.5, r * (1.1 - 0.4 * u), r * 0.35); fin.position.y = r * 0.75; fin.rotation.x = -0.45; grp.add(fin);
    [-1, 1].forEach((sd) => { const pl = new THREE.Mesh(plateGeo, mat); pl.scale.set(r * 0.35, r * 0.5, SPACING * 0.5); pl.position.set(sd * r * 0.85, -r * 0.1, 0); pl.rotation.z = sd * 0.5; grp.add(pl); });
    root.add(grp); segs.push({ grp, mat, r, u });
  }
  // legs with three claws, at two places along the body
  const legs = [];
  const goldMat = new THREE.MeshStandardMaterial({ color: '#f3d38a', metalness: 1, roughness: 0.25, emissive: '#3a2a08', emissiveIntensity: 0.4 });
  [6, 19].forEach((si) => [-1, 1].forEach((sd) => {
    const leg = new THREE.Group();
    const r = segs[si].r;
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.22, r * 1.6, 6), segs[si].mat); thigh.position.y = -r * 0.8; leg.add(thigh);
    for (let c = -1; c <= 1; c++) { const claw = new THREE.Mesh(new THREE.ConeGeometry(r * 0.09, r * 0.5, 5), goldMat); claw.position.set(c * r * 0.16, -r * 1.7, r * 0.15); claw.rotation.x = 1.9; leg.add(claw); }
    leg.position.set(sd * segs[si].r * 0.9, -segs[si].r * 0.3, 0); leg.rotation.z = sd * 0.55;
    segs[si].grp.add(leg); legs.push({ leg, sd, si });
  }));
  // the head
  const head = new THREE.Group();
  const headMat = gemMaterial('#3fffd2');
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), headMat); skull.scale.set(0.3, 0.24, 0.34); head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.42), headMat); snout.position.set(0, -0.04, 0.38); head.add(snout);
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), headMat); nose.position.set(0, 0.02, 0.6); head.add(nose);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.4), headMat); jaw.position.set(0, -0.17, 0.32); jaw.rotation.x = 0.18; head.add(jaw);
  const hornMat = goldMat;
  const horns = [];
  [-1, 1].forEach((sd) => {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(sd * 0.12, 0.16, -0.05), new THREE.Vector3(sd * 0.22, 0.36, -0.28), new THREE.Vector3(sd * 0.3, 0.42, -0.62), new THREE.Vector3(sd * 0.26, 0.5, -0.86)]);
    const horn = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.03, 6), hornMat); head.add(horn); horns.push(horn);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 0.7), toneMapped: false })); eye.position.set(sd * 0.16, 0.08, 0.2); head.add(eye); horns.push(eye);
  });
  // whiskers: long, flowing, rebuilt every frame
  const whiskers = [-1, 1].map((sd) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), 30, 0.008, 4);
    const w = new THREE.Mesh(geo, hornMat); scene.add(w); return { w, sd };
  });
  // a mane of flames behind the head
  const mane = [];
  for (let k = 0; k < 9; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.38, 4), headMat); const a = -1.2 + (k / 8) * 2.4; f.position.set(Math.sin(a) * 0.22, Math.cos(a) * 0.2, -0.22); f.rotation.set(-1.9, 0, -a * 0.6); head.add(f); mane.push(f); }
  root.add(head);
  // the tail fan
  const tail = new THREE.Group();
  for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 4), segs[SEG - 1].mat); const a = -0.8 + (k / 4) * 1.6; f.position.set(Math.sin(a) * 0.12, Math.cos(a) * 0.1, -0.2); f.rotation.set(-1.7, 0, -a); tail.add(f); }
  root.add(tail);
  return { root, segs, head, headMat, horns, whiskers, mane, tail, legs, goldMat };
}

/* ---------------- the pearl ---------------- */
function buildPearl(scene) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#fff4e0', roughness: 0.1, clearcoat: 1, iridescence: 1, emissive: new THREE.Color('#ffb36b'), emissiveIntensity: 0.45 }));
  g.add(core);
  const flames = [];
  for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.5, 0.2), transparent: true, opacity: 0.7, toneMapped: false, depthWrite: false })); g.add(f); flames.push(f); }
  const light = new THREE.PointLight('#ffb36b', 1.5, 5, 2); g.add(light);
  scene.add(g);
  return { g, core, flames, light };
}

/* ---------------- poses: a spine of SEG+1 points ---------------- */
function poseLine(t, out) { const n = out.length - 1; for (let i = 0; i <= n; i++) { const u = i / n; out[i].set(3.6 - u * 7.4, 0.18 * Math.sin(u * 9 - t * 2.2), 0.25 * Math.cos(u * 6 - t * 1.4)); } }
function poseCoil(t, out) { const n = out.length - 1; for (let i = 0; i <= n; i++) { const u = i / n; const a = u * Math.PI * 6 + t * 0.5; const r = 0.85 - u * 0.25; out[i].set(Math.cos(a) * r, 1.3 - u * 2.6, Math.sin(a) * r); } }
function poseS(t, out) { const n = out.length - 1; for (let i = 0; i <= n; i++) { const u = i / n; out[i].set(Math.sin(u * Math.PI * 2.2 + t * 0.8) * 1.1 * (1 - u * 0.3), 1.3 - u * 2.8, Math.cos(u * Math.PI * 2.2 + t * 0.8) * 0.6); } }

// walk a dense curve and take points SPACING apart along it
const dense = Array.from({ length: 400 }, () => new THREE.Vector3());
function resample(fn, t, out) {
  fn(t, dense);
  let acc = 0, j = 0; out[0].copy(dense[0]);
  for (let i = 1; i < out.length; i++) {
    const want = i * SPACING;
    while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { out[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; }
    if (j >= dense.length - 1) out[i].copy(dense[dense.length - 1]);
  }
}

export function createScene(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(FOG, 0.005);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 2000);
  const uniforms = { fogColor: { value: FOG.clone() }, fogDensity: { value: 0.005 }, lights: { value: 1 }, time: { value: 0 } };

  const city = buildCity(scene, uniforms);
  const D = buildDragon(scene);
  const pearl = buildPearl(scene);
  const key = new THREE.DirectionalLight('#ffd9b0', 1.4); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#5fd0ff', 1.6); rim.position.set(4, 2, -5); scene.add(rim);
  const neonFill = new THREE.PointLight('#ff3b5c', 6, 14, 2); neonFill.position.set(3, 1, -2); scene.add(neonFill);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.5, 0.8); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // state
  const S = { pose: 'free', poseW: 0, glow: 0, glowT: 0, color: 'aurora', ptr: new THREE.Vector2(0.25, -0.1), ptrS: new THREE.Vector2(0.25, -0.1), scroll: 0, fly: 1, yaw: 0, side: 0.32 };
  const trail = []; const headPos = new THREE.Vector3(1.5, 0.5, 0); const headVel = new THREE.Vector3(-1, 0, 0);
  for (let i = 0; i < 400; i++) trail.push(headPos.clone().add(new THREE.Vector3(i * 0.03, 0, 0)));
  const spineFree = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  const spinePose = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), mtx = new THREE.Matrix4();
  const raycaster = new THREE.Raycaster(); const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const target = new THREE.Vector3();

  function setColor(id) {
    S.color = id; const c = COLORS[id];
    D.segs.forEach((s, i) => { const k = (i / (SEG - 1)) * (c.body.length - 1); const a = new THREE.Color(c.body[Math.floor(k)]), b = new THREE.Color(c.body[Math.min(c.body.length - 1, Math.ceil(k))]); s.mat.color.copy(a.lerp(b, k % 1)); s.base = s.mat.color.clone(); });
    D.headMat.color.set(c.body[0]); D.headMat.userData.base = D.headMat.color.clone();
    D.goldMat.color.set(c.horn);
    D.horns.forEach((h) => { if (h.material.isMeshBasicMaterial) h.material.color.set(c.eye).multiplyScalar(2.6); });
  }
  setColor('aurora');

  function frame() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  frame();
  new ResizeObserver(frame).observe(canvas);

  let t = 0, last = performance.now(), raf = 0, paused = false;
  function placeSpine(time, dt) {
    // free: the head chases the pearl, the body follows its own trail
    raycaster.setFromCamera(S.ptrS, camera);
    raycaster.ray.intersectPlane(plane, target);
    target.x = clamp(target.x, -4.2, 4.2); target.y = clamp(target.y, -1.8, 2.2);
    // circle the pearl rather than stop on it
    const toT = tmp.copy(target).sub(headPos); const dist = toT.length();
    const orbitDir = tmp2.set(-toT.y, toT.x, 0.6 * Math.sin(time * 0.9)).normalize();
    const desire = toT.normalize().multiplyScalar(dist > 0.9 ? 1 : 0.25).add(orbitDir.multiplyScalar(dist > 0.9 ? 0.25 : 0.9));
    desire.z += Math.sin(time * 0.7) * 0.25 - headPos.z * 0.6;
    headVel.lerp(desire.normalize().multiplyScalar(2.4 + Math.min(3, dist) * 0.9), Math.min(1, dt * 2.6));
    headPos.addScaledVector(headVel, dt);
    trail.unshift(headPos.clone()); if (trail.length > 600) trail.pop();
    // sample the trail at even arc lengths
    let acc = 0, j = 0; spineFree[0].copy(trail[0]);
    for (let i = 1; i <= SEG; i++) {
      const want = i * SPACING;
      while (j < trail.length - 1) { const d = trail[j].distanceTo(trail[j + 1]); if (acc + d >= want) { spineFree[i].copy(trail[j]).lerp(trail[j + 1], (want - acc) / d); break; } acc += d; j++; }
      if (j >= trail.length - 1) spineFree[i].copy(trail[trail.length - 1]);
    }
    // a living ripple through the body
    for (let i = 1; i <= SEG; i++) spineFree[i].y += Math.sin(time * 3 - i * 0.45) * 0.035 * (i / SEG);
    // posed: the section's shape, turned toward the pointer
    resample(S.pose === 'line' ? poseLine : S.pose === 'coil' ? poseCoil : poseS, time, spinePose);
    const yaw = S.yaw;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let i = 0; i <= SEG; i++) { const p = spinePose[i]; const x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy; p.set(x + S.side * 9, p.y + 0.55, z); }
    const w = smooth(S.poseW);
    for (let i = 0; i <= SEG; i++) spine[i].copy(spineFree[i]).lerp(spinePose[i], w);
    if (w > 0.98) { headPos.copy(spine[0]); trail.length = 0; for (let i = 0; i <= SEG; i++) trail.push(spine[i].clone()); }
  }
  function orient(obj, from, to) { mtx.lookAt(to, from, up); obj.quaternion.setFromRotationMatrix(mtx); }

  function updateDragon(time, dt) {
    placeSpine(time, dt);
    const glow = S.glowT;
    for (let i = 0; i < SEG; i++) {
      const s = D.segs[i]; const a = spine[i + 1], b = spine[i];
      s.grp.position.copy(a).lerp(b, 0.5); orient(s.grp, a, b);
      s.mat.emissive.copy(s.base || s.mat.color).lerp(new THREE.Color('#7dffb0'), glow);
      s.mat.emissiveIntensity = 0.12 + glow * 0.55;
    }
    D.headMat.emissive.copy(D.headMat.userData.base || D.headMat.color).lerp(new THREE.Color('#7dffb0'), glow); D.headMat.emissiveIntensity = 0.05 + glow * 0.55;
    D.head.position.copy(spine[0]); orient(D.head, spine[1], spine[0]);
    D.tail.position.copy(spine[SEG]); orient(D.tail, spine[SEG], spine[SEG - 1]);
    D.mane.forEach((f, k) => { f.scale.y = 1 + 0.15 * Math.sin(time * 6 + k); });
    D.legs.forEach((L, k) => { L.leg.rotation.x = Math.sin(time * 4 + k * 1.7) * 0.45; });
    // whiskers trail back from the snout, waving
    D.whiskers.forEach(({ w, sd }) => {
      const base = new THREE.Vector3(sd * 0.14, -0.05, 0.5).applyQuaternion(D.head.quaternion).add(D.head.position);
      const pts = [base];
      for (let k = 1; k <= 6; k++) { const seg = spine[Math.min(SEG, k)]; pts.push(seg.clone().add(new THREE.Vector3(sd * (0.25 + k * 0.05), 0.08 * Math.sin(time * 2.5 + k * 0.9) - 0.05 * k, 0).applyQuaternion(D.head.quaternion))); }
      w.geometry.dispose(); w.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.008, 4);
    });
    // the pearl at the pointer, only while the dragon is free
    pearl.g.position.lerp(target, 0.25);
    const pv = 1 - smooth(S.poseW);
    pearl.g.scale.setScalar(Math.max(0.001, pv));
    pearl.flames.forEach((f, k) => { const a = (k / pearl.flames.length) * Math.PI * 2 + time * 2; f.position.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0); f.rotation.z = a - Math.PI / 2; f.scale.y = 0.8 + 0.4 * Math.sin(time * 9 + k * 2); });
    pearl.light.intensity = 1.5 * pv;
  }

  function updateCity(time, dt) {
    uniforms.time.value = time;
    const lights = lerp(1, 0.12, S.glowT);
    uniforms.lights.value = lights;
    city.signs.forEach((s, i) => { const flick = Math.sin(time * 13 + s.seed) > 0.985 ? 0.3 : 1; s.mat.color.setScalar(1.6 * flick * lerp(1, 0.15, S.glowT)); });
    city.mists.forEach((m) => { m.mm.position.x += m.v * dt; if (m.mm.position.x > 260) m.mm.position.x = -260; m.mm.lookAt(camera.position); });
    city.lanterns.forEach((l) => { l.l.position.y = l.y + Math.sin(time * 0.6 + l.s) * 0.4; });
    neonFill.intensity = 6 * lights;
  }

  function updateCamera(time) {
    const fly = smooth(S.fly);   // 1 = still high above the harbour (the intro), 0 = in place
    S.ptrS.lerp(S.ptr, 0.08);
    const px = S.ptrS.x, py = S.ptrS.y;
    const sc = S.scroll;
    camera.position.set(px * 0.35 + Math.sin(sc * 3) * 0.4, 0.9 + py * 0.18 + fly * 22 - sc * 0.6, 8.5 + fly * 30 - sc * 0.5);
    camera.lookAt(px * 0.2, 0.8 + fly * 6 + sc * 0.2, -10);
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (paused) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    S.glowT += (S.glow - S.glowT) * Math.min(1, dt * 2.5);
    S.yaw += ((S.ptrS.x * 0.9) - S.yaw) * Math.min(1, dt * 3);
    updateCamera(t); updateCity(t, dt); updateDragon(t, reduce ? 0 : dt);
    bloom.strength = 0.7 + S.glowT * 0.1;
    composer.render();
  }
  raf = requestAnimationFrame(tick);

  return {
    setPose(name, w, side = 0.32) { S.pose = name; S.poseW = clamp(w); S.side = side; },
    setGlow(k) { S.glow = k; },
    setColor,
    setPointer(x, y) { S.ptr.set(x, y); },
    setScroll(p) { S.scroll = p; },
    fly(k) { S.fly = k; },
    pause() { paused = true; }, resume() { paused = false; },
    ready: Promise.resolve(),
  };
}
