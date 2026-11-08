// Film 1, "Reacción en cadena" (24.3 s, the reference's sound): one take in the dark.
// A drop falls in slow motion onto a line of glass dominoes; they fall in a lit wave (swell 1, 6.0 s), the last one
// sends a chrome ball rolling into a Newton's cradle (swell 2, 10.1 s); the cradle launches a marble round the base
// into the touch button (swell 3, 14.0 s): the humidifier wakes, the strobe catches the drops and they rise
// (swell 4, 16.4 s); at swell 5 (21.45 s) the light turns amber like a sunrise and the name comes in.
export const DUR = 24.3;
export const AUDIO = 'audio/referencia.wav';
export const scene = { light: 'hielo', bg: '#040506', mistGain: 0.08, bloom: 0.9, rate: -0.6, strobe: false, mirrorOpts: { strength: 0.5, fade: 1.4 } };

const ICE = '#a6e1ff', AMBER = '#ffb259';
let S = {};

export const ballU = (t, c) => (t < 7.12 ? 0 : t < 10.1 ? c.ease.out(c.prog(t, 7.12, 10.1)) * 0.25 + c.prog(t, 7.12, 10.1) * 0.75 : 1);
export const marbleU = (t, c) => { const ml = c.prog(t, 10.2, 14.0); return ml <= 0 ? 0 : 0.18 * c.ease.out(Math.min(1, ml / 0.2)) + 0.82 * c.clamp((ml - 0.06) / 0.94); };

export async function setup(c) {
  const { THREE, U, scene: sc } = c;
  const T = U.three;
  // the product starts asleep: no light, no drops, no mist
  T.product.drops.visible = false; T.product.halo.visible = false; if (T.mist) T.mist.visible = false;
  U.setLit(0);

  const glowMat = (hex, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });
  const chrome = new THREE.MeshStandardMaterial({ color: '#dfe6ee', metalness: 1, roughness: 0.12 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#08090b', metalness: 0.1, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.4 });

  /* dominoes along a curve that ends in front of the product */
  const path = new THREE.CatmullRomCurve3([[-1.55, 0, -0.35], [-1.35, 0, 0.45], [-0.95, 0, 0.98], [-0.45, 0, 1.12], [-0.12, 0, 1.06]].map((p) => new THREE.Vector3(...p)));
  const N = 24, GAP = 0.072, H = 0.1, W = 0.052, D = 0.012;
  const L = path.getLength();
  const doms = [];
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(W, H, D), glass, N);
  const edge = new THREE.InstancedMesh(new THREE.BoxGeometry(W * 1.01, 0.005, D * 1.08), glowMat('#ffffff'), N);
  const side = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0012, H * 0.98, D * 1.04), glowMat('#ffffff'), N * 2);
  for (let i = 0; i < N; i++) {
    const u = (0.03 * L + i * GAP) / L;
    const p = path.getPointAt(u), tg = path.getTangentAt(u).setY(0).normalize();
    doms.push({ p, tg, axis: new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tg).normalize(), t0: 6.0 + i * 0.046 });
  }
  [body, edge, side].forEach((m) => { m.frustumCulled = false; sc.add(m); });
  edge.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
  side.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 6), 3);

  /* the falling drop and its splash */
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.009, 24, 16), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transparent: true, opacity: 0.92, emissive: new THREE.Color(ICE), emissiveIntensity: 0.9, clearcoat: 1 }));
  drop.scale.set(1, 1.35, 1); sc.add(drop);
  const dropGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.product.halo.material.map, color: ICE, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dropGlow.scale.set(0.035, 0.035, 1); sc.add(dropGlow);
  const splash = Array.from({ length: 10 }, (_, k) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.0028, 10, 8), glowMat(ICE, 2)); m.visible = false; sc.add(m);
    const a = (k / 10) * Math.PI * 2 + 0.3; return { m, v: new THREE.Vector3(Math.cos(a) * (0.22 + 0.1 * (k % 3)), 0.55 + 0.25 * ((k * 7) % 3), Math.sin(a) * (0.22 + 0.1 * (k % 2))) };
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, 64), glowMat(ICE, 2)); ring.rotation.x = Math.PI / 2; ring.visible = false; sc.add(ring);

  /* ball 1: from the last domino to the cradle */
  const bpath = new THREE.CatmullRomCurve3([[-0.06, 0.018, 1.06], [0.22, 0.018, 1.2], [0.42, 0.018, 1.08], [0.3, 0.018, 0.94], [0.08, 0.018, 0.9], [0, 0.018, 0.88]].map((p) => new THREE.Vector3(...p)));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.018, 40, 28), new THREE.MeshPhysicalMaterial({ color: '#e9eef3', metalness: 1, roughness: 0.08, emissive: new THREE.Color(ICE), emissiveIntensity: 0.35 })); sc.add(ball);
  const ballLight = new THREE.PointLight(ICE, 0.05, 0.5, 2); sc.add(ballLight);
  const ballGlow = new THREE.Mesh(new THREE.TorusGeometry(0.0185, 0.0012, 8, 48), glowMat(ICE, 2.2)); sc.add(ballGlow);

  /* the Newton's cradle, its balls along z in front of the product */
  const cradle = new THREE.Group(); sc.add(cradle);
  const R = 0.022, LEN = 0.16, TOP = 0.2, Z0 = 0.84, STEP = 2 * R + 0.0006;
  const frameMat = new THREE.MeshStandardMaterial({ color: '#1b1d21', metalness: 0.9, roughness: 0.3 });
  [-0.075, 0.075].forEach((x) => {
    const curve = new THREE.CatmullRomCurve3([[x, 0, Z0 + 0.06], [x, TOP, Z0 + 0.06], [x, TOP, Z0 - 4 * STEP - 0.06], [x, 0, Z0 - 4 * STEP - 0.06]].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.02);
    cradle.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.004, 10), frameMat));
  });
  const cb = [];
  for (let k = 0; k < 5; k++) {
    const piv = new THREE.Group(); piv.position.set(0, TOP, Z0 - k * STEP); cradle.add(piv);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#e9eef3', metalness: 1, roughness: 0.1, emissive: new THREE.Color(ICE), emissiveIntensity: 0 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mat); b.position.y = -LEN; piv.add(b);
    const strMat = new THREE.MeshBasicMaterial({ color: '#7d8a96' });
    [-1, 1].forEach((s) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, Math.hypot(LEN, 0.075), 6), strMat);
      st.position.set(s * 0.0375, -LEN / 2, 0); st.rotation.z = -s * Math.atan2(0.075, LEN); piv.add(st);
    });
    cb.push({ piv, mat });
  }

  /* the marble: launched by the cradle, round the base and into the touch button */
  const mpath = new THREE.CatmullRomCurve3([[0, 0.012, Z0 - 4 * STEP - R - 0.013], [-0.2, 0.012, 0.56], [-0.33, 0.012, 0.36], [-0.24, 0.012, 0.2], [-0.08, 0.012, 0.15], [0, 0.012, 0.118]].map((p) => new THREE.Vector3(...p)));
  const marble = new THREE.Mesh(new THREE.SphereGeometry(0.012, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transmission: 0, emissive: new THREE.Color(ICE), emissiveIntensity: 0.8, clearcoat: 1 }));
  sc.add(marble);
  const marbleGlow = new THREE.Sprite(dropGlow.material.clone()); marbleGlow.scale.set(0.03, 0.03, 1); sc.add(marbleGlow);

  /* words */
  const brand = c.words('Uprain', { top: '190px', fontSize: '176px', fontWeight: '600', letterSpacing: '-0.055em' });
  const line = c.words('La lluvia, al revés.', { top: '410px', fontSize: '58px', fontWeight: '400', letterSpacing: '-0.02em', color: '#ffe3c2' });
  const price = c.words('Humidificador antigravedad · 44,95 €', { top: '505px', fontSize: '31px', fontWeight: '500', color: '#f5d9b8' });
  price.el.classList.add('mono');

  /* the camera, one take */
  const D0 = doms[0].p, Dm = doms[12].p, De = doms[N - 1].p;
  const v = (p, x, y, z) => [p.x + x, p.y + y, p.z + z];
  const B = (u) => bpath.getPointAt(u), M = (u) => mpath.getPointAt(u);
  S = {
    ballLight, path, doms, body, edge, side, H, W, D, drop, dropGlow, splash, ring, bpath, ball, ballGlow, cb, R, LEN, mpath, marble, marbleGlow, brand, line, price,
    cam: (() => {
      const { orbit, follow, prog, ease, clamp, lerp } = c;
      const up = new THREE.Vector3(0, 1, 0);
      const P = (p) => [p.x, p.y, p.z];
      const topY = H + 0.004;
      const dropP = (t) => [D0.x, Math.max(topY + 0.03, lerp(0.95, topY, Math.pow(prog(t, 1.6, 6.0), 1.7)) - 0.03 * prog(t, 4.5, 6.0)), D0.z];
      const front = (t) => { const f = clamp((t - 6.0) / 0.046, 0, N - 1.001); const a = doms[Math.floor(f)].p, b = doms[Math.ceil(f)].p; const q = P(a.clone().lerp(b, f % 1)); q[1] = 0.05; return q; };
      const ballP = (t) => P(bpath.getPointAt(clamp(ballU(t, c))));
      const marbleP = (t) => P(mpath.getPointAt(clamp(marbleU(t, c))));
      const side = (d, k) => { const n = new THREE.Vector3().crossVectors(up, new THREE.Vector3(...d)).normalize(); return [n.x * k, n.z * k]; };
      return c.camPath([
        // A: a low glide back along the line, toward the first domino
        { t: 0.0, pos: v(De, 0.16, 0.035, 0.2), at: v(Dm, 0, 0.04, 0), fov: 30, roll: 0.07, ap: 0.02 },
        { t: 1.1, pos: v(Dm, 0.15, 0.04, 0.17), at: v(D0, 0, 0.06, 0), fov: 30, roll: 0.04, ap: 0.02 },
        // B: a spiral round the falling drop, down with it
        ...follow({ t0: 2.2, t1: 6.0, p: dropP, lead: 0, n: 10, fov: 30, ap: 0.03,
          offset: (t, a) => { const k = prog(t, 2.2, 6.0), ang = 0.9 - 1.6 * k, r = 0.3 - 0.06 * k; return [D0.x + Math.sin(ang) * r, a[1] + 0.03, D0.z + Math.cos(ang) * r]; } }),
        // C: tracking beside the wave of falling dominoes
        ...follow({ t0: 6.15, t1: 7.25, p: front, lead: 0.0, n: 12, fov: 33, ap: 0.016,
          offset: (t, a, d) => { const [sx, sz] = side(d, 0.3); return [a[0] + sx - d[0] * 0.16, 0.15, a[2] + sz - d[2] * 0.16]; } }),
        // D: chasing the chrome ball
        ...follow({ t0: 7.5, t1: 9.9, p: ballP, lead: 0.08, n: 24, fov: 33, ap: 0.02,
          offset: (t, a, d) => { const [sx, sz] = side(d, 0.08); return [a[0] - d[0] * 0.17 + sx, 0.06, a[2] - d[2] * 0.17 + sz]; } }),
        // E: round the Newton's cradle
        ...orbit({ t0: 10.1, t1: 11.8, at: [0, 0.08, 0.74], a0: 0.95, a1: -0.35, r0: 0.44, r1: 0.36, y0: 0.17, y1: 0.12, fov: 30, ap: 0.018, n: 5 }),
        // F: chasing the marble, low, to the button
        ...follow({ t0: 12.1, t1: 13.75, p: marbleP, lead: 0.08, n: 16, fov: 31, ap: 0.028,
          offset: (t, a, d) => { const [sx, sz] = side(d, 0.07); return [a[0] - d[0] * 0.17 + sx, 0.045, a[2] - d[2] * 0.17 + sz]; } }),
        { t: 14.0, pos: [0.07, 0.045, 0.27], at: [0, 0.03, 0.105], fov: 27, ap: 0.035 },
        // G: up and back as it wakes
        ...orbit({ t0: 14.35, t1: 16.4, at: [0, 0.15, 0], a0: 0.3, a1: 0.9, r0: 0.34, r1: 0.76, y0: 0.06, y1: 0.2, fov: 28, fov1: 32, ap: 0.014, n: 5 }),
        // H: most of a turn round the product, rising to the nozzle
        ...orbit({ t0: 16.6, t1: 19.0, at: [0, 0.17, 0], a0: 0.82, a1: -1.6, r0: 0.74, r1: 0.5, y0: 0.2, y1: 0.26, fov: 32, ap: 0.012, n: 6 }),
        ...orbit({ t0: 19.2, t1: 21.45, at: [0, 0.24, 0], a0: -1.75, a1: -3.9, r0: 0.48, r1: 0.42, y0: 0.27, y1: 0.33, fov: 31, ap: 0.016, n: 6 }),
        // I: the pull back for the name
        ...orbit({ t0: 21.7, t1: 24.3, at: [0, 0.19, 0], a0: -4.3, a1: 0.355 - 2 * Math.PI, r0: 0.6, r1: 1.32, y0: 0.29, y1: 0.21, fov: 33, fov1: 34, ap: 0.008, n: 6 }),
      ]);
    })(),
    tmp: { m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1), p: new THREE.Vector3(), c: new THREE.Color(), up: new THREE.Vector3(0, 1, 0) },
    THREE, chromeRoll: new THREE.Quaternion(), marbleRoll: new THREE.Quaternion(),
  };
}

// the cradle as a script: who swings, when, how far (radians, - toward the product)
function cradleAngles(t) {
  const a = [0, 0, 0, 0, 0];
  if (t < 10.1) return { a, hit: -1 };
  const half = 0.4, s = t - 10.1, n = Math.floor(s / half), u = (s % half) / half;
  const amp = 0.62 * Math.pow(0.86, n) * (t > 13.6 ? Math.max(0, 1 - (t - 13.6) / 1.2) : 1);
  const swing = Math.sin(u * Math.PI) * amp;
  if (n % 2 === 0) a[4] = -swing; else a[0] = swing;
  return { a, hit: u < 0.12 ? n : -1, n, u };
}

export function update(c, t, dt) {
  const { THREE, U } = { THREE: S.THREE, U: c.U };
  const T = U.three, { m, q, s, p, c: col, up } = S.tmp;
  const { prog, ease, clamp, lerp } = c;
  const sunrise = ease.inOut(prog(t, 21.45, 23.0));
  const accent = '#' + c.mixColor(ICE, AMBER, sunrise);

  /* dominoes */
  const maxA = 1.05;
  S.doms.forEach((d, i) => {
    const k = prog(t, d.t0, d.t0 + 0.2);
    const ang = (i === S.doms.length - 1 ? 1.48 : maxA) * ease.in(k) * (k < 1 ? 1 : 1);
    q.setFromAxisAngle(d.axis, ang);
    // rotate round the bottom front edge
    const pivot = p.copy(d.p).addScaledVector(d.tg, S.D / 2);
    const centre = new THREE.Vector3(0, S.H / 2, 0).addScaledVector(d.tg, -S.D / 2).applyQuaternion(q).add(pivot);
    const face = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.tg);
    const rq = q.clone().multiply(face);
    m.compose(centre, rq, s); S.body.setMatrixAt(i, m);
    const top = new THREE.Vector3(0, S.H / 2 - 0.0025, 0).applyQuaternion(rq).add(centre);
    m.compose(top, rq, s); S.edge.setMatrixAt(i, m);
    [-1, 1].forEach((sd, j) => {
      const e = new THREE.Vector3(sd * (S.W / 2), 0, 0).applyQuaternion(rq).add(centre);
      m.compose(e, rq, s); S.side.setMatrixAt(i * 2 + j, m);
    });
    // the edge lights as the wave passes, then settles to a glow
    const lit = 0.1 + 1.6 * Math.exp(-Math.max(0, t - d.t0) * 2.2) * (t >= d.t0 ? 1 : 0) + 0.35 * (t >= d.t0 ? 1 : 0);
    col.set(accent).multiplyScalar(lit * (0.35 + 0.65 * clamp(t / 1.5)));
    S.edge.setColorAt(i, col); S.side.setColorAt(i * 2, col); S.side.setColorAt(i * 2 + 1, col);
  });
  [S.body, S.edge, S.side].forEach((x) => { x.instanceMatrix.needsUpdate = true; if (x.instanceColor) x.instanceColor.needsUpdate = true; });

  /* the slow drop onto the first domino */
  const d0 = S.doms[0];
  const topY = S.H + 0.004;
  const fall = prog(t, 1.6, 6.0);
  const dy = lerp(0.95, topY, Math.pow(fall, 1.7));
  S.drop.visible = t < 6.0; S.dropGlow.visible = t < 6.0;
  S.drop.position.set(d0.p.x, dy, d0.p.z); S.drop.scale.set(1, 1.35 + 0.25 * fall, 1); S.dropGlow.position.copy(S.drop.position);
  S.dropGlow.material.opacity = 0.6 * clamp(t / 1.2);
  const ss = t - 6.0;
  S.splash.forEach((sp) => {
    sp.m.visible = ss > 0 && ss < 0.7;
    if (sp.m.visible) { sp.m.position.set(d0.p.x + sp.v.x * ss * 0.4, topY + sp.v.y * ss * 0.4 - 4.9 * ss * ss * 0.4, d0.p.z + sp.v.z * ss * 0.4); sp.m.scale.setScalar(1 - ss / 0.7); }
  });
  S.ring.visible = ss > 0 && ss < 0.9;
  if (S.ring.visible) { S.ring.position.set(d0.p.x, 0.002, d0.p.z); const r = 0.02 + ss * 0.35; S.ring.scale.set(r, r, r * 0.05); S.ring.material.color.set(accent).multiplyScalar(2.2 * (1 - ss / 0.9)); }

  /* ball 1 */
  const bl = S.bpath.getLength();
  const bu = ballU(t, c);
  const bp = S.bpath.getPointAt(Math.min(1, bu));
  const bpPrev = S.ball.position.clone();
  S.ball.position.copy(bp);
  const mv = bp.clone().sub(bpPrev); mv.y = 0;
  if (mv.lengthSq() > 1e-10 && t > 0.05) { const ax = new THREE.Vector3().crossVectors(up, mv).normalize(); S.chromeRoll.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, mv.length() / 0.018)); }
  S.ball.quaternion.copy(S.chromeRoll);
  S.ballGlow.position.copy(bp); S.ballGlow.rotation.set(Math.PI / 2, 0, 0); S.ballGlow.material.color.set(accent).multiplyScalar(t > 7.1 && t < 10.3 ? 3 : 0.6);
  S.ballLight.position.set(bp.x, 0.05, bp.z); S.ballLight.color.set(accent); S.ballLight.intensity = t > 6.9 && t < 10.4 ? 0.06 : 0;

  /* the cradle */
  const cr = cradleAngles(t);
  S.cb.forEach((b, k) => {
    b.piv.rotation.x = cr.a[k];
    const flashK = t >= 10.1 ? Math.exp(-((t - 10.1) % 0.4) * 9) * Math.pow(0.86, cr.n || 0) * (t < 14.4 ? 1 : 0) : 0;
    b.mat.emissive.set(accent); b.mat.emissiveIntensity = 0.04 + 0.9 * flashK * (k === 0 || k === 4 ? 1 : 0.55);
  });

  /* the marble: launched at 10.1 + a quarter swing, into the button at 14.0 */
  const mu = marbleU(t, c);
  const mp = S.mpath.getPointAt(clamp(mu));
  const mPrev = S.marble.position.clone(); S.marble.position.copy(mp);
  const mm = mp.clone().sub(mPrev); mm.y = 0;
  if (mm.lengthSq() > 1e-10 && t > 0.05) { const ax = new THREE.Vector3().crossVectors(up, mm).normalize(); S.marbleRoll.premultiply(new THREE.Quaternion().setFromAxisAngle(ax, mm.length() / 0.012)); }
  S.marble.quaternion.copy(S.marbleRoll);
  S.marble.material.emissive.set(accent); S.marbleGlow.position.copy(mp); S.marbleGlow.material.color.set(accent);
  S.marble.visible = S.marbleGlow.visible = t < 14.3;
  S.marble.material.emissiveIntensity = 0.8 * (t < 14.0 ? 1 : 1 - prog(t, 14.0, 14.3));
  S.marble.scale.setScalar(1 - 0.6 * prog(t, 14.0, 14.3)); S.marbleGlow.material.opacity = 0.6 * (1 - prog(t, 13.95, 14.2));

  /* the humidifier wakes at 14.0 */
  const on = ease.out(prog(t, 14.0, 14.9));
  U.setLight(accent);
  U.setLit(on);
  T.mats.glowSoft.color.set(accent).multiplyScalar(0.25 + 1.6 * on + 3 * Math.exp(-Math.max(0, t - 14.0) * 5) * (t >= 14 ? 1 : 0));
  T.product.drops.visible = T.product.halo.visible = t >= 14.15;
  if (T.mist) T.mist.visible = t >= 14.3;
  // drops fall for real until the strobe takes over at 16.4, then climb
  U.setStrobe(t >= 16.4);
  U.setRate(-0.6);
  U.setYaw(0.35 + t * 0.012);
  T.bloom.strength = 0.75 * (t > 14 ? 1 : 0.7) + 0.5 * Math.exp(-Math.max(0, t - 14.0) * 3) * (t >= 14 ? 1 : 0) + 0.3 * Math.exp(-Math.max(0, t - 16.4) * 3) * (t >= 16.4 ? 1 : 0);

  /* sunrise */
  const bg = new THREE.Color('#040506').lerp(new THREE.Color('#2a1206'), sunrise * 0.9);
  T.scene.background = bg; T.renderer.setClearColor(bg);
  c.mirror.mat.uniforms.base.value.copy(new THREE.Color('#060709').lerp(new THREE.Color('#1c0c04'), sunrise));
  c.mirror.mat.uniforms.tint.value.set(accent).multiplyScalar(0.05 * sunrise);
  U.setExposure(1 + 0.25 * sunrise);
  c.fx.wash(0.55 * sunrise, 'radial-gradient(90% 60% at 50% 38%, #ffb259 0%, #ff7a2f 45%, transparent 80%)');
  c.fx.flash(0.35 * Math.exp(-Math.max(0, t - 14.0) * 7) * (t >= 14 ? 1 : 0) + 0.25 * Math.exp(-Math.max(0, t - 21.45) * 5) * (t >= 21.45 ? 1 : 0), accent);
  // fade from black at the start, to black at the end
  document.getElementById('stage').style.filter = `brightness(${(clamp(t / 1.0) * (1 - prog(t, 23.9, 24.3))).toFixed(3)})`;

  /* words over the sunrise */
  c.wordsIn(S.brand, t, 22.3, null, { stagger: 0, dur: 0.9, rise: 80, blur: 24 });
  c.wordsIn(S.line, t, 22.75, null, { stagger: 0.08, dur: 0.6 });
  c.wordsIn(S.price, t, 23.1, null, { stagger: 0.03, dur: 0.5, rise: 30 });

  c.cam = S.cam(t);
}
