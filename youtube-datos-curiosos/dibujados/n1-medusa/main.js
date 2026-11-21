// «Esta medusa no se muere de vieja. Nunca.» Neón sobre una pared de ladrillo: la medusa ya brilla en el primer fotograma
// con el cartel «¿INMORTAL?»; «NUNCA» se enciende parpadeando; el nombre en letra de neón; la medusa encoge hasta caber
// en una uña (4,5 mm); un ciclo de neón (medusa → se encoge → pólipo → medusa) se dibuja con la voz y una chispa lo recorre
// sin parar (∞); al final un pez de neón entra y se la come (ÑAM).
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente, gsap } from '../kit/dibujo.js';
import { flecha } from '../kit/garabatos.js';
import { clamp, lerp, prog, E } from '../kit/util.js';

const T = await tiempos();
await Promise.all([fuente('cv', '../fonts/caveat-brush.ttf'), fuente('pm', '../fonts/permanent-marker.ttf')]);
const DUR = T.G.dur;
const D = pizarra('neon', { mano: false });
const { el, linea, dibuja, ya, escribe, camara, camaraYa, tl } = D;
const CY = '#3ff5ff', PK = '#ff4fd8', YE = '#ffe94d', LI = '#8dff6a', A = sonido();
camaraYa({ x: 540, y: 900, s: 1, r: 0 });
// un tubo de neón: el color con su brillo y un alma blanca
const tubo = (d, color, g, w = 9) => [linea(d, { g, color, w }), linea(d, { g, color: '#ffffff', w: w * 0.32, op: 0.85 })];
const enciende = (els, t) => { [].concat(els).forEach((e) => { const o = +(e.getAttribute('data-op') || 1); [[0, 0.25], [0.05, 1], [0.1, 0.2], [0.17, 1]].forEach(([dt, k]) => tl.set(e, { opacity: o * k }, t + dt)); }); A.fx(t, 'click', 0.12); A.fx(t + 0.02, 'shimmer', 0.06); };
const apaga = (els, t) => [].concat(els).forEach((e) => { [[0, 0.3], [0.06, 1], [0.12, 0.1], [0.2, 0]].forEach(([dt, k]) => tl.set(e, { opacity: k }, t + dt)); });

// la medusa grande, en su grupo (flota y encoge)
const jel = el('g', {}, D.art), jg = D.capa(jel);
const campana = 'M380 820 Q376 600 540 596 Q704 600 700 820 Q660 796 620 828 Q580 796 540 828 Q500 796 460 828 Q420 796 380 820 Z';
const tent = [400, 450, 500, 580, 630, 680].map((x, i) => `M${x} ${826 + (i % 2) * 4} q${i % 2 ? 22 : -22} 70 0 140 t0 140 t0 120`);
const brazos = ['M520 830 q-30 60 0 120 t-10 120 q-20 40 10 70', 'M560 830 q30 60 0 120 t10 120 q20 40 -10 70'];
const jelly = [...tubo(campana, CY, jg, 10), ...tubo('M420 760 Q540 650 660 760', CY, jg, 6), ...tent.flatMap((d) => tubo(d, PK, jg, 6)), ...brazos.flatMap((d) => tubo(d, PK, jg, 7))];
ya(jelly);
const hook = escribe('¿INMORTAL?', { x: 540, y: 330, size: 150, font: 'pm', color: YE, t0: 0, dur: 0.01, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
ya([...hook.g.querySelectorAll('path')]);
// «Nunca.»: el cartel cambia
const tN = T.at('nunca');
apaga([...hook.g.querySelectorAll('path')], tN - 0.15);
const nunca = escribe('NUNCA', { x: 540, y: 340, size: 190, font: 'pm', color: PK, t0: tN - 0.05, dur: 0.01, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
enciende([...nunca.g.querySelectorAll('path')], tN);
// «Se llama Turritopsis»
const tT = T.at('turritopsis');
apaga([...nunca.g.querySelectorAll('path')], tT - 0.25);
const nom = escribe('Turritopsis', { x: 540, y: 330, size: 150, font: 'cv', color: LI, t0: tT - 0.05, dur: 0.75, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
// «más pequeña que una uña»: un dedo de neón y la medusa encoge hasta su uña
const tU = T.at('pequeña'), tUna = T.at('uña');
const dg = D.capa(el('g', {}, D.art));
const dedo = [...tubo('M640 1500 L640 1080 Q640 960 780 960 Q920 960 920 1080 L920 1500', YE, dg, 9), ...tubo('M690 1080 Q690 1010 780 1010 Q870 1010 870 1080 L870 1150 Q780 1180 690 1150 Z', YE, dg, 7)];
dibuja(dedo, tU - 0.2, 0.55, { mano: false, sonido: false });
const mm = escribe('4,5 mm', { x: 340, y: 1120, size: 110, font: 'pm', color: YE, t0: tUna - 0.05, dur: 0.01, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
enciende([...mm.g.querySelectorAll('path')], tUna);
dibuja(flecha(440, 1100, 720, 1090, 0.15).map((d) => linea(d, { g: dg, color: YE, w: 7 })), tUna + 0.1, 0.3, { mano: false, sonido: false });
// el ciclo
const tC = T.line(2).t0 - 0.1;
[...dedo, ...nom.g.querySelectorAll('path')].forEach((e) => tl.to(e, { opacity: 0, duration: 0.15 }, tC));
[...mm.g.querySelectorAll('path'), ...dg.querySelectorAll('path')].forEach((e) => tl.to(e, { opacity: 0, duration: 0.15 }, tC));
const OX = 540, OY = 880, R = 330;
const cg = D.capa(el('g', {}, D.art));
const arc = (a0, a1) => { const p = (a) => [OX + R * Math.cos(a), OY + R * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
const punta = (a) => { const x = OX + R * Math.cos(a), y = OY + R * Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a); return `M${(x - tx * 30 - ty * 18).toFixed(1)} ${(y - ty * 30 + tx * 18).toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${(x - tx * 30 + ty * 18).toFixed(1)} ${(y - ty * 30 - tx * 18).toFixed(1)}`; };
const D2R = Math.PI / 180;
// medusa pequeña arriba, gota encogida a la derecha, pólipo abajo
const mini = (cx, cy, s) => [`M${cx - 70 * s} ${cy} Q${cx - 70 * s} ${cy - 80 * s} ${cx} ${cy - 80 * s} Q${cx + 70 * s} ${cy - 80 * s} ${cx + 70 * s} ${cy} Z`, ...[-40, 0, 40].map((dx) => `M${cx + dx * s} ${cy} q${-12 * s} ${40 * s} 0 ${80 * s} t0 ${70 * s}`)];
const mTop = mini(OX, OY - R + 40, 1);
const blob = `M${OX + R - 40} ${OY} m-34 0 a34 30 0 1 0 68 0 a34 30 0 1 0 -68 0`;
const polipo = [`M${OX} ${OY + R + 70} L${OX} ${OY + R - 40}`, `M${OX - 70} ${OY + R + 70} L${OX + 70} ${OY + R + 70}`, ...[-50, -20, 20, 50].map((dx) => `M${OX} ${OY + R - 40} q${dx * 0.6} -40 ${dx} -60`)];
const tEnv = T.at('envejece'), tEnc = T.at('encoge'), tPol = T.at('pólipo'), tBeb = T.at('bebé'), tCre = T.at('crece');
// la grande se apaga y aparece la pequeña arriba del ciclo
apaga(jelly, tEnv - 0.1);
const topEls = mTop.flatMap((d, i) => tubo(d, i ? PK : CY, cg, 7));
dibuja(topEls, tEnv, 0.45, { mano: false, sonido: false }); A.fx(tEnv, 'click', 0.12);
const a1 = tubo(arc(-80 * D2R, -10 * D2R), YE, cg, 7), a1p = tubo(punta(-10 * D2R), YE, cg, 7);
dibuja([...a1, ...a1p], tEnc - 0.3, 0.4, { mano: false, sonido: false });
const bl = tubo(blob, CY, cg, 7); dibuja(bl, tEnc + 0.1, 0.3, { mano: false, sonido: false });
const a2 = tubo(arc(10 * D2R, 75 * D2R), YE, cg, 7), a2p = tubo(punta(75 * D2R), YE, cg, 7);
dibuja([...a2, ...a2p], tPol - 0.5, 0.4, { mano: false, sonido: false });
const po = polipo.flatMap((d) => tubo(d, LI, cg, 7)); dibuja(po, tPol - 0.05, 0.5, { mano: false, sonido: false });
const beb = escribe('BEBÉ', { x: OX + 230, y: OY + R + 60, size: 90, font: 'pm', color: LI, t0: tBeb - 0.1, dur: 0.01, align: 'left', g: D.capa(el('g', {}, D.art)), mano: false });
enciende([...beb.g.querySelectorAll('path')], tBeb - 0.05);
const a3 = tubo(arc(105 * D2R, 255 * D2R), YE, cg, 7), a3p = tubo(punta(255 * D2R), YE, cg, 7);
dibuja([...a3, ...a3p], tCre - 0.1, 0.7, { mano: false, sonido: false });
const inf = escribe('∞', { x: OX, y: OY + 70, size: 260, font: 'pm', color: YE, t0: T.at('otra', 2) - 0.1, dur: 0.01, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
enciende([...inf.g.querySelectorAll('path')], T.at('otra', 2) - 0.05);
// una chispa recorre el ciclo, una y otra vez
const chispa = el('circle', { r: 16, fill: '#ffffff', opacity: 0, filter: 'url(#f-neon)' }, D.art);
// «que se la coman»: un pez de neón
const tCo = T.at('coman'), tUn = T.at('único');
const pez = el('g', { opacity: 0 }, D.art), pg = D.capa(pez);
const cuerpoPez = 'M0 0 Q90 -90 220 -20 L250 -50 L250 50 L220 20 Q90 90 0 0 Z';
const pezEls = [...tubo(cuerpoPez, PK, pg, 9), ...tubo('M60 -20 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0', '#ffffff', pg, 6)];
ya(pezEls);
const boca = el('path', { d: 'M-4 -26 L34 0 L-4 26', fill: '#120c10', stroke: 'none' }, pg);
const nam = escribe('¡ÑAM!', { x: 820, y: 360, size: 150, font: 'pm', color: PK, t0: tCo, dur: 0.01, align: 'center', g: D.capa(el('g', {}, D.art)), mano: false });
enciende([...nam.g.querySelectorAll('path')], tCo + 0.05);
apaga([...topEls], tCo + 0.05);
A.fx(tCo + 0.05, 'pop', 0.35); A.fx(tCo + 0.05, 'thump', 0.3);

const K = capas(T, { keys: ['medusa', 'vieja', 'nunca', 'turritopsis', 'una', 'polipo', 'bebe', 'cero', 'coman'], top: 1480, dur: DUR });
A.fx(0, 'thump', 0.25); A.fx(0.02, 'shimmer', 0.12);
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, musica: { archivo: 'n1-medusa.wav', gain: 0.32, duck: 0.55, fadein: 0.05, fadeout: 0.6 }, ambiente: [{ tipo: 'sala', desde: 0, hasta: DUR, g: 0.6 }] };
window.__dur = DUR;
window.__render = (t) => {
  D.render(t);
  // la medusa grande flota; en «pequeña» encoge hasta la uña
  const k = E.inOut(prog(t, tU + 0.1, tUna + 0.2)), s = lerp(1, 0.13, k), x = lerp(540, 780, k), y = lerp(880, 1080, k) + Math.sin(t * 2.2) * 14 * (1 - k);
  jel.setAttribute('transform', `translate(${x} ${y}) scale(${s}) translate(-540 -880)`);
  jel.querySelectorAll('path').forEach((p, i) => { if (i > 3) p.setAttribute('transform', `skewX(${Math.sin(t * 3 + i * 0.3) * 4})`); });
  // la chispa da vueltas desde «crece»
  const run = t >= tCre + 0.6 && t < tCo; chispa.setAttribute('opacity', run ? 1 : 0);
  if (run) { const a = -Math.PI / 2 + ((t - tCre - 0.6) * 2.6) % (Math.PI * 2); chispa.setAttribute('cx', OX + R * Math.cos(a)); chispa.setAttribute('cy', OY + R * Math.sin(a)); }
  // el pez entra por la derecha y abre la boca
  const pp = E.out(prog(t, tUn - 0.1, tCo + 0.05)); pez.setAttribute('opacity', t > tUn - 0.1 ? 1 : 0);
  pez.setAttribute('transform', `translate(${lerp(1250, OX + 40, pp)} ${OY - R - 10}) scale(-1.3 1.3)`);
  boca.setAttribute('opacity', Math.sin(t * 18) > 0 && t < tCo + 0.2 ? 1 : 0);
  K.update(t);
};
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
