// V6 · ASMR at night. A bedroom in the rain: a walnut nightstand, a warm lamp, a book, a window streaked with rain over
// blurred city lights, the bed out of focus. The dragon coils slowly; its joints click; the lamp goes off and it glows.
// A whisper (a real one, made from the voice's spectral envelope on breath noise) and handwritten captions.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createDragon, SEG, SPACING } from '../../../dragon/js/dragon.js';

const TI = await (await fetch('tiempos.json')).json();
const LN = Object.fromEntries(TI.lines.map((l) => [l.id, l]));
const DUR = TI.dur, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
const wt = (id, w) => (LN[id].words.find((x) => x[0].toLowerCase().startsWith(w)) || LN[id].words[0])[1];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = (s) => document.querySelector(s);
const S2 = LN.a2.t0 - 0.4, S3 = LN.a3.t0 - 0.4, OFF = wt('a4', 'luz') + 0.05, GLOW = wt('a5', 'brillando') - 0.3, S6 = LN.a6.t0 - 0.3, CARD = LN.a7.t0 - 0.1;

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

/* ---------- the dragon ---------- */
const dragon = createDragon(sc, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
const spine = Array.from({ length: SEG + 1 }, () => V()), dense = Array.from({ length: 500 }, () => V());
function coil(t) {
  // a slow loose coil that turns and breathes; the head lifts a little and looks about
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.5 + u * Math.PI * 4.2 + t * 0.09 + Math.sin(t * 0.5 + u * 5) * 0.04, r = 0.33 + u * 0.92; dense[i].set(Math.cos(a) * r - 0.1, 0, Math.sin(a) * r + 0.05); }
  let acc = 0, j = 0; spine[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { spine[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
  const nf = (i) => (i <= 2 ? 1 : i < 8 ? Math.pow(1 - (i - 2) / 6, 2) : 0);
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + nf(i) * (0.32 + 0.05 * Math.sin(t * 0.8));
  for (let i = 0; i < 8; i++) { const f = nf(i); spine[i].x += Math.sin(t * 0.6) * 0.08 * f; spine[i].z += 0.32 * f + (i <= 2 ? (2 - i) * 0.1 : 0); }
}

/* ---------- post: real depth of field, a soft bloom, grain ---------- */
const comp = new EffectComposer(R); comp.setPixelRatio(1); comp.setSize(W, H); comp.addPass(new RenderPass(sc, cam));
const dof = new BokehPass(sc, cam, { focus: 3, aperture: 0.004, maxblur: 0.014 }); comp.addPass(dof);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.7, 0.8); comp.addPass(bloom); comp.addPass(new OutputPass());
const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 }, fade: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float t, fade; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 d = vUv - 0.5; c *= smoothstep(1.05, 0.25, length(d * vec2(1.0, 0.72))); c += (h(vUv * 1100.0 + fract(t * 9.0)) - 0.5) * 0.045; c *= 1.0 - fade; gl_FragColor = vec4(c, 1.0); }' });
comp.addPass(lens);

/* ---------- the shots ---------- */
function shot(t) {
  coil(t);
  const h = spine[0], dir = h.clone().sub(spine[2]).setY(0).normalize(), side = V(-dir.z, 0, dir.x);
  let cp, ca, fov = 38, focus;
  if (t < S2) { const m = spine[14]; const u = t / S2; cp = V(m.x + 0.75 - u * 0.2, 0.42, m.z + 0.85); ca = V(m.x - 0.05, 0.12, m.z); fov = 34; focus = cp.distanceTo(ca); }
  else if (t < S3) { const u = (t - S2) / (S3 - S2); const k = Math.floor(lerp(22, 8, u)); const m = spine[k]; cp = V(m.x + 0.9, 0.5, m.z + 0.9); ca = V(m.x, 0.15, m.z); fov = 34; focus = cp.distanceTo(ca); }
  else if (t < OFF + 1.2) { const u = prog(t, S3, OFF + 1.2); cp = V(lerp(2.4, 1.9, u), lerp(1.7, 1.5, u), lerp(5.4, 4.6, u)); ca = V(-0.1, 0.55, -0.4); fov = 40; focus = cp.distanceTo(V(0, 0.3, 0)); }
  else if (t < S6) { const u = prog(t, OFF + 1.2, S6); cp = V(lerp(1.9, 1.3, u), lerp(1.5, 1.05, u), lerp(4.6, 3.4, u)); ca = V(0, 0.35, 0); fov = 38; focus = cp.distanceTo(V(0, 0.3, 0)); }
  else { const u = prog(t, S6, DUR); cp = h.clone().addScaledVector(dir, 2.9 - u * 0.4).addScaledVector(side, 0.8).add(V(0, 0.3, 0)); ca = h.clone().add(V(0, -0.15, 0)); fov = 36; focus = cp.distanceTo(h); }
  return { cp, ca, fov, focus };
}

/* ---------- captions in handwriting, a whole phrase that breathes in and out ---------- */
const capEl = $('#cap'); let shown = null;
function captions(t) {
  const l = TI.lines.find((x) => t >= x.t0 - 0.15 && t < x.t1 + 0.6);
  if (!l) { capEl.style.opacity = 0; return; }
  if (shown !== l) { capEl.textContent = l.texto; shown = l; }
  const o = prog(t, l.t0 - 0.15, l.t0 + 0.35) * (1 - prog(t, l.t1 + 0.25, l.t1 + 0.6));
  capEl.style.opacity = o; capEl.style.filter = o < 1 ? `blur(${(1 - o) * 8}px)` : 'none'; capEl.style.transform = `translateY(${(1 - o) * 12}px)`;
}
$('#card').innerHTML = `<div style="height:680px;border-radius:30px;overflow:hidden"><img src="../../img/producto-muneca.jpg" style="width:100%;height:100%;object-fit:cover"></div>
  <div style="display:flex;align-items:center;gap:18px;margin-top:30px"><div style="width:70px;height:70px;border-radius:18px;background:#e5322d;display:grid;place-items:center;font:900 42px Han">龍</div><div><div style="font:700 56px Inter;letter-spacing:-0.04em;line-height:1">LÓNG</div><div style="font:600 46px Caveat;color:rgba(255,255,255,.75)">para tus noches</div></div></div>
  <div style="display:flex;align-items:baseline;gap:20px;margin-top:20px"><div style="font:700 96px Inter;letter-spacing:-0.05em">21,95 €</div><div style="font:600 44px Caveat;color:#a8ffd0">2 por 32,95 €</div></div>
  <div style="font:700 64px Caveat;color:#fff;margin-top:14px">link en mi perfil ↓</div>`;

/* ---------- one frame ---------- */
function render(t) {
  const s = shot(t);
  const lampOn = t < OFF ? 1 : 0, glow = E.inOut(prog(t, GLOW, GLOW + 1.2));
  bulb.intensity = 14 * lampOn; down.intensity = 30 * lampOn; shadeMat.emissiveIntensity = 0.6 * lampOn + 0.02;
  moon.intensity = lampOn ? 0.5 : 0.7; sc.environmentIntensity = lampOn ? 0.12 : 0.03;
  glowL.intensity = glow * 2.2; glowL.position.copy(spine[12]).add(V(0, 0.45, 0));
  dragon.update(spine, t, glow * 0.55);
  winU.t.value = t; winU.k.value = lampOn ? 1 : 0.8;
  cam.position.copy(s.cp).add(V(Math.sin(t * 0.7) * 0.01, Math.sin(t * 0.9) * 0.008, 0)); cam.lookAt(s.ca); cam.fov = s.fov; cam.updateProjectionMatrix();
  dof.uniforms.focus.value = s.focus; dof.uniforms.aperture.value = t < S3 ? 0.006 : 0.0035; dof.uniforms.maxblur.value = 0.014;
  bloom.strength = 0.3 + glow * 0.35;
  lens.uniforms.t.value = t; lens.uniforms.fade.value = 1 - prog(t, 0.2, 1.8);
  R.toneMappingExposure = lampOn ? 1.0 : 1.15;
  comp.render();
  const cp = E.out(prog(t, CARD, CARD + 1.0)); $('#card').style.opacity = cp; $('#card').style.transform = `translateY(${(1 - cp) * 40}px) scale(${lerp(0.97, 1, cp)})`;
  captions(t);
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['600 60px Caveat', '700 60px Inter', '900 40px Han']) await document.fonts.load(f, 'Aá龍€↓');
const sfx = [];
for (let k = 0.6; k < S3 + 1; k += 0.55 + 0.25 * Math.abs(Math.sin(k * 7))) sfx.push({ t: k, tipo: 'segclick', g: 0.55, pan: Math.sin(k * 3) * 0.5 });
for (let k = S3 + 1; k < DUR - 1; k += 1.6 + Math.abs(Math.sin(k * 5))) sfx.push({ t: k, tipo: 'segclick', g: 0.35, pan: Math.sin(k * 3) * 0.4 });
sfx.push({ t: OFF, tipo: 'lightswitch', g: 0.45 }, { t: GLOW + 0.2, tipo: 'shimmer', g: 0.18 }, { t: CARD, tipo: 'swish', g: 0.15 });
window.__cues = { dur: DUR, musica: { archivo: '443.mp3', desde: 8.0, gain: 0.22, duck: 0.25, fadein: 3.0, fadeout: 2.5 }, voz: { gain: 1.15 }, sfx, ambiente: [{ tipo: 'lluvia', desde: 0, hasta: DUR, g: 0.9 }, { tipo: 'sala', desde: 0, hasta: DUR, g: 0.6 }] };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
