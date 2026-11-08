// The film engine: one page renders any of the four ads (film.html?v=1..4) frame by frame.
// window.__render(t) draws the frame at t seconds (frames must come in order: the drops and mist advance by dt);
// window.__dur is the length. Without ?record the film plays in a loop in the browser.
import * as THREE from 'three';
import { createUprainScene } from '../../uprain/js/uprain3d.js';

const q = new URLSearchParams(location.search);
const film = await import(`./v${q.get('v') || '1'}.js`);
const canvas = document.getElementById('gl');
const ui = document.getElementById('ui');
const $ = (id) => document.getElementById(id);

/* ---------- maths ---------- */
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  in: (t) => t * t * t,
  back: (t) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  spring: (t) => 1 - Math.exp(-6 * t) * Math.cos(10 * t),
};
export const mixColor = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t)).getHexString();

// a camera path through keys {t, pos, at, fov, roll}: Catmull-Rom between keys, so it never stops at a key
export function camPath(keys) {
  const cr = (p0, p1, p2, p3, u) => {
    const u2 = u * u, u3 = u2 * u;
    return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
  };
  const DEF = { roll: 0, ap: 0.012 };
  keys = keys.flat().filter((k, i, all) => i === 0 || k.t > all[i - 1].t + 1e-6);   // arcs and single keys mixed, no repeated time
  const v = (k, f, i) => { const x = k[f] ?? DEF[f]; return Array.isArray(x) ? x[i] : x; };
  return (t) => {
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(keys.length - 1, i + 2)];
    const u0 = clamp((t - b.t) / (c.t - b.t));
    // speed ramp: ease toward each key without ever stopping (premium curve, mixed with linear time)
    const r = c.ramp ?? 0.55;
    const u = u0 * (1 - r) + ease.inOut(u0) * r;
    const get = (f, n) => Array.from({ length: n }, (_, j) => cr(v(a, f, j), v(b, f, j), v(c, f, j), v(d, f, j), u));
    const opt = (f, d) => (keys.some((k) => k[f] != null) ? get(f, 1)[0] : d);
    return { pos: get('pos', 3), at: get('at', 3), fov: get('fov', 1)[0], roll: opt('roll', 0), ap: opt('ap', null) };
  };
}

// keys along a real arc round a point: angle a0 to a1 (radians, 0 = +z), radius and height eased between ends
export function orbit({ t0, t1, at, a0, a1, r0, r1 = r0, y0, y1 = y0, fov = 32, fov1 = fov, roll = 0, ap = null, n = 6 }) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, k = u;
    const a = a0 + (a1 - a0) * k, r = r0 + (r1 - r0) * k, y = y0 + (y1 - y0) * k;
    const key = { t: t0 + (t1 - t0) * u, pos: [at[0] + Math.sin(a) * r, y, at[2] + Math.cos(a) * r], at: [...at], fov: fov + (fov1 - fov) * k, roll, ramp: 0.15 };
    if (ap != null) key.ap = ap;
    return key;
  });
}
// keys that chase a moving point p(t): offset(t, p, dir) gives the camera position, lead is how far ahead it looks
export function follow({ t0, t1, p, offset, lead = 0.15, fov = 30, roll = 0, ap = null, n = 6 }) {
  n = Math.max(n, Math.ceil((t1 - t0) * 10));          // dense keys: a portrait frame is only ~17 degrees wide
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = t0 + (t1 - t0) * (i / n);
    const a = p(t), b = p(t + 0.05), dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const L = Math.hypot(...dir) || 1; const d = dir.map((x) => x / L);
    const look = p(t + lead);
    const key = { t, pos: offset(t, a, d), at: look, fov, roll, ramp: 0 };
    if (ap != null) key.ap = ap;
    return key;
  });
}

/* ---------- the 3D scene ---------- */
const o = film.scene || {};
let mirror = null;
const U = createUprainScene(canvas, Object.assign({
  view: 'hero', bg: '#050608', light: 'hielo', finish: 'grafito', live: false, manual: true, preserve: true, dpr: 1,
  rate: -0.55, strobe: true, mist: true, floor: true, bloom: 1.25, msaa: 0, dof: { focus: 0.6, aperture: 0.012, maxblur: 0.007 },
  beforeRender: (time) => mirror && mirror.update(),
}, o, q.has('msaa') ? { msaa: +q.get('msaa') } : {}, q.get('dof') === '0' ? { dof: null } : {}));
const { scene, camera, renderer } = U.three;

// a glossy floor that reflects the scene: the scene drawn again from a camera mirrored under the floor
function makeMirror({ color = '#060709', strength = 0.42, fade = 1.6 } = {}) {
  const rt = new THREE.WebGLRenderTarget(540, 960, { type: THREE.HalfFloatType });
  const vcam = new THREE.PerspectiveCamera();
  const texMat = new THREE.Matrix4();
  const mat = new THREE.ShaderMaterial({
    uniforms: { tex: { value: rt.texture }, texMat: { value: texMat }, base: { value: new THREE.Color(color) }, strength: { value: strength }, fade: { value: fade }, tint: { value: new THREE.Color('#000000') } },
    vertexShader: 'uniform mat4 texMat; varying vec4 vUv; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vUv = texMat * vec4(position, 1.0); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform sampler2D tex; uniform vec3 base; uniform vec3 tint; uniform float strength; uniform float fade; varying vec4 vUv; varying vec3 vW; void main(){ vec2 uv = vUv.xy / vUv.w; vec3 r = (texture2D(tex, uv).rgb + texture2D(tex, uv + vec2(0.002, 0.0)).rgb + texture2D(tex, uv - vec2(0.002, 0.0)).rgb) / 3.0; float d = length(vW.xz); float f = exp(-d * d / (fade * fade)); gl_FragColor = vec4(base + tint * f + r * strength * (0.35 + 0.65 * f), 1.0); }',
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.0002; scene.add(floor);
  const fwd = new THREE.Vector3();
  return {
    mat, floor,
    update() {
      camera.updateMatrixWorld();
      vcam.position.set(camera.position.x, -camera.position.y, camera.position.z);
      fwd.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      vcam.up.set(0, 1, 0).applyQuaternion(camera.quaternion); vcam.up.y *= -1;
      vcam.lookAt(fwd.x, -fwd.y, fwd.z);
      vcam.projectionMatrix.copy(camera.projectionMatrix);
      vcam.updateMatrixWorld();
      texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
      texMat.multiply(vcam.projectionMatrix).multiply(vcam.matrixWorldInverse).multiply(floor.matrixWorld);
      floor.visible = false;
      renderer.setRenderTarget(rt); renderer.render(scene, vcam); renderer.setRenderTarget(null);
      floor.visible = true;
    },
  };
}
if (o.mirror !== false) mirror = makeMirror(o.mirrorOpts);

/* ---------- the 2D layer: words, flash, wash, grain ---------- */
// a line of words; each word can be animated on its own (style per word, per frame)
export function words(html, css = {}) {
  const el = document.createElement('div'); el.className = 't';
  Object.assign(el.style, css);
  el.innerHTML = html.split(/(\s+)/).map((w) => (/^\s+$/.test(w) ? w : `<span class="w">${w}</span>`)).join('');
  ui.appendChild(el);
  return { el, ws: [...el.querySelectorAll('.w')] };
}
export function box(html, css = {}) {
  const el = document.createElement('div'); el.style.position = 'absolute'; Object.assign(el.style, css); el.innerHTML = html; ui.appendChild(el); return el;
}
// in at a, out at b: words rise from blur one after another
export function wordsIn(line, t, a, b, { stagger = 0.06, dur = 0.5, rise = 60, out = 0.35, blur = 14 } = {}) {
  line.ws.forEach((w, i) => {
    const k = ease.outExpo(prog(t, a + i * stagger, a + i * stagger + dur));
    const ko = b != null ? ease.in(prog(t, b, b + out)) : 0;
    w.style.opacity = (k * (1 - ko)).toFixed(3);
    w.style.transform = `translateY(${((1 - k) * rise - ko * rise * 0.6).toFixed(1)}px) scale(${(0.96 + 0.04 * k).toFixed(3)})`;
    w.style.filter = `blur(${((1 - k) * blur + ko * blur).toFixed(1)}px)`;
  });
}
const flash = $('flash'), wash = $('wash'), grain = $('grain');
{
  const c = document.createElement('canvas'); c.width = c.height = 240; const g = c.getContext('2d'); const d = g.createImageData(240, 240);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`;
}
export const fx = {
  flash(k, color = '#ffffff') { flash.style.opacity = clamp(k).toFixed(3); flash.style.background = color; },
  wash(k, color) { wash.style.opacity = clamp(k).toFixed(3); wash.style.background = color; },
};

/* ---------- the clock ---------- */
const ctx = { THREE, U, scene, camera, renderer, mirror, ui, words, box, wordsIn, fx, camPath, orbit, follow, ease, clamp, lerp, prog, smooth, mixColor };
await film.setup(ctx);
await document.fonts.ready;
const fps = 30;
const SUB = +(q.get('sub') || film.SUB || 2);          // subframes per frame, averaged: motion blur
const SHUTTER = 0.5;                                    // a 180-degree shutter: half the frame interval
const acc = document.createElement('canvas'); acc.width = 1080; acc.height = 1920;
acc.style.cssText = 'position:absolute;inset:0;width:1080px;height:1920px';
canvas.after(acc); const g2 = acc.getContext('2d');
canvas.style.visibility = 'hidden';
// handheld: slow layered sines, the ambient layer of the camera
const n3 = (t, s) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.9 + s * 2.1) * 0.3 + Math.sin(t * 6.1 + s * 3.7) * 0.1;
let last = -1, frameNo = 0;
function drawAt(t) {
  const dt = last < 0 ? 1 / fps / SUB : Math.max(0, t - last);
  last = t;
  film.update(ctx, t, dt);
  const c = ctx.cam;
  if (c) {
    const h = (film.HANDHELD ?? 1) * (ctx.shake ?? 1);
    const pos = [c.pos[0] + n3(t, 1) * 0.0035 * h, c.pos[1] + n3(t, 2) * 0.0028 * h, c.pos[2] + n3(t, 3) * 0.0035 * h];
    U.lookFrom(pos, c.at, c.fov, (c.roll || 0) + n3(t, 4) * 0.004 * h);
    const T = U.three;
    if (T.bokeh) {
      const d = Math.hypot(pos[0] - c.at[0], pos[1] - c.at[1], pos[2] - c.at[2]);
      T.bokeh.uniforms.focus.value = c.focus ?? d;
      T.bokeh.uniforms.aperture.value = c.ap ?? 0.012;
    }
  }
  // half-pixel jitter per subframe: the averaged subframes smooth the edges
  const J = [[0.25, 0.25], [-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25]][subK % 4];
  U.three.camera.setViewOffset(1080, 1920, J[0], J[1], 1080, 1920);
  U.step(dt);
}
let subK = 0;
function render(t) {
  frameNo++;
  grain.style.transform = `translate(${(frameNo * 37) % 120 - 60}px, ${(frameNo * 53) % 120 - 60}px)`;
  for (let k = 0; k < SUB; k++) {
    const tk = t - (SHUTTER / fps) * (1 - (k + 1) / SUB);
    subK = k; drawAt(Math.max(0, tk));
    g2.globalAlpha = 1 / (k + 1);
    g2.drawImage(canvas, 0, 0, 1080, 1920);
  }
  g2.globalAlpha = 1;
}
window.__dur = film.DUR;
window.__render = render;
window.__ready = Promise.resolve(true);
if (!q.has('record')) {
  let t0 = performance.now();
  const loop = (n) => { let t = (n - t0) / 1000; if (t > film.DUR) { t0 = n; t = 0; last = -1; } render(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
