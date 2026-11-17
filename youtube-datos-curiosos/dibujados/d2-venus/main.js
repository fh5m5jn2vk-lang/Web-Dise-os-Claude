// «¡En Venus, un día dura más que un año!». Pizarra de tiza: Venus ya está en la pizarra y la tiza escribe «1 DÍA > 1 AÑO»;
// una flecha la hace girar (243 días) mientras el planeta rota; la cámara se aleja, aparece el Sol y la órbita (225 días)
// y Venus da la vuelta por ella; abajo, un horizonte donde el Sol sale por el oeste; al final, una tarta de cumpleaños.
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { flecha, circulo, subrayado, tacha } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('ka', '../fonts/kalam-bold.ttf'), fuente('sb', '../fonts/schoolbell.ttf')]);
const DUR = T.G.dur;
const D = pizarra('tiza', { manga: '#7a2f3b' });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, tl } = D;
const YEL = '#ffd84d', PINK = '#ff8fa3', BLUE = '#8fd3ff', ORA = '#f7b267', A = sonido();
const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

// Venus: un círculo con bandas de nubes, coloreado; en un grupo que puede girar
const VX = 540, VY = 820, VR = 170;
const vg = el('g', {}, D.art), vb = el('g', {}, D.bajo);
const vInk = D.capa(vg);
const bandas = [-90, -30, 30, 90].map((dy, i) => { const w = Math.sqrt(VR * VR - dy * dy) - 8; return `M${VX - w} ${VY + dy} q${w * 0.5} ${-22 + i * 9} ${w} 0 t${w} 0`; });
const venus = [linea(circ(VX, VY, VR), { g: vInk }), ...bandas.map((d) => linea(d, { g: vInk, w: 6 })), linea(`M${VX - 40} ${VY - 120} l0 -90 l70 22 l-70 22`, { g: vInk, w: 6 })];
ya(venus);
const vc = colorea(circ(VX, VY, VR), { color: ORA, t0: 0, dur: 0.01, g: vb, op: 0.5, mano: false }); ya(vc);
camaraYa({ x: VX, y: 760, s: 1.1, r: -1 });
// «un día dura más que un año»
escribe('1 DÍA', { x: 300, y: 400, size: 120, font: 'ka', color: YEL, t0: 0.05, dur: 0.6, align: 'center' });
escribe('>', { x: 540, y: 400, size: 130, font: 'ka', t0: T.at('más') - 0.05, dur: 0.25, align: 'center' });
escribe('1 AÑO', { x: 790, y: 400, size: 120, font: 'ka', color: PINK, t0: T.at('año') - 0.15, dur: 0.55, align: 'center' });
A.fx(T.at('año'), 'pop', 0.2);

// «Tarda 243 días en girar sobre sí misma»: flecha de giro y el planeta rota
const tG = T.at('girar');
const arco = `M${VX - 230} ${VY + 40} A230 230 0 0 1 ${VX + 200} ${VY - 120}`;
const ap = flecha(VX + 150, VY - 175, VX + 210, VY - 110, 0);
dibuja([linea(arco, { w: 9, color: BLUE }), linea(ap[1], { w: 9, color: BLUE })], T.at('tarda') - 0.05, 0.7);
tl.to([vg, vb], { rotation: -150, svgOrigin: `${VX} ${VY}`, duration: T.line(1).t1 - tG + 1.5, ease: 'none' }, tG);
const t243 = T.at('243');
escribe('243 DÍAS', { x: VX, y: 1180, size: 112, font: 'ka', color: BLUE, t0: t243 - 0.05, dur: 0.6, align: 'center' });
escribe('girar', { x: VX, y: 1250, size: 64, font: 'sb', t0: tG, dur: 0.4, align: 'center', mano: false });
A.fx(t243, 'pop', 0.18);

// «y solo 225 en dar la vuelta al Sol»: la cámara se aleja, el Sol, la órbita, Venus la recorre
const SX = 540, SY = 1800, OR = 300;
const tS = T.at('y', 1) ;
camara(T.line(2).t0 - 0.3, 0.6, { x: 540, y: 1900, s: 1.0, r: 0.5 }, 'power3.inOut'); A.fx(T.line(2).t0 - 0.3, 'whoosh', 0.16);
const sInk = D.capa(el('g', {}, D.art));
const rayos = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `M${SX + Math.cos(a) * 135} ${SY + Math.sin(a) * 135} L${SX + Math.cos(a) * 185} ${SY + Math.sin(a) * 185}`; });
const tSol = T.at('Sol');
dibuja([linea(circ(SX, SY, 105), { g: sInk, color: YEL }), ...rayos.map((d) => linea(d, { g: sInk, color: YEL, w: 8 }))], T.line(2).t0 + 0.1, 0.9, { hueco: 0.01 });
colorea(circ(SX, SY, 105), { color: YEL, t0: T.line(2).t0 + 1.0, dur: 0.35, op: 0.55, mano: false });
dibuja(linea(circ(SX, SY, OR), { w: 6, dash: '18 22' }), T.at('vuelta') - 0.1, 0.6, { mano: false });
const t225 = T.at('225');
escribe('225 DÍAS', { x: SX, y: SY + 440, size: 112, font: 'ka', color: PINK, t0: t225 - 0.05, dur: 0.6, align: 'center' });
escribe('vuelta al Sol', { x: SX, y: SY + 510, size: 64, font: 'sb', t0: t225 + 0.5, dur: 0.5, align: 'center', mano: false });
A.fx(t225, 'pop', 0.18);
// una Venus pequeña recorre la órbita
const mini = el('g', { opacity: 0 }, D.art);
el('circle', { cx: SX, cy: SY - OR, r: 34, fill: ORA, stroke: '#f3f1e7', 'stroke-width': 7, filter: 'url(#f-tiza)' }, mini);
tl.set(mini, { opacity: 1 }, T.at('vuelta') + 0.3);
tl.fromTo(mini, { rotation: 0 }, { rotation: 360, svgOrigin: `${SX} ${SY}`, duration: T.line(2).t1 - T.at('vuelta') + 0.2, ease: 'power1.inOut', immediateRender: false }, T.at('vuelta') + 0.3);

// «Y encima gira al revés: el Sol sale por el oeste»: abajo, un horizonte
const HY = 2960;
const tR = T.at('revés');
camara(T.line(3).t0 - 0.2, 0.6, { x: 540, y: HY - 240, s: 1.0, r: -0.5 }, 'power3.inOut'); A.fx(T.line(3).t0 - 0.2, 'whoosh', 0.16);
escribe('¡AL REVÉS!', { x: 540, y: HY - 430, size: 130, font: 'ka', color: PINK, t0: tR - 0.2, dur: 0.6, align: 'center' });
dibuja(linea(`M60 ${HY} Q300 ${HY - 30} 540 ${HY - 10} T1020 ${HY - 5}`, { w: 9 }), T.at('allí') - 0.15, 0.45);
const sol2 = circ(250, HY - 10, 90);
dibuja(linea(`M160 ${HY - 10} A90 90 0 0 1 340 ${HY - 10}`, { w: 8, color: YEL }), T.at('sale') - 0.1, 0.3);
colorea(`M160 ${HY - 10} A90 90 0 0 1 340 ${HY - 10} Z`, { color: YEL, t0: T.at('sale') + 0.2, dur: 0.25, op: 0.6, mano: false });
dibuja(flecha(250, HY - 130, 250, HY - 330, 0).map((d) => linea(d, { w: 8, color: YEL })), T.at('sale') + 0.25, 0.3, { mano: false });
const tO = T.at('oeste');
escribe('OESTE', { x: 250, y: HY + 120, size: 96, font: 'ka', color: YEL, t0: tO - 0.1, dur: 0.5, align: 'center' });
escribe('ESTE', { x: 820, y: HY + 120, size: 80, font: 'ka', t0: tO + 0.1, dur: 0.35, align: 'center', mano: false });
dibuja(tacha(730, HY + 40, 180, 100).map((d) => linea(d, { w: 8, color: PINK })), tO + 0.45, 0.25, { mano: false });
A.fx(tO, 'pop', 0.2);

// «Cumplirías años antes de ver un día entero»: una tarta con su vela
const KY = 3880;
const tC = T.at('cumplirías');
camara(tC - 0.25, 0.55, { x: 540, y: KY - 140, s: 1.05, r: 0.5 }, 'power3.inOut'); A.fx(tC - 0.25, 'whoosh', 0.16);
const kInk = D.capa(el('g', {}, D.art));
const tarta = [`M330 ${KY} L750 ${KY} L750 ${KY - 170} L330 ${KY - 170} Z`, `M380 ${KY - 170} L700 ${KY - 170} L700 ${KY - 300} L380 ${KY - 300} Z`, `M330 ${KY - 110} q35 30 70 0 t70 0 t70 0 t70 0 t70 0 t70 0`, `M540 ${KY - 300} L540 ${KY - 400}`, `M540 ${KY - 410} q-24 -30 0 -70 q24 40 0 70 Z`, `M280 ${KY + 10} L800 ${KY + 10}`];
dibuja(tarta.map((d, i) => linea(d, { g: kInk, w: i === 4 ? 6 : 8, color: i === 4 ? YEL : undefined })), tC + 0.05, 1.0, { hueco: 0.02 });
colorea(tarta[0], { color: PINK, t0: tC + 1.1, dur: 0.25, op: 0.45, mano: false });
colorea(tarta[1], { color: BLUE, t0: tC + 1.2, dur: 0.25, op: 0.45, mano: false });
escribe('¡FELIZ AÑO!', { x: 540, y: KY - 520, size: 120, font: 'ka', color: YEL, t0: T.at('antes') - 0.05, dur: 0.6, align: 'center', mano: false });
escribe('(y el día sin acabar)', { x: 540, y: KY + 130, size: 64, font: 'sb', t0: T.at('día', 2) - 0.1, dur: 0.6, align: 'center' });
A.fx(T.at('antes'), 'pop', 0.22);
salida(T.END);

const K = capas(T, { keys: ['venus', 'dia', 'ano', '243', '225', 'reves', 'oeste', 'anos'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.26) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
