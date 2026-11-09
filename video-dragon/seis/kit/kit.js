// LÓNG · the kit for the short films: one three.js stage with three sets (a dark studio with a turntable, the bedroom
// at night, a gift on a table with fairy lights), the dragon and its poses, bloom, a lens pass (vignette, grain, fade),
// and frame() to place the camera and draw. Each film imports it and only writes its plan.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';
export { THREE, SEG, SPACING };

export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t, inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const COLS = ['metal', 'orojo', 'azulmorado', 'azulverde', 'oro', 'plata', 'pastel', 'luminoso'];
export const SWN = ['Metalizado', 'Oro y rojo', 'Azul y morado', 'Azul y verde', 'Oro', 'Plata', 'Pastel', 'Luminoso'];
export const SWC = ['#7b3fe4,#4f6ee8,#c9b54a,#5aa64a', '#ffcf3a,#ff8a1f,#e8322f', '#8a3ff0,#4a4ff0,#2f3fd0', '#3aa84a,#2d8f7a,#2f6fd0', '#ffe27a,#f5c021,#e0a800', '#f4f6f9,#a3aab4,#e9ecf1', '#fff3a6,#ffd1e8,#c9f0ff', '#f4f7ee,#dfe9d5'];

const tl = new THREE.TextureLoader();
const tex = (u, s, rep = 1.2) => new Promise((r) => tl.load(u, (t) => { if (s) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep * 0.7); t.anisotropy = 8; r(t); }));
const radial = (stops, size = 256) => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, size, size); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const mk = (parent, geo, m, pos = [0, 0, 0], shadow = false) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.castShadow = shadow; o.receiveShadow = shadow; parent.add(o); return o; };

export async function stage({ set = 'estudio', bloom = 0.35 } = {}) {
  const R = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(W, H, false); R.toneMapping = THREE.ACESFilmicToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#07080c');
  sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.25;
  const cam = new THREE.PerspectiveCamera(36, W / H, 0.03, 80);
  const L = {};   // the set's lights and the things a film switches
  const [wd, wn, wr] = await Promise.all([tex('../../tex/wood_diff.jpg', true), tex('../../tex/wood_nor.jpg'), tex('../../tex/wood_rough.jpg')]);
  const wood = new THREE.MeshPhysicalMaterial({ map: wd, normalMap: wn, roughnessMap: wr, roughness: 0.8, clearcoat: 0.35, clearcoatRoughness: 0.25 });
  L.wood = wood;

  if (set === 'estudio') {
    sc.fog = new THREE.Fog('#07080c', 9, 24);
    const floor = mk(sc, new THREE.CircleGeometry(30, 64), new THREE.MeshPhysicalMaterial({ color: '#101218', roughness: 0.32, metalness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.2 }), [0, 0, 0], true); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
    const disc = mk(sc, new THREE.CylinderGeometry(1.95, 2.0, 0.14, 96), new THREE.MeshPhysicalMaterial({ color: '#16181f', roughness: 0.25, metalness: 0.5, clearcoat: 1 }), [0, 0.07, 0], true);
    L.ring = mk(sc, new THREE.TorusGeometry(1.98, 0.02, 12, 160), new THREE.MeshBasicMaterial({ color: '#ff3b4e' }), [0, 0.14, 0]); L.ring.rotation.x = Math.PI / 2; L.disc = disc;
    // a soft pool of light on the back wall: a cyclorama
    const back = mk(sc, new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(70,40,90,1)'], [0.45, 'rgba(26,18,40,1)'], [1, 'rgba(7,8,12,1)']], 512), fog: false }), [0, 6, -12]);
    L.back = back;
    const key = new THREE.SpotLight('#fff1e2', 60, 30, 0.55, 0.6, 1.6); key.position.set(1.5, 8, 5); key.target.position.set(0, 0.3, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0005; sc.add(key, key.target);
    const rimA = new THREE.DirectionalLight('#ff7a45', 2.2); rimA.position.set(-6, 3, -5); sc.add(rimA);
    const rimB = new THREE.DirectionalLight('#5b86ff', 2.0); rimB.position.set(6, 2.5, -5); sc.add(rimB);
    const fill = new THREE.HemisphereLight('#9fb0ff', '#1a0f0a', 0.35); sc.add(fill);
    L.key = key; L.rimA = rimA; L.rimB = rimB; L.fill = fill;
    L.base = { key: 60, rimA: 2.2, rimB: 2.0, fill: 0.35, env: 0.25 };
    L.lights = (k) => { key.intensity = L.base.key * k; rimA.intensity = L.base.rimA * k; rimB.intensity = L.base.rimB * k; fill.intensity = L.base.fill * k; sc.environmentIntensity = L.base.env * Math.max(0.05, k); L.ring.material.color.setRGB(lerp(0.08, 1, k), lerp(0.02, 0.23, k), lerp(0.03, 0.3, k)); back.material.color.setScalar(lerp(0.15, 1, k)); };
  }

  if (set === 'cuarto') {
    const top = mk(sc, new THREE.BoxGeometry(3.6, 0.12, 2.3), wood, [0.2, -0.06, -0.1], true);
    mk(sc, new THREE.BoxGeometry(3.4, 2.6, 2.1), new THREE.MeshPhysicalMaterial({ map: wd, roughness: 0.85, color: '#9a8070' }), [0.2, -1.42, -0.15]);
    mk(sc, new THREE.BoxGeometry(3.0, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: '#1a120c' }), [0.2, -0.75, 0.91]);
    const lampG = new THREE.Group(); lampG.position.set(1.25, 0, -0.75); sc.add(lampG);
    const brass = new THREE.MeshPhysicalMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.3 });
    mk(lampG, new THREE.CylinderGeometry(0.28, 0.32, 0.08, 40), brass, [0, 0.04, 0], true);
    mk(lampG, new THREE.CylinderGeometry(0.03, 0.03, 1.25, 16), brass, [0, 0.66, 0]);
    const shadeMat = new THREE.MeshPhysicalMaterial({ color: '#efe2c8', roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color('#ffb46a'), emissiveIntensity: 0.6 });
    mk(lampG, new THREE.CylinderGeometry(0.36, 0.62, 0.72, 48, 1, true), shadeMat, [0, 1.5, 0]);
    const bulb = new THREE.PointLight('#ffb36a', 14, 9, 2); bulb.position.set(1.25, 1.3, -0.75); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024); bulb.shadow.radius = 8; bulb.shadow.bias = -0.002; sc.add(bulb);
    const down = new THREE.SpotLight('#ffc48a', 30, 6, 0.9, 0.8, 2); down.position.set(1.25, 1.25, -0.75); down.target.position.set(0.3, 0, 0); down.castShadow = true; down.shadow.mapSize.set(1024, 1024); down.shadow.radius = 6; sc.add(down, down.target);
    const book = new THREE.Group(); book.position.set(-0.95, 0.07, 0.35); book.rotation.y = 0.35; sc.add(book);
    mk(book, new THREE.BoxGeometry(0.95, 0.14, 1.25), new THREE.MeshStandardMaterial({ color: '#7a1f1a', roughness: 0.7 }), [0, 0, 0], true);
    mk(book, new THREE.BoxGeometry(0.9, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9 }), [0.03, 0, 0]);
    const duvetG = new THREE.PlaneGeometry(6, 4, 120, 80); { const p = duvetG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.12 * Math.sin(x * 2.1 + y * 0.7) + 0.07 * Math.sin(x * 5.3 - y * 3.1) + 0.04 * Math.sin(y * 7 + x)); } duvetG.computeVertexNormals(); }
    const duvet = mk(sc, duvetG, new THREE.MeshPhysicalMaterial({ color: '#cfc8bd', roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') }), [-4.6, 0.55, -1.2]); duvet.rotation.x = -Math.PI / 2 + 0.05; duvet.receiveShadow = true;
    const pillow = mk(sc, new THREE.SphereGeometry(1, 48, 24), duvet.material, [-3.4, 0.85, -2.4]); pillow.scale.set(1.4, 0.32, 0.7);
    const wallM = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.95 });
    const wall = mk(sc, new THREE.PlaneGeometry(30, 14), wallM, [0, 2, -3.6]); wall.receiveShadow = true;
    const winU = { t: { value: 0 }, k: { value: 1 } };
    const winMat = new THREE.ShaderMaterial({ uniforms: winU,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `uniform float t, k; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        vec3 city(vec2 uv){ vec3 c = mix(vec3(0.02, 0.03, 0.07), vec3(0.06, 0.07, 0.14), uv.y);
          for (int i = 0; i < 26; i++){ float fi = float(i); vec2 p = vec2(h(vec2(fi, 1.0)), 0.1 + 0.55 * h(vec2(fi, 2.0)));
            vec3 col = mix(vec3(1.0, 0.65, 0.3), vec3(0.4, 0.6, 1.0), step(0.6, h(vec2(fi, 3.0)))); if (h(vec2(fi, 4.0)) > 0.85) col = vec3(1.0, 0.3, 0.4);
            float d = length((uv - p) * vec2(1.6, 1.0)); c += col * smoothstep(0.075, 0.05, d) * (0.25 + 0.2 * sin(t * 0.5 + fi)); }
          return c; }
        void main(){ vec2 uv = vUv; vec2 off = vec2(0.0);
          vec2 g = uv * vec2(28.0, 18.0); vec2 id = floor(g), f = fract(g) - 0.5; float r = h(id); vec2 dp = vec2(h(id + 3.1) - 0.5, h(id + 7.7) - 0.5) * 0.6;
          float drop = smoothstep(0.16 * r, 0.1 * r, length(f - dp)) * step(0.55, r); off += (f - dp) * drop * 0.06;
          vec2 g2 = uv * vec2(12.0, 1.0); float col = floor(g2.x); float sp = 0.06 + 0.08 * h(vec2(col, 9.0));
          float y = fract(uv.y + t * sp + h(vec2(col, 5.0))); float x = fract(g2.x) - 0.5 + 0.08 * sin(uv.y * 30.0 + col);
          float run = smoothstep(0.06, 0.02, abs(x)) * smoothstep(0.0, 0.03, y) * smoothstep(0.08, 0.03, y);
          float trail = smoothstep(0.03, 0.0, abs(x)) * smoothstep(0.08, 0.6, y) * (1.0 - y) * 0.35; off += vec2(x, 0.0) * (run * 0.25 + trail * 0.05);
          vec3 c = city(uv + off); c += vec3(0.08, 0.1, 0.16) * (drop * 0.4 + run * 0.8 + trail * 0.4); gl_FragColor = vec4(c * k, 1.0); }` });
    mk(sc, new THREE.PlaneGeometry(5.2, 4.0), winMat, [-0.6, 2.5, -3.55]);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#d8d0c4', roughness: 0.6 });
    [[0, 2.0, 5.5, 0.14], [0, -2.0, 5.5, 0.14], [-2.65, 0, 0.14, 4.1], [2.65, 0, 0.14, 4.1], [0, 0, 0.08, 4.0], [0, 0.4, 5.2, 0.08]].forEach(([x, y, w, h]) => mk(sc, new THREE.BoxGeometry(w, h, 0.12), frameMat, [-0.6 + x, 2.5 + y, -3.5]));
    const moon = new THREE.DirectionalLight('#7f9cff', 0.5); moon.position.set(-1, 4, -6); sc.add(moon);
    L.bulb = bulb; L.down = down; L.shade = shadeMat; L.moon = moon; L.win = winU; L.duvet = duvet; L.wallM = wallM;
    L.lamp = (k) => { bulb.intensity = 14 * k; down.intensity = 30 * k; shadeMat.emissiveIntensity = 0.6 * k + 0.02; sc.environmentIntensity = 0.03 + 0.09 * k; moon.intensity = lerp(0.65, 0.45, k); };
    L.lights = L.lamp; sc.environmentIntensity = 0.12;
  }

  if (set === 'regalo') {
    sc.background = new THREE.Color('#0b0705');
    const table = mk(sc, new THREE.BoxGeometry(9, 0.2, 5), wood, [0, -0.1, 0], true); table.castShadow = false;
    // the fairy lights: warm discs far behind, as a lens sees them out of focus
    const bokeh = new THREE.Group(); sc.add(bokeh); const disc = radial([[0, 'rgba(255,214,150,1)'], [0.6, 'rgba(255,170,90,0.55)'], [1, 'rgba(255,140,60,0)']], 128);
    let q = 7; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: disc, color: new THREE.Color().setHSL(0.07 + rnd() * 0.06 - (rnd() > 0.85 ? 0.08 : 0), 0.9, 0.62), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.35 + rnd() * 0.4 })); s.position.set(lerp(-9, 9, rnd()), lerp(0.6, 9, rnd()), lerp(-9, -6, rnd())); s.scale.setScalar(0.5 + rnd() * 1.1); s.userData.ph = rnd() * 6.28; bokeh.add(s); }
    // the gift: a red box, a gold ribbon, the lid apart so it can fly off
    const red = new THREE.MeshPhysicalMaterial({ color: '#b3122a', roughness: 0.45, clearcoat: 0.6, sheen: 0.4, sheenColor: new THREE.Color('#ff6070') });
    const gold = new THREE.MeshPhysicalMaterial({ color: '#e8b64a', metalness: 1, roughness: 0.25 });
    const box = new THREE.Group(); sc.add(box);
    mk(box, new THREE.BoxGeometry(2.2, 1.5, 2.2), red, [0, 0.75, 0], true);
    mk(box, new THREE.BoxGeometry(2.24, 1.52, 0.22), gold, [0, 0.75, 0]); mk(box, new THREE.BoxGeometry(0.22, 1.52, 2.24), gold, [0, 0.75, 0]);
    const inside = mk(box, new THREE.BoxGeometry(2.0, 0.02, 2.0), new THREE.MeshStandardMaterial({ color: '#2a0508', roughness: 1 }), [0, 1.49, 0]);
    const lid = new THREE.Group(); lid.position.set(0, 1.5, 0); sc.add(lid);
    mk(lid, new THREE.BoxGeometry(2.36, 0.34, 2.36), red, [0, 0.17, 0], true);
    mk(lid, new THREE.BoxGeometry(2.4, 0.36, 0.24), gold, [0, 0.17, 0]); mk(lid, new THREE.BoxGeometry(0.24, 0.36, 2.4), gold, [0, 0.17, 0]);
    const bow = new THREE.Group(); bow.position.set(0, 0.42, 0); lid.add(bow);
    [-1, 1].forEach((s) => { const l = mk(bow, new THREE.TorusGeometry(0.32, 0.09, 12, 32), gold, [s * 0.3, 0.12, 0]); l.rotation.set(0, s * 0.5, s * 0.9); l.scale.set(1, 0.7, 1); });
    const key = new THREE.SpotLight('#ffe4c4', 70, 30, 0.6, 0.6, 1.6); key.position.set(2.5, 8, 5); key.target.position.set(0, 1, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0005; sc.add(key, key.target);
    const warm = new THREE.PointLight('#ff9a4a', 18, 14, 2); warm.position.set(-4, 3, -3); sc.add(warm);
    const fill = new THREE.HemisphereLight('#ffd9b0', '#200c05', 0.4); sc.add(fill);
    L.box = box; L.lid = lid; L.bokeh = bokeh; L.key = key; L.warm = warm; L.fill = fill; L.inside = inside;
    L.lights = (k) => { key.intensity = 70 * k; warm.intensity = 18 * k; fill.intensity = 0.4 * k; sc.environmentIntensity = 0.25 * Math.max(0.06, k); bokeh.children.forEach((s) => { s.material.opacity = (0.35 + 0.4 * ((s.userData.ph * 7) % 1)) * lerp(0.35, 1, k); }); };
  }

  if (set === 'gamer') {
    sc.background = new THREE.Color('#050508');
    const deskM = new THREE.MeshPhysicalMaterial({ color: '#121318', roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4 });
    const desk = mk(sc, new THREE.BoxGeometry(14, 0.25, 6.5), deskM, [0, -0.125, -0.6], true); desk.castShadow = false;
    const mat = mk(sc, new THREE.BoxGeometry(9.4, 0.03, 3.6), new THREE.MeshStandardMaterial({ color: '#0b0c10', roughness: 0.95 }), [0.4, 0.015, 0.35], true); mat.castShadow = false;
    const matEdge = mk(sc, new THREE.BoxGeometry(9.5, 0.035, 3.7), new THREE.MeshBasicMaterial({ color: '#ff3b4e' }), [0.4, 0.01, 0.35]);
    const wallM = new THREE.MeshStandardMaterial({ color: '#16161c', roughness: 0.9 });
    const wall = mk(sc, new THREE.PlaneGeometry(40, 16), wallM, [0, 4, -3.9]); wall.receiveShadow = true;
    // the monitor: a synthwave screen of our own
    const scr = document.createElement('canvas'); scr.width = 512; scr.height = 300; const g = scr.getContext('2d');
    const paintScreen = (t) => {
      const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#1a0638'); gr.addColorStop(0.55, '#5a1470'); gr.addColorStop(0.56, '#0a0614'); gr.addColorStop(1, '#14082a'); g.fillStyle = gr; g.fillRect(0, 0, 512, 300);
      const sun = g.createLinearGradient(0, 60, 0, 165); sun.addColorStop(0, '#ffd43b'); sun.addColorStop(1, '#ff3b8e'); g.fillStyle = sun; g.beginPath(); g.arc(256, 165, 78, Math.PI, 0); g.fill();
      g.fillStyle = '#1a0638'; for (let i = 0; i < 6; i++) g.fillRect(170, 112 + i * 9, 172, 2 + i * 0.6);
      g.strokeStyle = 'rgba(255,80,200,.75)'; g.lineWidth = 1.5;
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(256 + i * 12, 168); g.lineTo(256 + i * 70, 300); g.stroke(); }
      for (let k = 0; k < 9; k++) { const y = 168 + Math.pow(((k + (t * 1.2) % 1) / 9), 2) * 132; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 22px Inter, sans-serif'; g.fillText('LÓNG 龍', 22, 36);
    };
    paintScreen(0); const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace;
    const mon = new THREE.Group(); mon.position.set(-0.6, 0, -2.3); sc.add(mon);
    const black = new THREE.MeshPhysicalMaterial({ color: '#0a0a0d', roughness: 0.4, metalness: 0.3 });
    mk(mon, new THREE.BoxGeometry(5.0, 2.95, 0.18), black, [0, 2.35, 0], true);
    const screen = mk(mon, new THREE.PlaneGeometry(4.8, 2.75), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false }), [0, 2.35, 0.095]);
    mk(mon, new THREE.BoxGeometry(0.35, 1.1, 0.2), black, [0, 0.6, -0.15], true); mk(mon, new THREE.BoxGeometry(1.8, 0.06, 1.0), black, [0, 0.03, -0.1], true);
    const monL = new THREE.PointLight('#a24bff', 6, 9, 2); monL.position.set(-0.6, 2.3, -1.4); sc.add(monL);
    // the keyboard: a key per instance, coloured
    const kb = new THREE.Group(); kb.position.set(-1.0, 0.03, 0.45); sc.add(kb);
    mk(kb, new THREE.BoxGeometry(3.3, 0.16, 1.15), black, [0, 0.08, 0], true);
    const KX = 15, KZ = 5, keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.09, 0.18), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), KX * KZ);
    const m4 = new THREE.Matrix4(); for (let i = 0; i < KX; i++) for (let j = 0; j < KZ; j++) { m4.makeTranslation(-1.47 + i * 0.21, 0.2, -0.42 + j * 0.21); keys.setMatrixAt(i * KZ + j, m4); keys.setColorAt(i * KZ + j, new THREE.Color('#ff3b4e')); }
    kb.add(keys);
    const mouse = mk(sc, new THREE.CapsuleGeometry(0.22, 0.32, 6, 16), black, [-3.3, 0.13, 0.55], true); mouse.rotation.x = Math.PI / 2; mouse.scale.set(1, 1, 0.55);
    const mouseLed = mk(sc, new THREE.BoxGeometry(0.05, 0.02, 0.3), new THREE.MeshBasicMaterial({ color: '#ff3b4e', toneMapped: false }), [-3.3, 0.255, 0.5]);
    // the LED strip on the wall, and the light it throws
    const strip = mk(sc, new THREE.BoxGeometry(12, 0.07, 0.05), new THREE.MeshBasicMaterial({ color: '#ff3b4e', toneMapped: false }), [0, 4.6, -3.85]);
    const strip2 = mk(sc, new THREE.BoxGeometry(12, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: '#ff3b4e', toneMapped: false }), [0, -0.02, 2.62]);
    const wallL = new THREE.PointLight('#ff3b4e', 30, 14, 1.6); wallL.position.set(1.5, 3.8, -3.2); sc.add(wallL);
    const wallL2 = new THREE.PointLight('#ff3b4e', 18, 12, 1.6); wallL2.position.set(-3.5, 3.2, -3.2); sc.add(wallL2);
    const key = new THREE.SpotLight('#dfe6ff', 35, 30, 0.6, 0.6, 1.6); key.position.set(3, 7, 5); key.target.position.set(1.4, 0.3, 0.2); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0005; sc.add(key, key.target);
    const fill = new THREE.HemisphereLight('#8090ff', '#100810', 0.25); sc.add(fill);
    const tmpC = new THREE.Color(), tmpH = { h: 0, s: 0, l: 0 };
    L.screen = { paint: (t) => { paintScreen(t); scrTex.needsUpdate = true; } };
    // rgb(t, colour or null for the rainbow wave, brightness)
    L.rgb = (t, col, k = 1) => {
      for (let i = 0; i < KX; i++) for (let j = 0; j < KZ; j++) {
        if (col) { tmpC.set(col); tmpC.getHSL(tmpH); tmpC.setHSL(tmpH.h, tmpH.s, clamp(tmpH.l * (0.85 + 0.25 * Math.sin(t * 6 + i * 0.5 + j)), 0, 0.9)); }
        else tmpC.setHSL(((i / KX) * 0.8 - t * 0.35 + 10) % 1, 1, 0.55);
        tmpC.multiplyScalar(k); keys.setColorAt(i * KZ + j, tmpC);
      }
      keys.instanceColor.needsUpdate = true;
      const c = col ? tmpC.set(col) : tmpC.setHSL(((-t * 0.35) % 1 + 1) % 1, 1, 0.55);
      [strip.material, strip2.material, mouseLed.material, matEdge.material].forEach((m) => m.color.copy(c).multiplyScalar(k));
      wallL.color.copy(c); wallL2.color.copy(c); wallL.intensity = 30 * k; wallL2.intensity = 18 * k;
    };
    L.lights = (k) => { key.intensity = 35 * k; fill.intensity = 0.25 * k; monL.intensity = 6 * Math.max(0.15, k); screen.material.color.setScalar(Math.max(0.12, k)); sc.environmentIntensity = 0.2 * Math.max(0.05, k); };
    sc.environmentIntensity = 0.2;
  }

  // the dragon
  const dragon = createDragon(sc, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const spine = Array.from({ length: SEG + 1 }, () => V()), dense = Array.from({ length: 700 }, () => V());
  const glowL = new THREE.PointLight('#6dffb0', 0, 6, 2); sc.add(glowL);
  const haloM = new THREE.SpriteMaterial({ map: radial([[0, 'rgba(125,255,190,0.85)'], [0.4, 'rgba(90,255,170,0.25)'], [1, 'rgba(60,255,160,0)']], 128), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
  const halo = new THREE.Sprite(haloM); halo.scale.setScalar(4); sc.add(halo);

  // poses: each writes the spine (head first) in scene units
  const resample = (pts, n) => { spine[0].copy(pts[0]); let acc = 0, k = 1; for (let i = 1; i < n && k <= SEG; i++) { const s = pts[i].distanceTo(pts[i - 1]); while (k <= SEG && acc + s >= k * SPACING) { spine[k].lerpVectors(pts[i - 1], pts[i], s > 1e-9 ? (k * SPACING - acc) / s : 0); k++; } acc += s; } for (; k <= SEG; k++) spine[k].copy(spine[k - 1]).add(V(0, 0, -SPACING)); };
  const P = {
    // a loose coil on the floor, the head lifted in the middle and looking out
    coil(t, { rot = 0, lift = 0.35, cx = 0, cz = 0, y = 0, look = 0 } = {}) {
      for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.5 + u * Math.PI * 4.2 + rot + Math.sin(t * 0.5 + u * 5) * 0.04, r = 0.33 + u * 0.92; dense[i].set(Math.cos(a) * r + cx, y, Math.sin(a) * r + cz); }
      resample(dense, dense.length);
      const nf = (i) => (i <= 2 ? 1 : i < 8 ? Math.pow(1 - (i - 2) / 6, 2) : 0);
      for (let i = 0; i <= SEG; i++) spine[i].y = y + 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + nf(i) * (lift + 0.05 * Math.sin(t * 0.8));
      for (let i = 0; i < 8; i++) { const f = nf(i); spine[i].x += (Math.sin(t * 0.6) * 0.08 + look) * f; spine[i].z += 0.32 * f + (i <= 2 ? (2 - i) * 0.1 : 0); }
    },
    // stretched out straight along x, slithering: the full 88 cm
    stretch(t, { x0 = -3.2, z = 0, y = 0, wave = 0.05, speed = 2, lift = 0.25 } = {}) {
      for (let k = 0; k <= SEG; k++) spine[k].set(x0 + k * SPACING, y + 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025, z + Math.sin(k * 0.5 - t * speed) * wave * (0.3 + k / SEG));
      for (let k = 0; k < 6; k++) { const f = Math.pow(1 - k / 6, 2); spine[k].y += lift * f + Math.sin(t * 2.1) * 0.02 * f; spine[k].z += 0.06 * Math.sin(t * 1.3) * f; }
    },
    // an S that travels: it slithers across the floor
    slither(t, { x = 0, z = 0, y = 0, amp = 0.32, freq = 2.6, speed = 1.2, dir = 1, lift = 0.25 } = {}) {
      for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), s = u * 7.2; dense[i].set(x + dir * (3.2 - s), y, z + Math.sin(s * freq / 2 + t * speed * 3) * amp * (0.35 + u * 0.65)); }
      resample(dense, dense.length);
      for (let k = 0; k <= SEG; k++) spine[k].y = y + 0.2 * (1 - 0.82 * Math.pow(k / SEG, 1.2)) + 0.025;
      for (let k = 0; k < 6; k++) { const f = Math.pow(1 - k / 6, 2); spine[k].y += lift * f; }
    },
    // rising in a spiral (out of a box, round a centre), the head on top; u from 0 (all down) to 1 (all up)
    rise(t, u, { cx = 0, cz = 0, base = 0, height = 2.4, r = 0.62, turns = 2.4 } = {}) {
      const n = dense.length, out = clamp(u) * height;
      for (let i = 0; i < n; i++) { const s = i / (n - 1), along = s * SEG * SPACING, h = out - along * (height / (SEG * SPACING)) * 1.05, a = s * turns * Math.PI * 2 + t * 0.4, rr = r * (0.55 + s * 0.6);
        dense[i].set(cx + Math.cos(a) * rr, base + Math.max(h, -0.05) + 0.15, cz + Math.sin(a) * rr); }
      resample(dense, n);
      for (let k = 0; k < 4; k++) { const f = Math.pow(1 - k / 4, 2); spine[k].y += 0.25 * f; spine[k].z += 0.35 * f; }
    },
  };

  // post: bloom, then a lens (vignette, grain, fade to black)
  const comp = new EffectComposer(R, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  comp.setPixelRatio(1); comp.setSize(W, H); comp.addPass(new RenderPass(sc, cam));
  const bl = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), bloom, 0.6, 0.82); comp.addPass(bl); comp.addPass(new OutputPass());
  const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 }, fade: { value: 0 }, gray: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float t, fade, gray; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(c, vec3(l) * vec3(0.92, 0.95, 1.0), gray); vec2 d = vUv - 0.5; c *= smoothstep(1.05, 0.28, length(d * vec2(1.0, 0.72))); c += (h(vUv * 1100.0 + fract(t * 9.0)) - 0.5) * 0.04; c *= 1.0 - fade; gl_FragColor = vec4(c, 1.0); }' });
  comp.addPass(lens);

  let curCol = '';
  const tmp = V();
  // one frame: { cp, ca, fov, col, glow (0-1), fade, gray, bloom, shake }
  function frame(t, f) {
    if (f.col && f.col !== curCol) { dragon.setColor(f.col); curCol = f.col; }
    const glow = f.glow || 0;
    dragon.update(spine, t, glow * 0.6);
    tmp.copy(spine[12]).lerp(spine[24], 0.5); glowL.position.copy(tmp).add(V(0, 1.3, 0)); glowL.intensity = glow * (f.glowLight ?? 1.5);
    halo.position.copy(tmp).add(V(0, 0.2, 0)); haloM.opacity = glow * 0.35; halo.scale.setScalar(3.6 + glow);
    if (L.win) L.win.t.value = t;
    if (L.bokeh) L.bokeh.children.forEach((s, i) => { s.position.y += Math.sin(t * 0.7 + s.userData.ph) * 0.0015; });
    const sh = f.shake || 0;
    cam.position.copy(f.cp).add(V(Math.sin(t * 0.7) * 0.01 + Math.sin(t * 37) * sh * 0.02, Math.sin(t * 0.9) * 0.008 + Math.cos(t * 41) * sh * 0.02, 0)); if (f.up) cam.up.copy(f.up); else cam.up.set(0, 1, 0); cam.lookAt(f.ca); cam.fov = f.fov || 36; cam.updateProjectionMatrix();
    bl.strength = (f.bloom ?? bloom) + glow * 0.45;
    lens.uniforms.t.value = t; lens.uniforms.fade.value = f.fade || 0; lens.uniforms.gray.value = f.gray || 0;
    R.toneMappingExposure = f.exposure || 1;
    comp.render();
  }
  return { R, sc, cam, L, dragon, spine, P, frame, glowL, SPACING, SEG };
}
