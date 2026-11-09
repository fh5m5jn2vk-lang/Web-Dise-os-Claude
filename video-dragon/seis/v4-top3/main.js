// V4 · three reasons, as a luxury product film. Infinite black, a glossy floor that mirrors the dragon, a light that
// sweeps across it, dust in the beam; thin outlined numbers, trailer voice, gold for the price, and a black-and-gold
// card at the end.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
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
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), back: (t) => { const c = 1.4, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const wt = (id, w) => (LN[id].words.find((x) => x[0].toLowerCase().startsWith(w)) || LN[id].words[0])[1];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const $ = (s) => document.querySelector(s);
const T3 = LN.n3.t0 - 0.15, T2 = LN.n2.t0 - 0.15, T1 = LN.n1.t0 - 0.15, GLOW = wt('n2', 'brilla') - 0.05, PRICE = wt('n1', 'veint') - 0.05, CARD = LN.c.t0 - 0.2, RZ = LN.r.t0 - 0.1;

/* ---------- the studio ---------- */
const R = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const sc = new THREE.Scene(); sc.background = new THREE.Color('#000'); sc.fog = new THREE.Fog('#000', 6, 16);
sc.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture; sc.environmentIntensity = 0.2;
const cam = new THREE.PerspectiveCamera(36, W / H, 0.03, 60);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhysicalMaterial({ color: '#030304', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.84 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; sc.add(floor);
const sweep = new THREE.SpotLight('#fff3e0', 120, 16, 0.42, 0.7, 2); sweep.castShadow = true; sweep.shadow.mapSize.set(2048, 2048); sweep.shadow.radius = 6; sc.add(sweep, sweep.target);
const rimA = new THREE.SpotLight('#9fb8ff', 40, 12, 0.6, 0.8, 2); rimA.position.set(-3, 3, -4); sc.add(rimA, rimA.target);
const rimB = new THREE.SpotLight('#ffd7a0', 30, 12, 0.6, 0.8, 2); rimB.position.set(3.5, 2.5, -3.5); sc.add(rimB, rimB.target);
const glowL = new THREE.PointLight('#6dffb0', 0, 6, 2); sc.add(glowL);
// the visible beam of the sweeping light
const beamMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { k: { value: 0.0 } },
  vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform float k; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 2.0); float a = smoothstep(-6.0, 0.0, vY) * 0.12 * f * k; gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, a); }' });
const beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 12, 48, 1, true), beamMat); beam.geometry.translate(0, -6, 0); sc.add(beam);
// dust in the light
const DN = 900, dpos = new Float32Array(DN * 3), dseed = new Float32Array(DN);
for (let i = 0; i < DN; i++) { dpos.set([(Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 6], i * 3); dseed[i] = Math.random(); }
const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(dseed, 1));
const dustMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 }, col: { value: new THREE.Color('#ffe9c0') }, amt: { value: 0.6 } },
  vertexShader: 'attribute float seed; uniform float t; varying float vS; void main(){ vec3 p = position; p.y = mod(p.y + t * (0.05 + seed * 0.08), 4.0); p.x += sin(t * 0.5 + seed * 30.0) * 0.2; vS = seed; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (2.0 + seed * 5.0) * (5.0 / -mv.z); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 col; uniform float amt; uniform float t; varying float vS; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * (0.5 + 0.5 * sin(t * 2.0 + vS * 50.0)); gl_FragColor = vec4(col * a * amt, a * amt); }' });
sc.add(new THREE.Points(dg, dustMat));
const dragon = createDragon(sc, { hq: true }), mirror = createDragon(sc, { hq: true });
mirror.group.scale.y = -1;
dragon.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
const spine = Array.from({ length: SEG + 1 }, () => V()), dense = Array.from({ length: 500 }, () => V());
function coil(t, lift, rot = 0) {
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.6 + u * Math.PI * 4.4 + rot, r = 0.33 + u * 0.95; dense[i].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  let acc = 0, j = 0; spine[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { spine[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
  finish(t, lift);
}
function along(P, s) { spine[0].copy(P(s)); let prev = spine[0].clone(), total = 0, k = 1, ss = s, n = 0; while (k <= SEG && n++ < 30000) { ss -= 0.004; const q = P(ss); const d = prev.distanceTo(q); while (k <= SEG && total + d >= k * SPACING) { spine[k].lerpVectors(prev, q, (k * SPACING - total) / d); k++; } total += d; prev = q; } for (; k <= SEG; k++) spine[k].copy(spine[k - 1]); }
function finish(t, lift) {
  // the neck rises, the head itself stays level and looks ahead
  const nf = (i) => (i <= 2 ? 1 : i < 8 ? Math.pow(1 - (i - 2) / 6, 2) : 0);
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + nf(i) * lift * 1.1;
  for (let i = 0; i < 8; i++) { const f = nf(i); spine[i].x += Math.sin(t * 1.6) * 0.06 * f; spine[i].z += 0.35 * f + (i <= 2 ? (2 - i) * 0.12 : 0); }
}
const comp = new EffectComposer(R); comp.setPixelRatio(1); comp.setSize(W, H); comp.addPass(new RenderPass(sc, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.4, 0.6, 0.85); comp.addPass(bloom); comp.addPass(new OutputPass());
const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, t: { value: 0 }, flash: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float t, flash; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec2 d = vUv - 0.5; float k = 0.0018 * length(d) * 2.0; vec3 c = vec3(texture2D(tDiffuse, vUv + d * k).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * k).b);
      c *= smoothstep(1.05, 0.3, length(d * vec2(1.0, 0.75))); c += (h(vUv * 900.0 + fract(t * 8.0)) - 0.5) * 0.04; c = mix(c, vec3(1.0), flash); gl_FragColor = vec4(c, 1.0); }` });
comp.addPass(lens);

/* ---------- the shots ---------- */
let curCol = '';
function shot(t) {
  let glow = 0, sweepX = 0, beamK = 1, cp, ca, fov = 36, colr = 'arcoiris', dustCol = '#ffe9c0', dustAmt = 0.6;
  if (t < RZ) { // the hook: darkness, then the light finds its face
    coil(t, 0.42 + 0.03 * Math.sin(t * 2)); const h = spine[0];
    const k = E.inOut(prog(t, 0.2, 2.6)); sweepX = lerp(-5, 2.5, k); beamK = prog(t, 0.2, 0.8);
    const dir = h.clone().sub(spine[2]).setY(0).normalize(), side = V(-dir.z, 0, dir.x);
    cp = h.clone().addScaledVector(dir, 2.8 - t * 0.2).addScaledVector(side, 0.8).add(V(0, 0.35, 0)); ca = h.clone().add(V(0, -0.25, 0)); fov = 34;
  } else if (t < T3) { // three reasons: a wide, high look at it
    coil(t, 0.55, (t - RZ) * 0.4); sweepX = 0; cp = V(0.5, 4.6, 5.2); ca = V(0, 0.2, 0); fov = 36;
  } else if (t < T2) { // 3: it moves for real, a low tracking shot along the body
    const P = (s) => V(-3.2 + s * 1.1, 0, 0.35 * Math.sin(s * 2.4)); along(P, t - T3 + 0.6); finish(t, 0.42);
    const m = spine[9]; cp = V(m.x + 0.9, 0.55, 2.0); ca = V(m.x - 0.2, 0.2, m.z); fov = 34; sweepX = m.x + Math.sin(t) * 1.5;
  } else if (t < T1) { // 2: it glows in the dark
    coil(t, 0.58, (t - T2) * 0.25); glow = E.out(prog(t, GLOW, GLOW + 0.4)); sweepX = lerp(0, 4, prog(t, GLOW - 0.4, GLOW)); beamK = 1 - prog(t, GLOW - 0.3, GLOW);
    const a = 0.6 + (t - T2) * 0.3; cp = V(Math.sin(a) * 3.6, 1.7, Math.cos(a) * 3.6); ca = V(0, 0.35, 0); dustCol = '#6dffb0'; dustAmt = 0.4 + glow * 0.8;
  } else { // 1: it costs less than a dinner; the hero shot, then the card
    coil(t, lerp(0.35, 0.6, E.out(prog(t, T1, T1 + 1.2))), (t - T1) * 0.12); const h = spine[0];
    const dir = h.clone().sub(spine[2]).setY(0).normalize(), side = V(-dir.z, 0, dir.x);
    cp = h.clone().addScaledVector(dir, 3.6 - prog(t, T1, CARD) * 0.6).addScaledVector(side, 0.7).add(V(0, -0.1, 0)); ca = h.clone().add(V(0, -0.5, 0)); fov = 38;
    sweepX = lerp(-3, 3, (Math.sin((t - T1) * 0.8) + 1) / 2); dustCol = '#f3d38a'; dustAmt = 0.9;
  }
  return { glow, sweepX, beamK, cp, ca, fov, colr, dustCol, dustAmt };
}

/* ---------- words on screen ---------- */
const NUMS = [[T3, '3', 'SE MUEVE DE VERDAD'], [T2, '2', 'BRILLA EN LA OSCURIDAD'], [T1, '1', 'CUESTA MENOS QUE UNA CENA']];
const KEYS = new Set(['mueve', 'vivo.', 'brilla', 'oscuridad.', 'cena:', 'veintiún', 'noventa', 'cinco.', 'regalo', 'quieren.', 'perfil.']);
const subEl = $('#sub'); let shown = null;
function subs(t) {
  const l = TI.lines.find((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.35);
  if (!l || t > CARD + 0.3) { subEl.style.opacity = 0; return; }
  if (shown !== l) { subEl.innerHTML = l.words.map((w) => (KEYS.has(w[0].toLowerCase()) ? `<b>${w[0]}</b>` : `<span>${w[0]}</span>`)).join(' '); shown = l; }
  subEl.style.opacity = 1 - prog(t, l.t1 + 0.15, l.t1 + 0.35);
  [...subEl.children].forEach((s, i) => { const p = prog(t, l.words[i][1] - 0.03, l.words[i][1] + 0.18); s.style.opacity = 0.25 + 0.75 * p; });
}
$('#card').innerHTML = `<div style="position:absolute;left:40px;right:40px;top:40px;height:660px;overflow:hidden"><img src="../../img/producto-muneca.jpg" style="width:100%;height:100%;object-fit:cover;filter:contrast(1.05)"></div>
  <div style="position:absolute;left:0;right:0;top:740px;text-align:center"><div style="font:900 54px Han;color:#e5322d">龍</div><div style="font:300 64px Inter;letter-spacing:.42em;text-indent:.42em;margin-top:6px">LÓNG</div>
  <div style="font:300 30px Inter;letter-spacing:.2em;color:rgba(255,255,255,.7);margin-top:14px">DRAGÓN ARTICULADO · 88 CM</div>
  <div style="font:700 150px/1 Cormorant;margin-top:30px;color:transparent;background:linear-gradient(100deg,#8a6a2c,#f3dc9c 45%,#fff6d8 50%,#f3dc9c 55%,#8a6a2c);-webkit-background-clip:text;background-clip:text">21,95 €</div>
  <div style="font:300 34px Inter;letter-spacing:.12em;color:#f3dc9c;margin-top:8px">2 POR 32,95 €</div>
  <div id="ccta" style="margin:34px auto 0;width:560px;height:100px;border:2px solid #f3dc9c;display:grid;place-items:center;font:400 34px Inter;letter-spacing:.3em;text-indent:.3em;color:#f3dc9c">LINK EN MI PERFIL</div></div>`;

/* ---------- one frame ---------- */
function render(t) {
  const s = shot(t);
  if (s.colr !== curCol) { dragon.setColor(s.colr); mirror.setColor(s.colr); curCol = s.colr; }
  dragon.update(spine, t, s.glow * 0.45); mirror.update(spine, t, s.glow * 0.3);
  const dark = s.glow;
  sweep.position.set(s.sweepX, 6.5, 2.5); sweep.target.position.set(s.sweepX * 0.6, 0, 0); sweep.intensity = 120 * (1 - dark) * (t < 0.2 ? 0 : 1);
  rimA.intensity = 40 * (1 - dark * 0.95) * prog(t, 0.6, 1.4); rimB.intensity = 30 * (1 - dark * 0.95) * prog(t, 0.9, 1.6); sc.environmentIntensity = 0.2 * (1 - dark);
  glowL.intensity = dark * 2.2; glowL.position.copy(spine[12]).add(V(0, 0.5, 0));
  beam.position.copy(sweep.position); beam.lookAt(sweep.target.position); beam.rotateX(-Math.PI / 2); beamMat.uniforms.k.value = s.beamK * (1 - dark);
  dustMat.uniforms.t.value = t; dustMat.uniforms.col.value.set(s.dustCol); dustMat.uniforms.amt.value = s.dustAmt;
  cam.position.copy(s.cp).add(V(Math.sin(t * 0.9) * 0.01, Math.sin(t * 1.1) * 0.01, 0)); cam.lookAt(s.ca); cam.fov = s.fov; cam.updateProjectionMatrix();
  bloom.strength = 0.35 + dark * 0.2;
  // a white flash on each number
  const fl = NUMS.reduce((m, [n0]) => Math.max(m, t > n0 && t < n0 + 0.25 ? (1 - (t - n0) / 0.25) * 0.5 : 0), 0);
  lens.uniforms.t.value = t; lens.uniforms.flash.value = fl;
  comp.render();
  // the hook's title
  const tp = prog(t, 0.5, 1.4); $('#title').style.opacity = tp * (1 - prog(t, LN.h.t1 - 0.1, LN.h.t1 + 0.3)); $('#title').style.letterSpacing = lerp(0.6, 0.28, E.out(tp)) + 'em';
  // the numbers: a quick count on "tres razones", then each one with its label
  let numTxt = '', numO = 0, numS = 1, lab = '', labO = 0;
  if (t > LN.r.t0 && t < T3) { const k = Math.min(2, Math.floor((t - LN.r.t0) / 0.32)); numTxt = String(k + 1); numO = 0.9 * (1 - prog(t, T3 - 0.3, T3)); numS = 1.1 - ((t - LN.r.t0) % 0.32); }
  NUMS.forEach(([n0, n, l], i) => { const n1 = i < 2 ? NUMS[i + 1][0] : CARD; if (t > n0 && t < n1) { numTxt = n; const p = E.out(prog(t, n0, n0 + 0.6)); numO = p * (1 - prog(t, n1 - 0.35, n1)) * (i === 2 && t > PRICE ? 1 - prog(t, PRICE, PRICE + 0.3) : 1); numS = lerp(1.25, 1, p); lab = l; labO = prog(t, n0 + 0.25, n0 + 0.7) * (1 - prog(t, n1 - 0.3, n1)) * (i === 2 && t > PRICE ? 1 - prog(t, PRICE, PRICE + 0.3) : 1); } });
  $('#num').textContent = numTxt; $('#num').style.opacity = numO; $('#num').style.transform = `scale(${numS})`;
  $('#label').textContent = lab; $('#label').style.opacity = labO; $('#label').style.letterSpacing = lerp(0.6, 0.32, labO) + 'em';
  const pp = prog(t, PRICE, PRICE + 0.5); $('#price').style.opacity = pp * (1 - prog(t, CARD, CARD + 0.3)); $('#price').style.transform = `scale(${lerp(0.9, 1, E.out(pp))})`; $('#price').style.backgroundPosition = `${lerp(100, -50, prog(t, PRICE, PRICE + 2))}% 0`;
  // the card
  const cp = E.out(prog(t, CARD, CARD + 0.8)); $('#card').style.opacity = cp; $('#card').style.transform = `translateY(${(1 - cp) * 60}px)`;
  $('#ccta').style.background = t > CARD + 1.4 ? `rgba(243,220,156,${0.12 + 0.1 * Math.sin(t * 5)})` : 'transparent';
  // cinema bars
  const bh = 70 * (1 - prog(t, CARD, CARD + 0.6)); document.querySelectorAll('#bars i').forEach((b) => (b.style.height = bh + 'px'));
  subs(t);
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['200 100px Inter', '300 40px Inter', '700 100px Cormorant', '900 40px Han']) await document.fonts.load(f, 'Aá龍€');
const sfx = [{ t: 0.2, tipo: 'lightswitch', g: 0.35 }, { t: 0.25, tipo: 'whoosh', g: 0.2 }, { t: LN.r.t0, tipo: 'thump', g: 0.35 }, { t: LN.r.t0 + 0.32, tipo: 'thump', g: 0.35 }, { t: LN.r.t0 + 0.64, tipo: 'thump', g: 0.35 },
  ...NUMS.map(([n0]) => ({ t: n0, tipo: 'impact', g: 0.45 })), ...NUMS.map(([n0]) => ({ t: n0 - 0.4, tipo: 'whoosh', g: 0.2 })),
  { t: wt('n3', 'gira') , tipo: 'segclick', g: 0.5 }, { t: wt('n3', 'gira') + 0.3, tipo: 'segclick', g: 0.4 }, { t: GLOW, tipo: 'shimmer', g: 0.4 }, { t: GLOW - 0.3, tipo: 'lightswitch', g: 0.3 },
  { t: PRICE - 1.2, tipo: 'riser', g: 0.3 }, { t: PRICE, tipo: 'boom', g: 0.45 }, { t: PRICE + 0.05, tipo: 'shimmer', g: 0.3 }, { t: CARD, tipo: 'sweep', g: 0.3 }, { t: CARD + 0.8, tipo: 'bell', g: 0.12 }];
window.__cues = { dur: DUR, musica: { archivo: '706.mp3', desde: 0.39 + 0.4289 * 16, gain: 0.5, duck: 0.45, fadein: 1.2, fadeout: 2.0, silencios: [[GLOW - 0.3, GLOW + 0.2, 0.3]] }, voz: { gain: 1 }, sfx };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
