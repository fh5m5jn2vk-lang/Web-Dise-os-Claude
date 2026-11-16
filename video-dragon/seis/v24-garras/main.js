// LÓNG · «Este dibujo podía costarte la vida». A chalkboard history lesson: the chalk finishes a dragon's claw with five
// talons, «¡PROHIBIDO!»; «en la China de los Ming, el dragón dorado de cinco garras era solo del emperador» (the claw
// coloured gold, its talons counted 1–5, a crown); below it, «los nobles, cuatro» and «el pueblo, tres» (each claw with
// its hat); then a palace, a vase leaving it with a five-clawed dragon on it, and the eraser takes one talon off; then
// the real gold dragon, sketched in chalk until the photo appears.
// Source: Wikipedia, «Chinese dragon» (Yuan rules kept by the Hongwu Emperor; using the gold five-clawed motif was a
// capital offence; works leaving the imperial collection had one claw removed from each set).
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente, suave } from '../kit/dibujo.js';
import { garra, corona, flecha, circulo, subrayado } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('sb', '../fonts/schoolbell.ttf'), fuente('cv', '../fonts/caveat.ttf')]);
const J = await (await fetch('trazo.json')).json();
const DUR = +(T.END + 0.5).toFixed(3);
const D = pizarra('tiza', { manga: '#3b3b46', mundo: [-2000, -1500, 5080, 8500] });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, aparece, fotoReal } = D;
const WHITE = '#f3f1e7', GOLD = '#ffd84d', RED = '#ff6b6b', BLUE = '#8fd3ff', A = sonido();
const ink = D.capa(D.art), under = D.capa(D.bajo);
const L = (d, o = {}) => linea(d, { g: ink, ...o });
const claw = (cx, cy, n, r, color = WHITE, w = 9) => { const g = garra(cx, cy, n, r, Math.PI * 0.5, 1.7, true); return { g, leg: [L(g.leg.a, { color, w }), L(g.leg.b, { color, w }), L(g.leg.escamas, { color, w: w * 0.7 })], palma: L(g.palma, { color, w }), toes: g.talons.map((tq) => [L(tq.toe, { color, w }), L(tq.una, { color, w: w * 0.85 })]) }; };

// 1 · the hook: a claw with five talons, the chalk finishing it; «¡PROHIBIDO!»
camaraYa({ x: 560, y: 820, s: 1.3, r: -1 });
const c5 = claw(540, 760, 5, 150, WHITE, 11);
ya([...c5.leg, c5.palma, ...c5.toes[0], ...c5.toes[1]]);
dibuja(c5.toes.slice(2).flat(), 0.02, 0.95, { hueco: 0.04 });
const tVida = T.at('vida');
escribe('¡PROHIBIDO!', { x: 540, y: 250, size: 130, font: 'sb', color: RED, t0: T.at('costarte') - 0.05, dur: 0.75, align: 'center' });
dibuja(L(subrayado(230, 850, 285, 7), { color: RED, w: 10 }), tVida, 0.25);
A.fx(tVida, 'thump', 0.35);
camara(0.6, 1.1, { x: 540, y: 760, s: 1.08, r: 0 }, 'sine.inOut');

// 2 · the Ming: gold, five talons counted, the emperor's crown
const tMing = T.at('ming');
camara(tMing - 0.5, 0.5, { x: 540, y: 820, s: 0.96, r: 0 }, 'power2.inOut');
escribe('DINASTÍA MING', { x: 540, y: 120, size: 96, font: 'sb', color: BLUE, t0: T.at('china') - 0.1, dur: 0.75, align: 'center', mano: false });
colorea(c5.g.palma, { color: GOLD, t0: T.at('dorado') - 0.05, dur: 0.3, g: under, paso: 12, op: 0.75 });
c5.g.talons.forEach((tq, i) => colorea(tq.una, { color: GOLD, t0: T.at('dorado') + 0.25 + i * 0.05, dur: 0.05, g: under, paso: 6, op: 0.9, mano: false }));
const tCinco = T.at('cinco');
c5.g.talons.forEach((tq, i) => {
  const a = Math.PI * 0.5 + (i / 4 - 0.5) * 1.7, x = 540 + Math.cos(a) * 150 * 2.45, y = 760 + Math.sin(a) * 150 * 2.45 + 34;
  escribe(String(i + 1), { x, y, size: 84, font: 'sb', color: GOLD, t0: tCinco + i * 0.09, dur: 0.12, align: 'center', mano: false });
  A.fx(tCinco + i * 0.09, 'tick', 0.22);
});
const tEmp = T.at('emperador');
dibuja(L(corona(80, 560, 170), { color: GOLD, w: 10 }), T.at('solo') - 0.05, 0.45);
escribe('EMPERADOR', { x: 165, y: 640, size: 64, font: 'sb', color: GOLD, t0: tEmp - 0.02, dur: 0.5, align: 'center', mano: false });
A.fx(tEmp, 'bell', 0.18);

// 3 · nobles four, the people three, each with its hat
const tNob = T.at('nobles');
camara(tNob - 0.3, 0.55, { x: 540, y: 1780 + 180, s: 0.95, r: 0 }, 'power2.inOut'); A.fx(tNob - 0.3, 'whoosh', 0.1);
const c4 = claw(290, 1800, 4, 96); dibuja([...c4.leg, c4.palma, ...c4.toes.flat()], tNob - 0.05, 0.62, { hueco: 0.015 });
// a Ming official's cap: a dome and two flat wings
const gorro = ['M200 1500 Q290 1390 380 1500 Z', 'M200 1478 L120 1462 Q102 1480 120 1496 L200 1490', 'M380 1478 L460 1462 Q478 1480 460 1496 L380 1490'];
dibuja(gorro.map((d) => L(d, { color: BLUE, w: 7 })), tNob + 0.6, 0.35, { hueco: 0.02 });
escribe('NOBLES = 4', { x: 290, y: 2180, size: 84, font: 'sb', color: WHITE, t0: T.at('cuatro') - 0.05, dur: 0.45, align: 'center', mano: false });
const tPue = T.at('pueblo');
const c3 = claw(790, 1800, 3, 96); dibuja([...c3.leg, c3.palma, ...c3.toes.flat()], tPue - 0.15, 0.5, { hueco: 0.015 });
dibuja(L('M660 1500 L790 1400 L920 1500 Q790 1522 660 1500 Z', { color: '#e8b16a', w: 9 }), tPue + 0.38, 0.25);
escribe('PUEBLO = 3', { x: 790, y: 2180, size: 84, font: 'sb', color: WHITE, t0: T.at('tres') - 0.08, dur: 0.4, align: 'center', mano: false });

// 4 · out of the palace, a talon rubbed off
const PY = 2750;
const tObj = T.at('objeto');
camara(T.at('y') - 0.05, 0.5, { x: 540, y: PY + 260, s: 1.05, r: 0 }, 'power2.inOut'); A.fx(T.at('y') - 0.05, 'whoosh', 0.14);
const palacio = ['M150 ' + (PY + 40) + ' Q330 ' + (PY - 30) + ' 420 ' + (PY - 90) + ' Q510 ' + (PY - 30) + ' 690 ' + (PY + 40), 'M150 ' + (PY + 40) + ' q-34 0 -52 -42', 'M690 ' + (PY + 40) + ' q34 0 52 -42', 'M300 ' + (PY - 60) + ' Q370 ' + (PY - 110) + ' 420 ' + (PY - 170) + ' Q470 ' + (PY - 110) + ' 540 ' + (PY - 60) + ' q22 0 34 -30 M300 ' + (PY - 60) + ' q-22 0 -34 -30', 'M210 ' + (PY + 30) + ' L210 ' + (PY + 300), 'M630 ' + (PY + 30) + ' L630 ' + (PY + 300), 'M170 ' + (PY + 300) + ' L670 ' + (PY + 300), 'M330 ' + (PY + 300) + ' L330 ' + (PY + 170) + ' Q420 ' + (PY + 110) + ' 510 ' + (PY + 170) + ' L510 ' + (PY + 300)];
dibuja(palacio.map((d) => L(d, { color: WHITE, w: 9 })), tObj - 0.25, 0.8, { hueco: 0.03 });
// the vase, carried out through the door
const vx = 820, vy = PY + 250;
const jarron = `M${vx - 60} ${vy - 150} Q${vx - 40} ${vy - 120} ${vx - 70} ${vy - 70} Q${vx - 110} ${vy + 20} ${vx - 60} ${vy + 90} L${vx + 60} ${vy + 90} Q${vx + 110} ${vy + 20} ${vx + 70} ${vy - 70} Q${vx + 40} ${vy - 120} ${vx + 60} ${vy - 150} Z`;
dibuja(L(jarron, { color: BLUE, w: 8 }), T.at('salia') - 0.05, 0.4);
const cv = claw(vx, vy - 40, 5, 30, GOLD, 6);
dibuja([cv.palma, ...cv.toes.flat()], T.at('salia') + 0.32, 0.35, { hueco: 0.01 });
dibuja(flecha(560, PY + 240, 740, PY + 250, -0.2).map((d) => L(d, { color: WHITE, w: 7 })), T.at('palacio') - 0.05, 0.3);
// «¡le quitaban una garra!»: the eraser wipes the middle talon away, «-1»
const tQ = T.at('quitaban');
camara(tQ - 0.15, 0.4, { x: vx - 20, y: vy - 30 + 200 / 1.9, s: 1.9, r: 2 }, 'power2.out');
const borra = el('rect', { x: vx - 70, y: vy - 70, width: 90, height: 150, rx: 18, fill: '#f3f1e7', opacity: 0, filter: 'url(#f-tiza)' }, D.sobre);
D.tl.fromTo(borra, { opacity: 0, x: vx - 90 }, { opacity: 0.85, x: vx - 40, duration: 0.18, immediateRender: true }, tQ + 0.05);
D.tl.to(borra, { x: vx + 10, duration: 0.18, ease: 'sine.inOut' }, tQ + 0.23);
D.tl.to(borra, { opacity: 0, duration: 0.2 }, tQ + 0.42);
D.tl.to(cv.toes[2], { opacity: 0, duration: 0.2 }, tQ + 0.18);
const humo = el('ellipse', { cx: vx, cy: vy + 30, rx: 70, ry: 44, fill: '#f3f1e7', opacity: 0, filter: 'url(#f-tiza)' }, D.sobre);
D.tl.fromTo(humo, { opacity: 0 }, { opacity: 0.5, duration: 0.15, immediateRender: true }, tQ + 0.2); D.tl.to(humo, { opacity: 0.12, duration: 0.6 }, tQ + 0.4);
A.fx(tQ + 0.05, 'paper', 0.3);
escribe('-1', { x: vx + 120, y: vy - 80, size: 110, font: 'sb', color: RED, t0: T.at('garra') - 0.02, dur: 0.3, align: 'center' });
A.fx(T.at('garra'), 'slap', 0.2);

// 5 · the real one, in chalk, then the photo
const FY = 3560;
const tV = T.at('asi'), tFoto = T.at('verdad') - 0.04;
camara(T.at('dragon', 2) + 0.15, 0.45, { x: 540, y: FY + 370 + 200, s: 1.0, r: 0 }, 'power2.inOut'); A.fx(T.at('dragon', 2) + 0.15, 'whoosh', 0.14);
fotoReal(J, 'img/real.jpg', { x: 170, y: FY, w: 740, t0: T.at('dragon', 2) + 0.35, dur: tFoto - T.at('dragon', 2) - 0.4, tFoto, ancho: 4.6, color: WHITE, cinta: '#c9c2a8' });
salida(tFoto - 0.02);
A.fx(tFoto, 'shimmer', 0.26);
escribe('link en mi perfil', { x: 540, y: FY + 880, size: 92, font: 'sb', color: WHITE, t0: T.at('link') - 0.08, dur: 0.6, align: 'center' });
dibuja(flecha(810, FY + 860, 940, FY + 930, -0.3).map((d) => L(d, { w: 7 })), T.at('perfil') + 0.05, 0.3);

const K = capas(T, { keys: ['vida', 'ming', 'dorado', 'cinco', 'emperador', 'cuatro', 'tres', 'palacio', 'garra', 'verdad', 'perfil'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.26) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
