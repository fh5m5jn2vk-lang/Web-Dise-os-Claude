// «¡En la Tierra hay más árboles que estrellas en nuestra galaxia!». Tinta china y pincel sobre papel de arroz: un pino
// ya pintado y «ÁRBOLES» escrito; el pincel añade «> ESTRELLAS»; la cámara sube a la Vía Láctea (una aguada con puntos
// de estrellas, 400.000 millones); baja a un bosque que se pinta árbol a árbol (3 billones) con un sello rojo «×7»;
// los árboles de la derecha se tachan y se borran (15.000 millones al año) y, al alejarse, se va la mitad del bosque.
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';

const T = await tiempos();
await Promise.all([fuente('br', '../fonts/caveat-brush.ttf')]);
const DUR = T.G.dur;
const D = pizarra('arroz', { manga: '#3b2a1e' });
const { el, linea, dibuja, ya, salida, escribe, camara, camaraYa, aparece, texto, tl } = D;
const RED = '#c62a1f', INK = '#17130f', A = sonido();
const tinta = (parent = D.art) => D.capa(el('g', {}, parent));

// un abeto a pinceladas: el tronco y pisos de ramas en arco, más anchos abajo, con una aguada debajo
function pino(x, y, s, g) {
  const P = (d, w, op = 1) => linea(d, { g, w: w * s, op });
  const out = [P(`M${x} ${y} C${x + 6 * s} ${y - 150 * s} ${x - 8 * s} ${y - 300 * s} ${x} ${y - 470 * s}`, 18)];
  for (let j = 0; j < 6; j++) {
    const yj = y - (110 + j * 62) * s, w = (150 - j * 24) * s, dy = 46 * s;
    out.push(P(`M${x - w} ${yj + dy} Q${x - w * 0.45} ${yj + dy * 0.2} ${x} ${yj - 26 * s} Q${x + w * 0.45} ${yj + dy * 0.2} ${x + w} ${yj + dy}`, 15));
    out.push(P(`M${x - w * 0.8} ${yj + dy * 0.9} Q${x} ${yj + dy * 0.5} ${x + w * 0.8} ${yj + dy * 0.9}`, 34, 0.22));
  }
  out.push(P(`M${x} ${y - 470 * s} l0 ${-40 * s}`, 10));
  return out;
}
// la escena del primer fotograma: un pino grande, unas estrellas, «ÁRBOLES»
camaraYa({ x: 540, y: 900, s: 1, r: 0 });
const g0 = tinta();
ya(pino(260, 1360, 1.35, g0));
const est0 = Array.from({ length: 14 }, (_, i) => linea(`M${560 + ((i * 137) % 460)} ${330 + ((i * 89) % 420)} l0.1 0`, { g: g0, w: 9 + (i % 3) * 3 }));
ya(est0);
const hook = escribe('ÁRBOLES', { x: 700, y: 1040, size: 170, font: 'br', t0: 0, dur: 0.01, align: 'center', mano: false, g: tinta() });
ya([...hook.g.querySelectorAll('path')]);
escribe('> ESTRELLAS', { x: 700, y: 1210, size: 130, font: 'br', color: RED, t0: 0.05, dur: 1.2, align: 'center', g: tinta() });

// «La Vía Láctea tiene, como mucho, 400.000 millones de estrellas»: arriba, una aguada y puntos
const tV = T.at('vía') - 0.25;
camara(tV, 0.6, { x: 540, y: 300, s: 1, r: -0.6 }, 'power3.inOut'); A.fx(tV, 'whoosh', 0.15);
const gv = tinta();
const banda = [[0, 150, 0.07], [-40, 90, 0.08], [50, 70, 0.07], [10, 36, 0.1]].map(([o, w, op]) => linea(`M-120 ${640 + o} C200 ${420 + o} 640 ${300 + o} 1200 ${-120 + o}`, { g: gv, w, op, cap: 'round' }));
dibuja(banda, tV + 0.15, 0.8, { ease: 'power1.inOut', hueco: 0.02 });
const estrellas = Array.from({ length: 70 }, (_, i) => { const u = (i * 0.618) % 1, x = -80 + u * 1260, y = 640 - u * 760 + (((i * 53) % 220) - 110); return linea(`M${x.toFixed(0)} ${y.toFixed(0)} l0.1 0`, { g: gv, w: 5 + (i % 4) * 3 }); });
dibuja(estrellas, tV + 0.6, 1.4, { mano: false });
const t4 = T.at('400.000');
escribe('400.000', { x: 540, y: 120, size: 150, font: 'br', t0: t4 - 0.1, dur: 0.6, align: 'center', g: tinta() });
escribe('millones de estrellas', { x: 540, y: 220, size: 80, font: 'br', color: RED, t0: T.at('millones') + 0.05, dur: 0.6, align: 'center', mano: false, g: tinta() });
A.fx(t4, 'pop', 0.16);

// «En la Tierra hay unos tres billones de árboles. Siete veces más.»: abajo, un bosque árbol a árbol
const tB = T.line(2).t0 - 0.25;
camara(tB, 0.7, { x: 540, y: 1760, s: 0.95, r: 0.4 }, 'power3.inOut'); A.fx(tB, 'whoosh', 0.15);
const gb = tinta();
const arboles = Array.from({ length: 11 }, (_, i) => pino(70 + i * 94, 1920 - (i % 2) * 18, 0.42 + (i % 3) * 0.06, gb));
dibuja(linea('M-60 1925 Q540 1900 1140 1930', { g: gb, w: 10 }), tB + 0.2, 0.3);
arboles.forEach((tr, i) => dibuja(tr, tB + 0.45 + i * 0.13, 0.13, { hueco: 0.005, mano: i % 3 === 0 }));
const t3 = T.at('billones');
escribe('3 BILLONES', { x: 90, y: 2090, size: 130, font: 'br', t0: t3 - 0.25, dur: 0.7, align: 'left', mano: false, g: tinta() });
// el sello rojo «×7»
const sello = el('g', {}, D.sobre);
el('rect', { x: 800, y: 1985, width: 200, height: 170, rx: 18, fill: RED, opacity: 0.92, filter: 'url(#f-tinta)' }, sello);
texto('×7', { x: 900, y: 2115, size: 130, font: 'br', color: '#f6ead6', align: 'center', g: sello });
aparece(sello, T.at('siete'), { tipo: 'sello' }); A.fx(T.at('siete'), 'thump', 0.4); A.fx(T.at('siete'), 'slap', 0.2);

// «Pero cada año cortamos más de 15.000 millones»: los de la derecha, tachados y borrados
const tP = T.at('cortamos');
const tachas = [7, 8, 9, 10].map((i, k) => { const x = 70 + i * 94; const l = linea(`M${x - 60} ${1650} L${x + 60} ${1880}`, { w: 12, color: RED }); dibuja(l, tP + k * 0.15, 0.12, { mano: k === 0 }); return l; });
[7, 8, 9, 10].forEach((i, k) => arboles[i].forEach((p) => tl.to(p, { opacity: 0, duration: 0.3 }, tP + 0.5 + k * 0.12)));
tachas.forEach((l, k) => tl.to(l, { opacity: 0, duration: 0.3 }, tP + 0.6 + k * 0.12));
escribe('−15.000 millones al año', { x: 540, y: 1480, size: 92, font: 'br', color: RED, t0: T.at('15.000') - 0.1, dur: 0.7, align: 'center', mano: false, g: tinta() });
A.fx(tP, 'tear', 0.18);

// «ya hemos perdido casi la mitad»: la cámara se aleja y se va media pizarra de bosque
const tA = T.at('agricultura') - 0.2;
camara(tA, 0.7, { x: 540, y: 1220, s: 0.6, r: 0 }, 'power3.inOut'); A.fx(tA, 'whoosh', 0.16);
const tM = T.at('perdido');
[0, 1, 2, 3, 4, 5, 6].forEach((i, k) => arboles[i].forEach((p) => tl.to(p, { opacity: 0.12, duration: 0.35 }, tM + 0.05 * k)));

const mitad = el('g', {}, D.sobre);
el('rect', { x: 170, y: 1620, width: 360, height: 260, rx: 24, fill: RED, opacity: 0.92, filter: 'url(#f-tinta)' }, mitad);
texto('½', { x: 350, y: 1820, size: 230, font: 'br', color: '#f6ead6', align: 'center', g: mitad });
aparece(mitad, T.at('mitad') - 0.1, { tipo: 'sello' }); A.fx(T.at('mitad') - 0.1, 'thump', 0.45); A.fx(T.at('mitad') - 0.1, 'gong', 0.12);
salida(T.END);

const K = capas(T, { keys: ['arboles', 'estrellas', '400.000', 'billones', 'siete', '15.000', 'mitad'], top: 1470, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.2), musica: { archivo: 'n2-arboles.wav', gain: 0.3, duck: 0.5, fadein: 0.05, fadeout: 0.8 } };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
