// LÓNG ad: a 22 s vertical film, rendered frame by frame. window.__render(t) draws the frame at t seconds
// (call in order: the dragon's frames carry over), window.__dur is the length. Without ?record it plays in a loop.
// The beat is 120 BPM (a bar every 2 s) and every cut, word and hit sits on it, in step with audio/music.py.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDragon, SEG, SPACING } from '../../dragon/js/dragon.js';
import { createPhoto } from '../../dragon/js/photo.js';

const DUR = 22, W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)), in: (t) => t * t * t,
  back: (t) => { const c = 2.2, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- renderer, the harbour and the dragons ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping;
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
const camera = new THREE.PerspectiveCamera(38, W / H, 0.05, 200);
const photo = createPhoto(renderer, '../dragon/img/hongkong.jpg'); photo.resize(W, H);

const main = createDragon(scene);
const extra = ['galaxia', 'plata', 'fuego'].map((c) => { const d = createDragon(scene); d.setColor(c); d.group.visible = false; return d; });
const key = new THREE.DirectionalLight('#ffd9b0', 1.6); key.position.set(-3, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight('#5fd0ff', 2.0); rim.position.set(4, 2, -5); scene.add(rim);
const neon = new THREE.PointLight('#ff3b5c', 6, 14, 2); neon.position.set(3, 1, -2); scene.add(neon);
const front = new THREE.PointLight('#fff1d6', 3, 10, 2); scene.add(front);

// the flaming pearl of the finale
const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.26, 48, 32), new THREE.MeshPhysicalMaterial({ color: '#fff4e0', roughness: 0.08, clearcoat: 1, iridescence: 1, emissive: new THREE.Color('#ffb36b'), emissiveIntensity: 1.2 }));
const pearlLight = new THREE.PointLight('#ffb36b', 0, 6, 2); pearl.add(pearlLight); pearl.visible = false; scene.add(pearl);

// motes drifting in the air: gold over the lit city, green spores when it goes dark
const MOTES = 520;
const motePos = new Float32Array(MOTES * 3), moteSeed = new Float32Array(MOTES);
for (let i = 0; i < MOTES; i++) { motePos.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 6 - 1], i * 3); moteSeed[i] = Math.random(); }
const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3)); moteGeo.setAttribute('seed', new THREE.BufferAttribute(moteSeed, 1));
const moteMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { time: { value: 0 }, glow: { value: 0 }, amt: { value: 1 } },
  vertexShader: `attribute float seed; uniform float time; varying float vS;
    void main(){ vec3 p = position; p.y += mod(time * (0.15 + seed * 0.3) + seed * 16.0, 16.0) - 8.0 - position.y * 0.0;
      p.x += sin(time * 0.6 + seed * 40.0) * 0.25; vS = seed;
      vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = (4.0 + seed * 9.0) * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float time, glow, amt; varying float vS;
    void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d);
      float tw = 0.55 + 0.45 * sin(time * 3.0 + vS * 60.0);
      vec3 c = mix(vec3(1.0, 0.78, 0.42), vec3(0.45, 1.0, 0.7), glow);
      gl_FragColor = vec4(c * a * tw * amt * 0.55, 1.0); }`,
});
scene.add(new THREE.Points(moteGeo, moteMat));

/* ---------- post: bloom, then a lens pass (zoom blur, colour fringes, flash, vignette, grain) ---------- */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(photo.scene, photo.camera));
const dpass = new RenderPass(scene, camera); dpass.clear = false; composer.addPass(dpass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.5, 0.6, 0.85); composer.addPass(bloom);
composer.addPass(new OutputPass());
const lens = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, zoom: { value: 0 }, rgb: { value: 0 }, flash: { value: 0 }, time: { value: 0 }, dim: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float zoom, rgb, flash, time, dim; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5; vec3 c = vec3(0.0);
      float k = rgb * 0.012 + 0.0012;
      if (zoom > 0.002) {
        for (int i = 0; i < 12; i++) { float s = 1.0 - zoom * 0.16 * float(i) / 11.0;
          c.r += texture2D(tDiffuse, 0.5 + d * s * (1.0 + k)).r; c.g += texture2D(tDiffuse, 0.5 + d * s).g; c.b += texture2D(tDiffuse, 0.5 + d * s * (1.0 - k)).b; }
        c /= 12.0;
      } else { c = vec3(texture2D(tDiffuse, 0.5 + d * (1.0 + k)).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, 0.5 + d * (1.0 - k)).b); }
      c *= 1.0 - dim;
      c *= mix(1.0, smoothstep(1.05, 0.35, length(d * vec2(1.0, 0.8))), 0.55);
      c += (hash(vUv * vec2(1080.0, 1920.0) + fract(time * 7.0) * 100.0) - 0.5) * 0.035;
      c = mix(c, vec3(1.0, 0.97, 0.9), flash);
      gl_FragColor = vec4(c, 1.0);
    }`,
});
composer.addPass(lens);

/* ---------- the dragon's spine, laid along a path or a shape ---------- */
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
const spines = extra.map(() => Array.from({ length: SEG + 1 }, () => new THREE.Vector3()));
// head at c(tau), the body behind it along the same path, a piece every SPACING
function alongPath(c, tau, out) {
  out[0].copy(c(tau)); let prev = out[0].clone(), total = 0, k = 1, tt = tau, n = 0;
  while (k <= SEG && n++ < 40000) {
    tt -= 0.0025; const q = c(tt); const seg = prev.distanceTo(q);
    while (k <= SEG && total + seg >= k * SPACING) { out[k].lerpVectors(prev, q, (k * SPACING - total) / seg); k++; }
    total += seg; prev = q;
  }
  for (; k <= SEG; k++) out[k].copy(out[k - 1]);
  // a living ripple through the body
  for (let i = 1; i <= SEG; i++) out[i].y += Math.sin(tau * 5.5 - i * 0.45) * 0.025 * (i / SEG);
}

/* ---------- the shots ---------- */
const BEAT = 0.5;
// hits drive the lens: zoom blur, colour fringes, flash and shake (time, strength)
const HITS = [[0, 1.2], [2, 1], [6, 1], [11, 1.4], [14, 0.8], [14.5, 0.8], [15, 0.8], [15.5, 0.8], [16, 1], [17, 1.1], [21, 0.8]];
const COLOR_CUTS = [['arcoiris', 14], ['galaxia', 14.5], ['plata', 15], ['fuego', 15.5]];
const cam = { pos: V(0, 0, 5), at: V(0, 0, 0), fov: 38 };

function shot(t) {
  let lights = 1, glow = 0, zoomBg = 1.2, scroll = 0, colour = 'arcoiris', four = false, ring = false;
  if (t < 2) {
    // HOOK: the dragon rushes at us out of the city, spiralling, and stops face to face
    const c = (s) => { const R = 0.95 * Math.exp(-1.25 * s) + 0.14; return V(R * Math.sin(5 * s) + Math.sin(s * 2.4) * 0.12, R * Math.cos(5 * s) * 0.7 + 0.05, 1.15 - 15 * Math.exp(-2.5 * s)); };
    alongPath(c, t, spine);
    const p = E.out(prog(t, 0, 2));
    cam.pos.set(0.15 * Math.sin(t * 1.3), 0.12, 4.6 - p * 0.55); cam.at.set(0, 0.02, 0); cam.fov = 40 - p * 4;
    zoomBg = 1.6 - p * 0.35;
  } else if (t < 6) {
    // 88 CM: it climbs through the frame in long S-curves, the camera rising with it
    const c = (s) => { const u = s - 2; return V(1.0 * Math.sin(2.2 * u + 0.6), -5.2 + 2.5 * u, 0.55 * Math.cos(1.6 * u)); };
    alongPath(c, t, spine);
    const u = t - 2, hy = -5.2 + 2.5 * u;
    cam.pos.set(0.9 - u * 0.25, hy - 2.2, 7.4); cam.at.set(0, hy - 1.5, 0); cam.fov = 40;
    zoomBg = 1.18; scroll = prog(t, 2, 6);
  } else if (t < 10) {
    // EVERY SCALE MOVES: a close orbit as it winds up a spiral
    const c = (s) => { const u = s - 6; return V(0.85 * Math.cos(2.3 * u), -1.0 + 0.3 * u, 0.85 * Math.sin(2.3 * u)); };
    alongPath(c, t, spine);
    const u = t - 6, hy = -1.0 + 0.3 * u, a = 0.4 + 0.42 * u, r = 3.3 - 0.35 * u;
    cam.pos.set(Math.sin(a) * r, hy + 0.9, Math.cos(a) * r); cam.at.set(0, hy - 0.25, 0); cam.fov = 34;
    zoomBg = 1.38;
  } else if (t < 14) {
    // LIGHTS OUT: the city switches off and the dragon glows
    const c = (s) => { const u = s - 10; return V(1.35 * Math.sin(1.1 * u + 0.3), 0.3 + 0.75 * Math.sin(2.2 * u + 0.6), 0.7 * Math.cos(1.1 * u + 0.3)); };
    alongPath(c, t, spine);
    const u = t - 10;
    cam.pos.set(0.25 * Math.sin(u * 0.5), 0.4, 7.4 - E.inOut(prog(t, 10, 14)) * 1.6); cam.at.set(0, 0.3, 0); cam.fov = 38;
    lights = lerp(1, 0.06, E.out(prog(t, 10, 10.12)));
    glow = E.expo(prog(t, 10.9, 11.15)) * (0.75 + 0.25 * Math.sin(t * 3));
    zoomBg = 1.22 + u * 0.03;
  } else if (t < 16) {
    // FOUR COLOURS: a cut on every beat, a new angle and a new colour
    const c = (s) => { const u = s - 14; return V(-0.4 + 0.8 * Math.sin(2.6 * u), -1.6 + 1.4 * u, 0.55 * Math.cos(2.1 * u)); };
    alongPath(c, t, spine);
    const i = Math.min(3, Math.floor((t - 14) / BEAT)), v = (t - 14 - i * BEAT) / BEAT;
    colour = COLOR_CUTS[i][0];
    const h = spine[0];
    const A = [[V(0.7, -0.2, 3.2), V(0.4, -0.25, 2.6)], [V(-1.7, -1.6, 2.6), V(-1.4, -1.2, 2.2)], [V(2.6, 0.25, 1.0), V(2.2, 0.3, 1.6)], [V(0.3, 2.4, 2.4), V(-0.2, 2.0, 2.0)]][i];
    cam.pos.copy(A[0]).lerp(A[1], E.out(v)).multiplyScalar(1.55).add(h); cam.at.copy(h).add(V(0, -0.15, 0)).addScaledVector(spine[8].clone().sub(h), 0.35); cam.fov = 36;
    zoomBg = 1.3 + i * 0.05;
  } else if (t < 17) {
    // WHICH ONE? all four hanging side by side, as in the product photo
    four = true;
    const p = E.out(prog(t, 16, 17));
    cam.pos.set(0, 0.9, 8.6 - p * 0.7); cam.at.set(0, 0.8, 0); cam.fov = 38;
    zoomBg = 1.25;
  } else {
    // THE OFFER: the dragon makes a ring round the flaming pearl, above the price
    ring = true;
    const tilt = 0.5, cy = 1.15;
    const c = (s) => { const u = s - 17, a = 1.7 * u; const x = 1.08 * Math.cos(a), y0 = 0.16 * Math.sin(3 * a), z = 1.08 * Math.sin(a); return V(x, cy + y0 * Math.cos(tilt) - z * Math.sin(tilt) * 0.55, z * Math.cos(tilt) + y0 * Math.sin(tilt)); };
    alongPath(c, t, spine);
    const p = E.inOut(prog(t, 17, 22));
    cam.pos.set(0.4 * Math.sin(p * 1.2), 0.7, 6.9 - p * 0.6); cam.at.set(0, 0.5, 0); cam.fov = 38;
    zoomBg = 1.15 + p * 0.08;
  }
  return { lights, glow, zoomBg, scroll, colour, four, ring };
}

function hangSpines(t) {
  // the main dragon and the three others, held by the head and hanging, swaying a little
  const xs = [-1.08, -0.36, 0.36, 1.08];
  const set = (out, i) => {
    for (let k = 0; k <= SEG; k++) {
      const f = k / SEG, sw = Math.sin(t * 1.8 + i * 1.3 - k * 0.12) * 0.07 * f;
      const curl = Math.max(0, 1 - k / 4);
      out[k].set(xs[i] + sw + Math.sin(k * 0.5 + i) * 0.03, 1.55 - k * SPACING * 0.985 + curl * 0.05, 0.3 * curl * curl + Math.sin(k * 0.3 + i) * 0.04);
    }
  };
  set(spine, 0); spines.forEach((s, i) => set(s, i + 1));
}

/* ---------- the words ---------- */
const ui = document.getElementById('ui');
// a block of words that pop in one by one and blow away together; lines: [[text, className, fontPx], ...]
function block(lines, top, t0, t1, opts = {}) {
  const el = document.createElement('div'); el.className = 'blk shadow'; el.style.top = top + 'px'; ui.appendChild(el);
  const words = [];
  lines.forEach(([text, cls, px], li) => {
    const line = document.createElement('div'); line.className = cls.replace('gold', ''); line.style.fontSize = px + 'px'; if (li) line.style.marginTop = (opts.gap ?? 14) + 'px';
    text.split(' ').forEach((wd, wi) => { const s = document.createElement('span'); s.className = 'w' + (cls.includes('gold') ? ' gold' : ''); s.textContent = wd; line.appendChild(s); if (wi < text.split(' ').length - 1) line.appendChild(document.createTextNode(' ')); words.push(s); });
    el.appendChild(line);
  });
  return { el, words, t0, t1, stagger: opts.stagger ?? 0.09, kind: opts.kind ?? 'pop' };
}
const blocks = [
  block([['¿Por qué todo el mundo', 'sub', 50], ['quiere este dragón?', 'h gold', 128]], 250, 0.12, 1.92, { stagger: 0.1 }),
  block([['de escamas que se mueven', 'sub', 46]], 540, 2.6, 5.9),
  block([['Cada escama', 'h', 118], ['se mueve', 'h gold', 150]], 260, 6.15, 9.85),
  block([['Impreso en 3D · totalmente articulado', 'chip', 36]], 1270, 6.6, 9.85, { stagger: 0.05 }),
  block([['apaga la luz…', 'sub', 52]], 820, 10.15, 10.9, { stagger: 0.12 }),
  block([['Brilla', 'h glowT', 210], ['en la oscuridad', 'h', 92]], 250, 11.0, 13.9, { stagger: 0.12, gap: 6 }),
  block([['¿Cuál eliges?', 'h gold', 124], ['te leo en comentarios', 'sub', 42]], 240, 16.0, 16.97, { stagger: 0.08 }),
  block([['El regalo que nadie espera', 'sub', 44]], 1700, 18.0, 21.9, { stagger: 0.07 }),
];
// the glowing word
const glowStyle = document.createElement('style');
glowStyle.textContent = '.glowT{ color:#d8ffe6; text-shadow: 0 0 22px #6dffb0, 0 0 60px #2bff8a, 0 0 120px #13d46a; }';
document.head.appendChild(glowStyle);
// the big 88 of section two, counted up
const big = document.createElement('div'); big.className = 'blk shadow'; big.style.top = '280px';
big.innerHTML = '<div class="h gold" style="font-size:250px;line-height:.85;white-space:nowrap"><span id="n88">0</span><span style="font-size:130px"> CM</span></div>';
ui.appendChild(big);
// the colour names
const colourNames = { arcoiris: ['Arcoíris', 'linear-gradient(90deg,#ffd23f,#9be15d,#38c6d9,#5b7cff,#b45cff,#ff6fa8)'], galaxia: ['Galaxia', 'linear-gradient(90deg,#7b45f0,#a37cff,#d8c25a,#3e5ee0)'], plata: ['Plata', 'linear-gradient(90deg,#ffffff,#b7bdc6,#f4f6f9)'], fuego: ['Fuego', 'linear-gradient(90deg,#ffcf4a,#ff6a1f,#e8222f)'] };
const cname = document.createElement('div'); cname.className = 'blk shadow'; cname.style.top = '250px';
cname.innerHTML = '<div class="count" id="cc">01 / 04</div><div class="h" id="cn" style="font-size:170px;margin-top:10px;-webkit-background-clip:text;background-clip:text;color:transparent"></div>';
ui.appendChild(cname);
// little labels under the four hanging dragons
const tags = ['arcoiris', 'galaxia', 'plata', 'fuego'].map((c) => { const d = document.createElement('div'); d.className = 'blk'; d.style.cssText = 'left:0;right:auto;width:240px;text-align:center;font:800 34px Manrope;letter-spacing:.06em;'; d.innerHTML = `<span style="background:${colourNames[c][1]};-webkit-background-clip:text;background-clip:text;color:transparent">${colourNames[c][0].toUpperCase()}</span>`; ui.appendChild(d); return d; });

const $ = (id) => document.getElementById(id);
function setWords(b, t) {
  const on = t >= b.t0 - 0.01 && t <= b.t1 + 0.01;
  b.el.style.opacity = on ? 1 : 0; if (!on) return;
  const out = E.in(prog(t, b.t1 - 0.22, b.t1));
  b.words.forEach((w, i) => {
    const p = prog(t, b.t0 + i * b.stagger, b.t0 + i * b.stagger + 0.38);
    const y = (1 - E.out(p)) * 70 - out * 60, s = lerp(1.35, 1, E.back(p)) + out * 0.08;
    w.style.opacity = Math.min(1, p * 2.2) * (1 - out);
    w.style.transform = `translateY(${y}px) scale(${s})`;
    w.style.filter = `blur(${((1 - p) * 14 + out * 12).toFixed(1)}px)`;
  });
}
function fade(el, t, t0, t1, rise = 50, dur = 0.4) {
  const p = E.out(prog(t, t0, t0 + dur)), o = E.in(prog(t, t1 - 0.25, t1));
  el.style.opacity = t < t0 || t > t1 ? 0 : p * (1 - o);
  return { p, o, y: (1 - p) * rise - o * 40 };
}
function words(t) {
  blocks.forEach((b) => setWords(b, t));
  // 88 cm
  const k = fade(big, t, 2.12, 5.9, 80, 0.45);
  big.style.transform = `translateY(${k.y}px) scale(${lerp(1.2, 1, E.back(k.p))})`;
  $('n88').textContent = Math.round(88 * E.out(prog(t, 2.15, 3.6)));
  const r = fade($('ruler'), t, 2.1, 5.9, 0, 0.3);
  $('ruler').querySelector('i').style.height = (E.inOut(prog(t, 2.15, 5.5)) * 100) + '%';
  // colours
  const ci = Math.min(3, Math.floor((t - 14) / BEAT));
  cname.style.opacity = t >= 14 && t < 16 ? 1 : 0;
  if (t >= 14 && t < 16) {
    const [nm, grad] = colourNames[COLOR_CUTS[ci][0]]; const v = (t - 14 - ci * BEAT) / BEAT;
    if ($('cn').textContent !== nm) { $('cn').textContent = nm; $('cn').style.fontSize = '170px'; fit($('cn'), 900); } $('cn').style.backgroundImage = grad; $('cc').textContent = `0${ci + 1} / 04`;
    const p = E.out(clamp(v / 0.45));
    $('cn').style.transform = `translateX(${(1 - p) * (ci % 2 ? -160 : 160)}px) skewX(${(1 - p) * -12}deg) scale(${lerp(1.25, 1, p)})`;
    $('cn').style.filter = `blur(${(1 - p) * 10}px)`;
  }
  // labels under the hanging four
  tags.forEach((d, i) => {
    const o = fade(d, t, 16.15 + i * 0.08, 16.97, 30, 0.3);
    const p = V([-1.08, -0.36, 0.36, 1.08][i], -1.75, 0).project(camera);
    d.style.transform = `translate(${(p.x * 0.5 + 0.5) * W - 120}px, ${(-p.y * 0.5 + 0.5) * H + o.y}px)`;
    d.style.top = '0px';
  });
  // the finale
  const bb = fade($('brand'), t, 17.05, 22.2, 40, 0.5); $('brand').style.transform = `translateY(${bb.y}px)`;
  $('brand').querySelector('.han').style.transform = `scale(${lerp(1.6, 1, E.back(bb.p))})`;
  const cd = fade($('card'), t, 17.45, 22.2, 120, 0.55); $('card').style.transform = `translateY(${cd.y}px) scale(${lerp(0.9, 1, E.out(cd.p))})`;
  const ct = fade($('cta'), t, 18.6, 22.2, 60, 0.45);
  const pulse = t > 19 ? 1 + 0.045 * Math.max(0, Math.sin((t - 19) * Math.PI * 2)) : 1;   // a pulse on every beat
  $('cta').style.transform = `translateY(${ct.y}px) scale(${pulse})`;
  $('cta').querySelector('svg').style.transform = `translateY(${Math.sin(t * Math.PI * 4) * 5}px)`;
}

/* ---------- one frame ---------- */
let lastColour = '';
const shake = V(0, 0, 0);
function render(t) {
  const s = shot(t);
  // the lens follows the hits
  let zoom = 0, rgb = 0, flash = 0, kick = 0;
  HITS.forEach(([h, g]) => {
    const d = t - h;
    if (d >= 0) { const e = Math.exp(-d * 9); zoom = Math.max(zoom, e * 0.9 * g); rgb = Math.max(rgb, e * 1.6 * g); kick = Math.max(kick, Math.exp(-d * 7) * g); flash = Math.max(flash, Math.exp(-d * 18) * 0.55 * g); }
    else if (d > -0.14) { zoom = Math.max(zoom, E.in(1 + d / 0.14) * 0.7 * g); }          // a whoosh into the cut
  });
  if (t >= 10 && t < 10.08) flash = 0;                                                      // the lights go out without a flash
  lens.uniforms.zoom.value = zoom; lens.uniforms.rgb.value = rgb; lens.uniforms.flash.value = flash; lens.uniforms.time.value = t;
  lens.uniforms.dim.value = t < 0.06 ? 1 - t / 0.06 : 0;
  // camera, with a handheld drift and a shake on each hit
  shake.set(Math.sin(t * 1.7) * 0.02 + Math.sin(t * 31) * 0.03 * kick, Math.sin(t * 1.3 + 1) * 0.015 + Math.cos(t * 27) * 0.03 * kick, 0);
  camera.position.copy(cam.pos).add(shake); camera.fov = cam.fov * (1 - kick * 0.05); camera.updateProjectionMatrix();
  camera.lookAt(cam.at); camera.rotateZ(Math.sin(t * 0.9) * 0.008 + Math.sin(t * 23) * 0.01 * kick);
  front.position.copy(camera.position).add(V(0, 1, 0));
  // colours, the four and the ring
  if (s.colour !== lastColour && !s.four) { main.setColor(s.colour); lastColour = s.colour; }
  if (s.four) { if (lastColour !== 'arcoiris') { main.setColor('arcoiris'); lastColour = 'arcoiris'; } hangSpines(t); }
  extra.forEach((d, i) => { d.group.visible = s.four; if (s.four) d.update(spines[i], t, 0); });
  main.update(spine, t, s.glow);
  pearl.visible = s.ring; if (s.ring) { const p = E.back(prog(t, 17.1, 17.7)); pearl.scale.setScalar(Math.max(0.001, p)); pearl.position.set(0, 1.15, 0); pearlLight.intensity = 3 * p; pearl.material.emissiveIntensity = 1 + 0.3 * Math.sin(t * 6); }
  // the city, the lights and the glow
  photo.set({ mouse: new THREE.Vector2(clamp(camera.position.x * 0.35, -1, 1), clamp((camera.position.y - cam.at.y) * 0.2, -1, 1)), time: t, scroll: s.scroll, lights: s.lights, zoom: s.zoomBg });
  neon.intensity = 2.5 * s.lights; key.intensity = 1.6 * lerp(0.35, 1, s.lights); rim.intensity = 2 * lerp(0.5, 1, s.lights); front.intensity = 3 * lerp(0.3, 1, s.lights);
  moteMat.uniforms.time.value = t; moteMat.uniforms.glow.value = clamp(s.glow * 1.3); moteMat.uniforms.amt.value = s.glow > 0.05 ? 1.6 : 0.8;
  bloom.strength = 0.5 + s.glow * 0.6 + kick * 0.25; bloom.threshold = lerp(0.85, 0.55, s.glow);
  words(t);
  composer.render();
}

/* ---------- start ---------- */
await photo.ready;
await document.fonts.load('800 100px Syne'); await document.fonts.load('700 40px Manrope'); await document.fonts.load('900 100px Han', '龍');
function fit(el, max = 930) { let px = parseFloat(getComputedStyle(el).fontSize); const d = el.style.display; el.style.whiteSpace = 'nowrap'; el.style.display = 'inline-block'; while (el.offsetWidth > max && px > 20) { px -= 2; el.style.fontSize = px + 'px'; } el.style.display = d; }
document.querySelectorAll('.blk > div').forEach((l) => { const o = l.parentNode.style.opacity; l.parentNode.style.opacity = 1; fit(l); l.parentNode.style.opacity = o; });
const q = new URLSearchParams(location.search);
window.__dur = DUR;
window.__render = (t) => render(t);
render(0);
window.__ready = true;
if (!q.has('record')) {
  const t0 = performance.now();
  const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
