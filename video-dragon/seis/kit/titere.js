// LÓNG · a 2D puppet in SVG for the flat films: head (eyes that blink and look, brows, a mouth that opens with the
// voice), neck, torso, two arms that reach a point (two-bone IK) and hands. Skins set the colours, the hair and the
// style: 'vector' (flat, outlined), 'papel' (paper cut-out: white edge, shadow, paper grain) or 'trazo' (marker lines).
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
export const svgEl = el;
export function titere(parent, skin = {}) {
  const S = Object.assign({ skin: '#f2c29b', shade: '#d9a37c', hair: '#3a2418', shirt: '#ff3b4e', shirt2: '#d62a3c', line: '#1d1a2b', lw: 7, hairStyle: 'kid', eye: '#1d1a2b', cheek: '#ff8f8f', scale: 1, style: 'vector' }, skin);
  const lineOn = S.style !== 'papel';
  const st = (fill, extra = {}) => Object.assign({ fill: S.style === 'trazo' ? 'none' : fill, stroke: lineOn ? S.line : 'none', 'stroke-width': S.lw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, extra);
  const root = el('g', {}, parent), body = el('g', {}, root);
  const filt = S.style === 'papel' ? { filter: 'url(#paper)' } : {};
  // arms behind? the far arm goes behind the torso
  const armG = (side) => {
    const sh = el('g', filt, body), up = el('rect', st(S.shirt, { x: -27, y: -10, width: 54, height: 160, rx: 27 }), sh);
    const el2 = el('g', {}, sh), lo = el('rect', st(S.skin, { x: -23, y: -8, width: 46, height: 150, rx: 23 }), el2);
    const hand = el('g', {}, el2), palm = el('circle', st(S.skin, { r: 34 }), hand);
    el('path', st('none', { d: `M ${-side * 18} -6 q ${side * 6} 18 ${side * 22} 22` }), hand);
    return { sh, up, el: el2, lo, hand, side };
  };
  const armB = armG(-1);
  const torso = el('path', st(S.shirt, Object.assign({ d: 'M -112 22 Q -134 190 -124 360 L 124 360 Q 134 190 112 22 Q 0 -14 -112 22 Z' }, filt)), body);
  el('path', st(S.shirt2, { d: 'M -60 4 Q 0 40 60 4', fill: 'none' }), body);
  const neck = el('rect', st(S.skin, { x: -26, y: -40, width: 52, height: 56, rx: 18 }), body);
  const head = el('g', filt, body);
  // hair behind the head
  const hairBack = el('g', {}, head);
  if (S.hairStyle === 'mom') { el('circle', st(S.hair, { cx: 0, cy: -232, r: 52 }), hairBack); el('path', st(S.hair, { d: 'M -118 -110 Q -128 -230 0 -236 Q 128 -230 118 -110 Q 112 -40 84 -10 L -84 -10 Q -112 -40 -118 -110 Z' }), hairBack); }
  const face = el('ellipse', st(S.skin, { cx: 0, cy: -120, rx: 104, ry: 116 }), head);
  el('ellipse', st(S.skin, { cx: -102, cy: -112, rx: 18, ry: 26 }), head); el('ellipse', st(S.skin, { cx: 102, cy: -112, rx: 18, ry: 26 }), head);
  const hairFront = el('g', {}, head);
  if (S.hairStyle === 'kid') el('path', st(S.hair, { d: 'M -104 -140 Q -110 -236 -20 -244 L -6 -270 L 18 -242 L 40 -262 L 52 -236 Q 112 -226 106 -138 Q 70 -196 -10 -186 Q -70 -182 -104 -140 Z' }), hairFront);
  if (S.hairStyle === 'mom') el('path', st(S.hair, { d: 'M -106 -120 Q -100 -226 0 -232 Q 100 -226 106 -120 Q 60 -190 0 -178 Q -50 -186 -106 -120 Z' }), hairFront);
  const eyes = [-38, 38].map((x) => { const g = el('g', {}, head); const w = el('ellipse', st('#ffffff', { cx: x, cy: -128, rx: 22, ry: 26, 'stroke-width': S.lw * 0.7 }), g); const p = el('circle', { cx: x, cy: -124, r: 12, fill: S.style === 'trazo' ? 'none' : S.eye, stroke: S.style === 'trazo' ? S.line : 'none', 'stroke-width': 5 }, g); return { g, w, p, x }; });
  const brows = [-38, 38].map((x) => el('path', { d: `M ${x - 24} -168 Q ${x} -178 ${x + 24} -168`, fill: 'none', stroke: S.line, 'stroke-width': S.lw * 1.2, 'stroke-linecap': 'round' }, head));
  const cheeks = [-62, 62].map((x) => el('ellipse', { cx: x, cy: -86, rx: 18, ry: 11, fill: S.cheek, opacity: S.style === 'trazo' ? 0 : 0.55 }, head));
  const mouth = el('path', { d: '', fill: S.style === 'trazo' ? 'none' : '#5a1f2a', stroke: S.line, 'stroke-width': S.lw * 0.8, 'stroke-linejoin': 'round' }, head);
  const armF = armG(1);
  const SH = { [-1]: [-118, 60], 1: [118, 60] };
  const L1 = 140, L2 = 150;
  function reach(a, sx, sy, tx, ty, bendDir) {   // two-bone IK in the plane: the elbow bends down and out
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const dm = Math.min(Math.max(d, Math.abs(L1 - L2) + 1), L1 + L2 - 1);
    const base = Math.atan2(dy, dx), cosA = (L1 * L1 + dm * dm - L2 * L2) / (2 * L1 * dm), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const upAng = base + bendDir * A, ex = sx + Math.cos(upAng) * L1, ey = sy + Math.sin(upAng) * L1, loAng = Math.atan2(ty - ey, tx - ex);
    a.sh.setAttribute('transform', `translate(${sx} ${sy}) rotate(${(upAng * 180) / Math.PI - 90})`);
    a.el.setAttribute('transform', `translate(0 ${L1}) rotate(${((loAng - upAng) * 180) / Math.PI})`);
    a.hand.setAttribute('transform', `translate(0 ${L2})`);
    return [ex + Math.cos(loAng) * L2, ey + Math.sin(loAng) * L2];
  }
  // state: x, y (root, at the neck), s (scale), lean (deg), head (deg), look (-1..1), blink (0..1), mouth (0..1), smile (-1..1),
  // brows (-1 angry .. 1 surprised), eyesBig, armF/armB: [x, y] targets relative to the root (unscaled), or null to rest
  function set(o) {
    root.setAttribute('transform', `translate(${o.x} ${o.y}) scale(${(o.s || 1) * S.scale}) rotate(${o.lean || 0})`);
    head.setAttribute('transform', `rotate(${o.head || 0} 0 -40)`);
    const look = (o.look || 0) * 8, bl = 1 - (o.blink || 0), big = 1 + (o.eyesBig || 0) * 0.35;
    eyes.forEach((e) => { e.w.setAttribute('ry', 26 * bl * big); e.w.setAttribute('rx', 22 * big); e.p.setAttribute('cx', e.x + look); e.p.setAttribute('r', (o.eyesBig ? 13 : 12) * Math.max(0.05, bl)); e.p.setAttribute('cy', -124 + (o.lookY || 0) * 6); });
    const b = o.brows || 0; brows.forEach((br, i) => { const x = i ? 38 : -38, s = i ? 1 : -1, y = -168 - b * 14; br.setAttribute('d', `M ${x - 24} ${y + (b < 0 ? -s * 0 + (i ? 10 : -10) * -b * -1 : 0)} Q ${x} ${y - 10 - b * 4} ${x + 24} ${y + (b < 0 ? (i ? -10 : 10) * -b : 0)}`); });
    const m = Math.max(0, Math.min(1, o.mouth || 0)), sm = o.smile ?? 0.5, w = 34 + sm * 8, open = 4 + m * 34;
    mouth.setAttribute('d', `M ${-w} -64 Q 0 ${-64 + sm * 18 + open} ${w} -64 Q 0 ${-64 + sm * 6 - (m > 0.05 ? 2 : 0)} ${-w} -64 Z`);
    const restF = [150, 300], restB = [-150, 300];
    const tf = o.armF || restF, tb = o.armB || restB;
    const hf = reach(armF, SH[1][0], SH[1][1], tf[0], tf[1], o.bendF ?? 1), hb = reach(armB, SH[-1][0], SH[-1][1], tb[0], tb[1], o.bendB ?? -1);   // elbows out
    return { hf, hb };
  }
  return { root, set, parts: { head, torso, eyes, mouth, armF, armB } };
}
// SVG defs the styles need: paper grain and the cut-out edge, a soft glow
export function defs(svg) {
  const d = el('defs', {}, svg);
  d.innerHTML = `<filter id="paper" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="edge"/><feFlood flood-color="#fffdf6"/><feComposite in2="edge" operator="in" result="white"/><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.12 0.1" result="grain"/><feComposite in="grain" in2="SourceAlpha" operator="in" result="g2"/><feMerge><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/><feMergeNode in="g2"/></feMerge><feDropShadow dx="6" dy="9" stdDeviation="6" flood-color="#000" flood-opacity="0.35"/></filter>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return d;
}
