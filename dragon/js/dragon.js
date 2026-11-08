// A serpentine Chinese dragon: one continuous scaled body skinned to a spine every frame, a sculpted head,
// antler horns, flowing barbels, a mane, dorsal spines and four legs with five claws.
// createDragon(scene) -> { update(spine, time, glow), setColor(id), N }
import * as THREE from 'three';

export const SEG = 40, SPACING = 0.16;            // spine points and their spacing: a body 6.4 long
const RINGS = 220, SIDES = 18;

export const PALETTE = {
  aurora: { body: '#1fc7b4', top: '#3a7bff', belly: '#f3d79a', horn: '#efe1c0', eye: '#ffb02e', irid: 1 },
  jade: { body: '#1f9e6c', top: '#0f5e41', belly: '#e9d08a', horn: '#efe1c0', eye: '#ffcf4a', irid: 0.6 },
  rubi: { body: '#c4182f', top: '#7a0d1f', belly: '#f2c46a', horn: '#f3e2b8', eye: '#ffd24a', irid: 0.5 },
  obsidiana: { body: '#23252c', top: '#0d0e12', belly: '#c9a25a', horn: '#d9c08a', eye: '#ff4a2e', irid: 0.8 },
};

// overlapping fish scales, used as colour and as relief
function scaleTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, 256, 256);
  const R = 32;
  for (let row = -1; row < 10; row++) {
    for (let col = -1; col < 10; col++) {
      const x = col * R + (row % 2 ? R / 2 : 0), y = row * R * 0.62;
      const gr = g.createRadialGradient(x, y - R * 0.25, R * 0.1, x, y, R * 0.62);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#a8a8a8'); gr.addColorStop(1, '#3a3a3a');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R * 0.6, 0, Math.PI); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(20,20,20,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, R * 0.6, 0.05, Math.PI - 0.05); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

const radiusAt = (u) => {
  // head joins at u=0; a slim neck, a full chest, a long taper to the tail
  const neck = 0.14 + 0.03 * Math.cos(Math.min(1, u / 0.06) * Math.PI);
  const body = 0.235 * Math.sin(Math.min(1, (u - 0.04) / 0.3) * Math.PI / 2);
  const r = u < 0.06 ? neck : Math.max(neck * 0.9, body);
  return r * (1 - 0.92 * Math.pow(Math.max(0, (u - 0.25) / 0.75), 1.25)) + 0.008;
};

export function createDragon(scene) {
  const group = new THREE.Group(); scene.add(group);
  const scales = scaleTexture();

  /* body: a tube rebuilt on the spine each frame */
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((RINGS) * (SIDES + 1) * 3), uv = new Float32Array(RINGS * (SIDES + 1) * 2), col = new Float32Array(RINGS * (SIDES + 1) * 3);
  const idx = [];
  for (let k = 0; k < RINGS - 1; k++) for (let j = 0; j < SIDES; j++) {
    const a = k * (SIDES + 1) + j, b = a + SIDES + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  for (let k = 0; k < RINGS; k++) for (let j = 0; j <= SIDES; j++) {
    const v = k * (SIDES + 1) + j; uv[v * 2] = (j / SIDES) * 3; uv[v * 2 + 1] = (k / RINGS) * 52;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  const bodyMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, map: scales, bumpMap: scales, bumpScale: 2.2, roughness: 0.38, metalness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.3, iridescence: 1, iridescenceIOR: 1.5, sheen: 0.4, sheenColor: new THREE.Color('#ffffff'), emissive: new THREE.Color('#000000') });
  const body = new THREE.Mesh(geo, bodyMat); body.frustumCulled = false; group.add(body);

  /* dorsal spines along the ridge */
  const SP = 64;
  const spineGeo = new THREE.ConeGeometry(0.5, 1, 5); spineGeo.translate(0, 0.5, 0);
  const hornMat = new THREE.MeshStandardMaterial({ color: '#efe1c0', roughness: 0.35, metalness: 0.3 });
  const dorsal = new THREE.InstancedMesh(spineGeo, new THREE.MeshPhysicalMaterial({ color: '#ff5a3c', roughness: 0.35, metalness: 0.1, clearcoat: 0.5, emissive: new THREE.Color('#000') }), SP);
  dorsal.frustumCulled = false; group.add(dorsal);

  /* the mane: fine flames round the neck, waving */
  const MN = 54;
  const maneGeo = new THREE.ConeGeometry(0.5, 1, 4); maneGeo.translate(0, 0.5, 0);
  const maneMat = new THREE.MeshStandardMaterial({ color: '#ff7a3c', roughness: 0.5, emissive: new THREE.Color('#5a1a00'), emissiveIntensity: 0.5 });
  const mane = new THREE.InstancedMesh(maneGeo, maneMat, MN); mane.frustumCulled = false; group.add(mane);

  /* the head */
  const head = new THREE.Group(); group.add(head);
  const headMat = new THREE.MeshPhysicalMaterial({ color: '#1fc7b4', map: scales, bumpMap: scales, bumpScale: 1.2, roughness: 0.4, metalness: 0.25, clearcoat: 0.7, iridescence: 1, emissive: new THREE.Color('#000') });
  const bellyMat = new THREE.MeshStandardMaterial({ color: '#f3d79a', roughness: 0.55, emissive: new THREE.Color('#000') });
  const add = (geom, mat, p, s, r = [0, 0, 0], parent = head) => { const m = new THREE.Mesh(geom, mat); m.position.set(...p); m.scale.set(...s); m.rotation.set(...r); parent.add(m); return m; };
  const sph = new THREE.SphereGeometry(1, 28, 20);
  add(sph, headMat, [0, 0.02, -0.02], [0.19, 0.155, 0.22]);                     // skull
  add(sph, headMat, [0, 0.0, 0.2], [0.13, 0.095, 0.2]);                      // muzzle
  add(sph, headMat, [0, 0.03, 0.36], [0.11, 0.075, 0.08]);                    // nose pad
  [-1, 1].forEach((s) => {
    add(sph, headMat, [s * 0.075, 0.1, 0.07], [0.07, 0.035, 0.11], [0.3, 0, s * -0.25]);        // brow ridge
    add(sph, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.3, 0.25), toneMapped: false }), [s * 0.1, 0.06, 0.1], [0.03, 0.024, 0.032]).userData.eye = true;   // eye
    add(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#000' }), [s * 0.124, 0.06, 0.112], [0.004, 0.034, 0.008]);  // slit pupil
    add(sph, new THREE.MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.3 }), [s * 0.04, 0.06, 0.43], [0.018, 0.014, 0.012]);         // nostril
    add(sph, headMat, [s * 0.15, -0.02, -0.06], [0.06, 0.09, 0.05], [0, s * 0.4, 0]);           // cheek frill
  });
  // the lower jaw, hinged at the back, with teeth
  const jaw = new THREE.Group(); jaw.position.set(0, -0.06, -0.02); head.add(jaw);
  add(sph, bellyMat, [0, -0.03, 0.2], [0.1, 0.04, 0.19], [0, 0, 0], jaw);
  const tooth = new THREE.ConeGeometry(0.012, 0.045, 5);
  const toothMat = new THREE.MeshStandardMaterial({ color: '#f6f0e2', roughness: 0.3 });
  for (let k = 0; k < 6; k++) [-1, 1].forEach((s) => { add(tooth, toothMat, [s * (0.07 - k * 0.006), 0.0, 0.08 + k * 0.045], [1, 1, 1], [0, 0, 0], jaw); add(tooth, toothMat, [s * (0.075 - k * 0.006), -0.045, 0.1 + k * 0.045], [1, 1, 1], [Math.PI, 0, 0]); });
  // antler horns: a main beam with two tines
  const horns = [];
  [-1, 1].forEach((s) => {
    const beam = new THREE.CatmullRomCurve3([[s * 0.07, 0.12, -0.06], [s * 0.12, 0.24, -0.16], [s * 0.15, 0.3, -0.34], [s * 0.13, 0.36, -0.52]].map((p) => new THREE.Vector3(...p)));
    horns.push(add(new THREE.TubeGeometry(beam, 28, 0.022, 7), hornMat, [0, 0, 0], [1, 1, 1]));
    [[0.35, 0.16], [0.7, 0.12]].forEach(([u, len]) => {
      const b = beam.getPoint(u); const tine = new THREE.CatmullRomCurve3([b, b.clone().add(new THREE.Vector3(s * 0.03, len, 0.02)), b.clone().add(new THREE.Vector3(s * 0.05, len * 1.4, -0.04))]);
      add(new THREE.TubeGeometry(tine, 12, 0.013, 6), hornMat, [0, 0, 0], [1, 1, 1]);
    });
  });
  // a beard of fine strands under the chin
  for (let k = 0; k < 7; k++) add(new THREE.ConeGeometry(0.012, 0.22, 4), maneMat, [(k - 3) * 0.018, -0.14, 0.06 - Math.abs(k - 3) * 0.01], [1, 1, 1], [2.6, 0, (k - 3) * 0.08], jaw);

  /* barbels: two long whiskers that drag behind the snout */
  const barbelMat = new THREE.MeshStandardMaterial({ color: '#f1d79a', roughness: 0.4, metalness: 0.4, emissive: new THREE.Color('#2a1a00') });
  const barbels = [-1, 1].map((s) => { const pts = Array.from({ length: 14 }, () => new THREE.Vector3()); const m = new THREE.Mesh(new THREE.BufferGeometry(), barbelMat); m.frustumCulled = false; group.add(m); return { s, pts, m, init: false }; });

  /* legs: thigh, shin and a foot of five claws, at the chest and the hips */
  const legs = [];
  const capsule = new THREE.CapsuleGeometry(1, 1, 6, 12);
  const clawGeo = new THREE.ConeGeometry(0.012, 0.07, 6); clawGeo.translate(0, 0.035, 0);
  [[0.15, 0], [0.52, 1.6]].forEach(([u, ph]) => [-1, 1].forEach((s) => {
    const root = new THREE.Group(); group.add(root);
    const thigh = new THREE.Group(); root.add(thigh);
    add(capsule, headMat, [0, -0.09, 0], [0.045, 0.09, 0.045], [0, 0, 0], thigh);
    const shin = new THREE.Group(); shin.position.y = -0.19; thigh.add(shin);
    add(capsule, headMat, [0, -0.07, 0], [0.032, 0.07, 0.032], [0, 0, 0], shin);
    const foot = new THREE.Group(); foot.position.y = -0.16; shin.add(foot);
    add(sph, headMat, [0, 0, 0.02], [0.04, 0.025, 0.05], [0, 0, 0], foot);
    for (let c = 0; c < 5; c++) { const a = (c - 2) * 0.32; add(clawGeo, hornMat, [Math.sin(a) * 0.035, -0.005, 0.04 + Math.cos(a) * 0.02], [1, 1, 1], [1.7, a, 0], foot); }
    legs.push({ u, s, ph, root, thigh, shin, foot });
  }));

  /* the tail tuft */
  const tuft = new THREE.Group(); group.add(tuft);
  for (let k = 0; k < 9; k++) { const a = (k - 4) * 0.22; add(new THREE.ConeGeometry(0.022, 0.32, 4), maneMat, [Math.sin(a) * 0.05, Math.cos(a) * 0.05 * 0.5, -0.14], [1, 1, 1], [-1.75, 0, -a * 1.2], tuft); }

  /* ---------- per-frame skinning ---------- */
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), false, 'centripetal');
  const C = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const T = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const Nn = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const Bn = Array.from({ length: RINGS }, () => new THREE.Vector3());
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3();
  let prevN0 = new THREE.Vector3(0, 1, 0);
  const belly = new THREE.Color(), topC = new THREE.Color(), sideC = new THREE.Color(), tmpC = new THREE.Color();

  function frames() {
    // rotation-minimising frames (double reflection), seeded from last frame's normal so nothing flips
    for (let k = 0; k < RINGS; k++) { const u = k / (RINGS - 1); curve.getPointAt(u, C[k]); curve.getTangentAt(u, T[k]).normalize(); }
    const n0 = v1.copy(prevN0).addScaledVector(T[0], -prevN0.dot(T[0]));
    if (n0.lengthSq() < 1e-6) n0.copy(up).addScaledVector(T[0], -up.dot(T[0]));
    // lean the seed back toward world up, slowly, so the dragon stays belly-down
    const upP = v2.copy(up).addScaledVector(T[0], -up.dot(T[0]));
    if (upP.lengthSq() > 1e-4) n0.lerp(upP.normalize(), 0.08);
    Nn[0].copy(n0.normalize()); prevN0.copy(Nn[0]);
    for (let k = 0; k < RINGS - 1; k++) {
      const x0 = C[k], x1 = C[k + 1];
      const vv1 = v1.subVectors(x1, x0); const c1 = vv1.dot(vv1) || 1e-9;
      const rL = Nn[k].clone().addScaledVector(vv1, (-2 / c1) * vv1.dot(Nn[k]));
      const tL = T[k].clone().addScaledVector(vv1, (-2 / c1) * vv1.dot(T[k]));
      const vv2 = v2.subVectors(T[k + 1], tL); const c2 = vv2.dot(vv2) || 1e-9;
      Nn[k + 1].copy(rL).addScaledVector(vv2, (-2 / c2) * vv2.dot(rL)).normalize();
    }
    // keep the belly down: lean every ring's normal toward world up (smoothly, along the body)
    for (let k = 0; k < RINGS; k++) {
      const upP = v2.copy(up).addScaledVector(T[k], -up.dot(T[k]));
      if (upP.lengthSq() > 0.02) Nn[k].lerp(upP.normalize(), 0.55);
      Nn[k].addScaledVector(T[k], -Nn[k].dot(T[k])).normalize();
    }
    for (let pass = 0; pass < 3; pass++) for (let k = 1; k < RINGS - 1; k++) { Nn[k].add(v1.copy(Nn[k - 1]).add(Nn[k + 1]).multiplyScalar(0.5)).addScaledVector(T[k], -Nn[k].dot(T[k])).normalize(); }
    for (let k = 0; k < RINGS; k++) Bn[k].crossVectors(T[k], Nn[k]).normalize();
  }

  function setColor(id) {
    const p = PALETTE[id];
    belly.set(p.belly); topC.set(p.top); sideC.set(p.body);
    for (let k = 0; k < RINGS; k++) for (let j = 0; j <= SIDES; j++) {
      const th = (j / SIDES) * Math.PI * 2; const s = Math.sin(th);   // s = 1 the ridge, -1 the belly
      const v = (k * (SIDES + 1) + j) * 3;
      if (s < -0.45) tmpC.copy(belly); else tmpC.copy(sideC).lerp(topC, Math.max(0, s));
      col[v] = tmpC.r; col[v + 1] = tmpC.g; col[v + 2] = tmpC.b;
    }
    geo.attributes.color.needsUpdate = true;
    headMat.color.set(p.body); bodyMat.iridescence = p.irid; headMat.iridescence = p.irid;
    bellyMat.color.set(p.belly); hornMat.color.set(p.horn); barbelMat.color.set(p.horn);
    head.traverse((o) => { if (o.userData.eye) o.material.color.set(p.eye).multiplyScalar(2.4); });
  }
  setColor('aurora');

  function update(spine, time, glow) {
    curve.points.forEach((p, i) => p.copy(spine[i]));
    curve.updateArcLengths();
    frames();
    // the tube
    for (let k = 0; k < RINGS; k++) {
      const u = k / (RINGS - 1);
      const r = radiusAt(u) * (1 + 0.04 * Math.sin(time * 2 - u * 30));   // breathing
      for (let j = 0; j <= SIDES; j++) {
        const th = (j / SIDES) * Math.PI * 2;
        const cx = Math.cos(th) * r * 1.12, sy = Math.sin(th) * r * (Math.sin(th) < 0 ? 0.82 : 1);
        const v = (k * (SIDES + 1) + j) * 3;
        pos[v] = C[k].x + Bn[k].x * cx + Nn[k].x * sy;
        pos[v + 1] = C[k].y + Bn[k].y * cx + Nn[k].y * sy;
        pos[v + 2] = C[k].z + Bn[k].z * cx + Nn[k].z * sy;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();

    // dorsal spines from the neck to near the tail
    for (let i = 0; i < SP; i++) {
      const k = Math.floor(8 + (i / SP) * (RINGS - 26)); const u = k / (RINGS - 1); const r = radiusAt(u);
      sv.copy(Nn[k]).multiplyScalar(-0.55).add(T[k].clone().multiplyScalar(-1)).normalize();   // tilt back
      q.setFromUnitVectors(up, v1.copy(Nn[k]).lerp(sv, 0.55).normalize());
      const h = r * (0.9 + 0.35 * Math.sin(i * 1.7));
      m4.compose(v2.copy(C[k]).addScaledVector(Nn[k], r * 0.88), q, sv.set(r * 0.32, h, r * 0.12));
      dorsal.setMatrixAt(i, m4);
    }
    dorsal.instanceMatrix.needsUpdate = true;

    // the mane round the neck rings
    for (let i = 0; i < MN; i++) {
      const k = 2 + Math.floor((i / MN) * 16); const a = ((i * 2.399) % (Math.PI * 2));
      const side = Math.cos(a), top = Math.abs(Math.sin(a)) * 0.6 + 0.4;
      const dir = v1.copy(Bn[k]).multiplyScalar(side * 0.8).addScaledVector(Nn[k], top).addScaledVector(T[k], -1.4 - 0.3 * Math.sin(time * 4 + i)).normalize();
      q.setFromUnitVectors(up, dir);
      const r = radiusAt(k / (RINGS - 1));
      m4.compose(v2.copy(C[k]).addScaledVector(Bn[k], side * r * 0.9).addScaledVector(Nn[k], top * r * 0.7), q, sv.set(0.022, 0.2 + 0.08 * Math.sin(i * 3.1), 0.022));
      mane.setMatrixAt(i, m4);
    }
    mane.instanceMatrix.needsUpdate = true;

    // the head rides the first frame: forward is the reverse tangent
    const fwd = v1.copy(T[0]).negate(), hup = Nn[0];
    m4.makeBasis(v2.crossVectors(hup, fwd).normalize(), hup, fwd); head.quaternion.setFromRotationMatrix(m4);
    head.position.copy(C[0]).addScaledVector(fwd, 0.06);
    jaw.rotation.x = 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(time * 1.3));

    // barbels drag behind: each point eases toward the one ahead of it
    barbels.forEach((b) => {
      const anchor = new THREE.Vector3(b.s * 0.1, 0.0, 0.36).applyQuaternion(head.quaternion).add(head.position);
      if (!b.init) { b.pts.forEach((p, i) => p.copy(anchor).addScaledVector(fwd, -i * 0.06)); b.init = true; }
      b.pts[0].copy(anchor);
      for (let i = 1; i < b.pts.length; i++) {
        const p = b.pts[i], a = b.pts[i - 1];
        const want = v2.copy(p).sub(a); const L = want.length() || 1;
        p.copy(a).addScaledVector(want, 0.065 / L);                        // keep the strand's length
        p.addScaledVector(Bn[0], b.s * 0.004).y += 0.0025 * Math.sin(time * 2.4 + i * 0.7) - 0.0012;   // spread and sway
      }
      b.m.geometry.dispose(); b.m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(b.pts), 40, 0.006, 5);
    });

    // legs: rooted at the sides, paddling as it swims through the air
    legs.forEach((L) => {
      const k = Math.floor(L.u * (RINGS - 1)); const r = radiusAt(L.u);
      L.root.position.copy(C[k]).addScaledVector(Bn[k], L.s * r * 0.95).addScaledVector(Nn[k], -r * 0.35);
      m4.makeBasis(Bn[k], Nn[k], v1.copy(T[k]).negate()); L.root.quaternion.setFromRotationMatrix(m4);
      const sw = Math.sin(time * 3.2 + L.ph + (L.s > 0 ? Math.PI : 0));
      L.thigh.rotation.set(-0.9 + sw * 0.55, 0, L.s * 0.55);
      L.shin.rotation.set(1.1 - sw * 0.35, 0, 0);
      L.foot.rotation.set(-0.5 + sw * 0.25, 0, 0);
    });

    // the tail tuft rides the last frame
    const k = RINGS - 1;
    m4.makeBasis(Bn[k], Nn[k], v1.copy(T[k]).negate()); tuft.quaternion.setFromRotationMatrix(m4);
    tuft.position.copy(C[k]);
    tuft.children.forEach((c, i) => { c.rotation.y = 0.3 * Math.sin(time * 3 + i * 0.5); });

    // glow in the dark
    const gc = tmpC.set('#7dffb0');
    [bodyMat, headMat].forEach((m) => { m.emissive.copy(gc); m.emissiveIntensity = glow * 0.55; });
    dorsal.material.emissive.copy(gc); dorsal.material.emissiveIntensity = glow * 0.6;
  }

  return { update, setColor, group };
}
