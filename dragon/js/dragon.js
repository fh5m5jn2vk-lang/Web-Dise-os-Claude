// The 3D-printed articulated dragon, modelled on the product: a chain of separate printed segments, each a cluster
// of pointed leaf scales with a dorsal spike and a belly plate, in two-tone "silk" filament that shifts colour along
// the body; a chunky head with branching horns and stiff wavy whiskers; four small legs with claws; a finned tail.
// createDragon(scene, { hq }) -> { update(spine, time, glow), setColor(id), group }
// hq (the films): smooth, finer scales, a sculpted head with an open mouth, and fine print layer lines on every surface
import * as THREE from 'three';

export const SEG = 40, SPACING = 0.16;            // spine points and their spacing: a body 6.4 long
const RINGS = 140, PIECES = 46;

// silk filament colours along the body, head first (as in the product photographs)
export const PALETTE = {
  arcoiris: { stops: ['#ffd23f', '#9be15d', '#38c6d9', '#5b7cff', '#b45cff', '#ff6fa8'], horn: '#ffe9a8', whisker: '#c9f3ff' },
  galaxia: { stops: ['#7b45f0', '#a37cff', '#d8c25a', '#7aa63a', '#3e5ee0'], horn: '#9f7bff', whisker: '#e7d9a0' },
  plata: { stops: ['#e9ecf1', '#b7bdc6', '#f4f6f9', '#a3aab4'], horn: '#f4f6f9', whisker: '#ffffff' },
  fuego: { stops: ['#ffb12e', '#ff6a1f', '#e8222f', '#ff8a2e', '#ffcf4a'], horn: '#ffd27a', whisker: '#ffe08a' },
  // the eight colours on sale
  metal: { stops: ['#7b3fe4', '#4f6ee8', '#c9b54a', '#5aa64a', '#3b8f9e', '#7b3fe4'], horn: '#a98bff', whisker: '#e8d48a' },
  orojo: { stops: ['#ffcc3a', '#ff9a24', '#f0522c', '#d81e2a', '#e8322f'], horn: '#ffd27a', whisker: '#ffb347' },
  azulmorado: { stops: ['#8a3ff0', '#6a3ff0', '#4a4ff0', '#2f3fd0', '#3a2fd8'], horn: '#9a6bff', whisker: '#a7b8ff' },
  azulverde: { stops: ['#3aa84a', '#2d9a6a', '#2f7fc8', '#2f6fd0', '#3a9f55'], horn: '#4fb36a', whisker: '#4f8fe0' },
  oro: { stops: ['#ffd84a', '#f5c021', '#ffe27a', '#e8b010'], horn: '#ffe9a0', whisker: '#ffe08a' },
  pastel: { stops: ['#fff3a6', '#ffd1e8', '#c9f0ff', '#e6d6ff', '#fff3a6'], horn: '#bff0ff', whisker: '#bff0ff' },
  luminoso: { stops: ['#eef3e6', '#f4f7ee', '#e6eedd'], horn: '#f7f9f2', whisker: '#ffffff' },
};

const radiusAt = (u) => {
  const neck = 0.12 + 0.05 * Math.min(1, u / 0.09);
  const r = u < 0.09 ? neck : 0.17 + 0.02 * Math.sin(Math.min(1, (u - 0.09) / 0.3) * Math.PI / 2);
  return r * (1 - 0.86 * Math.pow(Math.max(0, (u - 0.3) / 0.7), 1.35)) + 0.012;
};

// merge simple geometries (with a vertex tint each) into one non-indexed geometry
function merge(parts) {
  const pos = [], nor = [], col = [];
  parts.forEach(({ g, m, tint }) => {
    let ng = g.clone(); ng.applyMatrix4(m); if (ng.index) { ng.computeVertexNormals(); ng = ng.toNonIndexed(); } else ng.computeVertexNormals();
    const p = ng.attributes.position.array, n = ng.attributes.normal.array;
    for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); col.push(tint, tint, tint); }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}
const M = (p = [0, 0, 0], q = new THREE.Quaternion(), s = [1, 1, 1]) => new THREE.Matrix4().compose(new THREE.Vector3(...p), q, new THREE.Vector3(...s));
const qFromTo = (a, b) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...a).normalize(), new THREE.Vector3(...b).normalize());

// one printed segment, in unit size: +z points to the head, +y is the back
function segmentGeometry(hq = false) {
  const parts = [];
  const leaf = hq ? new THREE.ConeGeometry(0.38, 0.72, 10, 2) : new THREE.ConeGeometry(0.38, 0.72, 4); leaf.translate(0, 0.36, 0);          // a pointed scale, grown along +y
  parts.push({ g: new THREE.CylinderGeometry(0.5, 0.5, 0.9, hq ? 24 : 10).rotateX(Math.PI / 2), m: M(), tint: 0.62 });   // the core, mostly hidden
  [0.22, -0.18].forEach((z, row) => {
    const n = 9;
    for (let k = 0; k < n; k++) {
      const a = -2.45 + (k / (n - 1)) * 4.9 + (row ? 0.35 : 0);    // round the top and the sides, not the belly
      const out = [Math.sin(a), Math.cos(a), 0];
      const dir = [out[0] * 0.45, out[1] * 0.45, -1.05];             // tilted back toward the tail
      const q = qFromTo([0, 1, 0], dir).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a));
      parts.push({ g: leaf, m: M([out[0] * 0.52, out[1] * 0.52, z], q, [1, 1, 0.38]), tint: 1.0 + 0.12 * row });
    }
  });
  // the dorsal spike and the belly plate
  const spike = new THREE.ConeGeometry(0.2, 1.25, hq ? 8 : 4); spike.translate(0, 0.62, 0);
  parts.push({ g: spike, m: M([0, 0.55, 0.05], qFromTo([0, 1, 0], [0, 1, -0.75])), tint: 1.15 });
  parts.push({ g: new THREE.BoxGeometry(0.62, 0.12, 0.8), m: M([0, -0.5, 0]), tint: 1.25 });
  return merge(parts);
}

// print layer lines: a fine bump across the local height of every printed part, faded out where it would shimmer
function printLines(mat) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLayer;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLayer = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLayer;').replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      {
        float k = 200.0; float ph = vLayer * k;
        float fw = fwidth(ph); float fade = 1.0 - smoothstep(0.6, 1.6, fw);
        float h = sin(ph) * fade;
        vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
        float dhx = dFdx(h), dhy = dFdy(h);
        vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
        vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
        normal = normalize(abs(det) * normal - grad * 0.0006);
      }`);
  };
  return mat;
}

// a dragon's head, sculpted from a sphere: skull, brows, a long snout and a nose, +z forward
function headGeometry(lower = false) {
  const g = new THREE.SphereGeometry(1, 96, 64), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const z = v.z * 0.27 + 0.1;                                    // -0.17 back .. 0.37 snout
    const f = THREE.MathUtils.clamp((z + 0.17) / 0.54, 0, 1);       // 0 back .. 1 tip
    let w = 0.14 - 0.06 * f * f, hgt = 0.14 - 0.06 * f;
    let x = v.x * w, y = v.y * hgt;
    if (!lower) {
      y += Math.exp(-Math.pow((z - 0.06) / 0.06, 2)) * Math.exp(-Math.pow((Math.abs(x) - 0.07) / 0.04, 2)) * 0.05 * Math.max(0, v.y);   // brow ridges
      y += Math.exp(-Math.pow((z - 0.33) / 0.04, 2)) * 0.025 * Math.max(0, v.y);                  // the nose bump
      x *= 1 + 0.12 * Math.exp(-Math.pow((z - 0.33) / 0.05, 2));                                  // flared nostrils
      if (v.y < 0) y *= 0.35;                                                                    // a flat palate
      y += 0.02;
    } else {
      w = 0.12 - 0.05 * f; x = v.x * w; y = v.y * 0.05; if (v.y > 0) y *= 0.3; y -= 0.035;
    }
    p.setXYZ(i, x, y, z - (lower ? 0.03 : 0));
  }
  g.computeVertexNormals();
  return g;
}

export function createDragon(scene, opts = {}) {
  const hq = !!opts.hq;
  const group = new THREE.Group(); scene.add(group);
  const silk = new THREE.MeshPhysicalMaterial({ vertexColors: true, flatShading: !hq, metalness: 0.55, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25, iridescence: 0.35, iridescenceIOR: 1.6, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), emissive: new THREE.Color('#000') });

  /* the body: one instanced printed segment, many times */
  const segGeo = segmentGeometry(hq); if (hq) printLines(silk);
  const body = new THREE.InstancedMesh(segGeo, silk, PIECES); body.frustumCulled = false; group.add(body);
  body.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PIECES * 3), 3);

  /* the head */
  const head = new THREE.Group(); group.add(head); head.scale.setScalar(1.35);
  const headMat = new THREE.MeshPhysicalMaterial({ color: '#ffd23f', flatShading: !hq, metalness: 0.55, roughness: 0.32, clearcoat: 0.6, iridescence: 0.35, sheen: 0.5, emissive: new THREE.Color('#000') });
  const hornMat = new THREE.MeshPhysicalMaterial({ color: '#ffe9a8', metalness: 0.6, roughness: 0.28, clearcoat: 0.6, emissive: new THREE.Color('#000') });
  const whiskerMat = new THREE.MeshPhysicalMaterial({ color: '#c9f3ff', metalness: 0.7, roughness: 0.22, iridescence: 1, emissive: new THREE.Color('#000') });
  const add = (geom, mat, p, s, r = [0, 0, 0], parent = head) => { const m = new THREE.Mesh(geom, mat); m.position.set(...p); m.scale.set(...s); m.rotation.set(...r); parent.add(m); return m; };
  const ico = new THREE.IcosahedronGeometry(1, 2), box = new THREE.BoxGeometry(1, 1, 1);
  if (hq) {
    printLines(headMat);
    add(headGeometry(), headMat, [0, 0, 0], [1, 1, 1]);                                       // skull and snout
    const jaw = add(headGeometry(true), headMat, [0, -0.045, 0.02], [1, 1, 1], [0.22, 0, 0]);  // the lower jaw, a little open
    const toothMat = new THREE.MeshPhysicalMaterial({ color: '#fff8ea', roughness: 0.3, clearcoat: 0.8 });
    const tooth = new THREE.ConeGeometry(0.012, 0.045, 6);
    for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) {
      const z = 0.3 - k * 0.055, xw = 0.14 - 0.06 * Math.pow((z + 0.17) / 0.54, 2);
      add(tooth, toothMat, [sd * xw * 0.82, -0.005, z], [1, k === 0 ? 1.6 : 1, 1], [Math.PI, 0, 0]);
      add(tooth, toothMat, [sd * xw * 0.7, 0.02, z - 0.02], [1, 0.9, 1], [0, 0, 0], jaw);
    }
    add(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshPhysicalMaterial({ color: '#a8203a', roughness: 0.4, clearcoat: 0.6 }), [0, -0.03, 0.12], [0.07, 0.015, 0.16], [0, 0, 0], jaw);   // tongue
  } else {
    add(ico, headMat, [0, 0.02, -0.03], [0.19, 0.16, 0.2]);                       // skull
    add(box, headMat, [0, -0.02, 0.17], [0.22, 0.13, 0.26]);                      // muzzle
    add(ico, headMat, [0, 0.0, 0.31], [0.12, 0.08, 0.07]);                        // nose
    add(box, headMat, [0, -0.1, 0.16], [0.18, 0.05, 0.24], [0.1, 0, 0]);           // lower jaw
  }
  [-1, 1].forEach((s) => {
    if (!hq) add(ico, headMat, [s * 0.085, 0.11, 0.06], [0.075, 0.04, 0.12], [0.35, 0, s * -0.3]);         // heavy brow
    add(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#111', roughness: 0.15, clearcoat: 1 }), hq ? [s * 0.108, 0.088, 0.07] : [s * 0.1, 0.06, 0.12], hq ? [0.03, 0.03, 0.03] : [0.028, 0.028, 0.028]).userData.eye = true;
    add(new THREE.TorusGeometry(1, 0.25, 6, 16), headMat, hq ? [s * 0.112, 0.088, 0.072] : [s * 0.1, 0.06, 0.125], [0.034, 0.034, 0.034], [0, s * (hq ? 1.2 : 0.5), 0]);   // eye ring
    add(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: '#0a0a0a' }), [s * 0.045, 0.03, 0.37], [0.022, 0.018, 0.012]);   // nostril
    add(new THREE.ConeGeometry(0.03, 0.12, 4), headMat, [s * 0.1, -0.02, 0.3], [1, 1, 1], [Math.PI / 2, 0, s * 0.4]);       // lip spike
  });
  // branching horns, up and back
  [-1, 1].forEach((s) => {
    const beam = new THREE.CatmullRomCurve3([[s * 0.07, 0.13, -0.04], [s * 0.1, 0.27, -0.1], [s * 0.13, 0.4, -0.22], [s * 0.13, 0.52, -0.38]].map((p) => new THREE.Vector3(...p)));
    add(new THREE.TubeGeometry(beam, 24, 0.028, 7), hornMat, [0, 0, 0], [1, 1, 1]);
    add(new THREE.ConeGeometry(0.028, 0.08, 7), hornMat, [s * 0.13, 0.55, -0.42], [1, 1, 1], [-0.9, 0, 0]);
    const b = beam.getPoint(0.45);
    const tine = new THREE.CatmullRomCurve3([b, b.clone().add(new THREE.Vector3(s * 0.02, 0.08, 0.08)), b.clone().add(new THREE.Vector3(s * 0.03, 0.15, 0.1))]);
    add(new THREE.TubeGeometry(tine, 10, 0.017, 6), hornMat, [0, 0, 0], [1, 1, 1]);
  });
  // stiff wavy whiskers looping out from the snout, as printed
  [-1, 1].forEach((s) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push(new THREE.Vector3(s * (0.12 + 0.3 * Math.sin(u * Math.PI * 0.9)), -0.02 + 0.32 * u + 0.03 * Math.sin(u * 22), 0.3 - 0.55 * u)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.008, 6), whiskerMat, [0, 0, 0], [1, 1, 1]);
  });
  // a crest of spikes behind the head
  for (let k = 0; k < 9; k++) { const a = -1.3 + (k / 8) * 2.6; add(new THREE.ConeGeometry(0.035, 0.24, 4), headMat, [Math.sin(a) * 0.16, 0.06 + Math.cos(a) * 0.1, -0.2], [1, 1, 1], [-1.95, 0, -a * 0.7]); }

  /* legs: short, with three claws, at the chest and the hips */
  const legs = [];
  const clawGeo = new THREE.ConeGeometry(0.014, 0.075, 5); clawGeo.translate(0, 0.0375, 0);
  [[0.17, 0], [0.5, 1.9]].forEach(([u, ph]) => [-1, 1].forEach((s) => {
    const root = new THREE.Group(); group.add(root);
    const thigh = new THREE.Group(); root.add(thigh);
    if (hq) add(new THREE.CapsuleGeometry(0.03, 0.1, 6, 12), headMat, [0, -0.07, 0], [1, 1, 1.1], [0, 0, 0], thigh); else add(box, headMat, [0, -0.07, 0], [0.06, 0.15, 0.07], [0, 0, 0], thigh);
    const shin = new THREE.Group(); shin.position.y = -0.14; thigh.add(shin);
    if (hq) add(new THREE.CapsuleGeometry(0.022, 0.07, 6, 12), headMat, [0, -0.05, 0.02], [1, 1, 1.1], [0.4, 0, 0], shin); else add(box, headMat, [0, -0.05, 0.02], [0.045, 0.1, 0.05], [0.4, 0, 0], shin);
    const foot = new THREE.Group(); foot.position.set(0, -0.11, 0.04); shin.add(foot);
    for (let c = 0; c < 3; c++) { const a = (c - 1) * 0.45; add(clawGeo, hornMat, [Math.sin(a) * 0.03, 0, 0.02], [1, 1, 1], [1.5, a, 0], foot); }
    legs.push({ u, s, ph, root, thigh, shin, foot });
  }));

  /* the tail fin */
  const tuft = new THREE.Group(); group.add(tuft);
  for (let k = 0; k < 7; k++) { const a = (k - 3) * 0.28; add(new THREE.ConeGeometry(0.03, 0.26, 4), headMat, [Math.sin(a) * 0.04, 0.02, -0.1], [1, 1, 0.5], [-1.65, 0, -a]); }

  /* ---------- frames along the spine ---------- */
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), false, 'centripetal');
  const C = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const T = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const Nn = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const Bn = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  const prevN0 = new THREE.Vector3(0, 1, 0);

  function frames() {
    for (let k = 0; k < RINGS; k++) { const u = k / (RINGS - 1); curve.getPointAt(u, C[k]); curve.getTangentAt(u, T[k]).normalize(); }
    const n0 = v1.copy(prevN0).addScaledVector(T[0], -prevN0.dot(T[0]));
    if (n0.lengthSq() < 1e-6) n0.copy(up).addScaledVector(T[0], -up.dot(T[0]));
    Nn[0].copy(n0.normalize());
    for (let k = 0; k < RINGS - 1; k++) {           // rotation-minimising frames (double reflection)
      const vv1 = v1.subVectors(C[k + 1], C[k]); const c1 = vv1.dot(vv1) || 1e-9;
      const rL = Nn[k].clone().addScaledVector(vv1, (-2 / c1) * vv1.dot(Nn[k]));
      const tL = T[k].clone().addScaledVector(vv1, (-2 / c1) * vv1.dot(T[k]));
      const vv2 = v2.subVectors(T[k + 1], tL); const c2 = vv2.dot(vv2) || 1e-9;
      Nn[k + 1].copy(rL).addScaledVector(vv2, (-2 / c2) * vv2.dot(rL)).normalize();
    }
    // keep the back up: lean each normal toward world up, then smooth along the body
    for (let k = 0; k < RINGS; k++) {
      const upP = v2.copy(up).addScaledVector(T[k], -up.dot(T[k]));
      if (upP.lengthSq() > 0.02) Nn[k].lerp(upP.normalize(), 0.6);
      Nn[k].addScaledVector(T[k], -Nn[k].dot(T[k])).normalize();
    }
    for (let pass = 0; pass < 3; pass++) for (let k = 1; k < RINGS - 1; k++) Nn[k].add(v1.copy(Nn[k - 1]).add(Nn[k + 1]).multiplyScalar(0.5)).addScaledVector(T[k], -Nn[k].dot(T[k])).normalize();
    for (let k = 0; k < RINGS; k++) Bn[k].crossVectors(T[k], Nn[k]).normalize();
    prevN0.copy(Nn[0]);
  }

  const tmpC = new THREE.Color(), cA = new THREE.Color(), cB = new THREE.Color();
  function setColor(id) {
    const p = PALETTE[id];
    for (let i = 0; i < PIECES; i++) {
      const k = (i / (PIECES - 1)) * (p.stops.length - 1);
      cA.set(p.stops[Math.floor(k)]); cB.set(p.stops[Math.min(p.stops.length - 1, Math.ceil(k))]);
      tmpC.copy(cA).lerp(cB, k % 1);
      body.instanceColor.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
    }
    body.instanceColor.needsUpdate = true;
    headMat.color.set(p.stops[0]); hornMat.color.set(p.horn); whiskerMat.color.set(p.whisker);
  }
  setColor('metal');

  function update(spine, time, glow) {
    curve.points.forEach((p, i) => p.copy(spine[i]));
    curve.updateArcLengths();
    frames();
    // the printed segments: each sits on its own frame, slightly apart, like the real articulated print
    for (let i = 0; i < PIECES; i++) {
      const u = 0.035 + (i / (PIECES - 1)) * 0.95;
      const kf = u * (RINGS - 1), k = Math.min(RINGS - 2, Math.floor(kf)), f = kf - k;
      const pos = v1.copy(C[k]).lerp(C[k + 1], f);
      const n = sv.copy(Nn[k]).lerp(Nn[k + 1], f).normalize();
      const t = v2.copy(T[k]).lerp(T[k + 1], f).normalize();
      const fwd = t.clone().negate(), b = new THREE.Vector3().crossVectors(n, fwd).normalize();
      m4.makeBasis(b, n.clone().crossVectors(fwd, b), fwd);
      q.setFromRotationMatrix(m4);
      const r = radiusAt(u);
      m4.compose(pos, q, new THREE.Vector3(r * 1.25, r * 1.2, (0.95 / PIECES) * 6.4 * 0.95));
      body.setMatrixAt(i, m4);
    }
    body.instanceMatrix.needsUpdate = true;

    // the head rides the first frame
    const fwd = v1.copy(T[0]).negate(), hup = Nn[0];
    m4.makeBasis(v2.crossVectors(hup, fwd).normalize(), hup, fwd); head.quaternion.setFromRotationMatrix(m4);
    head.position.copy(C[0]).addScaledVector(fwd, 0.1);

    // legs paddle as it swims through the air
    legs.forEach((L) => {
      const k = Math.floor(L.u * (RINGS - 1)); const r = radiusAt(L.u);
      L.root.position.copy(C[k]).addScaledVector(Bn[k], L.s * r * 1.05).addScaledVector(Nn[k], -r * 0.3);
      m4.makeBasis(Bn[k], Nn[k], v1.copy(T[k]).negate()); L.root.quaternion.setFromRotationMatrix(m4);
      const sw = Math.sin(time * 4 + L.ph + (L.s > 0 ? Math.PI : 0));
      L.thigh.rotation.set(-0.8 + sw * 0.5, 0, L.s * 0.6);
      L.shin.rotation.set(0.9 - sw * 0.3, 0, 0);
    });

    // the tail fin
    const k = RINGS - 1;
    m4.makeBasis(Bn[k], Nn[k], v1.copy(T[k]).negate()); tuft.quaternion.setFromRotationMatrix(m4); tuft.position.copy(C[k]);

    // glow in the dark
    tmpC.set('#7dffb0');
    [silk, headMat].forEach((m) => { m.emissive.copy(tmpC); m.emissiveIntensity = glow * 0.5; });
  }

  return { update, setColor, group };
}
