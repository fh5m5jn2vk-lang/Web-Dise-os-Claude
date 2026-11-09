// V3 · a group chat the night before Secret Santa. Marcos (us) has nothing; Lucía threatens; Dani sends a video of
// his dragon. Voice notes play with their waveform and transcript; texts arrive after typing dots; the dragon videos
// play inside the bubbles; the price lands; Lucía wants two; Dani shares the link; the product sheet slides up.
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
const DUR = TI.dur;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), back: (t) => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
const COL = { Lucía: '#ff6a8a', Dani: '#4cc3ff', Marcos: '#9b8cff' };

/* ---------- the dragon "phone videos": a desk at home, then the lights off ---------- */
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(560, 720, false);
R.toneMapping = THREE.ACESFilmicToneMapping; R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const tl = new THREE.TextureLoader();
const tex = (u, s) => new Promise((r) => tl.load(u, (t) => { if (s) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.3, 1.3); t.anisotropy = 8; r(t); }));
const [wd, wn] = await Promise.all([tex('../../tex/wood_diff.jpg', true), tex('../../tex/wood_nor.jpg')]);
const desk = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshPhysicalMaterial({ map: wd, normalMap: wn, roughness: 0.7, clearcoat: 0.3 })); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
const lamp = new THREE.SpotLight('#ffd2a0', 60, 14, 0.8, 0.6, 2); lamp.position.set(2.2, 4.4, 2); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.radius = 5; scene.add(lamp, lamp.target);
const hemi = new THREE.HemisphereLight('#aab8ff', '#2a1a10', 0.4); scene.add(hemi);
const glowL = new THREE.PointLight('#6dffb0', 0, 5, 2); scene.add(glowL);
const cam = new THREE.PerspectiveCamera(50, 560 / 720, 0.03, 50);
const dragon = createDragon(scene, { hq: true }); dragon.group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
const spine = Array.from({ length: SEG + 1 }, () => new THREE.Vector3()), dense = Array.from({ length: 500 }, () => new THREE.Vector3());
function coil(t) {
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.6 + u * Math.PI * 4.4 + t * 0.25 + Math.sin(t * 0.7 + u * 4) * 0.05, r = 0.35 + u * 0.95; dense[i].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  let acc = 0, j = 0; spine[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const d = dense[j].distanceTo(dense[j + 1]); if (acc + d >= want) { spine[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / d); break; } acc += d; j++; } }
  for (let i = 0; i <= SEG; i++) spine[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + (i < 6 ? Math.pow(1 - i / 6, 2) * (0.55 + Math.sin(t * 2) * 0.05) : 0);
  for (let i = 0; i < 6; i++) { const f = Math.pow(1 - i / 6, 2); spine[i].x += Math.sin(t * 1.7) * 0.07 * f; spine[i].z += 0.2 * f; }
}
function film(clip, ct, out) {
  const dark = clip === 2; coil(ct + (dark ? 4 : 0));
  lamp.intensity = dark ? 0 : 60; hemi.intensity = dark ? 0.02 : 0.4; scene.environmentIntensity = dark ? 0.01 : 0.5;
  scene.background = new THREE.Color(dark ? '#030304' : '#120d09');
  const glow = dark ? 0.9 + 0.1 * Math.sin(ct * 3) : 0; glowL.intensity = glow * 2.5; glowL.position.copy(spine[12]).add(new THREE.Vector3(0, 0.5, 0));
  dragon.update(spine, ct, glow * 0.6);
  // held in a hand: a slow arc round it with a little shake
  const a = 0.4 + ct * 0.22; cam.position.set(Math.sin(a) * 2.6 + Math.sin(ct * 7) * 0.012, 1.9 + Math.sin(ct * 5) * 0.01, Math.cos(a) * 2.6 + 0.4); cam.lookAt(0, 0.35, 0.1); cam.updateProjectionMatrix();
  R.render(scene, cam);
  out.getContext('2d').drawImage(R.domElement, 0, 0, 560, 720);
}

/* ---------- the messages ---------- */
const chat = document.getElementById('chat');
const MSG = [
  { id: 'm1', me: true, kind: 'voice', line: 'm1' },
  { id: 'l1', who: 'Lucía', kind: 'text', line: 'l1', text: 'Como regales calcetines otra vez te echo del grupo 💀' },
  { id: 'm2', me: true, kind: 'text', line: 'm2', text: 'Límite 25 €. IDEAS YA 🙏' },
  { id: 'd1', who: 'Dani', kind: 'voice', line: 'd1' },
  { id: 'dv', who: 'Dani', kind: 'video', at: LN.d1.t1 + 0.25, clip: 1, react: ['😍', LN.l2.t0 + 0.5] },
  { id: 'l2', who: 'Lucía', kind: 'text', line: 'l2', text: '¿¿QUÉ ES ESO?? Lo quiero 😍' },
  { id: 'd2', who: 'Dani', kind: 'voice', line: 'd2' },
  { id: 'dg', who: 'Dani', kind: 'video', at: LN.d2.t1 + 0.15, clip: 2, label: 'con la luz apagada 👀' },
  { id: 'm3', me: true, kind: 'text', line: 'm3', text: '¿Y cuánto cuesta?' },
  { id: 'd3', who: 'Dani', kind: 'text', line: 'd3', text: '21,95 €', big: true, react: ['🤯', LN.d3.t1 + 0.2] },
  { id: 'm4', me: true, kind: 'text', line: 'm4', text: 'PEDIDO. Me acabas de salvar la vida 🙌', react: ['😂', LN.m4.t1 + 0.35] },
  { id: 'l3', who: 'Lucía', kind: 'text', line: 'l3', text: 'Pásame el link que yo quiero dos' },
  { id: 'dl', who: 'Dani', kind: 'card', at: LN.l3.t1 + 0.25 },
];
const SEED = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
MSG.forEach((m, k) => {
  const L = m.line && LN[m.line];
  m.at = m.at ?? (L.t0 - (m.kind === 'voice' ? 0.05 : 0.12));
  const d = document.createElement('div'); d.className = 'msg ' + (m.me ? 'me' : 'them');
  let inner = '';
  if (!m.me) inner += `<div class="who" style="color:${COL[m.who]}">${m.who}</div>`;
  if (m.kind === 'text') inner += `<div class="tx"${m.big ? ' style="font:800 64px Inter;letter-spacing:-0.04em"' : ''}>${m.text}</div>`;
  if (m.kind === 'voice') inner += `<div class="voice"><div class="pb"><svg width="34" height="34" viewBox="0 0 24 24"><path class="pp" d="M8 5v14l11-7z" fill="#fff"/></svg></div><div class="wf">${Array.from({ length: 34 }, (_, i) => `<i style="height:${14 + Math.round(52 * Math.abs(Math.sin(i * 0.7 + k) * 0.6 + SEED(i + k * 40) * 0.4))}px"></i>`).join('')}</div><div style="font:600 26px Inter;color:rgba(255,255,255,.7)">0:0${Math.round(L.t1 - L.t0)}</div></div><div class="tr"></div>`;
  if (m.kind === 'video') inner += `<div class="vid"><canvas width="560" height="720"></canvas><div class="dur">0:${m.clip === 1 ? '12' : '08'}</div></div>${m.label ? `<div class="tx" style="margin-top:12px;font-size:36px">${m.label}</div>` : ''}`;
  if (m.kind === 'card') inner += `<div class="card"><img src="../../img/producto-muneca.jpg"><div style="padding:22px 26px 26px"><div style="display:flex;align-items:center;gap:14px"><div style="width:48px;height:48px;border-radius:12px;background:#e5322d;display:grid;place-items:center;font:900 30px Han;color:#fff">龍</div><div style="font:800 40px Inter;letter-spacing:-0.03em">LÓNG · Dragón articulado</div></div><div style="font:500 32px Inter;color:#aab2c4;margin-top:10px">88 cm · brilla en la oscuridad · 4 colores</div><div style="font:800 46px Inter;margin-top:14px;letter-spacing:-0.03em">21,95 € <span style="font:600 32px Inter;color:#9b8cff">· 2 por 32,95 €</span></div></div></div>`;
  inner += `<div class="meta">23:${47 + Math.floor(k / 4)}${m.me ? ' <span class="tick">✓✓</span>' : ''}</div>`;
  d.innerHTML = (m.me ? '' : `<div class="ava" style="background:${COL[m.who]}">${m.who[0]}</div>`) + `<div class="bub">${inner}</div>` + (m.react ? `<div class="react" style="${m.me ? 'right:60px' : 'left:150px'};opacity:0">${m.react[0]}</div>` : '');
  chat.appendChild(d); m.el = d; m.bub = d.querySelector('.bub');
  if (m.kind === 'voice') m.words = L.words;
});
// heights and places, from the bottom of the chat
const VIEW = 1452, GAP = 30;
let y = 30; MSG.forEach((m) => { const h = m.bub.offsetHeight + (m.react ? 34 : 0); m.y = y; m.h = h; y += h + GAP; m.el.style.top = m.y + 'px'; m.el.querySelector('.ava') && (m.el.querySelector('.ava').style.top = h - 72 - (m.react ? 34 : 0) + 'px'); });
const typingEl = document.createElement('div'); typingEl.className = 'typing'; typingEl.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(typingEl);

/* ---------- the hook: notifications on the lock screen ---------- */
const lock = document.getElementById('lock');
const NOTES = [['TÍO AYUDA 😭', 0.06], ['el amigo invisible es MAÑANA', 0.36], ['🎤 Nota de voz', 0.66]];
NOTES.forEach(([txt], i) => lock.insertAdjacentHTML('beforeend', `<div class="note"><div class="ic">🎁</div><div><b>Marcos · Amigo invisible</b><span>${txt}</span></div><em>ahora</em></div>`));
const notes = [...lock.querySelectorAll('.note')];

/* ---------- the end sheet ---------- */
const sheet = document.getElementById('sheet');
sheet.innerHTML = `<div style="width:120px;height:12px;border-radius:6px;background:#cfcac2;margin:26px auto 0"></div>
  <div style="padding:30px 56px 0"><div style="font:600 32px Inter;color:#7a746c">Lo que se acaba de pedir Marcos 👀</div>
  <div style="margin-top:22px;height:620px;border-radius:40px;overflow:hidden;position:relative"><img src="../../img/producto-colores.jpg" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%"></div>
  <div style="display:flex;align-items:center;gap:20px;margin-top:30px"><div style="width:80px;height:80px;border-radius:20px;background:#e5322d;display:grid;place-items:center;font:900 48px Han;color:#fff">龍</div><div><div style="font:800 60px Inter;letter-spacing:-0.045em;line-height:1">LÓNG</div><div style="font:500 32px Inter;color:#7a746c;margin-top:6px">Dragón articulado · 88 cm · brilla en la oscuridad</div></div></div>
  <div style="display:flex;align-items:baseline;gap:22px;margin-top:22px"><div style="font:850 104px Inter;letter-spacing:-0.06em">21,95 €</div><div style="font:700 36px Inter;color:#5b47f5">2 por 32,95 €</div></div>
  <div id="cta" style="margin-top:20px;height:128px;border-radius:64px;background:#5b47f5;color:#fff;display:grid;place-items:center;font:800 46px Inter;letter-spacing:-0.03em">Link en mi perfil</div></div>`;

/* ---------- the input bar: Marcos types his texts ---------- */
const input = document.getElementById('input'), statusEl = document.getElementById('status'), sendIcon = document.getElementById('sendicon');
const MIC = 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0zm6 8h2v2h-2z', SEND = 'M3 11l18-8-8 18-2-8z';
const typingWindows = MSG.filter((m) => m.me && m.kind === 'text').map((m) => ({ m, a: m.at - Math.min(0.85, 0.12 * m.text.length + 0.2), b: m.at }));

/* ---------- one frame ---------- */
const app = document.getElementById('app');
function render(t) {
  // hook: three notifications drop on the lock screen, then the chat opens
  notes.forEach((n, i) => { const a = t - NOTES[i][1], p = E.back(prog(a, 0, 0.3)); n.style.opacity = clamp(a * 6); n.style.top = 560 + i * 190 + (1 - p) * -80 + 'px'; n.style.transform = `scale(${lerp(0.9, 1, p)})`; });
  const open = E.inOut(prog(t, 0.95, 1.35));
  lock.style.opacity = 1 - open; lock.style.transform = `scale(${1 + open * 0.15})`; lock.style.filter = open > 0 ? `blur(${open * 16}px)` : '';
  lock.style.visibility = open >= 1 ? 'hidden' : 'visible';
  // messages arrive
  let bottom = 30;
  MSG.forEach((m) => {
    const a = t - m.at; const vis = a >= 0;
    const p = E.back(prog(a, 0, 0.32));
    m.el.style.opacity = vis ? clamp(a * 7) : 0;
    m.el.style.transform = `translateY(${(1 - p) * 40}px) scale(${lerp(0.92, 1, p)})`;
    m.bub.style.transformOrigin = m.me ? '100% 100%' : '0% 100%';
    if (vis) bottom = m.y + m.h + GAP;
    // voice notes: the waveform fills and the transcript writes itself as it plays
    if (m.kind === 'voice') {
      const L = LN[m.line], pp = prog(t, L.t0, L.t1);
      m.el.querySelectorAll('.wf i').forEach((b, i) => { b.style.background = i / 34 < pp ? '#fff' : 'rgba(255,255,255,.35)'; });
      m.el.querySelector('.pp').setAttribute('d', t > L.t0 && t < L.t1 ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z');
      const said = m.words.filter((wd) => t >= wd[1] - 0.02).map((wd) => wd[0]);
      m.el.querySelector('.tr').textContent = said.join(' ');
    }
    // texts: the words light up as they are read
    if (m.kind === 'text' && m.line) {
      const L = LN[m.line], pp = prog(t, L.t0, L.t1 - 0.1); const tx = m.el.querySelector('.tx');
      tx.style.color = `rgba(255,255,255,${lerp(0.55, 1, pp)})`;
    }
    if (m.react) { const r = m.el.querySelector('.react'), ra = t - m.react[1], rp = E.back(prog(ra, 0, 0.3)); r.style.opacity = clamp(ra * 6); r.style.top = m.bub.offsetHeight - 26 + 'px'; r.style.transform = `scale(${lerp(0.2, 1, rp)})`; }
    if (m.kind === 'video' && vis && a < 12) film(m.clip, a + (m.clip === 1 ? 2 : 0), m.el.querySelector('canvas'));
    const tick = m.el.querySelector('.tick'); if (tick) tick.style.color = a > 0.6 ? '#7ad7ff' : 'rgba(255,255,255,.5)';
  });
  // typing dots and the status line
  const next = MSG.find((m) => !m.me && t < m.at && t > m.at - (m.kind === 'voice' ? 1.3 : 0.9));
  typingEl.style.opacity = next && next.kind !== 'voice' ? 1 : 0;
  if (next) { typingEl.style.top = bottom + 'px'; typingEl.querySelectorAll('i').forEach((d, i) => { d.style.transform = `translateY(${Math.sin(t * 10 - i * 0.9) * -6}px)`; d.style.opacity = 0.5 + 0.5 * Math.sin(t * 10 - i * 0.9); }); }
  statusEl.textContent = next ? `${next.who} está ${next.kind === 'voice' ? 'grabando un audio' : 'escribiendo'}…` : 'Lucía, Dani, tú';
  statusEl.style.color = next ? '#5fd38a' : '#8b93a5';
  // the chat scrolls to keep the newest at the bottom
  const want = Math.max(0, bottom + (next && next.kind !== 'voice' ? 110 : 0) - VIEW + 20);
  const sc = scrollAt(t);

  // Marcos types
  const tw = typingWindows.find((w) => t >= w.a && t < w.b);
  if (tw) { const n = Math.ceil(prog(t, tw.a, tw.b - 0.08) * tw.m.text.length); input.textContent = tw.m.text.slice(0, n) + (Math.floor(t * 4) % 2 ? '|' : ''); input.style.color = '#fff'; sendIcon.setAttribute('d', SEND); }
  else { input.textContent = 'Mensaje'; input.style.color = '#7c8496'; sendIcon.setAttribute('d', MIC); }
  // punch-ins on the video and the price, a jolt on PEDIDO
  const vz = 0;
  const pz = E.inOut(prog(t, MSG[9].at + 0.05, MSG[9].at + 0.4)) * (1 - E.inOut(prog(t, LN.m4.t0 - 0.1, LN.m4.t0 + 0.3)));
  const jolt = t > LN.m4.t0 && t < LN.m4.t0 + 0.4 ? Math.sin((t - LN.m4.t0) * 60) * 8 * (1 - (t - LN.m4.t0) / 0.4) : 0;
  const zoom = 1 + vz * 0.12 + pz * 0.16;
  const focusY = vz > pz ? 232 + (MSG[4].y - sc) + MSG[4].h / 2 : 232 + (MSG[9].y - sc) + MSG[9].h / 2;
  // the zoom works on the conversation only: the header and the input stay put
  chat.style.transformOrigin = `540px ${focusY - 232 + sc}px`;
  chat.style.transform = `translate(${jolt}px, ${-sc}px) scale(${zoom})`;
  app.style.transform = `scale(${lerp(0.94, 1, open)})`;
  editStep(t);
  // the product sheet
  const sp = E.out(prog(t, MSG[12].at + 1.0, MSG[12].at + 1.6));
  sheet.style.transform = `translateY(${(1 - sp) * 1300}px)`;
  sheet.querySelector('#cta').style.transform = `scale(${t > MSG[12].at + 2.2 ? 1 + 0.03 * Math.max(0, Math.sin((t - MSG[12].at - 2.2) * 6)) : 1})`;
}
// scroll target per arrival, smoothed with a closed-form spring (a pure function of time)
const SCROLLS = [[0, 0]];
MSG.forEach((m, i) => { const bottomAfter = m.y + m.h + GAP; SCROLLS.push([m.at, Math.max(0, bottomAfter - VIEW + 20)]); });
function step(tau, w = 11, z = 0.9) { if (tau <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau)); }
function scrollAt(t) { let v = 0; for (let i = 1; i < SCROLLS.length; i++) v += (SCROLLS[i][1] - SCROLLS[i - 1][1]) * step(t - SCROLLS[i][0]); return v; }

/* ---------- the edit: zoom into Dani's video, then a full-screen cut of the dragon on the beat ---------- */
const DV = MSG[4], ZIN = DV.at + 0.55, E0 = ZIN + 0.5, ELEN = 5.5, E1 = E0 + ELEN, ZOUT = E1 + 0.42;
const BEAT = 60 / 139.86, DROP = E0 + 0.15;            // the trap track's drop lands as the edit opens
const editCv = document.getElementById('edit'), etext = document.getElementById('etext'), flashEl = document.getElementById('flash');
const R2 = new THREE.WebGLRenderer({ canvas: editCv, antialias: true, preserveDrawingBuffer: true }); R2.setPixelRatio(1); R2.setSize(1080, 1920, false);
R2.toneMapping = THREE.ACESFilmicToneMapping; R2.toneMappingExposure = 0.95;
const s2 = new THREE.Scene(); s2.background = new THREE.Color('#040406'); s2.environment = new THREE.PMREMGenerator(R2).fromScene(new RoomEnvironment(), 0.04).texture; s2.environmentIntensity = 0.25;
const cam2 = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.03, 60);
const floor2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshPhysicalMaterial({ color: '#08080b', roughness: 0.25, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.15 })); floor2.rotation.x = -Math.PI / 2; s2.add(floor2);
const key2 = new THREE.SpotLight('#ffffff', 55, 14, 0.5, 0.6, 2); key2.position.set(-2, 5, 3); s2.add(key2, key2.target);
const rimA = new THREE.PointLight('#33e6ff', 18, 8, 2); rimA.position.set(2.5, 1.2, -2); s2.add(rimA);
const rimB = new THREE.PointLight('#ff3fd2', 18, 8, 2); rimB.position.set(-2.5, 1.0, -1.5); s2.add(rimB);
const glow2 = new THREE.PointLight('#6dffb0', 0, 5, 2); s2.add(glow2);
const d2 = createDragon(s2, { hq: true });
const sp2 = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
const comp = new EffectComposer(R2); comp.setPixelRatio(1); comp.setSize(1080, 1920);
comp.addPass(new RenderPass(s2, cam2));
const bloom2 = new UnrealBloomPass(new THREE.Vector2(540, 960), 0.35, 0.5, 0.88); comp.addPass(bloom2);
comp.addPass(new OutputPass());
const lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, zoom: { value: 0 }, rgb: { value: 0 }, time: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float zoom, rgb, time; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec2 d = vUv - 0.5; vec3 c = vec3(0.0); float k = 0.002 + rgb * 0.014;
      for (int i = 0; i < 10; i++) { float s = 1.0 - zoom * 0.18 * float(i) / 9.0;
        c.r += texture2D(tDiffuse, 0.5 + d * s * (1.0 + k)).r; c.g += texture2D(tDiffuse, 0.5 + d * s).g; c.b += texture2D(tDiffuse, 0.5 + d * s * (1.0 - k)).b; }
      c /= 10.0; c *= mix(1.0, smoothstep(1.1, 0.25, length(d * vec2(1.0, 0.7))), 0.6);
      c += (h(vUv * 1000.0 + fract(time * 7.0)) - 0.5) * 0.05; gl_FragColor = vec4(c, 1.0); }` });
comp.addPass(lens);
const SHOTS = [[0, 'macro'], [0.15 + 2 * BEAT, 'orbit'], [0.15 + 4 * BEAT, 'top'], [0.15 + 6 * BEAT, 'glow'], [0.15 + 8 * BEAT, 'colors'], [0.15 + 11 * BEAT, 'hero']];
const TXT = { macro: 'MIRA ESTO.', orbit: 'CADA PIEZA', top: 'SE MUEVE.', glow: 'Y BRILLA.', hero: '88 CM · LÓNG 龍' };
function coil2(ct, lift, tight = 1) {
  for (let i = 0; i < dense.length; i++) { const u = i / (dense.length - 1), a = 0.6 + u * Math.PI * 4.4 * tight + ct * 0.6, r = 0.32 + u * 0.95 / tight; dense[i].set(Math.cos(a) * r, 0, Math.sin(a) * r); }
  let acc = 0, j = 0; sp2[0].copy(dense[0]);
  for (let i = 1; i <= SEG; i++) { const want = i * SPACING; while (j < dense.length - 1) { const dd = dense[j].distanceTo(dense[j + 1]); if (acc + dd >= want) { sp2[i].copy(dense[j]).lerp(dense[j + 1], (want - acc) / dd); break; } acc += dd; j++; } }
  for (let i = 0; i <= SEG; i++) sp2[i].y = 0.2 * (1 - 0.82 * Math.pow(i / SEG, 1.2)) + 0.025 + (i < 7 ? Math.pow(1 - i / 7, 2) * lift : 0);
  for (let i = 0; i < 7; i++) { const f = Math.pow(1 - i / 7, 2); sp2[i].z += 0.25 * f; sp2[i].x += Math.sin(ct * 2.2) * 0.06 * f; }
}
let col2 = '';
function editFrame(e) {
  const si = SHOTS.reduce((k, x, i) => (e >= x[0] ? i : k), 0), shot = SHOTS[si][1], u = e - SHOTS[si][0];
  // beat hits: the lens punches, the frame shakes
  const sinceBeat = e < 0.15 ? 9 : (e - 0.15) % BEAT, hit = Math.exp(-sinceBeat * 9), cut = Math.exp(-u * 10);
  let ct = e, lift = 0.6, colr = 'arcoiris', glow = 0, cp, ca, fov = 38;
  if (shot === 'macro') { ct = 2 + e * 0.35; coil2(ct, 0.62); const h = sp2[0], dir = h.clone().sub(sp2[2]).setY(0).normalize(), side = new THREE.Vector3(-dir.z, 0, dir.x); cp = h.clone().addScaledVector(dir, 2.5 - u * 0.5).addScaledVector(side, 0.9 - u * 0.8).add(new THREE.Vector3(0, 0.35, 0)); ca = h.clone().add(new THREE.Vector3(0, -0.2, 0)); fov = 36; }
  else if (shot === 'orbit') { const ramp = u < 0.35 ? u * 3 : 1.05 + (u - 0.35) * 0.4; ct = 3 + ramp; coil2(ct, 0.5); const a = 2.2 + ramp * 2.2; cp = new THREE.Vector3(Math.sin(a) * 2.0, 0.35, Math.cos(a) * 2.0); ca = new THREE.Vector3(0, 0.3, 0); fov = 44; }
  else if (shot === 'top') { ct = 5 + u * 1.5; coil2(ct, 0.45, 1.05); const a = u * 1.6; cp = new THREE.Vector3(Math.sin(a) * 0.4, 3.3 - u * 0.4, Math.cos(a) * 0.4 + 0.2); ca = new THREE.Vector3(0, 0, 0); fov = 46; }
  else if (shot === 'glow') { ct = 7 + u * 0.3; coil2(ct, 0.55); glow = E.out(clamp(u / 0.25)); const a = 1 + u * 0.4; cp = new THREE.Vector3(Math.sin(a) * 2.3, 1.4, Math.cos(a) * 2.3); ca = new THREE.Vector3(0, 0.3, 0); }
  else if (shot === 'colors') { const k = Math.min(3, Math.floor(u / BEAT)); colr = ['arcoiris', 'galaxia', 'plata', 'fuego'][k]; ct = 9 + u * 0.8; coil2(ct, 0.6); const a = 0.3 + k * 1.4 + (u % BEAT) * 0.8; cp = new THREE.Vector3(Math.sin(a) * 2.1, 0.9 + (k % 2) * 0.6, Math.cos(a) * 2.1); ca = new THREE.Vector3(0, 0.35, 0); }
  else { ct = 12 + u * 0.25; coil2(ct, lerp(0.4, 0.95, E.out(clamp(u / 0.4)))); const h = sp2[0], dir = h.clone().sub(sp2[2]).setY(0).normalize(), side = new THREE.Vector3(-dir.z, 0, dir.x); cp = h.clone().addScaledVector(dir, 3.3 - u * 0.5).addScaledVector(side, 0.5).add(new THREE.Vector3(0, 0.1, 0)); ca = h.clone().add(new THREE.Vector3(0, -0.45, 0)); fov = 40; }
  if (colr !== col2) { d2.setColor(colr); col2 = colr; }
  const dark = shot === 'glow';
  key2.intensity = dark ? 0 : 55 * (shot === 'top' ? 0.6 + 0.8 * hit : 1); rimA.intensity = dark ? 0.5 : 12; rimB.intensity = dark ? 0.5 : 12; s2.environmentIntensity = dark ? 0.01 : 0.25;
  glow2.intensity = glow * 3; glow2.position.copy(sp2[12]).add(new THREE.Vector3(0, 0.5, 0));
  d2.update(sp2, ct, glow * 0.65);
  const shake = new THREE.Vector3(Math.sin(e * 61) * 0.02 * hit, Math.cos(e * 53) * 0.02 * hit, 0);
  cam2.position.copy(cp).add(shake); cam2.lookAt(ca); cam2.fov = fov * (1 - hit * 0.04); cam2.updateProjectionMatrix();
  lens.uniforms.zoom.value = Math.max(cut * 1.1, hit * 0.35); lens.uniforms.rgb.value = Math.max(cut, hit * 0.6); lens.uniforms.time.value = e;
  bloom2.strength = 0.3 + glow * 0.45 + hit * 0.12;
  comp.render();
  // the words, cut in on the beat
  const word = shot === 'colors' ? ['ARCOÍRIS', 'GALAXIA', 'PLATA', 'FUEGO'][Math.min(3, Math.floor(u / BEAT))] : TXT[shot];
  const wp = E.out(clamp((shot === 'colors' ? u % BEAT : u) / 0.12));
  etext.innerHTML = `<div style="position:absolute;left:0;right:0;top:${shot === 'hero' ? 1180 : 300}px;text-align:center;font:400 ${shot === 'hero' ? 150 : 190}px/0.9 Anton, Han;letter-spacing:.01em;color:#fff;text-shadow:-6px 0 rgba(255,40,120,.75), 6px 0 rgba(40,220,255,.75), 0 10px 40px rgba(0,0,0,.6);transform:scale(${lerp(1.4, 1, wp)});opacity:${wp}">${word}</div>`;
  return hit;
}
function editStep(t) {
  const zin = E.in(prog(t, ZIN, E0)), zout = E.out(prog(t, E1, ZOUT));
  let zoom = 0;
  if (t >= ZIN && t < E0) zoom = zin; else if (t >= E0 && t < E1) zoom = 1; else if (t >= E1 && t < ZOUT) zoom = 1 - zout;
  const vid = DV.el.querySelector('.vid');
  if (zoom > 0) {
    app.style.transform = 'none'; const r = vid.getBoundingClientRect();
    const S = Math.max(1080 / r.width, 1920 / r.height) * 1.02, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const s = lerp(1, S, zoom), tx = lerp(0, 540 - cx * S, zoom), ty = lerp(0, 960 - cy * S, zoom);
    app.style.transformOrigin = '0 0'; app.style.transform = `translate(${540 - cx * s + (cx * s - 540) * (1 - zoom) * 0 + (zoom < 1 ? (cx - 540) * 0 : 0)}px, ${960 - cy * s}px) scale(${s})`;
    if (zoom < 1) app.style.transform = `translate(${lerp(0, 540 - cx * S, zoom)}px, ${lerp(0, 960 - cy * S, zoom)}px) scale(${s})`;
  } else { app.style.transformOrigin = '540px 960px'; }
  const on = t >= E0 - 0.06 && t < ZOUT;
  editCv.style.opacity = on ? (t < E0 ? prog(t, E0 - 0.06, E0) : t > E1 ? 1 - prog(t, E1 + 0.25, ZOUT) : 1) : 0;
  etext.style.opacity = t >= E0 && t < E1 ? 1 : 0;
  // leaving: the edit shrinks back into the bubble
  if (t >= E1 && t < ZOUT) { const k = 1 - zout; editCv.style.transformOrigin = '540px 960px'; editCv.style.transform = `scale(${lerp(0.37, 1, k)})`; editCv.style.borderRadius = lerp(60, 0, k) + 'px'; }
  else { editCv.style.transform = 'none'; editCv.style.borderRadius = '0'; }
  let fl = 0;
  if (t >= E0 - 0.06 && t < E0 + 0.25) fl = Math.max(0, 1 - Math.abs(t - E0) / 0.2) * 0.85;
  if (t >= E0 && t < E1) { const e = t - E0; editFrame(e); SHOTS.slice(1).forEach(([s0]) => { const d = e - s0; if (d >= 0 && d < 0.12) fl = Math.max(fl, (1 - d / 0.12) * 0.45); }); }
  else if (t >= E1 && t < ZOUT) editFrame(ELEN - 0.01);
  flashEl.style.opacity = fl;
}

/* ---------- start ---------- */
await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
for (const f of ['500 40px Inter', '800 40px Inter', '200 100px Inter', '900 40px Han']) await document.fonts.load(f, 'Aá龍');
await document.fonts.load('40px "Noto Color Emoji"', '😭🎁💀🙏😍👀🤯🙌😂🎤');
const sfx = [];
NOTES.forEach(([, t0]) => sfx.push({ t: t0, tipo: 'notify', g: 0.3 }));
sfx.push({ t: 0.95, tipo: 'whoosh', g: 0.18 });
MSG.forEach((m) => { sfx.push({ t: m.at, tipo: m.me ? 'send' : 'receive', g: m.me ? 0.3 : 0.28, pan: m.me ? 0.3 : -0.3 }); if (m.react) sfx.push({ t: m.react[1], tipo: 'pop', g: 0.25 }); });
typingWindows.forEach((w) => { for (let k = w.a; k < w.b - 0.05; k += 0.085) sfx.push({ t: k, tipo: 'key', g: 0.12 }); });
sfx.push({ t: MSG[12].at + 1.0, tipo: 'whoosh', g: 0.25 }, { t: MSG[12].at + 1.5, tipo: 'cash', g: 0.18 }, { t: LN.m4.t0, tipo: 'thump', g: 0.3 });
sfx.push({ t: ZIN - 0.9, tipo: 'riser', g: 0.35 }, { t: E0, tipo: 'impact', g: 0.5 }, { t: E1, tipo: 'whoosh', g: 0.3 });
SHOTS.slice(1).forEach(([s0]) => sfx.push({ t: E0 + s0 - 0.12, tipo: 'whoosh', g: 0.22 }, { t: E0 + s0, tipo: 'thump', g: 0.3 }));
sfx.push({ t: E0 + SHOTS[3][0], tipo: 'shimmer', g: 0.3 }, { t: E0 + SHOTS[5][0], tipo: 'boom', g: 0.4 });
for (let k = 0; k < 3; k++) sfx.push({ t: E0 + SHOTS[4][0] + (k + 1) * BEAT, tipo: 'slap', g: 0.3 });
window.__cues = { dur: DUR, musica: { archivo: '282.mp3', desde: 12.0, gain: 0.34, duck: 0.6, fadein: 1.0, fadeout: 1.0, silencios: [[ZIN - 0.2, ZOUT + 0.3, 0.0]] }, musicas: [{ archivo: '369.mp3', desde: 14.06 - (DROP - (E0 - 1.0)), en: E0 - 1.0, hasta: ZOUT + 0.5, gain: 0.85, fadein: 0.6, fadeout: 0.45 }], voz: { gain: 1 }, sfx };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
