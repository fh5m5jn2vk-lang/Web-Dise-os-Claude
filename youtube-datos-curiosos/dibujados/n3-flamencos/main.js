// «¡Los flamencos no nacen rosas!». Cuaderno de cuadros, boli azul y fosforitos: el flamenco ya está dibujado y pintado
// de rosa en el primer fotograma; un huevo se rompe y sale una cría gris; abajo, algas y una gamba con su pigmento naranja
// (flechas al flamenco) y una zanahoria «de la misma familia»; al final el rosa del flamenco se borra hasta quedar blanco.
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { flecha, circulo, subrayado, tacha } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('ka', '../fonts/kalam-bold.ttf'), fuente('if', '../fonts/indie-flower.ttf')]);
const DUR = T.G.dur;
const D = pizarra('cuaderno', { manga: '#e86b9a' });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, tl } = D;
const PINK = '#ff5fae', ORA = '#ff9f1c', GREEN = '#2fbf71', GREY = '#9aa0a6', RED = '#e0312b', A = sonido();
// las líneas del cuaderno
const rejilla = el('g', { opacity: 0.55 }, D.fondo);
for (let y = -400; y < 3200; y += 48) el('path', { d: `M-400 ${y} H1500`, stroke: '#9cc3e6', 'stroke-width': 2 }, rejilla);
for (let x = -400; x < 1500; x += 48) el('path', { d: `M${x} -400 V3200`, stroke: '#cfe1f2', 'stroke-width': 1.5 }, rejilla);
el('path', { d: 'M90 -400 V3200', stroke: '#f08a8a', 'stroke-width': 3 }, rejilla);
const at = (w, n) => T.at(w, n);

// el flamenco, ya pintado
const FX = 330, FY = 520, FS = 1.2;
const fg = D.capa(el('g', { transform: `translate(${FX} ${FY}) scale(${FS})` }, D.art)), fb = el('g', { transform: `translate(${FX} ${FY}) scale(${FS})` }, D.bajo);
const L = (d, o = {}) => linea(d, { g: fg, ...o });
const cuerpo = 'M100 300 Q150 220 260 240 Q340 258 330 330 Q300 400 200 402 Q108 396 100 300 Z';
const cuello = 'M140 272 C84 222 74 162 122 132 C168 104 186 76 160 52';
const cabeza = 'M165 45 m-27 0 a27 27 0 1 0 54 0 a27 27 0 1 0 -54 0';
const fl = [L(cuerpo), L(cuello, { w: 22, color: '#1e3fa6' }), L(cuello, { w: 12, color: '#fff9fb' }), L(cabeza), L('M188 38 Q238 44 242 78 Q226 70 200 62', {}), L('M222 54 Q238 62 242 78 Q228 72 222 66 Z', { w: 6 }),
  L('M160 38 l0.1 0', { w: 10 }), L('M320 300 L382 282 M326 322 L386 316 M318 340 L372 350'), L('M150 300 Q200 280 250 300 Q210 320 170 318'),
  L('M210 400 L212 560 L206 700'), L('M232 398 L246 500 L200 470'), L('M206 700 L168 712 M206 700 L244 714')];
ya(fl);
const rosa = [colorea(cuerpo, { color: PINK, t0: 0, dur: 0.01, g: fb, op: 0.55, mano: false }), colorea(cabeza, { color: PINK, t0: 0, dur: 0.01, g: fb, op: 0.55, mano: false }), linea(cuello, { g: fb, color: PINK, w: 30, op: 0.5 })];
ya(rosa);
camaraYa({ x: 540, y: 880, s: 1.02, r: -0.8 });
// el gancho escrito: «¡NO NACEN» ya está, «ROSAS!» se escribe en rosa y se subraya
const h1 = escribe('¡NO NACEN', { x: 540, y: 330, size: 120, font: 'ka', color: RED, t0: 0, dur: 0.01, align: 'center', mano: false });
ya([...h1.g.querySelectorAll('path')]);
escribe('ROSAS!', { x: 540, y: 470, size: 140, font: 'ka', color: PINK, t0: 0.1, dur: 0.75, align: 'center' });
dibuja(linea(subrayado(330, 760, 500, 7), { w: 9, color: PINK }), at('rosas') + 0.1, 0.3);

// «Las crías salen del huevo grises»: a la izquierda, un huevo se rompe y sale la cría gris
const tH = at('huevo'), tG = at('grises');
camara(at('crías') - 0.2, 0.5, { x: 400, y: 1080, s: 1.12, r: 0.6 }, 'power2.inOut'); A.fx(at('crías') - 0.2, 'whoosh', 0.12);
const eg = D.capa(el('g', {}, D.art)), ebg = el('g', {}, D.bajo);
const cascara = ['M140 1330 Q120 1250 160 1240 L180 1270 L200 1240 L220 1272 L240 1240 Q290 1250 270 1330 Q250 1380 205 1380 Q160 1380 140 1330 Z'];
dibuja(cascara.map((d) => linea(d, { g: eg })), at('crías'), 0.5);
const cria = ['M205 1255 m-62 0 a62 56 0 1 0 124 0 a62 56 0 1 0 -124 0', 'M205 1160 m-38 0 a38 36 0 1 0 76 0 a38 36 0 1 0 -76 0'];
dibuja([...cria.map((d) => linea(d, { g: eg, w: 4 })), linea('M238 1158 l26 6 l-24 8', { g: eg }), linea('M212 1150 l0.1 0', { g: eg, w: 9 }), linea('M150 1240 q-22 -6 -30 10 M260 1240 q22 -6 30 10', { g: eg })], tH, 0.5);
colorea(cria[0], { color: GREY, t0: tG - 0.15, dur: 0.3, g: ebg, op: 0.6, paso: 12 }); colorea(cria[1], { color: GREY, t0: tG + 0.15, dur: 0.2, g: ebg, op: 0.6, paso: 10 });
escribe('GRIS', { x: 205, y: 1050, size: 92, font: 'ka', color: '#6e747a', t0: tG - 0.05, dur: 0.4, align: 'center', mano: false });
A.fx(tH, 'pop', 0.22); A.fx(tH + 0.03, 'slap', 0.15);

// «El rosa viene de lo que comen: algas y gambitas llenas de pigmentos naranjas»: abajo
const tC = at('comen') - 0.2;
camara(tC, 0.55, { x: 540, y: 2020, s: 1.0, r: -0.5 }, 'power2.inOut'); A.fx(tC, 'whoosh', 0.14);
const pg = D.capa(el('g', {}, D.art)), pbg = el('g', {}, D.bajo);
const algas = [0, 1, 2, 3].map((i) => `M${140 + i * 46} 2160 q-24 -50 0 -100 t0 -100 t0 -80`);
dibuja(algas.map((d) => linea(d, { g: pg, color: GREEN, w: 7 })), at('algas') - 0.05, 0.4, { hueco: 0.02 });
const gamba = 'M430 2060 Q470 1950 580 1960 Q660 1975 650 2050 Q640 2100 590 2110 L600 2150 L560 2125 Q500 2110 470 2080 Z';
dibuja([linea(gamba, { g: pg }), linea('M580 1965 q20 40 0 140 M540 1962 q20 40 0 140 M500 1975 q18 40 -2 120', { g: pg, w: 3.5 }), linea('M440 2040 q-60 -80 -40 -170 M450 2030 q-90 -40 -110 -130', { g: pg, w: 3.5 }), linea('M470 2010 l0.1 0', { g: pg, w: 10 })], at('gambitas') - 0.05, 0.5);
colorea(gamba, { color: ORA, t0: at('naranjas') - 0.25, dur: 0.35, g: pbg, op: 0.6 });
escribe('PIGMENTOS', { x: 760, y: 2280, size: 82, font: 'ka', color: ORA, t0: at('pigmentos') - 0.05, dur: 0.45, align: 'center', mano: false });
dibuja(flecha(640, 1940, 760, 1560, -0.2).map((d) => linea(d, { w: 6, color: PINK })), at('naranjas') + 0.1, 0.3, { mano: false });
dibuja(flecha(250, 1900, 330, 1560, 0.2).map((d) => linea(d, { w: 6, color: PINK })), at('naranjas') + 0.25, 0.3, { mano: false });

// «Son de la misma familia que el de las zanahorias»: una zanahoria al lado
const zg = D.capa(el('g', {}, D.art)), zbg = el('g', {}, D.bajo);
const zan = 'M820 1990 Q860 1980 900 1995 L860 2200 Z';
dibuja([linea(zan, { g: zg }), linea('M850 2040 l18 4 M845 2090 l16 3 M855 2140 l10 2', { g: zg, w: 3.5 }), linea('M860 1988 q-20 -60 -50 -80 M865 1986 q0 -70 10 -100 M870 1990 q30 -50 60 -60', { g: zg, color: GREEN, w: 6 })], at('familia') - 0.1, 0.5);
colorea(zan, { color: ORA, t0: at('zanahorias') - 0.05, dur: 0.25, g: zbg, op: 0.65 });
escribe('=', { x: 735, y: 2085, size: 120, font: 'ka', t0: at('misma') - 0.05, dur: 0.2, align: 'center', mano: false });
dibuja(linea(circulo(760, 2250, 230, 70), { w: 6, color: RED }), at('zanahorias') + 0.15, 0.35, { mano: false });

// «Si dejan de comerlos, se van quedando blancos»: vuelve al flamenco y el rosa se borra
const tS = at('si') - 0.2;
camara(tS, 0.55, { x: 560, y: 900, s: 1.0, r: 0.6 }, 'power2.inOut'); A.fx(tS, 'whoosh', 0.14);
rosa.forEach((r) => tl.to(r, { opacity: 0.05, duration: 1.3, ease: 'power1.in' }, at('quedando') - 0.4));
dibuja(tacha(330, 380, 430, 120).map((d) => linea(d, { w: 10, color: RED })), at('dejan'), 0.3);
escribe('¡BLANCOS!', { x: 760, y: 1250, size: 100, font: 'ka', color: '#6e747a', t0: at('blancos') - 0.1, dur: 0.5, align: 'center' });
A.fx(at('quedando'), 'swish', 0.2);
salida(T.END);

const K = capas(T, { keys: ['rosas', 'grises', 'algas', 'gambitas', 'naranjas', 'zanahorias', 'blancos'], top: 1490, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.22), musica: { archivo: 'n3-flamencos.wav', gain: 0.3, duck: 0.5, fadein: 0.05, fadeout: 0.6 } };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
