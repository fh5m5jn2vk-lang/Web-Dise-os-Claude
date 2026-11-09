// LÓNG · «Lo que le hace falta a tu cuarto». No voice, no music: the owner adds the sound. A bedroom at night in the
// rain. In the dark, «Lo que le hace falta»; the lamp clicks on with «a tu cuarto» and finds the dragon coiled on the
// walnut nightstand, dust floating in the light, and one long push creeps up to its head. Then a low orbit, letterboxed,
// looking up as the head rises like a creature waking. A blink of black, the Luminoso one glowing green in the dark
// room, and the end card. Silent film: window.__render(t), window.__dur; no cues.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';

const DUR = 16.5, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = (s) => document.querySelector(s);
const T_ON = 1.7;        // the lamp clicks on
const T_ORBIT = 5.3;     // the low orbit: it wakes up and looks at us
const T_CUT = 9.0;       // a blink of black, then the Luminoso in the dark
const T_GLOW = 9.5;
const T_END = 13.4;      // the end card

/* ---------- the room ---------- */
const R = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
R.toneMapping = THREE.ACESFilmicToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const sc = new THREE.Scene(); sc.background = new THREE.Color('#05060a'); sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.12;
const cam = new THREE.PerspectiveCamera(40, W / H, 0.03, 60);
const tl = new THREE.TextureLoader();
const tex = (u, s, rep = 1.2) => new Promise((r) => tl.load(u, (t) => { if (s) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep * 0.7); t.anisotropy = 8; r(t); }));
const [wd, wn, wr] = await Promise.all([tex('../../tex/wood_diff.jpg', true), tex('../../tex/wood_nor.jpg'), tex('../../tex/wood_rough.jpg')]);
const wood = new THREE.MeshPhysicalMaterial({ map: wd, normalMap: wn, roughnessMap: wr, roughness: 0.8, clearcoat: 0.35, clearcoatRoughness: 0.25 });
const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 2.3), wood); top.position.set(0.2, -0.06, -0.1); top.receiveShadow = true; top.castShadow = true; sc.add(top);
const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 2.1), new THREE.MeshPhysicalMaterial({ map: wd, roughness: 0.85, color: '#9a8070' })); bodyBox.position.set(0.2, -1.42, -0.15); sc.add(bodyBox);
const drawerLine = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: '#1a120c' })); drawerLine.position.set(0.2, -0.75, 0.91); sc.add(drawerLine);
// the lamp
const lampG = new THREE.Group(); lampG.position.set(1.25, 0, -0.75); sc.add(lampG);
const brass = new THREE.MeshPhysicalMaterial({ color: '#b08a4a', metalness: 1, roughness: 0.3 });
const mk = (geo, m, pos = [0, 0, 0], shadow = false) => { const o = new THREE.Mesh(geo, m); o.position.set(...pos); o.castShadow = shadow; o.receiveShadow = shadow; return o; };
lampG.add(mk(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 40), brass, [0, 0.04, 0], true));
lampG.add(mk(new THREE.CylinderGeometry(0.03, 0.03, 1.25, 16), brass, [0, 0.66, 0]));
const shadeMat = new THREE.MeshPhysicalMaterial({ color: '#efe2c8', roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color('#ffb46a'), emissiveIntensity: 0.6, transmission: 0.0 });
const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.62, 0.72, 48, 1, true), shadeMat); shade.position.set(0, 1.5, 0); lampG.add(shade);
const bulb = new THREE.PointLight('#ffb36a', 14, 9, 2); bulb.position.set(1.25, 1.3, -0.75); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024); bulb.shadow.radius = 8; bulb.shadow.bias = -0.002; sc.add(bulb);
const down = new THREE.SpotLight('#ffc48a', 30, 6, 0.9, 0.8, 2); down.position.set(1.25, 1.25, -0.75); down.target.position.set(0.3, 0, 0); down.castShadow = true; down.shadow.mapSize.set(1024, 1024); down.shadow.radius = 6; sc.add(down, down.target);
// a book, a glass
const book = new THREE.Group(); book.position.set(-0.95, 0.07, 0.35); book.rotation.y = 0.35; sc.add(book);
book.add(mk(new THREE.BoxGeometry(0.95, 0.14, 1.25), new THREE.MeshStandardMaterial({ color: '#7a1f1a', roughness: 0.7 }), [0, 0, 0], true));
book.add(mk(new THREE.BoxGeometry(0.9, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: '#efe6d2', roughness: 0.9 }), [0.03, 0, 0]));
// the bed, out of focus behind
const duvetG = new THREE.PlaneGeometry(6, 4, 120, 80); { const p = duvetG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.12 * Math.sin(x * 2.1 + y * 0.7) + 0.07 * Math.sin(x * 5.3 - y * 3.1) + 0.04 * Math.sin(y * 7 + x)); } duvetG.computeVertexNormals(); }
const duvet = new THREE.Mesh(duvetG, new THREE.MeshPhysicalMaterial({ color: '#cfc8bd', roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff') })); duvet.rotation.x = -Math.PI / 2 + 0.05; duvet.position.set(-4.6, 0.55, -1.2); duvet.receiveShadow = true; sc.add(duvet);
const pillow = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), duvet.material); pillow.scale.set(1.4, 0.32, 0.7); pillow.position.set(-3.4, 0.85, -2.4); sc.add(pillow);
// the wall and the rainy window
const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.95 })); wall.position.set(0, 2, -3.6); wall.receiveShadow = true; sc.add(wall);
const winU = { t: { value: 0 }, k: { value: 1 } };
const winMat = new THREE.ShaderMaterial({ uniforms: winU,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `uniform float t, k; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 city(vec2 uv){
      vec3 c = mix(vec3(0.02, 0.03, 0.07), vec3(0.06, 0.07, 0.14), uv.y);
      for (int i = 0; i < 26; i++){ float fi = float(i); vec2 p = vec2(h(vec2(fi, 1.0)), 0.1 + 0.55 * h(vec2(fi, 2.0)));
        vec3 col = mix(vec3(1.0, 0.65, 0.3), vec3(0.4, 0.6, 1.0), step(0.6, h(vec2(fi, 3.0)))); if (h(vec2(fi, 4.0)) > 0.85) col = vec3(1.0, 0.3, 0.4);
        float d = length((uv - p) * vec2(1.6, 1.0)); c += col * smoothstep(0.075, 0.05, d) * (0.25 + 0.2 * sin(t * 0.5 + fi)); }
      return c;
    }
    void main(){
      vec2 uv = vUv; vec2 off = vec2(0.0);
      // still drops on the glass
      vec2 g = uv * vec2(28.0, 18.0); vec2 id = floor(g), f = fract(g) - 0.5;
      float r = h(id); vec2 dp = vec2(h(id + 3.1) - 0.5, h(id + 7.7) - 0.5) * 0.6;
      float drop = smoothstep(0.16 * r, 0.1 * r, length(f - dp)) * step(0.55, r);
      off += (f - dp) * drop * 0.06;
      // running drops with trails
      vec2 g2 = uv * vec2(12.0, 1.0); float col = floor(g2.x); float sp = 0.06 + 0.08 * h(vec2(col, 9.0));
      float y = fract(uv.y + t * sp + h(vec2(col, 5.0)));
      float x = fract(g2.x) - 0.5 + 0.08 * sin(uv.y * 30.0 + col);
      float run = smoothstep(0.06, 0.02, abs(x)) * smoothstep(0.0, 0.03, y) * smoothstep(0.08, 0.03, y);
      float trail = smoothstep(0.03, 0.0, abs(x)) * smoothstep(0.08, 0.6, y) * (1.0 - y) * 0.35;
      off += vec2(x, 0.0) * (run * 0.25 + trail * 0.05);
      vec3 c = city(uv + off);
      c += vec3(0.08, 0.1, 0.16) * (drop * 0.4 + run * 0.8 + trail * 0.4);
      gl_FragColor = vec4(c * k, 1.0);
    }` });
const win = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4.0), winMat); win.position.set(-0.6, 2.5, -3.55); sc.add(win);
const frameMat = new THREE.MeshStandardMaterial({ color: '#d8d0c4', roughness: 0.6 });
[[0, 2.0, 5.5, 0.14], [0, -2.0, 5.5, 0.14], [-2.65, 0, 0.14, 4.1], [2.65, 0, 0.14, 4.1], [0, 0, 0.08, 4.0], [0, 0.4, 5.2, 0.08]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frameMat); m.position.set(-0.6 + x, 2.5 + y, -3.5); sc.add(m); });
const moon = new THREE.DirectionalLight('#7f9cff', 0.5); moon.position.set(-1, 4, -6); moon.target.position.set(0, 0, 0); sc.add(moon, moon.target);
const glowL = new THREE.PointLight('#6dffb0', 0, 5, 2); sc.add(glowL);
// dust floating in the lamp light. It lives in its own scene, drawn after the depth of field with its own blur, and only
// in the air above the dragon or in front of the nightstand, where nothing can stand in front of it. Seeded: every render matches.
const rnd = (() => { let q = 11; return () => (q = (q * 16807) % 2147483647) / 2147483647; })();
const DN = 520, dpos = new Float32Array(DN * 3), dseed = new Float32Array(DN);
for (let i = 0; i < DN; i++) {
  const front = rnd() < 0.35;
  dpos.set(front ? [lerp(-1.6, 2.4, rnd()), lerp(0.08, 0.95, rnd()), lerp(1.45, 3.3, rnd())] : [lerp(-1.6, 2.4, rnd()), lerp(1.0, 2.4, rnd()), lerp(-1.3, 3.2, rnd())], i * 3);
  dseed[i] = rnd();
}
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(dseed, 1));
const dustU = { t: { value: 0 }, col: { value: new THREE.Color('#ffd9a0') }, amt: { value: 0 }, src: { value: V(1.0, 1.0, -0.4) }, focus: { value: 3 }, blurK: { value: 60 } };
const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: dustU,
  vertexShader: /* glsl */ `attribute float seed; uniform float t, focus, blurK; uniform vec3 src; varying float vS, vA;
    void main(){ vec3 p = position;
      p.x += sin(t * 0.31 + seed * 40.0) * 0.07; p.y += sin(t * 0.23 + seed * 17.0) * 0.06 - t * (0.004 + seed * 0.01); p.z += cos(t * 0.27 + seed * 23.0) * 0.06;
      vS = seed; float d = distance(p, src); float lit = 1.0 / (1.0 + d * d * 0.22);
      vec4 mv = modelViewMatrix * vec4(p, 1.0); float z = -mv.z;
      float base = (1.2 + seed * 2.6) * clamp(5.0 / z, 0.6, 3.0), coc = min(24.0, blurK * abs(z - focus));   // the same blur law as the bokeh pass
      float size = base + coc; gl_PointSize = size; vA = lit * clamp(pow(base / size, 1.2) * 2.2, 0.12, 1.4) * step(0.15, z);
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: /* glsl */ `uniform vec3 col; uniform float amt, t; varying float vS, vA;
    void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.15, d) * (0.6 + 0.4 * sin(t * 1.3 + vS * 60.0)) * vA * amt; gl_FragColor = vec4(col * a, a); }` }));
dust.frustumCulled = false; const dustScene = new THREE.Scene(); dustScene.add(dust);

/* ---------- the dragon ---------- */
const dragon = createDragon(sc, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
const spine = Array.from({ length: SEG + 1 }, () => V()), dense = Array.from({ length: 500 }, () => V());
let LIFT = 0.32;
function coil(t) {
  // a slow loose coil that turns and breathes; the head lifts a little and looks about
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.5 + u * Math.PI * 4.2 + t * 0.09 + Math.sin(t * 0.5 + u * 5) * 0.04, r = 0.33 + u * 0.92; dense[i].set(Math.cos(a) * r - 0.1, 0, Math.sin(a) * r + 0.05); }
  let acc = 0, j = 0; spine[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { spine[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
  const nf = (i) => (i <= 2 ? 1 : i < 8 ? Math.pow(1 - (i - 2) / 6, 2) : 0);
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + nf(i) * (LIFT + 0.05 * Math.sin(t * 0.8));
  for (let i = 0; i < 8; i++) { const f = nf(i); spine[i].x += Math.sin(t * 0.6) * 0.08 * f; spine[i].z += 0.32 * f + (i <= 2 ? (2 - i) * 0.1 : 0); }
}

/* ---------- post: real depth of field, a soft bloom, grain ---------- */
const comp = new EffectComposer(R); comp.setPixelRatio(1); comp.setSize(W, H); comp.addPass(new RenderPass(sc, cam));
const dof = new BokehPass(sc, cam, { focus: 3, aperture: 0.004, maxblur: 0.014 }); comp.addPass(dof);
const dustPass = new RenderPass(dustScene, cam); dustPass.clear = false; comp.addPass(dustPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.7, 0.8); comp.addPass(bloom); comp.addPass(new OutputPass());
const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 }, fade: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float t, fade; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 d = vUv - 0.5; c *= smoothstep(1.05, 0.25, length(d * vec2(1.0, 0.72))); c += (h(vUv * 1100.0 + fract(t * 9.0)) - 0.5) * 0.045; c *= 1.0 - fade; gl_FragColor = vec4(c, 1.0); }' });
comp.addPass(lens);

/* ---------- the shots ---------- */
function shot(t) {
  LIFT = t < T_ORBIT ? lerp(0.24, 0.34, E.inOut(prog(t, T_ON, T_ORBIT))) : t < T_CUT ? lerp(0.34, 0.64, E.inOut(prog(t, T_ORBIT, T_ORBIT + 1.8))) : 0.42;
  coil(t);
  const h = spine[0];
  let cp, ca, fov, focus, ap;
  if (t < T_ORBIT) {   // one long push: the dark room, the lamp clicks on, and we creep up to its head
    const u = prog(t, 0, T_ORBIT), e = u * u * (3 - 2 * u) * 0.7 + u * 0.3;   // never quite still
    cp = V(lerp(2.6, 1.05, e), lerp(1.75, 0.74, e), lerp(6.0, 2.7, e));
    ca = V(-0.1, 0.78, -0.1).lerp(h.clone().add(V(0, 0.22, 0)), E.inOut(prog(u, 0.3, 1)));
    fov = lerp(40, 32, e); focus = cp.distanceTo(h); ap = lerp(0.0025, 0.0055, e);
  } else if (t < T_CUT) {   // low, circling, looking up at the head as it rises
    const u = E.inOut(prog(t, T_ORBIT, T_CUT)), a = lerp(-0.25, 1.3, u), r = lerp(2.5, 1.9, u);
    cp = V(Math.sin(a) * r - 0.05, lerp(0.3, 0.42, u), Math.cos(a) * r + 0.25); ca = h.clone().add(V(0, -0.04, 0)); fov = lerp(36, 31, u); focus = cp.distanceTo(h); ap = 0.005;
  } else {   // the Luminoso in the dark: the whole spiral from high up, slowly coming down to its head
    const u = prog(t, T_CUT, DUR), e = E.out(u) * 0.55 + u * 0.45;
    cp = V(lerp(2.9, 1.05, e), lerp(3.3, 1.15, e), lerp(6.0, 2.75, e));
    ca = V(-0.1, 0.62, 0).lerp(h.clone().add(V(0, 0.16, 0)), E.inOut(prog(u, 0.15, 0.85)));
    fov = lerp(37, 32, e); focus = cp.distanceTo(V(0, 0.25, 0.3)); ap = 0.003;
  }
  return { cp, ca, fov, focus, ap };
}

// the line, letter by letter
// «Lo que le / hace falta» types itself in the dark; «a tu cuarto» lands with the lamp
const titleEl = $('#title'), CH = [];
titleEl.querySelectorAll('.ln').forEach((ln, li) => {
  ln.innerHTML = ln.dataset.l.split(' ').map((w) => {
    const red = /^\*.+\*$/.test(w), word = w.replace(/\*/g, '');
    const cs = word.split('').map((c) => `<span class="c" data-l="${li}">${c}</span>`).join('');
    return `<span class="w">${red ? `<em>${cs}</em>` : cs}</span>`;
  }).join(' ');
});
let k12 = 0, k3 = 0;
titleEl.querySelectorAll('.c').forEach((c) => { const l3 = c.dataset.l === '2'; CH.push({ el: c, l3, at: l3 ? T_ON + 0.02 + (k3++) * 0.03 : 0.4 + (k12++) * 0.045 }); });

/* ---------- one frame ---------- */
let curCol = '';
function render(t) {
  const s = shot(t);
  const col = t < T_CUT ? 'metal' : 'luminoso'; if (col !== curCol) { dragon.setColor(col); curCol = col; }
  const on = t >= T_ON && t < T_CUT ? E.out(prog(t, T_ON, T_ON + 0.12)) * (0.92 + 0.08 * Math.exp(-(t - T_ON) * 6) * Math.sin((t - T_ON) * 80)) : 0;
  const glow = t >= T_CUT ? E.inOut(prog(t, T_GLOW - 0.3, T_GLOW + 1.1)) * (0.93 + 0.07 * Math.sin(t * 2.4)) : 0;
  bulb.intensity = 14 * on; down.intensity = 30 * on; shadeMat.emissiveIntensity = 0.6 * on + 0.02;
  moon.intensity = t < T_ON ? 0.65 : t < T_CUT ? 0.45 : 0.7; sc.environmentIntensity = on ? 0.12 : 0.03;
  glowL.intensity = glow * 1.7; glowL.position.copy(spine[12]).add(V(0, 0.75, 0)); wood.clearcoat = t >= T_CUT ? 0.04 : 0.35;
  dragon.update(spine, t, glow * 0.55);
  dustU.t.value = t; dustU.focus.value = s.focus; dustU.blurK.value = s.ap * 1800; dustU.amt.value = t < T_CUT ? on * 4.0 : glow * 2.0; dustU.col.value.set(t < T_CUT ? '#ffd9a0' : '#7dffb8');
  if (t < T_CUT) dustU.src.value.set(1.0, 1.0, -0.4); else dustU.src.value.copy(spine[10]).add(V(0, 0.3, 0));
  winU.t.value = t; winU.k.value = on ? 1 : 0.8;
  cam.position.copy(s.cp).add(V(Math.sin(t * 0.7) * 0.01, Math.sin(t * 0.9) * 0.008, 0)); cam.lookAt(s.ca); cam.fov = s.fov; cam.updateProjectionMatrix();
  dof.uniforms.focus.value = s.focus; dof.uniforms.aperture.value = s.ap; dof.uniforms.maxblur.value = 0.016;
  bloom.strength = 0.3 + glow * 0.3 + (t >= T_ORBIT && t < T_CUT ? 0.08 : 0);
  // black at the start, a blink of black at the cut
  const blink = t < T_CUT ? prog(t, T_CUT - 0.22, T_CUT) : 1 - prog(t, T_CUT, T_CUT + 0.4);
  lens.uniforms.t.value = t; lens.uniforms.fade.value = Math.max(1 - prog(t, 0.0, 0.9), blink);
  R.toneMappingExposure = on ? 1.0 : t >= T_CUT ? 0.92 : 1.15;
  comp.render();
  // the words
  CH.forEach((c, i) => {
    const a = t - c.at, p = E.out(clamp(a / (c.l3 ? 0.32 : 0.5))), out = E.in(prog(t, T_ORBIT - 0.55 + i * 0.008, T_ORBIT - 0.05));
    c.el.style.opacity = clamp(a * (c.l3 ? 8 : 4)) * (1 - out);
    c.el.style.transform = c.l3 ? `scale(${lerp(1.5, 1, p)})` : `translateY(${(1 - p) * 30 - out * 24}px)`;
    const bl = (1 - p) * (c.l3 ? 14 : 10) + out * 12; c.el.style.filter = bl > 0.05 ? `blur(${bl}px)` : '';
  });
  const gp = E.out(prog(t, T_GLOW + 0.4, T_GLOW + 1.2)) * (1 - prog(t, T_END - 0.3, T_END)); $('#glowline').style.opacity = gp; $('#glowline').style.filter = gp < 1 ? `blur(${(1 - gp) * 8}px)` : '';
  // letterbox bars while it circles: cinema
  const bars = E.inOut(prog(t, T_ORBIT - 0.2, T_ORBIT + 0.6)) * (1 - prog(t, T_CUT - 0.1, T_CUT)); document.querySelectorAll('#bars i').forEach((b) => { b.style.height = (bars * 150) + 'px'; });
  const cp = E.out(prog(t, T_END, T_END + 0.9)); $('#endc').style.opacity = cp; $('#endc').style.transform = `scale(${lerp(1.04, 1, cp)})`;
}

/* ---------- start ---------- */
for (const f of ['700 60px Syne', '800 60px Syne', '500 30px Mono', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aaá0·龍');
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
