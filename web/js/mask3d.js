// Rubra: the LED mask in 3D (three.js). One module for the live hero and for the stills.
// createMaskScene(canvas, opts) -> { ready, pause(), resume(), destroy(), renderOnce() }
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const RED = new THREE.Color(1.0, 0.018, 0.012);
const NIR = new THREE.Color(0.42, 0.01, 0.012);
const OFF = new THREE.Color(0.11, 0.1, 0.1);

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

/* ---------- the face mask: a parametric shell ---------- */
const FACE = {
  H: 0.5,
  halfW(v) {                       // half width of the oval at height v (-1 chin .. 1 forehead)
    const a = Math.abs(v);
    if (v >= 0) return 0.37 * Math.pow(Math.max(0, 1 - Math.pow(a, 3.2)), 0.42);
    return 0.37 * Math.pow(Math.max(0, 1 - a * a), 0.5) * (1 - 0.12 * a * a);
  },
  holes: [
    { cx: -0.128, cy: 0.06, rx: 0.074, ry: 0.036 },
    { cx: 0.128, cy: 0.06, rx: 0.074, ry: 0.036 },
    { cx: 0, cy: -0.268, rx: 0.092, ry: 0.03 },
  ],
  depth(x, y) {
    const W = 0.4;
    const u = clamp(x / W, -1, 1);
    let z = 0.25 * Math.sqrt(1 - u * u) - 0.25;           // wraps round the cheeks
    z -= 0.06 * Math.pow(y / 0.5, 2);                      // forehead and chin fall back
    const ridge = smooth(0.08, -0.02, y) * smooth(-0.2, -0.13, y) * (0.4 + 0.6 * smooth(0.06, -0.15, y));
    z += 0.085 * Math.exp(-(x * x) / (2 * 0.032 * 0.032)) * ridge;               // nose
    z += 0.018 * Math.exp(-(Math.pow(Math.abs(x) - 0.16, 2) / 0.006 + Math.pow(y + 0.08, 2) / 0.012)); // cheeks
    z -= 0.022 * Math.exp(-(Math.pow(Math.abs(x) - 0.128, 2) / 0.008 + Math.pow(y - 0.06, 2) / 0.004)); // eye sockets
    return z;
  },
  point(u, v, out = new THREE.Vector3()) {
    const y = v * this.H;
    const x = u * this.halfW(v);
    return out.set(x, y, this.depth(x, y));
  },
  inHole(x, y, pad = 0) {
    return this.holes.some((h) => Math.pow((x - h.cx) / (h.rx + pad), 2) + Math.pow((y - h.cy) / (h.ry + pad), 2) < 1);
  },
};

/* ---------- the neck and chest mask: a collar that opens into a bib ---------- */
const NECK = {
  H: 0.3,
  point(u, v, out = new THREE.Vector3()) {
    // v: 1 the collar's top edge .. -1 the lower edge on the chest; u: -1..1 left to right
    const t = (1 - v) / 2;
    const W = 0.2 + 0.29 * Math.pow(smooth(0.1, 1, t), 0.85);
    const x = u * W;
    const y = v * this.H - 0.09 * t * t * (1 - u * u) + 0.06 * Math.pow(1 - t, 2) * u * u;
    const k = 1 / (0.17 + 0.75 * smooth(0.08, 0.75, t));
    let z = (Math.cos(x * k) - 1) / k;
    z += 0.07 * t;
    return out.set(x, y, z);
  },
};

function buildSurface(shape, nu, nv, keep) {
  const pos = [], idx = [], uvs = [];
  const p = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const u = -1 + (2 * i) / nu, v = -1 + (2 * j) / nv;
      shape.point(u, v, p);
      pos.push(p.x, p.y, p.z); uvs.push((u + 1) / 2, (v + 1) / 2);
    }
  }
  const at = (i, j) => j * (nu + 1) + i;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      const cx = (pos[a * 3] + pos[c * 3]) / 2, cy = (pos[a * 3 + 1] + pos[c * 3 + 1]) / 2;
      if (keep && !keep(cx, cy)) continue;
      idx.push(a, b, d, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function normalAt(shape, u, v) {
  const e = 0.004;
  const a = shape.point(u - e, v), b = shape.point(u + e, v);
  const c = shape.point(u, v - e), d = shape.point(u, v + e);
  return new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, c)).normalize();
}

function rimTube(points, r, mat, closed = true) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(64, points.length * 2), r, 10, closed), mat);
}

function ledField(shape, cells, offset) {
  // cells: [{u, v, nir}] -> one InstancedMesh of small domed lenses facing out of the shell
  const geo = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(0.0085, 0.004, 0.0085);
  geo.rotateX(Math.PI / 2);                       // the dome faces +z
  const mat = new THREE.MeshBasicMaterial({ toneMapped: false });
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1), s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  cells.forEach((c, k) => {
    shape.point(c.u, c.v, p);
    const n = normalAt(shape, c.u, c.v);
    if (n.z < 0) n.negate();
    p.addScaledVector(n, offset);
    q.setFromUnitVectors(z, n);
    m.compose(p, q, s);
    mesh.setMatrixAt(k, m);
    mesh.setColorAt(k, OFF);
    c.pos = p.clone();
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function makeFace(mats) {
  const group = new THREE.Group();
  const keep = (x, y) => !FACE.inHole(x, y);
  const shell = new THREE.Mesh(buildSurface(FACE, 150, 170, keep), mats.shell);
  group.add(shell);

  // rims: the outer edge and every opening get a rounded lip, so the shell reads as moulded silicone
  const outline = [];
  for (let k = 0; k <= 120; k++) { const v = -1 + (2 * k) / 120; outline.push(FACE.point(0.999, v)); }
  for (let k = 120; k >= 0; k--) { const v = -1 + (2 * k) / 120; outline.push(FACE.point(-0.999, v)); }
  group.add(rimTube(outline.filter((_, i) => i % 2 === 0), 0.007, mats.shell));
  for (const h of FACE.holes) {
    const ring = [];
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * Math.PI * 2;
      const x = h.cx + h.rx * Math.cos(a), y = h.cy + h.ry * Math.sin(a);
      ring.push(new THREE.Vector3(x, y, FACE.depth(x, y)));
    }
    group.add(rimTube(ring, 0.0055, mats.shell));
  }

  // the light: lenses on a grid, kept off the openings and the edge; every third one near infrared
  const cells = [];
  const step = 0.031;
  let n = 0;
  for (let y = -0.45; y <= 0.47; y += step) {
    const row = Math.round((y + 0.45) / step);
    for (let x = -0.36; x <= 0.36; x += step) {
      const xx = x + (row % 2 ? step / 2 : 0);
      const v = y / FACE.H;
      const W = FACE.halfW(v);
      if (W < 0.03 || Math.abs(xx) > W - 0.028) continue;
      if (FACE.inHole(xx, y, 0.022)) continue;
      cells.push({ u: xx / W, v, nir: n++ % 3 === 2 });
    }
  }
  const leds = ledField(FACE, cells, 0.0035);
  group.add(leds);

  // the warm light that falls through the openings
  const glowTex = radialTexture();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.7), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.5, 0.03, 0.02), opacity: 0 }));
  glow.position.set(0, -0.06, -0.09);
  group.add(glow);

  // the strap round the head and the control on its right side
  const strapPts = (side) => [
    new THREE.Vector3(side * 0.355, 0.13, -0.11), new THREE.Vector3(side * 0.40, 0.14, -0.22),
    new THREE.Vector3(side * 0.37, 0.15, -0.38), new THREE.Vector3(side * 0.24, 0.16, -0.5), new THREE.Vector3(0, 0.165, -0.54),
  ];
  const strapCurve = new THREE.CatmullRomCurve3([...strapPts(1), ...strapPts(-1).reverse().slice(1)]);
  const strap = new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 120, 0.009, 8, false), mats.strap);
  strap.scale.set(1, 1, 1); strap.geometry.scale(1, 1, 1);
  group.add(strap);
  const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.06, 6, 16), mats.pod);
  pod.rotation.z = Math.PI / 2; pod.rotation.y = -0.9;
  pod.position.set(0.39, 0.0, -0.2);
  group.add(pod);
  const podRing = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0028, 8, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.15, 0.1), toneMapped: false }));
  podRing.position.set(0.405, 0.0, -0.176); podRing.rotation.y = 0.68;
  group.add(podRing);

  return { group, leds, cells, glow, extras: [podRing] };
}

function makeNeck(mats) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(buildSurface(NECK, 140, 90), mats.shell);
  group.add(shell);
  const edge = (v) => { const pts = []; for (let k = 0; k <= 80; k++) pts.push(NECK.point(-1 + (2 * k) / 80, v)); return pts; };
  group.add(rimTube(edge(1), 0.006, mats.shell, false));
  group.add(rimTube(edge(-1), 0.007, mats.shell, false));
  const sideL = [], sideR = [];
  for (let k = 0; k <= 40; k++) { const v = -1 + (2 * k) / 40; sideL.push(NECK.point(-1, v)); sideR.push(NECK.point(1, v)); }
  group.add(rimTube(sideL, 0.0065, mats.shell, false));
  group.add(rimTube(sideR, 0.0065, mats.shell, false));
  const cells = [];
  let n = 0;
  for (let j = 0; j <= 15; j++) {
    const v = 0.9 - (1.8 * j) / 15;
    const cols = Math.round(9 + 17 * ((1 - v) / 2));
    for (let i = 0; i < cols; i++) {
      const u = -0.88 + (1.76 * (i + (j % 2 ? 0.5 : 0))) / cols;
      if (Math.abs(u) > 0.9) continue;
      cells.push({ u, v, nir: n++ % 3 === 2 });
    }
  }
  const leds = ledField(NECK, cells, 0.0035);
  group.add(leds);
  // the clasp at the back of the neck
  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.014), mats.pod);
  clasp.position.copy(NECK.point(1, 0.82)); clasp.position.x += 0.006; clasp.position.z -= 0.01; clasp.rotation.y = 1.25;
  group.add(clasp);
  const a = NECK.point(-1, 0.86), b = NECK.point(1, 0.86);
  const back = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x - 0.03, a.y + 0.01, a.z - 0.12), new THREE.Vector3(0, a.y + 0.02, a.z - 0.3), new THREE.Vector3(b.x + 0.03, b.y + 0.01, b.z - 0.12), b]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(back, 80, 0.008, 8, false), mats.strap));
  return { group, leds, cells, glow: null, extras: [] };
}

function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.45, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const VIEWS = {
  hero:   { ry: -0.42, rx: 0.06, fill: 0.86, dx: 0, dy: 0 },
  front:  { ry: 0.0,  rx: 0.02, fill: 0.84, dx: 0, dy: 0 },
  side:   { ry: -1.32, rx: 0.04, fill: 0.9, dx: 0, dy: 0 },
  three:  { ry: 0.55, rx: 0.12, fill: 0.84, dx: 0, dy: 0 },
  detail: { ry: -0.3, rx: 0.16, fill: 2.3, dx: 0.1, dy: 0.1 },
  pod:    { ry: 2.55, rx: 0.1, fill: 1.45, dx: 0.0, dy: 0.04 },
  edge:   { ry: -1.18, rx: 0.0, fill: 1.55, dx: 0.0, dy: -0.04 },
};

export function createMaskScene(canvas, opts = {}) {
  const o = Object.assign({ product: 'face', view: 'hero', live: true, entrance: true, bg: '#0a0a0a', bloom: 1, pointer: true, dpr: Math.min(window.devicePixelRatio || 1, 1.75), preserve: false }, opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: o.preserve, powerPreference: 'high-performance' });
  renderer.setPixelRatio(o.dpr);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;

  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 20);

  const mats = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0xd6cfc9, roughness: 0.55, metalness: 0, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffe9e4), clearcoat: 0.0, side: THREE.DoubleSide }),
    strap: new THREE.MeshStandardMaterial({ color: 0x1d1c1c, roughness: 0.95 }),
    pod: new THREE.MeshPhysicalMaterial({ color: 0x232222, roughness: 0.45, clearcoat: 0.15 }),
  };

  const key = new THREE.DirectionalLight(0xfff3ea, 1.25); key.position.set(-1.2, 1.4, 1.6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9d2, 1.2); rim.position.set(1.6, 0.6, -1.4); scene.add(rim);
  const fill = new THREE.HemisphereLight(0xffffff, 0x1a0b0b, 0.35); scene.add(fill);
  const redLight = new THREE.PointLight(0xff2a1a, 0, 1.6, 1.6); redLight.position.set(0, -0.05, 0.42); scene.add(redLight);

  let built;
  if (o.product === 'both') {
    const f = makeFace(mats), n = makeNeck(mats);
    f.group.position.set(-0.27, 0.14, 0); f.group.rotation.y = 0.32;
    n.group.position.set(0.3, -0.12, 0.02); n.group.rotation.y = -0.32; n.group.scale.setScalar(0.86);
    const g = new THREE.Group(); g.add(f.group, n.group);
    built = { group: g, multi: [f, n], cells: [], leds: null, glow: f.glow, extras: f.extras };
  } else built = o.product === 'neck' ? makeNeck(mats) : makeFace(mats);
  const pivot = new THREE.Group(); pivot.add(built.group); scene.add(pivot);
  // centre the product on its own box
  const box = new THREE.Box3().setFromObject(built.group);
  const centre = box.getCenter(new THREE.Vector3());
  built.group.position.sub(centre);
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y) / 2;

  if (o.halo !== false) {
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(radius * 3.4, radius * 3.4), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(0.3, 0.012, 0.01), opacity: 0.45 }));
    halo.position.set(0, 0, -0.45);
    scene.add(halo);
  }
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42 * o.bloom, 0.2, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const view = Object.assign({}, VIEWS[o.view] || VIEWS.hero, o.viewOverride || {});
  function frame() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const fitH = radius / Math.tan(vFov / 2);
    const fitW = radius / (Math.tan(vFov / 2) * camera.aspect);
    const dist = Math.max(fitH, fitW) / view.fill + 0.15;
    const visW = 2 * dist * Math.tan(vFov / 2) * camera.aspect;
    const ax = (typeof o.anchorX === 'function' ? o.anchorX(w, h) : (o.anchorX ?? 0.5));
    const cx = view.dx - (ax - 0.5) * visW;
    camera.position.set(cx, view.dy, dist);
    camera.lookAt(cx, view.dy, 0);
    camera.updateProjectionMatrix();
  }
  frame();

  // the order the lenses light: a wave from the middle out
  const fields = built.multi ? built.multi : [built];
  fields.forEach((f) => {
    const maxD = Math.max(...f.cells.map((c) => Math.hypot(c.pos.x, c.pos.y)));
    f.cells.forEach((c) => { c.d = Math.hypot(c.pos.x, c.pos.y) / maxD; });
  });
  const tmp = new THREE.Color();
  function setLight(t, time) {
    fields.forEach((f) => {
      f.cells.forEach((c, k) => {
        const on = smooth(c.d * 0.75, c.d * 0.75 + 0.25, t);
        const pulse = 1 + 0.06 * Math.sin(time * 1.3 + c.d * 6);
        const target = c.nir ? NIR : RED;
        tmp.copy(OFF).lerp(target, on).multiplyScalar(1 + on * (c.nir ? 1.6 : 2.4) * pulse);
        f.leds.setColorAt(k, tmp);
      });
      f.leds.instanceColor.needsUpdate = true;
    });
    if (built.glow) built.glow.material.opacity = 0.85 * smooth(0.3, 1, t) * Math.pow(Math.max(0, Math.cos(pivot.rotation.y)), 4);
    redLight.intensity = 0.0;
    built.extras.forEach((e) => { e.material.color.setRGB(0.3 + 0.9 * t, 0.02 + 0.02 * t, 0.015 + 0.01 * t); });
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    pointer.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  };
  if (o.live && o.pointer && !reduce) window.addEventListener('pointermove', onMove, { passive: true });

  const doEntrance = o.live && o.entrance && !reduce;
  let start = performance.now(), raf = 0, paused = false, last = 0, pausedAt = 0;
  function pose(time) {
    const e = doEntrance ? time : 99;
    const k = easeOut(e / 2.2);
    const sway = o.live && !reduce ? Math.sin(Math.max(0, time - 2.2) * (Math.PI * 2 / 16)) * 0.16 * smooth(2.2, 4, time) : 0;
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    pivot.rotation.y = view.ry + (1 - k) * -1.25 + sway + pointer.x * 0.12;
    pivot.rotation.x = view.rx + (1 - k) * 0.18 + pointer.y * 0.06;
    pivot.position.y = (1 - k) * -0.08 + (o.live && !reduce ? Math.sin(time * 0.8) * 0.004 : 0);
    const s = 0.9 + 0.1 * k; pivot.scale.setScalar(s);
    const lit = 0.25 + 0.75 * easeOut(e / 1.4);
    key.intensity = 1.25 * lit; rim.intensity = 1.0 * lit; scene.environmentIntensity = 0.32 * lit;
    setLight(doEntrance ? smooth(0.8, 2.8, time) : 1, time);
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (paused) return;
    const time = (now - start) / 1000;
    if (now - last < 15) return;
    last = now;
    pose(time);
    composer.render();
  }
  const ro = new ResizeObserver(() => { frame(); if (!o.live || reduce || paused) { pose(paused ? (pausedAt - start) / 1000 : 99); composer.render(); } });
  ro.observe(canvas);

  function renderOnce() { pose(99); composer.render(); }
  if (o.live && !reduce) raf = requestAnimationFrame(tick); else renderOnce();

  return {
    ready: Promise.resolve(),
    renderOnce,
    get leds() { return fields.reduce((a, f) => a + f.cells.length, 0); },
    pause() { if (!paused) { paused = true; pausedAt = performance.now(); } },
    resume() { if (paused) { start += performance.now() - pausedAt; paused = false; } },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointermove', onMove); renderer.dispose(); },
  };
}
