// «¡Cleopatra vivió más cerca del iPhone que de las pirámides!». Pizarra blanca y rotulador: la mano termina el retrato
// de Cleopatra (ya está en el primer fotograma), la cámara baja al iPhone y sube a la pirámide mientras se dibujan;
// luego una línea del tiempo vertical baja de la pirámide (2560 a. C.) a Cleopatra (2.500 años) y al iPhone (2.000),
// con sus llaves y cifras en rojo y azul; al final la cámara se aleja y enseña la pizarra entera.
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { flecha, circulo, subrayado } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('pm', '../fonts/permanent-marker.ttf'), fuente('cv', '../fonts/caveat.ttf')]);
const DUR = T.G.dur;
const D = pizarra('blanca', { manga: '#2a4d8f' });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa } = D;
const RED = '#d42b2b', BLUE = '#1f5fd1', GOLD = '#e3a21a', SKIN = '#f2c8a2', A = sonido();

// la línea del tiempo, vertical: 2560 a. C. arriba, 2007 abajo
const X = 380, Y0 = 260, Y1 = 2360, yr = (y) => Y0 + ((y + 2560) / (2007 + 2560)) * (Y1 - Y0);
const yC = yr(-30);
const g = (tx, ty, s = 1) => D.capa(el('g', { transform: `translate(${tx} ${ty}) scale(${s})` }, D.art));
const gb = (tx, ty, s = 1) => el('g', { transform: `translate(${tx} ${ty}) scale(${s})` }, D.bajo);

// Cleopatra, de frente: melena negra con flequillo, diadema dorada con cobra, ojos con raya, collar
const CX = 470, CY = yC - 230, CS = 1.15;
const cg = g(CX, CY, CS), cb = gb(CX, CY, CS);
const L = (d, o = {}) => linea(d, { g: cg, ...o });
const pelo = 'M70 335 L70 170 Q70 58 200 54 Q330 58 330 170 L330 335 Q300 345 270 335 L270 175 Q200 160 130 175 L130 335 Q100 345 70 335 Z';
const cara = 'M200 100 Q292 102 296 210 Q298 300 200 330 Q102 300 104 210 Q108 102 200 100 Z';
const ojos = ['M140 205 Q161 189 184 205 Q161 216 140 205 Z', 'M216 205 Q239 189 260 205 Q239 216 216 205 Z', 'M140 205 L120 193', 'M260 205 L280 193'];
const cejas = ['M136 182 Q160 170 186 180', 'M214 180 Q240 170 264 182'];
const resto = ['M200 214 Q195 246 206 256 Q200 261 191 256', 'M176 286 Q200 274 224 286 Q200 302 176 286 Z', 'M168 328 L168 372', 'M232 328 L232 372'];
const collar = ['M100 372 Q200 440 300 372', 'M114 392 Q200 462 286 392', 'M128 412 Q200 482 272 412'];
const diadema = 'M96 140 Q200 112 304 140', cobra = 'M200 128 Q186 104 200 84 Q214 104 200 128 Z';
const retrato = [L(cara), L(pelo), ...ojos.map((d) => L(d, { w: 6 })), ...cejas.map((d) => L(d, { w: 6 })), ...resto.map((d) => L(d, { w: 6 }))];
ya(retrato);
[[pelo, '#1d1d20', 0.85], [cara, SKIN, 0.6]].forEach(([d, c, o]) => { const z = colorea(d, { color: c, t0: 0, dur: 0.01, g: cb, op: o, mano: false }); ya(z); });
['M161 204 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'M239 204 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0'].forEach((d) => ya(L(d, { w: 7 })));
// 0 s: la mano termina la diadema, la cobra y el collar
camaraYa({ x: CX + 230, y: CY + 230, s: 1.45, r: -1 });
dibuja([L(diadema, { w: 13, color: GOLD }), L(cobra, { w: 6, color: GOLD }), ...collar.map((d) => L(d, { w: 9, color: GOLD }))], 0.02, 1.0, { hueco: 0.04 });
escribe('CLEOPATRA', { x: CX + 230, y: CY - 40, size: 92, font: 'pm', color: RED, t0: 0.15, dur: 0.75, align: 'center', mano: false });

// «…del iPhone»: la cámara baja y se dibuja el teléfono
const PX = 520, PY = Y1 - 170;
const pg = g(PX, PY, 1.15), pL = (d, o = {}) => linea(d, { g: pg, ...o });
const tI = T.at('iPhone');
camara(tI - 0.25, 0.4, { x: 620, y: PY + 170, s: 1.25, r: 1 }, 'power3.inOut'); A.fx(tI - 0.25, 'whoosh', 0.14);
dibuja([pL('M26 0 L144 0 Q170 0 170 26 L170 304 Q170 330 144 330 L26 330 Q0 330 0 304 L0 26 Q0 0 26 0 Z'), pL('M14 42 L156 42 L156 284 L14 284 Z', { w: 5 }), pL('M66 20 L104 20', { w: 6 }), pL('M85 296 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0', { w: 5 })], tI + 0.1, 0.55, { hueco: 0.02 });
colorea('M14 42 L156 42 L156 284 L14 284 Z', { color: '#7cc0f2', t0: tI + 0.6, dur: 0.01, g: gb(PX, PY, 1.15), op: 0.55, mano: false });
escribe('2007', { x: PX + 330, y: PY + 205, size: 96, font: 'pm', color: BLUE, t0: tI + 0.3, dur: 0.45, align: 'center', mano: false });

// «…que de las pirámides»: sube a lo alto de la pizarra y se dibuja la pirámide
const QX = 470, QY = Y0 - 170;
const qg = g(QX, QY, 1.05), qL = (d, o = {}) => linea(d, { g: qg, ...o });
const tP = T.at('pirámides');
camara(tP - 0.25, 0.45, { x: 640, y: QY + 190, s: 1.2, r: -0.6 }, 'power3.inOut'); A.fx(tP - 0.25, 'whoosh', 0.16);
const piram = 'M20 300 L260 20 L500 300 Z';
dibuja([qL(piram), qL('M260 20 L330 300', { w: 5 }), qL('M-30 300 L560 300', { w: 6 }), ...[90, 160, 230].map((h) => qL(`M${20 + (240 * (300 - h)) / 280 + 10} ${h} L${500 - (240 * (300 - h)) / 280 - 10} ${h}`, { w: 4 }))], tP + 0.05, 0.6, { hueco: 0.02 });
colorea(piram, { color: GOLD, t0: tP + 0.7, dur: 0.01, g: gb(QX, QY, 1.05), op: 0.45, mano: false });

// «…hacia el 2560 antes de Cristo»: el primer punto de la línea y la fecha
const t25 = T.at('2560');
const punto = (y, c) => linea(`M${X} ${y} m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0`, { w: 14, color: c });
dibuja(punto(Y0, RED), t25 - 0.3, 0.2);
camara(t25 - 0.45, 0.5, { x: 470, y: Y0 + 120, s: 0.95, r: 0 }, 'power2.inOut');
escribe('2560 a. C.', { x: X - 30, y: Y0 + 130, size: 74, font: 'pm', color: RED, t0: t25 - 0.05, dur: 0.7, align: 'right' });

// «Cleopatra llegó unos 2500 años después»: la línea baja hasta ella y su llave
const tC = T.at('llegó');
camara(tC - 0.4, 1.1, { x: 520, y: (Y0 + yC) / 2 + 120, s: 0.78, r: 0 }, 'power2.inOut'); A.fx(tC - 0.4, 'whoosh', 0.12);
dibuja(linea(`M${X} ${Y0} L${X} ${yC}`, { w: 10 }), tC - 0.3, 0.9, { ease: 'power1.inOut' });
dibuja(punto(yC, RED), tC + 0.62, 0.15);
const llave = (y0, y1, x, c) => linea(`M${x} ${y0 + 10} Q${x - 40} ${y0 + 10} ${x - 40} ${(y0 + y1) / 2 - 20} L${x - 70} ${(y0 + y1) / 2} L${x - 40} ${(y0 + y1) / 2 + 20} Q${x - 40} ${y1 - 10} ${x} ${y1 - 10}`, { w: 7, color: c });
const t2500 = T.at('2500');
dibuja(llave(Y0, yC, X - 60, RED), t2500 - 0.35, 0.35, { mano: false });
escribe('2.500', { x: X - 150, y: (Y0 + yC) / 2 + 10, size: 120, font: 'pm', color: RED, t0: t2500 - 0.05, dur: 0.55, align: 'right' });
escribe('AÑOS', { x: X - 150, y: (Y0 + yC) / 2 + 100, size: 66, font: 'pm', color: RED, t0: t2500 + 0.45, dur: 0.35, align: 'right', mano: false });
A.fx(t2500, 'pop', 0.18);

// «Y del primer iPhone la separan solo 2000»: la línea sigue hasta el teléfono
const tY = T.at('primer');
camara(tY - 0.35, 1.0, { x: 520, y: (yC + Y1) / 2 + 160, s: 0.78, r: 0 }, 'power2.inOut'); A.fx(tY - 0.35, 'whoosh', 0.12);
dibuja(linea(`M${X} ${yC} L${X} ${Y1}`, { w: 10 }), tY - 0.25, 0.8);
dibuja(punto(Y1, BLUE), tY + 0.55, 0.15);
const t2000 = T.at('2000');
dibuja(llave(yC, Y1, X - 60, BLUE), t2000 - 0.4, 0.35, { mano: false });
escribe('2.000', { x: X - 150, y: (yC + Y1) / 2 + 10, size: 120, font: 'pm', color: BLUE, t0: t2000 - 0.05, dur: 0.5, align: 'right' });
escribe('AÑOS', { x: X - 150, y: (yC + Y1) / 2 + 100, size: 66, font: 'pm', color: BLUE, t0: t2000 + 0.4, dur: 0.35, align: 'right', mano: false });
A.fx(t2000, 'pop', 0.18);

// «Para ella, las pirámides ya eran antiguas»: la pizarra entera; la pirámide, rodeada
const tE = T.at('ella');
camara(tE - 0.3, 0.8, { x: 560, y: 1330, s: 0.62, r: 0 }, 'power3.inOut'); A.fx(tE - 0.3, 'whoosh', 0.16);
const tA = T.at('antiguas');
dibuja(linea(circulo(QX + 260, QY + 170, 330, 230), { w: 9, color: RED }), tA - 0.55, 0.55);
escribe('¡YA ERA ANTIGUA!', { x: 640, y: QY - 50, size: 96, font: 'pm', color: RED, t0: tA - 0.45, dur: 0.6, align: 'center', mano: false });
salida(T.END);
A.fx(tA, 'pop', 0.2);

const K = capas(T, { keys: ['cleopatra', 'iphone', 'piramides', '2560', '2500', '2000', 'antiguas'], top: 1450, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.22) };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
