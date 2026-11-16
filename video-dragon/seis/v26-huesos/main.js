// LÓNG · «A un hombre enfermo le recetaron huesos de dragón». Pencil on cream sketch paper: an apothecary jar, its label
// written 龍骨 («dragon bones») stroke by stroke, bones sticking out, «RECETA»; «cuenta la historia que, al mirarlos, vio
// letras grabadas» (a big bone, a magnifying glass, carved marks appearing in it); «eran huesos de hace más de tres mil
// años… con la escritura china más antigua»; «hoy, los dragones se imprimen en 3D» (a printer laying the layers); then
// the real dragon, white as bone, sketched until the photo appears.
// Sources: World History Encyclopedia, «Oracle Bones» (Wang Yirong, 1899, «dragon bones» from an apothecary — told as
// a story, its details are uncertain); Wikipedia, «Chinese dragon» («dragon bones» sold as medicine).
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente, suave } from '../kit/dibujo.js';
import { hueso, flecha, circulo, subrayado } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('kb', '../fonts/kalam-bold.ttf'), fuente('rb', '../fonts/reenie-beanie.ttf')]);
const H1 = await (await fetch('../kit/hanzi/9f8d.json')).json(), H2 = await (await fetch('../kit/hanzi/9aa8.json')).json();
const J = await (await fetch('trazo.json')).json();
const DUR = +(T.END + 0.5).toFixed(3);
const D = pizarra('boceto', { manga: '#5a4632', mundo: [-2000, -1500, 6000, 8500] });
const { el, linea, dibuja, ya, salida, texto, escribe, colorea, caracter, camara, camaraYa, aparece, fotoReal } = D;
const GR = '#3a332b', RED = '#b8352e', SEP = '#8a6a44', A = sonido();
const ink = D.capa(D.art), shade = D.capa(D.bajo);
const L = (d, o = {}) => linea(d, { g: ink, w: 4.2, ...o });

// A · the jar of «dragon bones»: already sketched; the hand writes its label, adds the bones, rings it
camaraYa({ x: 545, y: 690, s: 1.22, r: -1 });
const jar = ['M380 560 Q370 610 330 650 Q300 700 300 820 Q300 1000 360 1060 L720 1060 Q780 1000 780 820 Q780 700 750 650 Q710 610 700 560 Z',
  'M360 560 L720 560 L720 500 L360 500 Z', 'M400 500 Q540 440 680 500', 'M420 660 L660 660 L660 960 L420 960 Z'];
const jarEls = jar.map((d) => L(d));
ya(jarEls);
const lbl = el('g', {}, D.art);
caracter(H1, { x: 452, y: 672, size: 150, t0: 0.03, dur: 0.6, g: lbl, color: GR, ancho: 130, hueco: 0.008 });
caracter(H2, { x: 470, y: 810, size: 140, t0: 0.66, dur: 0.42, g: lbl, color: GR, ancho: 130, hueco: 0.008 });
const huesos = [hueso(410, 470, 160, 46), hueso(560, 440, 150, 44)].map((d) => L(d, { w: 4 }));
dibuja(huesos, 1.12, 0.48, { hueco: 0.04 });
// «RECETA:» is already on the page in the first frame: a prescription… for what?
texto('RECETA:', { x: 540, y: 330, size: 116, font: 'kb', color: RED, align: 'center' });
const tH = T.at('huesos');
dibuja(linea(circulo(540, 810, 170, 190, 0.2), { g: ink, color: RED, w: 6 }), tH + 0.05, 0.42);
camara(0.5, 1.4, { x: 540, y: 760, s: 1.05, r: 0 }, 'sine.inOut');

// B · a bone, a magnifying glass, carved marks
const BY = 1760;
const tCuenta = T.at('cuenta');
camara(tCuenta - 0.35, 0.5, { x: 540, y: BY + 150, s: 1.05, r: 0 }, 'power2.inOut'); A.fx(tCuenta - 0.35, 'whoosh', 0.14);
const big = L(hueso(160, BY, 760, 190), { w: 5 });
dibuja(big, tCuenta - 0.1, 0.55);
colorea(hueso(160, BY, 760, 190), { color: SEP, t0: tCuenta + 0.45, dur: 0.4, g: shade, paso: 9, ancho: 4, op: 0.45, ang: -50 });
// cracks, as on real oracle bones
dibuja(['M300 ' + (BY - 30) + ' l20 50 l-12 30', 'M760 ' + (BY - 10) + ' l-18 40 l14 26'].map((d) => L(d, { w: 3 })), tCuenta + 0.85, 0.2, { hueco: 0.02 });
const tMirar = T.at('mirarlos');
const lupa = [circulo(540, BY, 190, 190, 0.12), `M670 ${BY + 140} L820 ${BY + 300}`, `M690 ${BY + 160} L840 ${BY + 320}`];
dibuja(lupa.map((d, i) => L(d, { w: i ? 9 : 6 })), tMirar - 0.05, 0.45, { hueco: 0.02 });
// marks like the oracle bone script: sun, moon, person, mountain, the old «dragon»
const cx = 540, cy = BY;
const marcas = [
  `M${cx - 120} ${cy - 70} m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0 M${cx - 122} ${cy - 72} l4 4`,
  `M${cx - 30} ${cy - 100} q-40 30 0 70 q-18 -35 0 -70 M${cx - 40} ${cy - 66} l16 0`,
  `M${cx + 70} ${cy - 100} q-10 40 -40 70 M${cx + 52} ${cy - 62} q20 18 30 40`,
  `M${cx - 150} ${cy + 70} l0 -40 l25 25 l25 -50 l25 50 l25 -25 l0 40`,
  `M${cx + 40} ${cy + 20} q40 -30 70 0 q20 20 -10 40 q-40 20 -10 50 q20 10 40 -10 M${cx + 40} ${cy + 20} l-14 -24 l22 6 M${cx + 110} ${cy + 18} l10 8`,
];
dibuja(marcas.map((d) => L(d, { w: 6, color: '#2a221a' })), T.at('vio') - 0.02, T.at('grabadas') + 0.45 - T.at('vio'), { hueco: 0.03 });

// C · more than three thousand years: the oldest Chinese writing
const tEran = T.at('eran');
camara(tEran - 0.15, 0.55, { x: 540, y: BY + 40, s: 0.88, r: 0 }, 'power2.inOut');
escribe('+3.000 AÑOS', { x: 540, y: BY - 380, size: 140, font: 'kb', color: RED, t0: T.at('tres') - 0.2, dur: 0.8, align: 'center' });
dibuja(L(subrayado(200, 880, BY - 350, 7), { color: RED, w: 7 }), T.at('anos') + 0.05, 0.25);
A.fx(T.at('tres'), 'bell', 0.14);
escribe('LA ESCRITURA CHINA', { x: 540, y: BY + 470, size: 84, font: 'kb', color: GR, t0: T.at('escritura') - 0.2, dur: 0.55, align: 'center', mano: false });
escribe('MÁS ANTIGUA', { x: 540, y: BY + 580, size: 104, font: 'kb', color: RED, t0: T.at('antigua') - 0.2, dur: 0.5, align: 'center', mano: false });

// D · today: printed in 3D
const PY = 2920;
const tHoy = T.at('hoy');
camara(tHoy - 0.3, 0.45, { x: 540, y: PY + 330, s: 1.0, r: 0 }, 'power2.inOut'); A.fx(tHoy - 0.3, 'whoosh', 0.14);
// the frame of a printer: two posts, a top bar, the rail the head rides on, the bed, the base
const impresora = [`M300 ${PY + 40} L300 ${PY + 620}`, `M780 ${PY + 40} L780 ${PY + 620}`, `M270 ${PY + 40} L810 ${PY + 40}`, `M300 ${PY + 170} L780 ${PY + 170}`,
  `M330 ${PY + 560} L750 ${PY + 560}`, `M270 ${PY + 620} L810 ${PY + 620}`];
dibuja(impresora.map((d) => L(d, { w: 6 })), tHoy - 0.05, 0.6, { hueco: 0.03 });
escribe('IMPRESORA', { x: 540, y: PY - 30, size: 76, font: 'kb', color: GR, t0: tHoy + 0.15, dur: 0.45, align: 'center', mano: false });
// the print head: drawn, then it moves along each layer as the layers go down, back and forth
const cabezal = el('g', {}, D.art), cabezalI = D.capa(cabezal);
const cab = [`M500 ${PY + 140} L580 ${PY + 140} L580 ${PY + 225} L500 ${PY + 225} Z`, `M522 ${PY + 225} L540 ${PY + 262} L558 ${PY + 225}`].map((d) => linea(d, { g: cabezalI, w: 5 }));
dibuja(cab, tHoy + 0.58, 0.2, { hueco: 0.02 });
salida(tHoy + 0.8);   // the hand leaves the printer to it
const NL = 9, tImp = T.at('imprimen') - 0.15, dImp = 0.8, dl = dImp / NL;
const capaW = (k) => 300 - Math.abs(k - 4) * 28, capaY = (k) => PY + 548 - k * 26;
for (let k = 0; k < NL; k++) {
  const w = capaW(k), y = capaY(k), d = k % 2 ? `M${540 + w / 2} ${y} L${540 - w / 2} ${y}` : `M${540 - w / 2} ${y} L${540 + w / 2} ${y}`;
  dibuja(linea(d, { w: 12, color: '#6f6152' }), tImp + k * dl, dl * 0.95, { ease: 'none', mano: false });
}
// where the head is: over the layer being printed (nozzle tip at PY + 262 at rest)
function cabezalEn(t) {
  const u = (t - tImp) / dImp;
  if (u <= -0.2) return [0, 0];
  if (u < 0) { const a = (u + 0.2) / 0.2; return [-capaW(0) / 2 * a, (capaY(0) - (PY + 262)) * a]; }
  const k = Math.min(NL - 1, Math.floor(u * NL)), f = Math.min(1, u * NL - k), w = capaW(k);
  const x = (k % 2 ? 1 - f : f) * w - w / 2;
  return [u >= 1 ? 0 : x, capaY(k) - (PY + 262)];
}
escribe('3D', { x: 920, y: PY + 340, size: 150, font: 'kb', color: RED, t0: T.at('3d') - 0.15, dur: 0.35, align: 'center', mano: false });

// E · the real one
const FY = 3780;
const tV = T.at('asi'), tFoto = T.at('verdad') - 0.04;
camara(T.at('3d') + 0.15, 0.4, { x: 540, y: FY + 370 + 200, s: 1.0, r: 0 }, 'power2.inOut'); A.fx(T.at('3d') + 0.15, 'whoosh', 0.14);
fotoReal(J, 'img/real.jpg', { x: 170, y: FY, w: 740, t0: T.at('3d') + 0.3, dur: tFoto - T.at('3d') - 0.34, tFoto, ancho: 4, color: GR, cinta: '#e2cfa2' });
salida(tFoto - 0.02);
A.fx(tFoto, 'shimmer', 0.26);
escribe('link en mi perfil', { x: 540, y: FY + 880, size: 120, font: 'rb', color: GR, t0: T.at('link') - 0.08, dur: 0.6, align: 'center' });
dibuja(flecha(810, FY + 850, 940, FY + 920, -0.3).map((d) => L(d, { w: 5 })), T.at('perfil') + 0.05, 0.3);

const K = capas(T, { keys: ['enfermo', 'huesos', 'dragon', 'letras', 'grabadas', 'tres', 'mil', 'antigua', '3d', 'verdad', 'perfil'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.26) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); const [hx, hy] = cabezalEn(t); cabezal.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
