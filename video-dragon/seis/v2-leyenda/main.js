// V2 · the legend, in 2D. Rice paper; an ink drop falls and blooms into a mountain landscape in ink wash, mist and a
// red sun; a brush-painted dragon swims through it. The painting turns out to hang in a temple; we go back into it and
// the paper tears: behind it, the real dragon. Then 88 cm along a brush ruler, piece by piece; night falls and the
// dragon glows jade; red paper and a gold paper-cut; a scroll unrolls with the offer.
// The paper, the landscape, the ink bleed, the tear and the glow are one fragment shader; the dragon is drawn with brush
// strokes on a 2D canvas each frame and inked by the shader.
import * as THREE from 'three';

const TI = await (await fetch('tiempos.json')).json();
const LN = Object.fromEntries(TI.lines.map((l) => [l.id, l]));
const DUR = TI.dur, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), back: (t) => { const c = 1.6, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const wt = (id, w) => (LN[id].words.find((x) => x[0].toLowerCase().startsWith(w)) || LN[id].words[0])[1];
const $ = (s) => document.querySelector(s);

// scene times
const S2 = LN.l2.t0 - 0.3, S3 = LN.l3.t0 - 0.35, TEAR = wt('l3', 'sac') - 0.05, S4 = LN.l4.t0 - 0.35, PIEZA = wt('l4', 'pieza'), S5 = LN.l5.t0 - 0.15, GLOW = wt('l5', 'brilla') - 0.05, S6 = LN.l6.t0 - 0.25, S7 = LN.l7.t0 - 0.2;

/* ---------- the dragon, in brush strokes ---------- */
const dc = document.createElement('canvas'); dc.width = W; dc.height = H; const g = dc.getContext('2d');
// a dry-brush speckle, cut out of the ink to give it texture
const speck = document.createElement('canvas'); speck.width = speck.height = 256; { const s = speck.getContext('2d'), im = s.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random(); im.data[i + 3] = v > 0.86 ? 255 * (v - 0.86) / 0.14 : 0; } s.putImageData(im, 0, 0); }
const speckPat = g.createPattern(speck, 'repeat');
const N = 72, GAP = 15;
function trail(P, s, out) {   // head at P(s), body behind it along the same path, GAP px apart
  out[0] = P(s); let prev = out[0], total = 0, k = 1, ss = s, n = 0;
  while (k < N && n++ < 20000) { ss -= 0.004; const q = P(ss); const d = Math.hypot(q[0] - prev[0], q[1] - prev[1]); while (k < N && total + d >= k * GAP) { const f = (k * GAP - total) / d; out[k] = [prev[0] + (q[0] - prev[0]) * f, prev[1] + (q[1] - prev[1]) * f]; k++; } total += d; prev = q; }
  for (; k < N; k++) out[k] = out[k - 1];
  return out;
}
const PTS = new Array(N);
function drawDragon(pts, { scale = 1, explode = 0, t = 0, alpha = 1 } = {}) {
  g.save(); g.globalAlpha = alpha;
  const wAt = (u) => (44 * (1 - 0.78 * Math.pow(u, 1.25)) + 7) * scale;
  const nrm = (i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  g.fillStyle = '#000'; g.strokeStyle = '#000';
  if (explode < 0.01) {
    // the body as one brushed ribbon
    g.beginPath();
    for (let i = 3; i < N; i++) { const u = i / (N - 1), [nx, ny] = nrm(i), w = wAt(u); const x = pts[i][0] + nx * w, y = pts[i][1] + ny * w; i === 3 ? g.moveTo(x, y) : g.lineTo(x, y); }
    for (let i = N - 1; i >= 3; i--) { const u = i / (N - 1), [nx, ny] = nrm(i), w = wAt(u) * 0.92; g.lineTo(pts[i][0] - nx * w, pts[i][1] - ny * w); }
    g.closePath(); g.globalAlpha = alpha * 0.9; g.fill();
  } else {
    // piece by piece: each printed segment on its own, drifting apart and back
    for (let i = 3; i < N; i += 2) { const u = i / (N - 1), [nx, ny] = nrm(i), w = wAt(u); const off = explode * (18 + 26 * Math.sin(i * 1.7)) * scale; const cx = pts[i][0] + nx * off * 0.4, cy = pts[i][1] + ny * off * 0.4 + (i - N / 2) * explode * 1.4;
      g.save(); g.translate(cx, cy); g.rotate(Math.atan2(ny, nx) + explode * Math.sin(i) * 0.4); g.beginPath(); g.ellipse(0, 0, w * 0.95, GAP * 0.95 * scale, 0, 0, Math.PI * 2); g.globalAlpha = alpha * 0.9; g.fill(); g.restore(); }
  }
  // scales and the spine line: cut back into the ink
  g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round';
  for (let i = 4; i < N - 2; i += 2) { const u = i / (N - 1), [nx, ny] = nrm(i), w = wAt(u) * 0.62; const a = Math.atan2(ny, nx);
    g.lineWidth = Math.max(1.5, 3.4 * scale * (1 - u * 0.6)); g.globalAlpha = 0.85;
    for (const sd of [-1, 1]) { g.beginPath(); g.arc(pts[i][0] + nx * w * 0.45 * sd, pts[i][1] + ny * w * 0.45 * sd, w * 0.5, a + Math.PI * 0.15, a + Math.PI * 0.85); g.stroke(); } }
  g.fillStyle = speckPat; g.globalAlpha = 0.55; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  // dorsal fins: flicks of the brush along the back
  for (let i = 5; i < N - 3; i += 3) { const u = i / (N - 1), [nx, ny] = nrm(i), w = wAt(u); const bx = pts[i][0] + nx * w, by = pts[i][1] + ny * w; const tx = pts[i + 2][0] - pts[i][0], ty = pts[i + 2][1] - pts[i][1];
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + nx * 26 * scale + tx * 0.2, by + ny * 26 * scale + ty * 0.2, bx + tx * 0.9 + nx * 6, by + ty * 0.9 + ny * 6); g.lineTo(bx + tx * 0.6, by + ty * 0.6); g.closePath(); g.globalAlpha = alpha * 0.85; g.fill(); }
  // legs with claws at the chest and the hips
  for (const u of [0.2, 0.52]) { const i = Math.round(u * (N - 1)), [nx, ny] = nrm(i), w = wAt(u); for (const sd of [-1, 1]) { const bx = pts[i][0] - nx * w * 0.6 * sd * -1, by = pts[i][1] - ny * w * 0.6 * sd * -1; const sw = Math.sin(t * 3 + i + sd) * 10 * scale;
    g.lineWidth = 9 * scale; g.globalAlpha = alpha * 0.9; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + nx * 40 * sd * scale + sw, by + ny * 40 * sd * scale, bx + nx * 62 * sd * scale + sw, by + ny * 62 * sd * scale + 18 * scale); g.stroke();
    for (let c = -1; c <= 1; c++) { g.lineWidth = 4 * scale; g.beginPath(); const ex = bx + nx * 62 * sd * scale + sw, ey = by + ny * 62 * sd * scale + 18 * scale; g.moveTo(ex, ey); g.lineTo(ex + (c * 10 + nx * 12 * sd) * scale, ey + 14 * scale); g.stroke(); } } }
  // the head: snout forward along the direction of travel
  const h = pts[0], d = [pts[0][0] - pts[3][0], pts[0][1] - pts[3][1]], dl = Math.hypot(...d) || 1, ang = Math.atan2(d[1], d[0]);
  g.save(); g.translate(h[0], h[1]); g.rotate(ang); g.scale(scale * 1.45, scale * 1.45);
  g.globalAlpha = alpha;
  // mane: flames of the brush behind the head
  for (let k = 0; k < 7; k++) { const a = -1.3 + k * 0.43; g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(-60 + Math.cos(a) * 10, Math.sin(a) * 70, -95 - k * 4 + Math.sin(t * 4 + k) * 6, Math.sin(a) * 80); g.quadraticCurveTo(-55, Math.sin(a) * 30, -20, 4); g.fill(); }
  // skull, snout and the open jaw
  g.beginPath(); g.moveTo(-38, -30); g.bezierCurveTo(-10, -50, 40, -40, 78, -16); g.lineTo(96, -8); g.bezierCurveTo(100, 0, 92, 6, 80, 6); g.lineTo(40, 4); g.lineTo(84, 22); g.bezierCurveTo(70, 34, 30, 34, -10, 26); g.bezierCurveTo(-34, 20, -48, 0, -38, -30); g.fill();
  // horns sweeping back, whiskers trailing in waves
  g.lineCap = 'round'; g.lineWidth = 9;
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(-6, -36 * (sd > 0 ? 1 : 0.8)); g.bezierCurveTo(-30, -70, -70, -86 - sd * 6, -112, -78 - sd * 10); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(-50, -66); g.lineTo(-58, -96); g.stroke(); g.lineWidth = 9; }
  g.lineWidth = 3.2;
  for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(78, 2 + sd * 6); for (let k = 1; k <= 30; k++) { const s = k / 30; g.lineTo(78 - s * 260, (14 + 60 * s) * sd + Math.sin(s * 9 - t * 3 + sd) * 18 * s); } g.stroke(); }
  // the eye: cut out, with a pupil
  g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(26, -16, 12, 8, -0.2, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(40, 4); g.lineTo(80, 10); g.lineTo(44, 12); g.fill();
  g.globalCompositeOperation = 'source-over'; g.beginPath(); g.arc(29, -16, 4.5, 0, Math.PI * 2); g.fill();
  g.restore();
  g.restore();
}

/* ---------- the shader: paper, ink wash, bloom, tear, night, red paper-cut ---------- */
const canvas = $('#ink');
const R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
const dTex = new THREE.CanvasTexture(dc); dTex.generateMipmaps = true; dTex.minFilter = THREE.LinearMipmapLinearFilter;
const load = (u) => new Promise((r) => new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; r(t); }));
const [ph1, ph2] = await Promise.all([load('../../img/producto-muneca.jpg'), load('../../img/producto-colores.jpg')]);
const U = { uT: { value: 0 }, uDragon: { value: dTex }, uPhoto: { value: ph1 }, uPhoto2: { value: ph2 }, uDrop: { value: 0 }, uBloom: { value: 0 }, uLand: { value: 0 }, uPar: { value: 0 }, uTear: { value: 0 }, uNight: { value: 0 }, uGlow: { value: 0 }, uRed: { value: 0 }, uDA: { value: 1 }, uPZ: { value: 0 }, uLandVis: { value: 1 } };
const mat = new THREE.ShaderMaterial({ uniforms: U,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: /* glsl */ `
  precision highp float;
  uniform sampler2D uDragon, uPhoto, uPhoto2; uniform float uT, uDrop, uBloom, uLand, uPar, uTear, uNight, uGlow, uRed, uDA, uPZ, uLandVis;
  varying vec2 vUv;
  const float AS = 0.5625;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * n(p); p = p * 2.03 + 11.3; a *= 0.5; } return v; }
  vec3 paperCol(vec2 uv){
    float fib = fbm(uv * vec2(6.0, 70.0)) * 0.5 + fbm(uv * vec2(80.0, 9.0)) * 0.5;
    vec3 c = mix(vec3(0.94, 0.89, 0.79), vec3(0.97, 0.93, 0.85), fib);
    c -= 0.05 * smoothstep(0.85, 1.0, h(floor(uv * vec2(540.0, 960.0)))) ;
    float v = length((uv - 0.5) * vec2(1.0, 0.8)); c *= 1.0 - 0.18 * smoothstep(0.35, 0.8, v);
    return c;
  }
  // the ink wash landscape: density 0..1 and the sun
  float land(vec2 uv, out float sun){
    float ink = 0.0; vec2 sp = vec2(0.70, 0.73) + vec2(uPar * 0.02, 0.0);
    sun = smoothstep(0.088, 0.08, length((uv - sp) * vec2(1.0, 1.7778)) + (fbm(uv * 30.0) - 0.5) * 0.006);
    for (int k = 0; k < 4; k++){
      float fk = float(k);
      float x = uv.x * (1.0 + fk * 0.15) + uPar * (0.03 + fk * 0.05) + fk * 3.7;
      float ridge = 0.62 - fk * 0.11 + (fbm(vec2(x * (1.6 + fk * 0.5), fk * 4.0)) - 0.5) * (0.34 - fk * 0.04);
      ridge += 0.06 * sin(x * 3.0 + fk);
      if (uv.y < ridge){
        float wash = (0.16 + 0.17 * fk) * (0.35 + 0.65 * smoothstep(ridge - 0.22, ridge - 0.005, uv.y));
        wash *= 0.75 + 0.5 * fbm(uv * vec2(14.0, 40.0) + fk);
        float mist = smoothstep(0.45, 0.8, fbm(vec2(uv.x * 2.5 - uT * 0.025 + fk, uv.y * 7.0)));
        wash *= 1.0 - 0.7 * mist * smoothstep(ridge - 0.08, ridge - 0.3, uv.y);
        ink = 1.0 - (1.0 - ink) * (1.0 - wash);
        if (k < 1) sun *= 0.0;
      }
    }
    // pines on the nearest ridge
    return ink;
  }
  vec2 cover(vec2 uv, float ar, float zoom, vec2 off){ vec2 p = uv - 0.5; p.x *= AS / ar; if (AS / ar > 1.0) p /= AS / ar; return p / zoom + 0.5 + off; }
  void main(){
    vec2 uv = vUv;
    vec3 col = paperCol(uv);
    // the drop and its bloom reveal the landscape
    vec2 c0 = vec2(0.5, 0.56);
    float dd = length((uv - c0) * vec2(1.0, 1.7778));
    float edge = uBloom * 1.25 + (fbm(uv * 7.0 + uT * 0.1) - 0.5) * 0.12 * (0.3 + uBloom);
    float reveal = max(uLand, smoothstep(edge + 0.01, edge - 0.03, dd));
    float rim = exp(-pow((dd - edge) / 0.018, 2.0)) * (1.0 - uLand) * step(0.001, uBloom) * (1.0 - smoothstep(0.85, 1.0, uBloom));
    float sun; float ink = land(uv, sun) * reveal * uLandVis;
    col = mix(col, vec3(0.78, 0.19, 0.16), sun * reveal * 0.9 * uLandVis);
    ink = max(ink, rim * 0.55);
    // the falling drop
    vec2 dp = vec2(0.5, mix(1.05, 0.56, uDrop));
    float drop = smoothstep(0.018, 0.013, length((uv - dp) * vec2(1.0, 1.7778))) * step(0.001, uDrop) * (1.0 - step(0.999, uDrop));
    ink = max(ink, drop);
    // the brushed dragon, with a soft bleed into the paper
    float da = texture2D(uDragon, uv).a, bleed = texture2D(uDragon, uv, 2.5).a;
    float dk = clamp(da * 0.92 + bleed * 0.22, 0.0, 1.0) * uDA;
    vec3 inkCol = vec3(0.08, 0.06, 0.05);
    col = mix(col, inkCol, clamp(ink, 0.0, 1.0));
    col = mix(col, inkCol, dk);
    // night: the paper goes indigo and the dragon glows jade
    vec3 night = mix(vec3(0.05, 0.07, 0.14), vec3(0.09, 0.12, 0.22), fbm(uv * 3.0 + uT * 0.02));
    col = mix(col, night * (0.8 + 0.4 * (1.0 - length(uv - 0.5))), uNight);
    float g1 = texture2D(uDragon, uv, 3.5).a, g2 = texture2D(uDragon, uv, 5.5).a;
    vec3 jade = vec3(0.35, 1.0, 0.68);
    col = mix(col, vec3(0.75, 1.0, 0.85), da * 0.55 * uGlow * uDA); col += jade * (g1 * 0.35 + g2 * 0.3) * uGlow * uDA;
    // fireflies
    for (int i = 0; i < 18; i++){ float fi = float(i); vec2 fp = vec2(h(vec2(fi, 1.0)), fract(h(vec2(fi, 2.0)) + uT * (0.02 + 0.03 * h(vec2(fi, 3.0))))); fp.x += 0.03 * sin(uT * 1.3 + fi);
      float fd = length((uv - fp) * vec2(1.0, 1.7778)); col += jade * smoothstep(0.008, 0.0, fd) * uNight * (0.5 + 0.5 * sin(uT * 4.0 + fi * 2.0)) * 1.2; col += jade * exp(-fd * 90.0) * 0.12 * uNight; }
    // the tear: the paper opens down the middle and the real dragon is behind
    float jag = (fbm(vec2(uv.y * 26.0, 3.0)) - 0.5) * 0.08 + (n(vec2(uv.y * 120.0, 7.0)) - 0.5) * 0.015;
    float open = uTear * 0.62;
    float dx = abs(uv.x - 0.5 + jag * 0.5);
    float inside = smoothstep(open, open - 0.004, dx) * step(0.001, uTear);
    vec3 photo = texture2D(uPhoto, cover(uv, 1.0, 1.0 + 0.08 * uPZ, vec2(0.0, 0.02))).rgb;
    float fibre = smoothstep(open + 0.022, open, dx) * (1.0 - inside) * step(0.001, uTear);
    col = mix(col, vec3(0.99, 0.97, 0.92), fibre * (0.7 + 0.3 * n(uv * vec2(300.0, 40.0))));
    col *= 1.0 - 0.35 * smoothstep(open + 0.06, open + 0.02, dx) * (1.0 - inside) * step(0.001, uTear) * (1.0 - fibre);
    col = mix(col, photo, inside);
    // red paper with a gold paper-cut medallion and the product inside
    vec2 q = (uv - vec2(0.5, 0.56)) * vec2(1.0, 1.7778);
    float rd = length(q); float redEdge = uRed * 1.2 + (fbm(uv * 6.0) - 0.5) * 0.1;
    float redA = smoothstep(redEdge + 0.01, redEdge - 0.03, rd);
    vec3 red = mix(vec3(0.62, 0.1, 0.08), vec3(0.75, 0.16, 0.12), fbm(uv * vec2(5.0, 30.0)));
    float a = atan(q.y, q.x);
    float ring = smoothstep(0.006, 0.0, abs(rd - 0.33)) + smoothstep(0.004, 0.0, abs(rd - 0.355));
    float petals = smoothstep(0.004, 0.0, abs(rd - (0.385 + 0.02 * cos(a * 12.0)))) ;
    float lattice = step(0.36, rd) * step(rd, 0.44) * smoothstep(0.35, 0.0, abs(sin(a * 24.0)) * 1.0) * 0.0;
    float rays = step(0.40, rd) * step(rd, 0.47) * smoothstep(0.08, 0.0, abs(fract(a * 16.0 / 6.2832) - 0.5) - 0.38);
    vec3 gold = vec3(0.92, 0.76, 0.42);
    vec3 redCol = red; redCol = mix(redCol, gold, clamp(ring + petals + rays, 0.0, 1.0));
    vec2 pq = q / 0.31 * 0.5 + 0.5; vec3 med = texture2D(uPhoto2, pq * 0.7 + vec2(0.15, 0.22)).rgb;
    redCol = mix(redCol, med, smoothstep(0.312, 0.306, rd));
    col = mix(col, redCol, redA);
    // grain
    col += (h(uv * vec2(1080.0, 1920.0) + fract(uT * 7.0)) - 0.5) * 0.035;
    gl_FragColor = vec4(col, 1.0);
  }` });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); const scn = new THREE.Scene(); scn.add(quad); const ocam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---------- the paths of the dragon in each scene ---------- */
const swim = (s) => [-260 + s * 360, 1010 + 120 * Math.sin(s * 1.5) + 40 * Math.sin(s * 3.2)];
const rise = (s) => [330 + 230 * Math.sin(s * 1.25) + s * 40, 2050 - s * 360];
function poseFor(t) {
  g.clearRect(0, 0, W, H);
  if (t < S2 + 0.1) { if (t > 1.0) drawDragon(trail(swim, t - 1.0, PTS), { t, alpha: prog(t, 1.0, 1.4) }); }
  else if (t < S3 + 0.3) drawDragon(trail(rise, t - S2 + 0.4, PTS), { t });
  else if (t < S4) {
    // it turns to us and comes close, then the paper tears
    const k = E.inOut(prog(t, S3, TEAR));
    const P = (s) => [540 + 300 * Math.sin(s * 1.6), 1500 - s * 140];
    const pts = trail(P, 3.6 + (t - S3) * 0.5, PTS).map(([x, y]) => [540 + (x - 540) * (1 + k * 0.9), 820 + (y - 820) * (1 + k * 0.9)]);
    drawDragon(pts, { t, scale: 1 + k * 0.9, alpha: 1 - prog(t, TEAR + 0.1, TEAR + 0.5) });
  } else if (t < S5) {
    // straight down the ruler; piece by piece it comes apart and back
    const ex = Math.sin(clamp((t - PIEZA + 0.1) / 1.0) * Math.PI);
    const pts = Array.from({ length: N }, (_, i) => [470 + Math.sin(i * 0.18 + t * 2.2) * 26 * (i / N), 400 + i * 16.3]);
    drawDragon(pts, { t, explode: ex, alpha: prog(t, S4, S4 + 0.4) });
    // the brush ruler
    g.save(); g.globalAlpha = prog(t, S4 + 0.2, S4 + 0.8); g.lineCap = 'round'; g.lineWidth = 7; const L = 1180 * E.out(prog(t, S4 + 0.2, S4 + 1.2));
    g.beginPath(); g.moveTo(820, 400); g.lineTo(820, 400 + L); g.stroke();
    for (let k = 0; k <= 22; k++) { const y = 400 + k * (1180 / 22); if (y > 400 + L) break; g.lineWidth = k % 11 === 0 ? 6 : 3; g.beginPath(); g.moveTo(820, y); g.lineTo(820 - (k % 11 === 0 ? 50 : 26), y); g.stroke(); }
    g.font = 'italic 700 120px CormorantI'; g.textAlign = 'left'; g.globalAlpha = prog(t, wt('l4', 'ochenta'), wt('l4', 'ochenta') + 0.4); g.fillText('88', 850, 1000); g.font = 'italic 600 64px CormorantI'; g.fillText('cm', 860, 1070);
    g.restore();
  } else if (t < S6 + 0.3) {
    // it moves as in the paintings, a travelling wave
    const pts = Array.from({ length: N }, (_, i) => [540 + 230 * Math.sin(i * 0.11 - t * 2.4) * (0.35 + 0.65 * i / N), 380 + i * 16.2]);
    drawDragon(pts, { t, alpha: prog(t, S5 - 0.1, S5 + 0.3) * (1 - prog(t, S6, S6 + 0.3)) });
  }
  dTex.needsUpdate = true;
}

/* ---------- the banner: a scroll unrolls ---------- */
$('#banner').innerHTML = `<div style="position:absolute;left:0;right:0;top:0;height:1480px;padding:70px 60px;box-sizing:border-box;text-align:center;color:#1a120d">
  <div style="font:400 120px/1 Brush, Han;color:#b3241e">龍</div>
  <div style="font:700 92px/1 Cormorant;letter-spacing:.12em;margin-top:10px">LÓNG</div>
  <div style="font:italic 600 44px CormorantI;color:#5b4a3c;margin-top:12px">el dragón articulado</div>
  <div style="margin:40px auto 0;width:640px;height:640px;border-radius:50%;overflow:hidden;border:10px solid #b3241e;box-shadow:0 0 0 6px #e9c46a"><img src="../../img/producto-muneca.jpg" style="width:100%;height:100%;object-fit:cover"></div>
  <div style="font:italic 600 46px CormorantI;color:#5b4a3c;margin-top:38px">88 cm · articulado · brilla en la oscuridad</div>
  <div style="font:700 130px/1 Cormorant;margin-top:26px">21,95 €</div>
  <div style="font:italic 600 50px CormorantI;color:#b3241e;margin-top:8px">o dos por 32,95 €</div>
  <div style="position:absolute;right:90px;bottom:80px;width:150px;height:150px;border-radius:14px;background:#b3241e;color:#f6e9d2;font:900 54px/66px Han;display:grid;place-items:center;transform:rotate(-6deg);box-shadow:inset 0 0 0 6px #b3241e, inset 0 0 0 10px rgba(246,233,210,.7)">吉<br>祥</div></div>`;

/* ---------- captions: they bleed in like ink ---------- */
const capEl = $('#cap'); let shown = null;
function captions(t, color) {
  const l = TI.lines.find((x) => t >= x.t0 - 0.05 && t < x.t1 + 0.4);
  if (!l || t > S7) { capEl.style.opacity = 0; return; }
  if (shown !== l) { capEl.innerHTML = l.words.map((w) => `<span>${w[0]}</span>`).join(''); shown = l; }
  capEl.style.opacity = 1 - prog(t, l.t1 + 0.2, l.t1 + 0.4); capEl.style.color = color;
  [...capEl.children].forEach((s, i) => { const p = prog(t, l.words[i][1] - 0.04, l.words[i][1] + 0.28); s.style.opacity = p; s.style.filter = p < 1 ? `blur(${(1 - p) * 9}px)` : 'none'; s.style.transform = `translateY(${(1 - E.out(p)) * 10}px)`; });
}

/* ---------- one frame ---------- */
function render(t) {
  poseFor(t);
  U.uT.value = t; U.uPar.value = t * 0.25;
  U.uDrop.value = prog(t, 0.35, 0.8); U.uBloom.value = E.out(prog(t, 0.8, 3.2));
  U.uLand.value = t > 3.2 ? 1 : 0; U.uLandVis.value = 1 - prog(t, S3 + 0.2, S3 + 0.6);
  U.uTear.value = E.inOut(prog(t, TEAR, TEAR + 0.75)) * (1 - prog(t, S4 - 0.2, S4 + 0.1)); U.uPZ.value = prog(t, TEAR, S4);
  U.uNight.value = E.inOut(prog(t, GLOW - 0.25, GLOW + 0.3)) * (1 - prog(t, S6 - 0.1, S6 + 0.3)); U.uGlow.value = U.uNight.value * (0.85 + 0.15 * Math.sin(t * 3));
  U.uRed.value = E.out(prog(t, S6, S6 + 1.3)); U.uDA.value = 1;
  R.render(scn, ocam);
  // the painting hangs in a temple, then we go back into it
  const out = E.inOut(prog(t, S2, S2 + 0.8)) * (1 - E.inOut(prog(t, S3 - 0.1, S3 + 0.6)));
  $('#frame').style.transform = `translateY(${-out * 40}px) scale(${lerp(1, 0.52, out)})`;
  ['#mount', '#rodT', '#rodB'].forEach((s) => ($(s).style.opacity = clamp(out * 3)));
  $('#temple').style.opacity = clamp(out * 2);
  ['#lan1', '#lan2'].forEach((s, i) => ($(s).style.transform = `rotate(${Math.sin(t * 1.4 + i * 2) * 5}deg)`));
  // calligraphy and the seal, painted on in the first scene
  const cp = prog(t, wt('l1', 'leyenda'), wt('l1', 'leyenda') + 0.8); $('#cal').style.opacity = cp * (1 - prog(t, S3 + 0.2, S3 + 0.6)); $('#cal').style.filter = `blur(${(1 - cp) * 14}px)`;
  const sp = E.back(prog(t, wt('l1', 'suerte'), wt('l1', 'suerte') + 0.25)); $('#seal').style.opacity = clamp((t - wt('l1', 'suerte')) * 6) * (1 - prog(t, S3 + 0.2, S3 + 0.6)); $('#seal').style.transform = `scale(${lerp(2, 1, sp)}) rotate(-5deg)`;
  // the scroll unrolls with the offer
  const un = E.out(prog(t, S7, S7 + 1.2)); $('#banner').style.height = un * 1480 + 'px';
  $('#bRodT').style.top = 160 + 'px'; $('#bRodB').style.top = 160 + 30 + un * 1480 + 'px'; ['#bRodT', '#bRodB'].forEach((s) => ($(s).style.opacity = clamp((t - S7 + 0.1) * 6)));
  const capCol = out > 0.5 ? '#f1d48a' : U.uNight.value > 0.5 ? '#d9fff0' : U.uRed.value > 0.5 ? '#f3d58b' : U.uTear.value > 0.3 ? '#fff' : '#1a120d';
  const darkBg = U.uTear.value > 0.3 || out > 0.5 || U.uNight.value > 0.5 || U.uRed.value > 0.5;
  capEl.style.textShadow = darkBg ? '0 3px 18px rgba(0,0,0,.75), 0 0 40px rgba(0,0,0,.5)' : '0 0 18px rgba(246,238,220,.95), 0 0 36px rgba(246,238,220,.9), 0 0 60px rgba(246,238,220,.7)';
  captions(t, capCol);
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['italic 600 60px CormorantI', '700 60px Cormorant', '400 60px Brush', '900 60px Han']) await document.fonts.load(f, 'Aá龍吉祥');
const sfx = [
  { t: 0.75, tipo: 'ink', g: 0.55 }, { t: 0.8, tipo: 'gong', g: 0.35 }, { t: wt('l1', 'suerte'), tipo: 'thump', g: 0.25 },
  { t: S2, tipo: 'whoosh', g: 0.2 }, { t: S3 - 0.1, tipo: 'whoosh', g: 0.25 }, { t: TEAR, tipo: 'tear', g: 0.6 }, { t: TEAR + 0.4, tipo: 'impact', g: 0.3 },
  { t: S4 + 0.2, tipo: 'paper', g: 0.3 }, { t: PIEZA - 0.05, tipo: 'segclick', g: 0.5 }, { t: PIEZA + 0.4, tipo: 'segclick', g: 0.5 },
  { t: GLOW, tipo: 'shimmer', g: 0.4 }, { t: S6, tipo: 'gong', g: 0.3 }, { t: S7, tipo: 'paper', g: 0.45 }, { t: S7 + 1.0, tipo: 'thump', g: 0.3 },
];
window.__cues = { dur: DUR, musica: { archivo: '595.mp3', desde: 30.0, gain: 0.55, duck: 0.45, fadein: 1.5, fadeout: 2.0 }, voz: { gain: 1 }, sfx, ambiente: [{ tipo: 'viento', desde: 0, hasta: DUR, g: 0.5 }] };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
