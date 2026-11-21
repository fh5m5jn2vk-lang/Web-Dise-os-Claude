// the drawing kit: films drawn by hand, line by line, on a board much bigger than the frame.
//  · a board (whiteboard, chalkboard, notebook, sketch paper or rice paper) and a camera that glides across it;
//  · every line is drawn with GSAP's DrawSVGPlugin on one paused timeline that the recorder seeks frame by frame;
//  · a hand holding the board's tool (marker, chalk, ballpoint, pencil, brush) whose tip rides each stroke as it is
//    drawn, lifts and travels between strokes, and leaves the frame when there is nothing to draw;
//  · words are written by tracing the letters' outlines (opentype.js) and then filling them, like whiteboard videos;
//  · shapes are coloured in with a scribble clipped to the shape; Chinese characters are painted stroke by stroke
//    from their stroke data, the brush revealing each one along its centre line;
//  · a real photo can be sketched from its traced edges (trazar.py) and then become the photo itself;
//  · sound cues: the tool on the board for every stroke (seis/mezcla.py synthesises it).
import { clamp, lerp, prog, E } from './util.js';
import { manoSVG } from './mano.js';
import { parse as parseFont } from '../vendor/opentype/opentype.min.mjs';

export const gsap = window.gsap;
gsap.registerPlugin(window.DrawSVGPlugin, window.MotionPathPlugin, window.MorphSVGPlugin, window.CustomEase);
const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent = null, html = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  if (html !== null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function rnd(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

export const ESTILOS = {
  blanca:   { tex: 'blanca',   tool: 'rotu',   ink: '#1d1d20', w: 8,   filtro: 'f-rotu',  sombra: 0.2 },
  tiza:     { tex: 'tiza',     tool: 'tiza',   ink: '#f3f1e7', w: 9,   filtro: 'f-tiza',  sombra: 0.35 },
  cuaderno: { tex: 'cuaderno', tool: 'boli',   ink: '#1e3fa6', w: 4.2, filtro: 'f-boli',  sombra: 0.18 },
  boceto:   { tex: 'boceto',   tool: 'lapiz',  ink: '#3a332b', w: 4,   filtro: 'f-lapiz', sombra: 0.2 },
  arroz:    { tex: 'arroz',    tool: 'pincel', ink: '#17130f', w: 10,  filtro: 'f-tinta', sombra: 0.2 },
  neon:     { tex: 'ladrillo', tool: 'rotu',   ink: '#3ff5ff', w: 9,   filtro: 'f-neon',  sombra: 0 },
};

const FILTROS = `
  <filter id="f-rotu" x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="4" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="f-boli" x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="8" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.25" result="m"/>
    <feComposite in="d" in2="m" operator="in"/>
  </filter>
  <filter id="f-tiza" x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.85" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="w"/>
    <feDisplacementMap in="c" in2="w" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="f-lapiz" x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="5" result="n"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.9 1.5" result="m"/>
    <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="9" result="w"/>
    <feDisplacementMap in="c" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="f-tinta" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="6" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.7"/>
  </filter>
  <filter id="f-neon" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2"/>
    <feMerge><feMergeNode in="b1"/><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="f-sombra" x="-20%" y="-20%" width="140%" height="140%">
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/><feGaussianBlur stdDeviation="9"/>
  </filter>
  <radialGradient id="vig" cx="50%" cy="46%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".28"/></radialGradient>`;

// a path's subpaths as separate d strings, from opentype commands
function contornos(cmds) {
  const out = []; let cur = '';
  const f = (v) => +v.toFixed(1);
  for (const c of cmds) {
    if (c.type === 'M') { if (cur) out.push(cur); cur = `M${f(c.x)} ${f(c.y)}`; }
    else if (c.type === 'L') cur += `L${f(c.x)} ${f(c.y)}`;
    else if (c.type === 'Q') cur += `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}`;
    else if (c.type === 'C') cur += `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`;
    else if (c.type === 'Z') cur += 'Z';
  }
  if (cur) out.push(cur);
  return out;
}
// a smooth path through points (Catmull-Rom as cubic Béziers)
export function suave(pts, closed = false) {
  if (pts.length < 3) return 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${P[1][0].toFixed(1)} ${P[1][1].toFixed(1)}`;
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}

const FONTS = {};
export async function fuente(nombre, archivo) { FONTS[nombre] = parseFont(await (await fetch(archivo)).arrayBuffer()); return FONTS[nombre]; }

export function pizarra(estilo, { mundo = [-2000, -2000, 5080, 7000], mano = true, manga = '#2c3e66', escala = 0.62 } = {}) {
  const ST = { ...ESTILOS[estilo] };
  const stage = document.getElementById('stage'); stage.classList.add('dib', 'dib-' + estilo);
  const svg = el('svg', { id: 'board', width: 1080, height: 1920, viewBox: '0 0 1080 1920' });
  stage.insertBefore(svg, stage.firstChild);
  const defs = el('defs', {}, svg, FILTROS + `<pattern id="pap" patternUnits="userSpaceOnUse" width="768" height="768"><image href="../kit/papel/${ST.tex}.png" width="768" height="768"/></pattern>`
    + `<g id="manoArt">${manoSVG(ST.tool, manga)}</g>`);
  const camG = el('g', { id: 'cam' }, svg);
  el('rect', { x: mundo[0], y: mundo[1], width: mundo[2], height: mundo[3], fill: 'url(#pap)' }, camG);
  const fondo = el('g', { id: 'fondo' }, camG), bajo = el('g', { id: 'bajo' }, camG), art = el('g', { id: 'art' }, camG), sobre = el('g', { id: 'sobre' }, camG);
  el('rect', { width: 1080, height: 1920, fill: 'url(#vig)', 'pointer-events': 'none' }, svg);
  const sombraU = el('use', { href: '#manoArt', filter: 'url(#f-sombra)', opacity: ST.sombra }, svg);
  const manoU = el('use', { href: '#manoArt' }, svg);
  if (!mano) { sombraU.style.display = 'none'; manoU.style.display = 'none'; }

  const tl = gsap.timeline({ paused: true });
  const S = [];                 // strokes the hand draws: {el, t0, t1, ease, len}
  const EXTRA = [];             // other sounds of drawing (no hand): {t0, t1, tool}
  let uid = 0;
  const grupo = (parent = art, attrs = {}) => el('g', attrs, parent);
  // a group drawn in the board's tool look
  const capa = (parent = art) => el('g', { filter: `url(#${ST.filtro})` }, parent);

  function linea(d, { color = ST.ink, w = ST.w, g = art, op = 1, cap = 'round', dash } = {}) {
    return el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': cap, 'stroke-linejoin': 'round', opacity: 0, 'data-op': op, 'stroke-dasharray': dash }, g);
  }
  // draw these elements one after another between t0 and t0 + dur; returns the end time
  function dibuja(els, t0, dur, { ease = 'power1.inOut', mano = true, hueco = 0.05, sonido = true, ctm = null } = {}) {
    els = [].concat(els).filter(Boolean); if (!els.length) return t0;
    const L = els.map((e) => Math.max(1, e.getTotalLength()));
    const wts = L.map((l) => Math.pow(l + 25, 0.8)), sum = wts.reduce((a, b) => a + b, 0);
    const lift = els.length > 1 ? Math.min(hueco, (dur * 0.3) / (els.length - 1)) : 0;
    const avail = dur - lift * (els.length - 1);
    let t = t0; const ez = gsap.parseEase(ease), dmin = Math.min(0.012, (avail / els.length) * 0.5);
    els.forEach((e, i) => {
      const d = Math.max(dmin, (avail * wts[i]) / sum);
      e._t0 = t; tl.set(e, { opacity: +(e.getAttribute('data-op') || 1) }, t);
      tl.fromTo(e, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: d, ease, immediateRender: true }, t);
      if (mano) S.push({ el: e, ctm, t0: t, t1: t + d, ease: ez, len: L[i] });
      else if (sonido) EXTRA.push({ t0: t, t1: t + d, tool: ST.tool });
      t += d + lift;
    });
    return t - lift;
  }
  // words already on the board (no animation): one filled path
  function texto(txt, { x, y, size, font, color = ST.ink, align = 'left', g = art }) {
    const F = FONTS[font], adv = F.getAdvanceWidth(txt, size, { kerning: true });
    const x0 = align === 'center' ? x - adv / 2 : align === 'right' ? x - adv : x;
    return el('path', { d: F.getPath(txt, x0, y, size, { kerning: true }).toPathData(1), fill: color }, g);
  }
  // already on the board when the film starts
  function ya(els) { [].concat(els).forEach((e) => { tl.killTweensOf(e); gsap.set(e, { drawSVG: '0% 100%' }); e.style.opacity = ''; e.setAttribute('opacity', e.getAttribute('data-op') || 1); }); }
  // the hand leaves the frame at these times (until its next stroke)
  const OUTS = []; function salida(t) { OUTS.push(t); OUTS.sort((a, b) => a - b); }
  // words: each letter's outline traced, then filled
  function escribe(txt, { x, y, size, font, color = ST.ink, t0, dur, align = 'left', g = art, trazo, relleno = true, mano = true, op = 1, ease = 'power1.inOut' }) {
    const F = FONTS[font]; if (!F) throw new Error('no font ' + font);
    const adv = F.getAdvanceWidth(txt, size, { kerning: true });
    const x0 = align === 'center' ? x - adv / 2 : align === 'right' ? x - adv : x;
    const grp = el('g', {}, g), glyphs = [];
    F.forEachGlyph(txt, x0, y, size, { kerning: true }, (gl, gx, gy, fs) => {
      const subs = contornos(gl.getPath(gx, gy, fs).commands); if (!subs.length) return;
      const fill = relleno ? el('path', { d: subs.join(''), fill: color, opacity: 0 }, grp) : null;
      const outs = subs.map((d) => linea(d, { color, w: trazo || Math.max(1.6, size * 0.026), g: grp, op }));
      glyphs.push({ fill, outs, L: outs.reduce((a, e) => a + e.getTotalLength(), 0) });
    });
    const sum = glyphs.reduce((a, gq) => a + Math.pow(gq.L + 40, 0.8), 0); let t = t0;
    glyphs.forEach((gq) => {
      const d = (dur * Math.pow(gq.L + 40, 0.8)) / sum;
      dibuja(gq.outs, t, d * 0.92, { ease, mano, hueco: 0.015 });
      if (gq.fill) tl.fromTo(gq.fill, { opacity: 0 }, { opacity: op, duration: Math.min(0.12, d * 0.5), ease: 'power1.out', immediateRender: true }, t + d * 0.7);
      t += d;
    });
    return { g: grp, w: adv, end: t0 + dur };
  }
  // colour a shape in with a scribble clipped to it
  function colorea(dShape, { color, t0, dur, g = bajo, ang = -32, paso = 15, ancho, op = 0.9, mano = true } = {}) {
    const id = 'cp' + ++uid; const cp = el('clipPath', { id }, defs); el('path', { d: dShape }, cp);
    const tmp = el('path', { d: dShape }, g); const bb = tmp.getBBox(); tmp.remove();
    const a = (ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, R = Math.hypot(bb.width, bb.height) / 2 + paso;
    const pts = []; let k = 0;
    for (let o = -R; o <= R; o += paso) {
      // the hatch line through the box, cut to the box (so the scribble stays on the shape)
      const ox = cx - s * o, oy = cy + c * o; let t0c = -1e9, t1c = 1e9;
      for (const [p, dd, lo, hi] of [[ox, c, bb.x - 4, bb.x + bb.width + 4], [oy, s, bb.y - 4, bb.y + bb.height + 4]]) {
        if (Math.abs(dd) < 1e-6) { if (p < lo || p > hi) { t0c = 1; t1c = 0; } continue; }
        let ta = (lo - p) / dd, tb = (hi - p) / dd; if (ta > tb) [ta, tb] = [tb, ta]; t0c = Math.max(t0c, ta); t1c = Math.min(t1c, tb);
      }
      if (t1c <= t0c) continue;
      const A = [ox + c * t0c, oy + s * t0c], B = [ox + c * t1c, oy + s * t1c];
      if (k++ % 2) pts.push(B, A); else pts.push(A, B);
    }
    const gg = el('g', { 'clip-path': `url(#${id})` }, g);
    const d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
    const z = linea(d, { color, w: ancho || paso * 1.75, g: gg, op, cap: 'round' });
    dibuja(z, t0, dur, { ease: 'none', mano });
    return z;
  }
  // a Chinese character painted stroke by stroke (Make Me a Hanzi data: 1024 units, y up from 900): each stroke's
  // outline is filled, and a mask reveals it along the stroke's centre line, the way the brush moves
  function caracter(H, { x, y, size, color = ST.ink, t0, dur, g = art, mano = true, ancho = 130, ease = 'power2.inOut', hueco = 0.06 }) {
    const k = size / 1024;
    const grp = el('g', { transform: `translate(${x} ${y}) scale(${k}) translate(0 900) scale(1 -1)` }, g);
    const meds = H.strokes.map((d, i) => {
      const id = 'hz' + ++uid;
      const m = el('mask', { id, maskUnits: 'userSpaceOnUse', x: -300, y: -400, width: 1700, height: 1700 }, defs);
      const mp = el('path', { d: 'M' + H.medians[i].map((q) => q[0] + ' ' + q[1]).join(' L'), fill: 'none', stroke: '#fff', 'stroke-width': ancho, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, m);
      mp._fill = el('path', { d, fill: color, mask: `url(#${id})`, opacity: 0 }, grp);
      return mp;
    });
    const end = dibuja(meds, t0, dur, { ease, mano, hueco, ctm: grp });
    // each stroke stays hidden by its own opacity until the brush reaches it (a mask alone is not always respected)
    meds.forEach((mp) => tl.set(mp._fill, { opacity: 1 }, mp._t0));
    return { g: grp, end, meds };
  }
  // a real photo: sketched from its traced lines inside a drawn frame, then the photo itself appears
  function fotoReal(J, src, { x, y, w, t0, dur, tFoto, color = ST.ink, ancho = 3, marco = true, cinta = '#f4e4a8', fade = 0.5, grupoLineas = 7 }) {
    const k = w / J.w, h = J.h * k; const g = el('g', {}, art);
    let tt = t0;
    if (marco) {
      const m = 14, f = linea(`M${x - m} ${y - m} L${x + w + m} ${y - m} L${x + w + m} ${y + h + m} L${x - m} ${y + h + m} Z`, { color, w: Math.max(ancho, ST.w * 0.6), g });
      tt = dibuja(f, t0, Math.min(0.35, dur * 0.18), { ease: 'power1.inOut' });
    }
    const runs = []; let cur = '', n = 0;
    J.lines.forEach((L) => { const pts = []; for (let i = 0; i < L.length; i += 2) pts.push([x + L[i] * k, y + L[i + 1] * k]); cur += suave(pts); if (++n >= grupoLineas) { runs.push(cur); cur = ''; n = 0; } });
    if (cur) runs.push(cur);
    const paths = runs.map((d) => linea(d, { color, w: ancho, g }));
    dibuja(paths, tt, t0 + dur - tt, { ease: 'none', hueco: 0.004 });
    const img = el('image', { href: src, x, y, width: w, height: h, opacity: 0, preserveAspectRatio: 'xMidYMid slice' }, sobre);
    tl.fromTo(img, { opacity: 0 }, { opacity: 1, duration: fade, ease: 'power2.out', immediateRender: true }, tFoto);
    tl.to(g.querySelectorAll('path:not(:first-child)'), { opacity: 0, duration: 0.5 }, tFoto + 0.25);
    // tape on two corners
    const tapes = [[x - 30, y - 22, -14], [x + w - 70, y + h - 18, -12]].map(([tx, ty, r]) => el('rect', { x: tx, y: ty, width: 110, height: 40, fill: cinta, opacity: 0, transform: `rotate(${r} ${tx + 55} ${ty + 20})` }, sobre));
    tapes.forEach((tp, i) => tl.fromTo(tp, { opacity: 0 }, { opacity: 0.85, duration: 0.12, immediateRender: true }, tFoto + 0.25 + i * 0.12));
    return { img, g, h, tapes };
  }
  // a thing that is stuck on rather than drawn: pops in
  function aparece(e, t0, { tipo = 'pop', dur = 0.32 } = {}) {
    if (tipo === 'pop') tl.fromTo(e, { scale: 0.2, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: dur, ease: 'back.out(2.2)', immediateRender: true }, t0);
    else if (tipo === 'sello') tl.fromTo(e, { scale: 2.2, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: 0.16, ease: 'power3.in', immediateRender: true }, t0);
    else tl.fromTo(e, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power1.out', immediateRender: true }, t0);
  }

  // the camera: centred on board point (x, y), zoom s, roll r
  const C = { x: 540, y: 960, s: 1, r: 0 }; let last = { ...C };
  function camara(t0, dur, to, ease = 'power2.inOut') { const from = { ...last }; last = { ...last, ...to }; tl.fromTo(C, from, { ...last, duration: dur, ease, immediateRender: false }, t0); }
  function camaraYa(to) { Object.assign(C, to); last = { ...C }; }
  function aplicaCam(t) {
    const x = C.x + Math.sin(t * 0.6) * 3, y = C.y + Math.cos(t * 0.5) * 3, r = C.r + Math.sin(t * 0.37) * 0.25;
    camG.setAttribute('transform', `translate(540 960) rotate(${r.toFixed(3)}) scale(${C.s.toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`);
  }

  // the hand
  const PARK = { x: 1500, y: 2500 };
  const pt = (s, u) => { const p = s.el.getPointAtLength(s.len * clamp(u)); const m = (s.ctm || s.el).getCTM(); return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f }; };
  const mix = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
  let sorted = null;
  function manoEn(t) {
    if (!S.length) return { ...PARK, up: 1 };
    if (!sorted) sorted = [...S].sort((a, b) => a.t0 - b.t0);
    let i = -1; for (let k = 0; k < sorted.length; k++) { if (sorted[k].t0 <= t) i = k; else break; }
    if (i === -1) { const s0 = sorted[0], a = prog(t, s0.t0 - 0.45, s0.t0); return { ...mix(PARK, pt(s0, 0), E.out(a)), up: 1 - a }; }
    const s = sorted[i];
    if (t <= s.t1) return { ...pt(s, s.ease(prog(t, s.t0, s.t1))), up: 0 };
    const pe = pt(s, 1), nx = sorted[i + 1];
    if (!nx) { const a = prog(t, s.t1 + 0.12, s.t1 + 0.6); return { ...mix(pe, PARK, E.in(a)), up: Math.min(1, (t - s.t1) * 6) }; }
    const gap = nx.t0 - s.t1, forced = OUTS.find((o) => o >= s.t1 - 1e-6 && o < nx.t0 - 0.3);
    if (gap > 1.3 || forced !== undefined) {
      const t0o = forced !== undefined ? Math.max(forced, s.t1) : s.t1 + 0.12;
      const out = prog(t, t0o, t0o + 0.42), back = prog(t, nx.t0 - 0.45, nx.t0);
      if (back <= 0) return { ...mix(pe, PARK, E.in(out)), up: 1 };
      return { ...mix(PARK, pt(nx, 0), E.out(back)), up: 1 - back * 0.7 };
    }
    const tr = Math.min(gap, 0.3), a = prog(t, nx.t0 - tr, nx.t0), u = E.inOut(a), p = mix(pe, pt(nx, 0), u);
    return { x: p.x, y: p.y - Math.sin(Math.PI * u) * 16, up: gap > 0.08 ? Math.max(Math.sin(Math.PI * u), a < 1 ? 0.6 : 0) : 0 };
  }
  let lastHand = null;
  function pintaMano(t) {
    const h = manoEn(t); let x = h.x, y = h.y;
    // a tiny tremor while drawing, and a slow sway
    x += Math.sin(t * 23.0) * 0.6; y += Math.cos(t * 19.0) * 0.6;
    const ang = -38 + (x - 540) * 0.012 + Math.sin(t * 2.1) * 1.2, sc = escala * (1 + h.up * 0.035);
    manoU.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(2)}) scale(${sc.toFixed(4)})`);
    sombraU.setAttribute('transform', `translate(${(x + 20 + h.up * 22).toFixed(1)} ${(y + 30 + h.up * 26).toFixed(1)}) rotate(${ang.toFixed(2)}) scale(${sc.toFixed(4)})`);
    lastHand = h;
  }
  function render(t) { tl.seek(t, false); aplicaCam(t); pintaMano(t); }
  // the sound of the tool: strokes close together become one gesture
  function cuesTrazos(g = 0.24) {
    const all = [...S.map((s) => ({ t0: s.t0, t1: s.t1, tool: ST.tool, v: s.len / Math.max(0.02, s.t1 - s.t0) })), ...EXTRA.map((e) => ({ ...e, v: 600 }))].sort((a, b) => a.t0 - b.t0);
    const out = [];
    for (const s of all) {
      const p = out[out.length - 1];
      if (p && s.t0 - p.t1 < 0.035) { p.t1 = Math.max(p.t1, s.t1); p.v = Math.max(p.v, s.v); }
      else out.push({ ...s });
    }
    return out.map((s) => ({ t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), tool: s.tool, g: +(g * clamp(0.55 + s.v / 2500, 0.55, 1.15)).toFixed(3) }));
  }
  return { ST, svg, defs, camG, fondo, bajo, art, sobre, tl, S, linea, dibuja, ya, salida, texto, escribe, colorea, caracter, fotoReal, aparece, camara, camaraYa, render, cuesTrazos, grupo, capa, el };
}
