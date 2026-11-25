// Dato Bomba: el formato común de los Shorts del canal, sobre el motor de dibujo a mano.
//  · Fotograma 0: la tarjeta amarilla con el gancho y el logo «?!», y el dibujo principal ya en la pizarra.
//  · Arriba, una mecha que se quema hasta la bomba: el espectador espera la explosión (bucle abierto).
//  · En la frase del giro, la bomba estalla: «¡BUM!», destello, sacudida, la música se corta un instante.
//  · Subtítulos en cajas de cómic por encima de la zona que tapa YouTube; después del giro, el sello del canal.
// Cada vídeo solo escribe sus dibujos y en qué palabra aparece cada uno.
import { tiempos, capas, sonido } from './capas.js';
import { pizarra, fuente } from './dibujo.js';
import { clamp, lerp, prog, E } from './util.js';

export const PAL = {
  blanca:   { k: '#1d1d20', r: '#e0312b', y: '#ffd400', g: '#2fbf71', b: '#1f6fd1', o: '#ff9f1c', p: '#ff5fae', n: '#8a5a2b', gr: '#8f969c', w: '#ffffff' },
  cuaderno: { k: '#1e3fa6', r: '#ff4d4d', y: '#ffe14d', g: '#5be37d', b: '#4aa3ff', o: '#ffa94d', p: '#ff6fb5', n: '#b07a4a', gr: '#9aa0a6', w: '#ffffff' },
  boceto:   { k: '#3a332b', r: '#c8463c', y: '#e8b62c', g: '#6b9e5a', b: '#5a86b8', o: '#d9822b', p: '#d98aa0', n: '#8a6a4a', gr: '#8a8580', w: '#fffaf0' },
  tiza:     { k: '#f3f1e7', r: '#ff8fa3', y: '#ffd84d', g: '#8fe3a0', b: '#8fd3ff', o: '#f7b267', p: '#ffb3d9', n: '#c8a27a', gr: '#b9c0c6', w: '#ffffff' },
  arroz:    { k: '#17130f', r: '#c62a1f', y: '#e0a82e', g: '#5f8f4e', b: '#4f7ca8', o: '#d97a2b', p: '#d88a9a', n: '#7a5a3a', gr: '#7d7a76', w: '#fbf6ec' },
  neon:     { k: '#3ff5ff', r: '#ff4f6d', y: '#ffe94d', g: '#8dff6a', b: '#3ff5ff', o: '#ffab4d', p: '#ff4fd8', n: '#ffab4d', gr: '#c9d6ff', w: '#ffffff' },
};
const FUENTE = { blanca: 'pm', cuaderno: 'ka', boceto: 'ka', tiza: 'ka', arroz: 'br', neon: 'pm' };
const MUSICA = { blanca: 'comic', tiza: 'comic', cuaderno: 'cuaderno', boceto: 'lapiz', arroz: 'tinta', neon: 'neon' };
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, at = {}, p = null, txt = null) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); if (txt !== null) e.textContent = txt; return e; };
const rafaga = (cx, cy, R, r, n = 12, ky = 0.85) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr * ky).toFixed(1); } return d + 'Z'; };
const LOGO = `<svg viewBox="0 0 800 800"><path d="${rafaga(400, 400, 330, 150, 8, 1)}" fill="#141414" transform="translate(18 18)"/><path d="${rafaga(400, 400, 330, 150, 8, 1)}" fill="#fff200" stroke="#141414" stroke-width="22" stroke-linejoin="round"/><g transform="rotate(-8 400 410)"><text x="400" y="545" text-anchor="middle" font-family="Bungee" font-size="400" fill="#fff" stroke="#141414" stroke-width="22" paint-order="stroke">?!</text></g></svg>`;

export async function arranque({ gancho, claves = [], manga } = {}) {
  const T = await tiempos();
  const G = await (await fetch('guion.json')).json();
  await Promise.all([fuente('pm', '../fonts/permanent-marker.ttf'), fuente('ka', '../fonts/kalam-bold.ttf'), fuente('cv', '../fonts/caveat.ttf'), fuente('br', '../fonts/caveat-brush.ttf')]);
  await document.fonts.load('400 60px Bungee', '¡?!ÁÉÍÓÚÑ0'); await document.fonts.ready;
  const estilo = G.estilo, neon = estilo === 'neon', P = PAL[estilo], FONT = FUENTE[estilo];
  const D = pizarra(estilo, { mano: !neon, manga, mundo: [-2000, -2000, 5080, 12000] });
  document.getElementById('stage').classList.add('bomba');
  if (estilo === 'cuaderno') {   // las cuadrículas del cuaderno
    const rej = D.grupo(D.fondo, { opacity: 0.55 });
    for (let y = -600; y < 9000; y += 48) D.el('path', { d: `M-600 ${y} H1700`, stroke: '#9cc3e6', 'stroke-width': 2 }, rej);
    for (let x = -600; x < 1700; x += 48) D.el('path', { d: `M${x} -600 V9000`, stroke: '#cfe1f2', 'stroke-width': 1.5 }, rej);
    D.el('path', { d: 'M90 -600 V9000', stroke: '#f08a8a', 'stroke-width': 3 }, rej);
  }
  const A = sonido(), DUR = T.G.dur;
  const tBum = T.line(G.bum ?? 3).t0 - 0.12, tH = T.line(1).t0 - 0.12;
  const K = capas(T, { keys: claves, top: 1235, dur: DUR }); K.fromT(T.line(1).t0 - 0.06);
  const at = (w, n = 1) => T.at(w, n);
  const Y = (n, y) => n * 1700 + y;

  // ---- la capa de marca ----
  const stage = document.getElementById('stage');
  const capa = document.createElement('div'); capa.id = 'bomba'; stage.insertBefore(capa, document.getElementById('cap'));
  const svg = sv('svg', { width: 1080, height: 1920, viewBox: '0 0 1080 1920' }); capa.appendChild(svg);
  svg.innerHTML = '<defs><filter id="bb-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="7"/></filter></defs>';
  // la mecha y la bomba
  let dRope = 'M80 ' + 165; for (let x = 100; x <= 900; x += 20) dRope += ` L${x} ${(165 + Math.sin(x * 0.03) * 9).toFixed(1)}`;
  const mecha = sv('g', {}, svg);
  const cuerda = sv('path', { d: dRope, fill: 'none', stroke: '#4a3424', 'stroke-width': 11, 'stroke-linecap': 'round' }, mecha);
  const bomb = sv('g', {}, mecha);
  sv('circle', { cx: 958, cy: 182, r: 56, fill: '#141414', transform: 'translate(8 8)', opacity: 0.35 }, bomb);
  sv('rect', { x: 896, y: 138, width: 34, height: 26, rx: 4, fill: '#3a3a3a', stroke: '#141414', 'stroke-width': 4, transform: 'rotate(-35 913 151)' }, bomb);
  sv('circle', { cx: 958, cy: 182, r: 56, fill: '#1b1b1b', stroke: '#141414', 'stroke-width': 5 }, bomb);
  sv('path', { d: 'M924 160 A40 40 0 0 1 950 140', fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.55 }, bomb);
  sv('text', { x: 960, y: 200, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 46, fill: '#fff200' }, bomb, '?!');
  const chispa = sv('g', {}, svg);
  sv('circle', { r: 30, fill: '#ffd43b', opacity: 0.55, filter: 'url(#bb-glow)' }, chispa);
  const estrellaC = sv('path', { d: rafaga(0, 0, 22, 8, 6, 1), fill: '#fff200', stroke: '#ff8a1f', 'stroke-width': 3 }, chispa);
  sv('circle', { r: 6, fill: '#fff' }, chispa);
  const chispitas = Array.from({ length: 6 }, () => sv('path', { stroke: '#ffd43b', 'stroke-width': 3, 'stroke-linecap': 'round' }, chispa));
  // el sello del canal (después del giro)
  const chip = sv('g', { opacity: 0 }, svg);
  sv('path', { d: rafaga(96, 166, 44, 22, 8, 1), fill: '#fff200', stroke: '#141414', 'stroke-width': 5 }, chip);
  sv('text', { x: 96, y: 182, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 38, fill: '#fff', stroke: '#141414', 'stroke-width': 5, 'paint-order': 'stroke' }, chip, '?!');
  sv('text', { x: 152, y: 182, 'font-family': 'Bungee', 'font-size': 40, fill: '#fff', stroke: '#141414', 'stroke-width': 7, 'paint-order': 'stroke' }, chip, 'DATO BOMBA');
  // la explosión
  const bum = sv('g', { opacity: 0 }, svg);
  sv('path', { d: rafaga(540, 800, 420, 290, 12), fill: '#141414', transform: 'translate(18 18)' }, bum);
  sv('path', { d: rafaga(540, 800, 420, 290, 12), fill: '#fff200', stroke: '#141414', 'stroke-width': 14, 'stroke-linejoin': 'round' }, bum);
  sv('path', { d: rafaga(540, 800, 250, 170, 10), fill: '#ff3b4e', stroke: '#141414', 'stroke-width': 10, 'stroke-linejoin': 'round' }, bum);
  sv('text', { x: 552, y: 878, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 200, fill: '#141414', transform: 'rotate(-6 540 800)' }, bum, '¡BUM!');
  sv('text', { x: 540, y: 866, 'text-anchor': 'middle', 'font-family': 'Bungee', 'font-size': 200, fill: '#fff', stroke: '#141414', 'stroke-width': 12, 'paint-order': 'stroke', transform: 'rotate(-6 540 800)' }, bum, '¡BUM!');
  // la tarjeta del gancho
  const gan = document.createElement('div'); gan.id = 'gancho';
  gan.innerHTML = `<div class="caja"><div class="logo">${LOGO}</div>${gancho}</div>`; capa.appendChild(gan);
  let L = 0;
  const board = document.getElementById('board');
  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function marca(t) {
    if (!L) L = cuerda.getTotalLength();
    // la mecha se consume hasta la bomba
    const p = clamp(t / tBum), vivo = t < tBum;
    mecha.setAttribute('opacity', vivo ? 1 : 0); chispa.setAttribute('opacity', vivo ? 1 : 0);
    cuerda.style.strokeDasharray = `${L} ${L}`; cuerda.style.strokeDashoffset = -L * p;
    const pt = cuerda.getPointAtLength(L * p), f = Math.floor(t * 30);
    chispa.setAttribute('transform', `translate(${pt.x} ${pt.y}) scale(${0.85 + rnd(f) * 0.35})`);
    estrellaC.setAttribute('transform', `rotate(${(t * 400) % 360})`);
    chispitas.forEach((c, i) => { const a = rnd(f * 7 + i) * Math.PI * 2, r0 = 14, r1 = 24 + rnd(f + i * 3) * 22; c.setAttribute('d', `M${Math.cos(a) * r0} ${Math.sin(a) * r0} L${Math.cos(a) * r1} ${Math.sin(a) * r1}`); });
    // la bomba tiembla más cuanto menos falta
    const ten = clamp((t - tBum + 2.5) / 2.5), sh = ten * ten * 5;
    bomb.setAttribute('transform', `translate(${Math.sin(t * 60) * sh} ${Math.cos(t * 47) * sh}) translate(958 182) scale(${1 + Math.sin(t * 9) * 0.03 + ten * 0.08}) translate(-958 -182)`);
    // la explosión
    const k = t - tBum;
    if (k >= 0 && k < 0.95) {
      const s = k < 0.14 ? lerp(0.2, 1.12, E.out(k / 0.14)) : k < 0.6 ? lerp(1.12, 1, E.out((k - 0.14) / 0.3)) : lerp(1, 1.45, E.in((k - 0.6) / 0.35));
      bum.setAttribute('opacity', k < 0.6 ? 1 : 1 - (k - 0.6) / 0.35); bum.setAttribute('transform', `translate(540 800) rotate(${Math.sin(k * 30) * 3 * (1 - k)}) scale(${s}) translate(-540 -800)`);
    } else bum.setAttribute('opacity', 0);
    const fl = k >= 0 ? 0.85 * Math.exp(-k * 9) : 0; document.getElementById('flash').style.opacity = fl;
    const am = k >= 0 && k < 0.6 ? 20 * Math.exp(-k * 7) : 0; board.style.transformOrigin = '540px 960px'; board.style.transform = am > 0.3 ? `translate(${Math.sin(k * 90) * am}px, ${Math.cos(k * 70) * am}px) scale(1.05)` : '';
    chip.setAttribute('opacity', clamp((t - tBum - 0.75) / 0.25));
    // la tarjeta del gancho se va al empezar la segunda frase
    const g = prog(t, tH, tH + 0.28);
    gan.style.opacity = 1 - g; gan.style.transform = `translateY(${-70 * E.in(g)}px) scale(${1 + 0.12 * g})`;
  }

  // ---- ayudas para dibujar ----
  function escena(n, t, { dur = 0.5, s = 1, x = 540, dy = 0, r = 0, sonar = true } = {}) { D.camara(t, dur, { x, y: n * 1700 + 960 + dy, s, r }, 'power3.inOut'); if (sonar) A.fx(t, 'whoosh', 0.14); }
  function pinta(dd, { x = 0, y = 0, s = 1, t0 = 0, dur = 0.8, ya: pre = false, mano = true, color = null, relleno = true, fdur = 0.3, rot = 0, op = 1, en = null } = {}) {
    const tf = `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
    const gb = D.grupo(en ? en[1] : D.bajo, { transform: tf }), g = D.capa(D.grupo(en ? en[0] : D.art, { transform: tf }));
    const w = (D.ST.w * 1.3) / Math.max(0.35, s);
    const lines = [];
    dd.t.forEach(([d, k = 1, c = null, giro = 0]) => {
      const col = neon ? (c ? P[c] : color || P.k) : c ? P[c] : color || P.k;
      const l = D.linea(d, { g, color: col, w: w * k, op });
      if (giro) l.setAttribute('transform', `rotate(${giro} 200 200)`);
      lines.push(l);
      if (neon) { const core = D.linea(d, { g, color: '#ffffff', w: w * k * 0.3, op: 0.85 * op }); if (giro) core.setAttribute('transform', `rotate(${giro} 200 200)`); lines.push(core); }
    });
    let end = t0;
    if (pre) D.ya(lines); else end = D.dibuja(lines, t0, dur, { mano, hueco: 0.02 });
    const fills = [];
    if (relleno && !neon) dd.f.forEach(([d, c, o = 0.55], i) => {
      const z = D.colorea(d, { color: P[c] || c, t0: end + i * fdur * 0.6, dur: fdur, g: gb, op: o, mano: false, paso: 14 / Math.max(0.5, s) });
      if (pre) D.ya(z); fills.push(z);
    });
    return { g, gb, lines, fills, end: pre ? 0 : end + (relleno && !neon ? dd.f.length * fdur * 0.6 : 0) };
  }
  function texto(txt, { x = 540, y, size = 110, font = FONT, color = null, t0 = 0, dur = 0.5, align = 'center', mano = false, ya: pre = false } = {}) {
    const g = D.capa(D.grupo(D.art));
    const r = D.escribe(txt, { x, y, size, font, color: color || P.k, t0, dur: pre ? 0.01 : dur, align, g, mano });
    if (pre) D.ya([...r.g.querySelectorAll('path')]);
    return r;
  }
  const par = () => [D.grupo(D.art), D.grupo(D.bajo)];
  const sello = (html, t0, { y = 300, t1 = null, clase = '', rot = -4, kind = 'stamp' } = {}) =>
    K.item(`<div style="width:1080px;display:flex;justify-content:center"><div class="sello ${clase}">${html}</div></div>`, 0, y, t0, t1 ?? DUR + 1, kind, rot);

  function listo({ ambiente = [], sfx = [] } = {}) {
    A.forItems(K.IT);
    A.fx(0.02, 'impact', 0.2); A.fx(tH, 'swish', 0.22);
    A.fx(Math.max(0, tBum - 1.5), 'riser', 0.2); A.fx(tBum, 'boom', 0.6); A.fx(tBum, 'impact', 0.45); A.fx(tBum + 0.04, 'confetti', 0.18);
    sfx.forEach(([t, tipo, g]) => A.fx(t, tipo, g));
    window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.2), ambiente: [{ tipo: 'mecha', desde: 0, hasta: tBum, g: 0.55 }, ...ambiente],
      musica: { archivo: G.id_musica || location.pathname.split('/').slice(-2, -1)[0] + '.wav', gain: 0.27, duck: 0.5, fadein: 0.05, fadeout: 0.6, silencios: [[tBum - 0.05, tBum + 0.45, 0.05]] } };
    window.__dur = DUR;
    window.__render = (t) => { D.render(t); marca(t); K.update(t); };
    window.__render(0); window.__ready = true;
    if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }
  return { T, G, D, P, A, K, at, Y, escena, pinta, texto, sello, par, tBum, tH, DUR, listo, estilo, FONT, MUSICA: MUSICA[estilo] };
}
