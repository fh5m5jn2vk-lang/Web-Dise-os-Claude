// LÓNG · «¡El dragón chino es un Frankenstein!». A whiteboard and a marker: the hand finishes drawing a Chinese dragon
// (its head is already there in the first frame), stitches pop onto it, «¡FRANKENSTEIN! = 9 ANIMALES»; then, as each
// of Wang Fu's nine resemblances is said, the camera dives onto that part, the hand colours it in and its animal is
// written beside it with an arrow (antlers of a stag, head of a camel, eyes of a demon, neck of a snake, belly of a
// clam, scales of a carp, claws of an eagle, soles of a tiger, ears of a cow); the camera pulls back on the patchwork
// dragon, «hace casi 2.000 años», and pans down where the hand sketches the real dragon until the photo appears.
// Source of the list: Wang Fu (Han dynasty), as quoted in Visser, The Dragon in China and Japan (1913), p. 70.
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { dragon, flecha, circulo } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('pm', '../fonts/permanent-marker.ttf'), fuente('cv', '../fonts/caveat.ttf')]);
const J = await (await fetch('trazo.json')).json();
const DUR = +(T.END + 0.5).toFixed(3);
const D = pizarra('blanca');
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, aparece, fotoReal } = D;
const RED = '#d42b2b', A = sonido();

// the dragon: local coordinates + (40, 650) on the board
const OX = 40, OY = 760;
const dr = dragon({ garras: 5 });
const W = (p) => [p[0] + OX, p[1] + OY];
const gB = el('g', { transform: `translate(${OX} ${OY})` }, D.bajo);       // colour under the ink
const gA = D.capa(el('g', { transform: `translate(${OX} ${OY})` }, D.art)); // the ink
const L = (d, o = {}) => linea(d, { g: gA, ...o });

// the first frame is close on the head being finished; the camera pulls back as the body is drawn
camaraYa({ x: 260, y: 1010, s: 1.75, r: -1 });
camara(0.25, 0.9, { x: 540, y: 905, s: 0.92, r: 0 }, 'power2.inOut');
// 0 s: the head is already on the board; the hand is finishing the body
const cabeza = [L(dr.cabeza), L(dr.ojo), L(dr.pupila, { w: 6 }), L(dr.ceja), L(dr.nariz), ...dr.colmillos.map((d) => L(d, { w: 5 })), L(dr.oreja), ...dr.cuernos.map((d) => L(d, { w: 9 })), ...dr.bigotes.map((d) => L(d, { w: 5 }))];
ya(cabeza);
const piernas = [dr.delante, dr.detras].flatMap((p) => [L(p.zona), L(p.g.palma), ...p.g.talons.flatMap((tq) => [L(tq.toe, { w: 5 }), L(tq.una, { w: 4 })])]);
dibuja([L(dr.crin), L(dr.lomo), L(dr.panza), L(dr.cresta, { w: 5 }), ...dr.cola.map((d) => L(d)), ...piernas], 0.02, 1.8, { hueco: 0.03 });
// «Frankenstein»: stitches stamped on, the word written in red
const tF = T.at('frankenstein');
dr.costuras.forEach((d, i) => { const s = L(d, { w: 5, color: RED }); dibuja(s, tF + i * 0.12, 0.1, { mano: false, sonido: false }); A.fx(tF + i * 0.12, 'thump', 0.3); A.fx(tF + i * 0.12, 'slap', 0.16); });
escribe('¡FRANKENSTEIN!', { x: 540, y: 300, size: 118, font: 'pm', color: RED, t0: tF - 0.05, dur: 0.75, align: 'center', mano: false });
// «nueve animales»: the hand writes it, then rings the 9
const tN = T.at('nueve');
escribe('= 9 ANIMALES', { x: 540, y: 455, size: 96, font: 'pm', t0: T.at('esta') - 0.02, dur: 0.95, align: 'center' });
dibuja(linea(circulo(395, 421, 70, 66)), tN + 0.42, 0.32);
A.fx(tN, 'pop', 0.2);

// the nine: [word, zone or strokes, colour, label, label position (board), arrow tip (board), zoom]
const pt = (p) => W(p);
const bodyPt = (u, side = 0) => { const i = Math.round(u * 63), s = dr.S[i]; return W([s.x + s.nx * side, s.y + s.ny * side]); };
const nueve = [
  ['cuernos', 'cuernos', '#8a5a2b', 'CIERVO', [330, 800], pt([250, 165]), 2.0],
  ['cabeza', dr.zonas.cabeza, '#f2c14e', 'CAMELLO', [125, 880], pt([110, 260]), 1.75],
  ['ojos', dr.zonas.ojo, '#e53935', 'DEMONIO', [140, 1210], pt([172, 270]), 2.0],
  ['cuello', dr.zonas.cuello, '#58b368', 'SERPIENTE', [560, 900], bodyPt(0.07, -20), 1.65],
  ['vientre', dr.zonas.vientre, '#7cc8f2', 'ALMEJA', [600, 1400], bodyPt(0.5, 40), 1.6],
  ['escamas', dr.zonas.escamas, '#f39c33', 'CARPA', [770, 990], bodyPt(0.62, -30), 1.6],
  ['garras', 'garras', '#b5651d', 'ÁGUILA', [300, 1375], W([dr.delante.foot[0] - 6, dr.delante.foot[1] + 40]), 1.8],
  ['patas', dr.detras.zona, '#f5a623', 'TIGRE', [955, 1300], W([dr.detras.foot[0], dr.detras.foot[1] - 20]), 1.7],
  ['orejas', dr.zonas.oreja, '#f48fb1', 'VACA', [105, 800], pt([238, 245]), 1.9],
];
nueve.forEach(([word, zona, color, label, lp, tip, s], k) => {
  const t = T.at(word);
  // the camera dives onto the part and its label, keeping them above the captions
  const fx = (lp[0] + tip[0]) / 2, fy = (lp[1] + tip[1]) / 2;
  camara(t - 0.2, 0.36, { x: fx, y: fy + 190 / s, s, r: k % 2 ? 0.6 : -0.6 }, 'power2.inOut');
  A.fx(t - 0.2, 'whoosh', 0.07);
  // the hand colours it in
  if (zona === 'cuernos') dibuja(dr.cuernos.map((d) => L(d, { w: 15, color })), t + 0.02, 0.5);
  else if (zona === 'garras') dibuja(dr.delante.g.talons.map((tq) => L(tq.una, { w: 12, color })), t + 0.02, 0.5, { hueco: 0.02 });
  else colorea(zona, { color, t0: t + 0.02, dur: 0.55, g: gB, paso: zona === dr.zonas.ojo ? 6 : 14, op: 0.6 });
  if (word === 'vientre') dibuja([L(dr.bandaV, { w: 4 }), L(dr.placas, { w: 4 })], t + 0.58, 0.3, { mano: false });
  if (word === 'escamas') dibuja(dr.escamas.map((d) => L(d, { w: 4 })), t + 0.58, 0.32, { mano: false });
  if (word === 'patas') dibuja(['M-14 0 l18 10', 'M-10 18 l18 10', 'M-6 36 l18 10'].map((d) => linea(d, { g: el('g', { transform: `translate(${dr.detras.foot[0] + OX - 4} ${dr.detras.foot[1] + OY - 70})` }, D.art), w: 7 })), t + 0.58, 0.25, { mano: false });
  // its animal, written beside it, and an arrow
  escribe(label, { x: lp[0], y: lp[1], size: 58, font: 'pm', color: RED, t0: t + 0.08, dur: 0.34, align: 'center', mano: false });
  const fl = flecha(lp[0] + (tip[0] > lp[0] ? 60 : -60) * 0.4, lp[1] + (tip[1] > lp[1] ? 14 : -62), tip[0], tip[1], 0.18);
  dibuja(fl.map((d) => linea(d, { w: 5 })), t + 0.3, 0.22, { mano: false });
  A.fx(t + 0.1, 'pop', 0.14, -0.2 + k * 0.05);
});

// «hace casi dos mil años»: the whole patchwork dragon, and the date written under it
const tH = T.at('lo');
camara(tH - 0.1, 0.6, { x: 540, y: 1080, s: 0.86, r: 0 }, 'power3.inOut');
A.fx(tH - 0.1, 'whoosh', 0.12);
escribe('HACE CASI 2.000 AÑOS', { x: 540, y: 1505, size: 78, font: 'pm', color: RED, t0: T.at('hace') - 0.05, dur: 0.72, align: 'center' });
// the real one: the hand sketches the photo, then the photo
const tV = T.at('asi'), tFoto = T.at('verdad') - 0.05;
const tBaja = T.at('hace') + 0.72;
camara(tBaja, 0.5, { x: 540, y: 2230, s: 1, r: 0 }, 'power2.inOut');
A.fx(tBaja, 'whoosh', 0.14);
fotoReal(J, 'img/real.jpg', { x: 170, y: 1660, w: 740, t0: tBaja + 0.12, dur: tFoto - tBaja - 0.16, tFoto, ancho: 4.2 });
salida(tFoto - 0.02);
A.fx(tFoto, 'shimmer', 0.26); A.fx(tFoto, 'impact', 0.16);
escribe('link en mi perfil', { x: 540, y: 2520, size: 92, font: 'cv', t0: T.at('link') - 0.08, dur: 0.75, align: 'center' });
dibuja(flecha(800, 2500, 930, 2570, -0.3).map((d) => linea(d, { w: 6 })), T.at('perfil') + 0.05, 0.3);

// captions
const K = capas(T, { keys: ['frankenstein', 'nueve', 'ciervo', 'camello', 'demonio', 'serpiente', 'almeja', 'carpa', 'aguila', 'tigre', 'vaca', 'dos', 'mil', 'verdad', 'perfil'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.22) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
