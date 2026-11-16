// LÓNG · «¿Por qué los dragones chinos no tienen alas?». A squared notebook and a blue ballpoint: the pen finishes a
// Chinese dragon flying, tries a bat wing on its back and crosses it out; «según la leyenda, vuelan gracias a un bulto
// en la cabeza: el chimu» (the bump ringed with a highlighter, named), «sin él, no pueden subir al cielo» (a dotted
// path up to the clouds); «y no escupen fuego» (a western dragon breathing fire, crossed out) «traen la lluvia» (a rain
// cloud over ours); «este tampoco escupe fuego…» the real one sketched, «pero brilla en la oscuridad»: the light goes,
// the sketch glows green; then the photo.
// Sources: Wikipedia, «Chinese dragon» (most have no wings; the chimu, 尺木, from the Tang «Youyang zazu»: «a dragon
// without a chimu cannot ascend to the sky»; dragons as rain-bringers, not fire-breathers).
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { dragon, dragonOeste, nube, lluvia, flecha, circulo, tacha } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('if', '../fonts/indie-flower.ttf'), fuente('pm', '../fonts/permanent-marker.ttf')]);
const J = await (await fetch('trazo.json')).json();
const DUR = +(T.END + 0.5).toFixed(3);
const D = pizarra('cuaderno', { manga: '#7a4b2a', mundo: [-2000, -1500, 6000, 8000] });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, aparece, fotoReal } = D;
const BLUE = '#1e3fa6', RED = '#e0302f', HL = '#ffe34d', A = sonido();

// the notebook: a 46 px grid and a red margin
el('defs', {}, D.svg, `<pattern id="cuad" patternUnits="userSpaceOnUse" width="46" height="46"><path d="M46 0 L0 0 L0 46" fill="none" stroke="#a9c4e4" stroke-width="1.6" opacity=".75"/></pattern>`);
el('rect', { x: -2000, y: -1500, width: 6000, height: 8000, fill: 'url(#cuad)' }, D.fondo);
el('path', { d: 'M92 -1500 L92 6500', stroke: '#e57373', 'stroke-width': 3, opacity: 0.8 }, D.fondo);

const OX = 60, OY = 560;
const dr = dragon({ garras: 4, chimu: true });
const gA = D.capa(el('g', { transform: `translate(${OX} ${OY})` }, D.art));
const gB = el('g', { transform: `translate(${OX} ${OY})` }, D.bajo);
const L = (d, o = {}) => linea(d, { g: gA, w: 5, ...o });
const W = (x, y) => [x + OX, y + OY];

// 1 · the hook: the dragon in flight, nearly finished; a bat wing tried on its back, crossed out
camaraYa({ x: 300, y: 870, s: 1.55, r: -1 });
camara(0.35, 1.0, { x: 540, y: 900, s: 0.98, r: 0 }, 'power2.inOut');
const head = [L(dr.cabeza), L(dr.ojo), L(dr.pupila, { w: 4 }), L(dr.ceja), L(dr.nariz), ...dr.colmillos.map((d) => L(d, { w: 3 })), L(dr.oreja), ...dr.cuernos.map((d) => L(d, { w: 6 })), ...dr.bigotes.map((d) => L(d, { w: 3 })), L(dr.chimu)];
ya(head);
const legs = [dr.delante, dr.detras].flatMap((p) => [L(p.zona), L(p.g.palma), ...p.g.talons.flatMap((tq) => [L(tq.toe, { w: 3.5 }), L(tq.una, { w: 3 })])]);
dibuja([L(dr.crin), L(dr.lomo), L(dr.panza), L(dr.cresta, { w: 3.5 }), ...dr.cola.map((d) => L(d)), ...legs, ...dr.escamas.map((d) => L(d, { w: 3 }))], 0.02, 1.15, { hueco: 0.02 });
const ala = ['M520 340 Q470 200 520 120 Q540 190 590 190 Q600 140 650 110 Q650 180 700 200 Q690 270 640 330', 'M560 330 Q600 260 650 220'].map((d) => L(d, { w: 5 }));
dibuja(ala, 1.18, 0.38, { hueco: 0.02 });
const tAlas = T.at('alas');
dibuja(tacha(500, 110, 220, 230).map((d) => linea(d, { g: gA, color: RED, w: 9 })), tAlas - 0.02, 0.28, { hueco: 0.02 });
escribe('¿ALAS?', { x: 840, y: 520, size: 96, font: 'pm', color: RED, t0: tAlas + 0.08, dur: 0.4, align: 'center', mano: false });
A.fx(tAlas + 0.05, 'slap', 0.25);

// 2 · the chimu: the bump on the head, ringed and named; without it, no way up to the sky
const tBulto = T.at('bulto');
camara(T.at('vuelan') - 0.1, 0.55, { x: W(175, 0)[0] + 60, y: W(0, 226)[1] + 200 / 2.1 - 20, s: 2.1, r: -1.5 }, 'power2.inOut'); A.fx(T.at('vuelan') - 0.1, 'whoosh', 0.12);
colorea(dr.chimu + ' Z', { color: HL, t0: tBulto - 0.02, dur: 0.3, g: gB, paso: 7, op: 0.75 });
dibuja(linea(circulo(W(172, 0)[0], W(0, 226)[1], 46, 34), { g: D.art, color: RED, w: 4 }), tBulto + 0.25, 0.35);
const tChimu = T.at('chimu');
dibuja(flecha(W(330, 0)[0], W(0, 130)[1], W(205, 0)[0], W(0, 205)[1], 0.2).map((d) => linea(d, { color: RED, w: 4 })), tChimu - 0.45, 0.3);
escribe('CHIMU', { x: W(380, 0)[0], y: W(0, 128)[1], size: 64, font: 'pm', color: RED, t0: tChimu - 0.12, dur: 0.38, align: 'center', mano: false });
const tCielo = T.at('cielo');
camara(T.at('sin') - 0.05, 0.55, { x: 540, y: 760, s: 0.9, r: 0 }, 'power2.inOut'); A.fx(T.at('sin') - 0.05, 'whoosh', 0.12);
dibuja([linea(nube(300, 300, 1.0), { w: 5 }), linea(nube(640, 260, 1.15), { w: 5 })], T.at('sin') + 0.25, 0.6, { hueco: 0.03 });
dibuja(linea('M300 640 Q340 470 420 340', { w: 5, dash: '14 14' }), tCielo - 0.35, 0.35);
escribe('CIELO', { x: 520, y: 200, size: 60, font: 'if', color: BLUE, t0: tCielo, dur: 0.3, align: 'center', mano: false });

// 3 · no fire (a western dragon, crossed out), but rain
const WX = 1500, WY = 640;
const tFuego = T.at('fuego');
camara(T.at('escupen') - 0.25, 0.4, { x: WX + 360, y: WY + 250 + 120, s: 1.05, r: 0 }, 'power2.inOut'); A.fx(T.at('escupen') - 0.25, 'whoosh', 0.14);
const wo = dragonOeste(), gO = D.capa(el('g', { transform: `translate(${WX - 60} ${WY - 60}) scale(1.25)` }, D.art));
dibuja([wo.cuerpo, wo.cola, wo.ala1, wo.ala2, wo.patas, wo.ojo, wo.cuerno].map((d) => linea(d, { g: gO, w: 5 })), T.at('escupen') - 0.05, 0.42, { hueco: 0.01 });
colorea(wo.fuego[0], { color: '#ff8a1f', t0: tFuego - 0.06, dur: 0.18, g: gO, paso: 9, op: 0.85, mano: false });
dibuja(wo.fuego.map((d) => linea(d, { g: gO, color: RED, w: 5 })), tFuego - 0.08, 0.2, { mano: false });
dibuja(tacha(WX + 60, WY + 60, 620, 400).map((d) => linea(d, { color: RED, w: 12 })), tFuego + 0.12, 0.22, { hueco: 0.02 });
A.fx(tFuego + 0.12, 'slap', 0.3);
const tLluvia = T.at('lluvia');
camara(T.at('traen') - 0.12, 0.38, { x: 560, y: 760 + 200 / 1.05, s: 1.05, r: 0 }, 'power2.inOut'); A.fx(T.at('traen') - 0.12, 'whoosh', 0.14);
dibuja([linea(nube(470, 470, 1.25), { w: 6 }), linea(lluvia(480, 500, 9, 1.4), { color: '#2c7be5', w: 5 })], T.at('traen') + 0.1, 0.6, { hueco: 0.04 });
A.fx(tLluvia, 'shimmer', 0.1);

// 4 · «este tampoco escupe fuego… pero brilla en la oscuridad»: the real one sketched, the lights go, it glows
const FY = 1560;
const tEste = T.at('este'), tBrilla = T.at('brilla'), tFoto = T.at('asi') + 0.12;
camara(tEste - 0.3, 0.45, { x: 540, y: FY + 370 + 190, s: 1.0, r: 0 }, 'power2.inOut'); A.fx(tEste - 0.3, 'whoosh', 0.14);
const F = fotoReal(J, 'img/real.jpg', { x: 170, y: FY, w: 740, t0: tEste - 0.05, dur: tBrilla - tEste - 0.15, tFoto, ancho: 3.8, color: BLUE, cinta: '#f5e6a8' });
salida(tBrilla - 0.25);
// the dark, and the sketch glowing green on top of it
const dark = el('rect', { x: -2000, y: -1500, width: 6000, height: 8000, fill: '#05070a', opacity: 0 }, D.sobre);
el('defs', {}, D.svg, `<filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
const glowG = el('g', { filter: 'url(#glow)', opacity: 0 }, D.sobre);
F.g.querySelectorAll('path').forEach((p, i) => { if (i === 0) return; const c = p.cloneNode(); c.setAttribute('stroke', '#8dffc0'); c.setAttribute('stroke-width', 4.5); c.setAttribute('opacity', 1); c.style.strokeDasharray = 'none'; c.style.opacity = 1; glowG.appendChild(c); });
D.tl.fromTo(dark, { opacity: 0 }, { opacity: 0.9, duration: 0.22, immediateRender: true }, tBrilla - 0.12);
D.tl.fromTo(glowG, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out', immediateRender: true }, tBrilla + 0.05);
D.tl.to([dark, glowG], { opacity: 0, duration: 0.3 }, tFoto - 0.15);
A.fx(tBrilla - 0.12, 'lightswitch', 0.4); A.fx(tBrilla + 0.05, 'shimmer', 0.32);
A.fx(tFoto - 0.15, 'lightswitch', 0.3);
escribe('link en mi perfil', { x: 540, y: FY + 870, size: 92, font: 'if', color: BLUE, t0: T.at('link') - 0.08, dur: 0.6, align: 'center' });
dibuja(flecha(810, FY + 850, 940, FY + 920, -0.3).map((d) => linea(d, { w: 5 })), T.at('perfil') + 0.05, 0.3);

const K = capas(T, { keys: ['alas', 'leyenda', 'bulto', 'chimu', 'cielo', 'fuego', 'lluvia', 'brilla', 'oscuridad', 'verdad', 'perfil'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.22) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t, t > tBrilla && t < tFoto); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
