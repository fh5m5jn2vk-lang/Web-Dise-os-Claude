// Uprain: the anti-gravity humidifier in 3D (three.js). One module for the live hero, the live demo and the stills.
// createUprainScene(canvas, opts) -> { renderOnce(), setLight(id), setFinish(id), setStrobe(on), setRate(v), setYaw(r), pause(), resume(), destroy() }
//
// How the drops move: water really falls from the nozzle at a steady rate. A light under the nozzle flashes a little
// faster than the drops fall, so each flash finds every drop slightly higher than the flash before, and the eye reads
// the column as water rising. `rate` is the apparent speed (drop spacings a second, negative = rising); with the
// strobe off the drops fall at their real speed, drawn as streaks.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

export const LIGHTS = {
  hielo: '#a6e1ff',
  ambar: '#ffb259',
  cobalto: '#3d63ff',
  menta: '#6dffc8',
};
export const FINISHES = {
  grafito: { body: '#1a1b1e', bodyRough: 0.5, frame: '#2b2d31', frameRough: 0.28 },
  arena: { body: '#d9d3c7', bodyRough: 0.62, frame: '#c9bda6', frameRough: 0.3 },
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

/* ---------- measurements (metres) ---------- */
const BASE_R = 0.106, BASE_H = 0.055;
const WATER_Y = 0.0468;                 // the basin's water line
const LOOP_W = 0.124, LOOP_TOP = 0.334, LOOP_BOT = 0.03, LOOP_R = 0.034, TUBE = 0.0078;
const NOZZLE_Y = 0.306;                 // where a drop leaves the nozzle
const DROPS = 10;
const CENTRE = new THREE.Vector3(0, 0.168, 0);

/* ---------- views: camera around the product, or a close-up on a point ---------- */
const VIEWS = {
  hero: { az: 0.58, el: 0.13, fill: 0.84, dy: -0.03 },
  front: { az: 0.0, el: 0.06, fill: 0.82 },
  three: { az: 0.72, el: 0.2, fill: 0.8 },
  side: { az: 1.18, el: 0.1, fill: 0.8 },
  column: { az: 0.32, el: 0.05, target: [0, 0.185, 0], dist: 0.66 },
  nozzle: { az: 0.5, el: 0.06, target: [0, 0.3, 0], dist: 0.2 },
  basin: { az: 0.35, el: 0.5, target: [0, 0.06, 0], dist: 0.26 },
  base: { az: 0.18, el: 0.16, target: [0, 0.035, 0.04], dist: 0.3 },
};

function radialTexture(inner = 0, soft = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35 * soft, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function roundedLoop() {
  // the frame: a tall rounded rectangle standing in the x-y plane, its foot sunk into the base
  const pts = [], hw = LOOP_W / 2, r = LOOP_R, seg = 14;
  const corner = (cx, cy, a0) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0)); } };
  corner(hw - r, LOOP_TOP - r, 0);
  corner(-hw + r, LOOP_TOP - r, Math.PI / 2);
  corner(-hw + r, LOOP_BOT + r, Math.PI);
  corner(hw - r, LOOP_BOT + r, Math.PI * 1.5);
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
}

function buildProduct(mats) {
  const g = new THREE.Group();

  // base: a turned puck with a soft shoulder and a shallow basin on top
  const prof = [
    [0, 0], [0.094, 0], [0.101, 0.002], [0.105, 0.007], [BASE_R, 0.014], [BASE_R, 0.041], [0.104, 0.048],
    [0.099, 0.053], [0.09, BASE_H], [0.071, BASE_H], [0.066, 0.0535], [0.061, 0.049], [0.05, 0.0462], [0.03, 0.0448], [0, 0.0444],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 128), mats.body);
  g.add(base);

  // a thin bright seam where the shoulder meets the top: it catches the light
  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.0805, 0.0011, 8, 160), mats.frame);
  seam.rotation.x = Math.PI / 2; seam.position.y = BASE_H + 0.0002; g.add(seam);

  // water in the basin
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.0605, 96), mats.water);
  water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; g.add(water);

  // the frame and its foot
  const loop = new THREE.Mesh(new THREE.TubeGeometry(roundedLoop(), 260, TUBE, 20, true), mats.frame);
  g.add(loop);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.006, 32), mats.frame);
  [-1, 1].forEach((s) => { const f = foot.clone(); f.position.set(s * (LOOP_W / 2), BASE_H + 0.002, 0); g.add(f); });

  // light strips on the inner face of both uprights
  const stripGeo = new THREE.CapsuleGeometry(0.0016, LOOP_TOP - LOOP_BOT - 2 * LOOP_R - 0.03, 4, 12);
  const strips = [-1, 1].map((s) => {
    const m = new THREE.Mesh(stripGeo, mats.glow);
    m.position.set(s * (LOOP_W / 2 - TUBE * 0.82), (LOOP_TOP + BASE_H) / 2 + 0.006, 0);
    g.add(m); return m;
  });

  // the nozzle: a short brushed cone hanging from the top bar, ringed by the strobe
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.0082, 0.0026, 0.024, 40), mats.frame);
  nozzle.position.y = LOOP_TOP - TUBE - 0.011; g.add(nozzle);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.0019, 12, 64), mats.glow);
  ring.rotation.x = Math.PI / 2; ring.position.y = LOOP_TOP - TUBE - 0.004; g.add(ring);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 16, 12), mats.glow);
  tip.position.y = NOZZLE_Y + 0.002; g.add(tip);

  // the touch button on the front of the base: a ring and a dot
  const btnRing = new THREE.Mesh(new THREE.TorusGeometry(0.0065, 0.0007, 8, 48), mats.glowSoft);
  btnRing.position.set(0, 0.027, BASE_R + 0.0004); g.add(btnRing);
  const btnDot = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 24), mats.glowSoft);
  btnDot.position.set(0, 0.027, BASE_R + 0.0006); g.add(btnDot);

  // the drops: one instanced teardrop, scaled per frame
  const dropGeo = new THREE.SphereGeometry(1, 28, 20);
  const p = dropGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {           // pull the top into a soft point
    const y = p.getY(i); const k = y > 0 ? 1 - 0.38 * y * y : 1;
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); p.setY(i, y * (y > 0 ? 1.45 : 1));
  }
  dropGeo.computeVertexNormals();
  const drops = new THREE.InstancedMesh(dropGeo, mats.drop, DROPS);
  drops.frustumCulled = false; g.add(drops);
  const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mats.dropHalo, DROPS);
  halo.frustumCulled = false; g.add(halo);

  return { group: g, drops, halo, strips, ring, tip, water };
}

export function createUprainScene(canvas, opts = {}) {
  const o = Object.assign({
    view: 'hero', bg: '#0b0c0e', finish: 'grafito', light: 'hielo', live: false, entrance: false, drag: false,
    rate: -0.55, strobe: true, dpr: 1, anchorX: 0.5, fill: null, preserve: false, bloom: 1, mist: true, floor: true, yaw: 0, manual: false, msaa: 0, dof: null,
  }, opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const live = o.live && !reduce;
  const bg = new THREE.Color(o.bg);
  const dark = bg.getHSL({ h: 0, s: 0, l: 0 }).l < 0.4;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: o.preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(o.dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = dark ? 1.0 : 0.86;
  renderer.setClearColor(bg, 1);

  const scene = new THREE.Scene();
  scene.background = bg;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = dark ? 0.32 : 0.5;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 20);

  const lightColor = new THREE.Color(LIGHTS[o.light] || o.light);
  const fin = FINISHES[o.finish] || FINISHES.grafito;
  const mats = {
    body: new THREE.MeshPhysicalMaterial({ color: fin.body, roughness: fin.bodyRough, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.55, sheen: 0.4, sheenRoughness: 0.8 }),
    frame: new THREE.MeshStandardMaterial({ color: fin.frame, roughness: fin.frameRough, metalness: 0.9 }),
    water: new THREE.MeshPhysicalMaterial({ color: '#0c1416', roughness: 0.03, metalness: 0, transmission: 0, clearcoat: 1, clearcoatRoughness: 0.02, emissive: lightColor.clone(), emissiveIntensity: dark ? 0.14 : 0.08 }),
    glow: new THREE.MeshBasicMaterial({ color: lightColor.clone().multiplyScalar(1.8), toneMapped: false }),
    glowSoft: new THREE.MeshBasicMaterial({ color: lightColor.clone().multiplyScalar(1.2), toneMapped: false }),
    drop: new THREE.MeshPhysicalMaterial({ color: dark ? '#ffffff' : '#cfdde4', roughness: 0.02, metalness: 0, transparent: true, opacity: 0.9, clearcoat: 1, emissive: lightColor.clone(), emissiveIntensity: dark ? 0.55 : 0.4, ior: 1.33, specularIntensity: 1 }),
    dropHalo: new THREE.MeshBasicMaterial({ map: radialTexture(0, 0.7), color: lightColor.clone(), transparent: true, opacity: dark ? 0.3 : 0.18, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  };
  const P = buildProduct(mats);
  const pivot = new THREE.Group(); pivot.add(P.group); scene.add(pivot);

  // light: a soft key from the upper left, a cool rim behind, and the strobe's own colour from the nozzle
  const key = new THREE.DirectionalLight('#ffffff', dark ? 1.15 : 1.25); key.position.set(-0.6, 0.9, 0.8); scene.add(key);
  const rim = new THREE.DirectionalLight('#dfe8ff', dark ? 1.4 : 0.8); rim.position.set(0.5, 0.6, -0.9); scene.add(rim);
  const strobeLight = new THREE.PointLight(lightColor.clone(), dark ? 0.22 : 0.08, 0.6, 1.6); strobeLight.position.set(0, NOZZLE_Y - 0.02, 0); P.group.add(strobeLight);
  const basinLight = new THREE.PointLight(lightColor.clone(), dark ? 0.06 : 0.02, 0.3, 2); basinLight.position.set(0, WATER_Y + 0.03, 0.02); P.group.add(basinLight);

  // floor: a contact shadow and the pool of coloured light the device throws on the table
  let pool = null;
  if (o.floor) {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: radialTexture(0.42, 1), color: '#000000', transparent: true, opacity: dark ? 0.85 : 0.32, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.0004; scene.add(shadow);
    pool = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: radialTexture(0, 0.6), color: lightColor.clone(), transparent: true, opacity: dark ? 0.2 : 0.08, depthWrite: false, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.0008; scene.add(pool);
  }

  // mist: soft sprites rising from the basin's rim and fading out above the frame
  const MIST = o.mist ? 90 : 0;
  let mist = null; const mistState = [];
  if (MIST) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(MIST * 3), 3));
    geo.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(MIST), 1));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(MIST), 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: radialTexture(0, 0.5) }, tint: { value: new THREE.Color('#ffffff').lerp(lightColor, 0.35) }, scale: { value: 600 }, gain: { value: o.mistGain ?? (dark ? 0.16 : 0.32) } },
      vertexShader: 'attribute float alpha; attribute float size; varying float vA; uniform float scale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 tint; uniform float gain; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(tint, t.a * vA * gain); }',
    });
    mist = new THREE.Points(geo, mat); mist.frustumCulled = false; P.group.add(mist);
    for (let i = 0; i < MIST; i++) mistState.push({ age: Math.random(), life: 4 + Math.random() * 4, a: Math.random() * Math.PI * 2, r: 0.03 + Math.random() * 0.03, sway: Math.random() * 6 });
  }

  // msaa: multisampled composer buffers (the renderer's own antialias never reaches them)
  const composer = o.msaa ? new EffectComposer(renderer, new THREE.WebGLRenderTarget(canvas.width, canvas.height, { type: THREE.HalfFloatType, samples: o.msaa })) : new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // dof: depth of field for the films, refocused per frame by the caller ({ focus, aperture, maxblur })
  let bokeh = null;
  if (o.dof) { bokeh = new BokehPass(scene, camera, Object.assign({ focus: 0.6, aperture: 0.04, maxblur: 0.01 }, o.dof)); composer.addPass(bokeh); }
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), (dark ? 0.55 : 0.3) * o.bloom, 0.5, dark ? 0.78 : 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- framing ---------- */
  const view = Object.assign({}, VIEWS[o.view] || VIEWS.hero);
  if (o.fill) view.fill = o.fill;
  const radius = 0.19;
  let freeCam = false;
  function frame() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h;
    if (freeCam) { camera.updateProjectionMatrix(); if (mist) mist.material.uniforms.scale.value = h * 0.9; return; }
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const target = view.target ? new THREE.Vector3(...view.target) : CENTRE.clone();
    if (view.dy) target.y += view.dy;
    let dist = view.dist;
    if (!dist) {
      const fitH = radius / Math.tan(vFov / 2);
      const fitW = (radius * 0.72) / (Math.tan(vFov / 2) * camera.aspect);
      dist = Math.max(fitH, fitW) / view.fill;
    }
    const dir = new THREE.Vector3(Math.sin(view.az) * Math.cos(view.el), Math.sin(view.el), Math.cos(view.az) * Math.cos(view.el));
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    // slide the product to anchorX of the canvas
    const ax = typeof o.anchorX === 'function' ? o.anchorX(w, h) : o.anchorX;
    const visW = 2 * dist * Math.tan(vFov / 2) * camera.aspect;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const shift = right.multiplyScalar(-(ax - 0.5) * visW);
    camera.position.add(shift); camera.lookAt(target.clone().add(shift));
    camera.updateProjectionMatrix();
    if (mist) mist.material.uniforms.scale.value = h * 0.9;
  }
  frame();

  /* ---------- state ---------- */
  let rate = o.rate, rateTarget = o.rate, strobe = o.strobe, strobeMix = strobe ? 1 : 0;
  let phase = 0.37;
  let yaw = o.yaw, yawVel = 0, dragging = false, lastX = 0, idle = 0;
  const auto = live && o.drag;
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const camQ = new THREE.Quaternion();

  function placeDrops(dt) {
    // apparent motion under the strobe, real fall without it
    rate += (rateTarget - rate) * Math.min(1, dt * 3);
    strobeMix += ((strobe ? 1 : 0) - strobeMix) * Math.min(1, dt * 5);
    const realFall = 9.5;                                  // drop spacings a second, what the eye would see unlit
    const v = rate * strobeMix + realFall * (1 - strobeMix);
    phase = (phase + v * dt) % 1; if (phase < 0) phase += 1;
    const span = NOZZLE_Y - (WATER_Y + 0.004);
    const streak = 1 + 3.5 * (1 - strobeMix);
    camQ.copy(camera.quaternion);
    const invPivot = new THREE.Quaternion().copy(pivot.quaternion).invert();
    for (let k = 0; k < DROPS; k++) {
      const s = ((k + phase) / DROPS) % 1;                  // 0 at the nozzle, 1 at the water
      const y = NOZZLE_Y - s * span;
      const grow = smooth(0, 0.08, s) * (1 - smooth(0.93, 1, s) * 0.6);   // a drop forms at the nozzle, flattens as it lands
      const r = 0.0052 * (0.35 + 0.65 * grow);
      tmpP.set(0, y, 0); tmpQ.identity(); tmpS.set(r, r * streak, r);
      tmpM.compose(tmpP, tmpQ, tmpS); P.drops.setMatrixAt(k, tmpM);
      // a camera-facing glow behind each drop
      const hs = r * (4 + 1.5 * strobeMix);
      tmpQ.copy(invPivot).multiply(camQ);
      tmpS.set(hs, hs * (1 + 2.2 * (1 - strobeMix)), hs);
      tmpM.compose(tmpP, tmpQ, tmpS); P.halo.setMatrixAt(k, tmpM);
    }
    P.drops.instanceMatrix.needsUpdate = true; P.halo.instanceMatrix.needsUpdate = true;
    mats.drop.opacity = (dark ? 0.9 : 0.78) - 0.5 * (1 - strobeMix);
    mats.dropHalo.opacity = (dark ? 0.3 : 0.18) * (0.35 + 0.65 * strobeMix);
  }

  function placeMist(dt) {
    if (!mist) return;
    const pos = mist.geometry.attributes.position, al = mist.geometry.attributes.alpha, sz = mist.geometry.attributes.size;
    mistState.forEach((m, i) => {
      m.age += dt / m.life; if (m.age > 1) { m.age = 0; m.a = Math.random() * Math.PI * 2; m.r = 0.03 + Math.random() * 0.03; }
      const t = m.age;
      const rr = m.r + t * 0.05;
      pos.setXYZ(i, Math.cos(m.a + t * 0.6) * rr + Math.sin(t * 4 + m.sway) * 0.006, BASE_H + 0.002 + t * 0.19, Math.sin(m.a + t * 0.6) * rr);
      al.setX(i, smooth(0, 0.25, t) * (1 - smooth(0.35, 1, t)) * 0.5);
      sz.setX(i, 0.07 + t * 0.16);
    });
    pos.needsUpdate = true; al.needsUpdate = true; sz.needsUpdate = true;
  }

  let entranceT = live && o.entrance ? 0 : 99;
  let litK = 1;
  function pose(dt, time) {
    if (entranceT < 99) entranceT += dt;
    const k = easeOut(entranceT / 2.4);
    if (auto && !dragging) {
      idle += dt;
      yawVel *= Math.pow(0.04, dt);
      yaw += yawVel * dt + (idle > 1.2 ? 0.12 * dt * smooth(1.2, 3, idle) : 0);
    }
    pivot.rotation.y = yaw + (1 - k) * -1.1;
    pivot.position.y = (1 - k) * -0.05 + (live ? Math.sin(time * 0.9) * 0.0015 : 0);
    const lit = smooth(0.4, 2.2, entranceT) * litK;
    mats.glow.color.copy(lightColor).multiplyScalar(0.2 + 1.6 * lit);
    strobeLight.intensity = (dark ? 0.22 : 0.08) * lit;
    if (pool) pool.material.opacity = (dark ? 0.2 : 0.08) * lit;
    key.intensity = (dark ? 1.15 : 1.25) * (0.35 + 0.65 * k);
    placeDrops(entranceT < 1.2 ? 0 : dt);
    placeMist(dt);
  }

  /* ---------- drag to turn ---------- */
  const onDown = (e) => { dragging = true; lastX = e.clientX; idle = 0; canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('is-dragging'); };
  const onMoveDrag = (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; const d = dx * 0.008; yaw += d; yawVel = d * 60; };
  const onUp = () => { dragging = false; canvas.classList.remove('is-dragging'); };
  if (auto) {
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMoveDrag);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  }

  let raf = 0, paused = false, last = performance.now(), time = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (paused) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (dt < 0.012) return;
    time += dt;
    pose(dt, time);
    composer.render();
  }
  function renderOnce() {
    entranceT = 99;
    for (let i = 0; i < 40; i++) placeMist(0.12);           // settle the mist into a natural spread
    pose(0, 0); placeDrops(0);
    composer.render();
  }
  const ro = new ResizeObserver(() => { frame(); if (!live || paused) renderOnce(); });
  ro.observe(canvas);
  if (live) raf = requestAnimationFrame(tick); else renderOnce();

  function setLight(id) {
    lightColor.set(LIGHTS[id] || id);
    mats.glowSoft.color.copy(lightColor).multiplyScalar(1.2);
    mats.water.emissive.copy(lightColor); mats.drop.emissive.copy(lightColor); mats.dropHalo.color.copy(lightColor);
    strobeLight.color.copy(lightColor); basinLight.color.copy(lightColor);
    if (pool) pool.material.color.copy(lightColor);
    if (mist) mist.material.uniforms.tint.value.set('#ffffff').lerp(lightColor, 0.35);
    if ((!live || paused) && !o.manual) renderOnce();
  }
  function setFinish(id) {
    const f = FINISHES[id]; if (!f) return;
    mats.body.color.set(f.body); mats.body.roughness = f.bodyRough; mats.frame.color.set(f.frame); mats.frame.roughness = f.frameRough;
    if ((!live || paused) && !o.manual) renderOnce();
  }

  // true when a shader failed to compile or the context is gone: the caller then shows the poster instead
  const failed = () => renderer.getContext().isContextLost() || (renderer.info.programs || []).some((pr) => pr.diagnostics && pr.diagnostics.runnable === false);

  return {
    renderOnce, setLight, setFinish, failed,
    setStrobe(on) { strobe = !!on; if (!live && !o.manual) { strobeMix = strobe ? 1 : 0; renderOnce(); } },
    setRate(v) { rateTarget = v; if (!live && !o.manual) { rate = v; } },
    setYaw(r) { yaw = r; if (!live && !o.manual) renderOnce(); },
    // manual mode (the ad videos): place the camera, set the light's strength, advance time by dt and draw one frame
    setCamera(c) { Object.assign(view, { target: null, dist: null, dy: 0 }, c); if (c.ax != null) o.anchorX = c.ax; frame(); },
    setLit(k) { litK = k; },
    setExposure(e) { renderer.toneMappingExposure = e; },
    step(dt) { time += dt; pose(dt, time); if (o.beforeRender) o.beforeRender(time); composer.render(); },
    // a free camera for the films: position, target and field of view in metres and degrees
    lookFrom(pos, target, fov = 28, roll = 0) { freeCam = true; camera.fov = fov; camera.position.set(...pos); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...target); camera.updateProjectionMatrix(); },
    get three() { return { scene, camera, renderer, pivot, product: P, mats, bloom, mist, pool, bokeh, composer, lightColor, strobeLight, key, rim }; },
    pause() { paused = true; },
    resume() { paused = false; },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); },
  };
}
