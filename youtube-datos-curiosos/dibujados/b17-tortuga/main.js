// «Hay tortugas que respiran por el trasero.» Pizarra blanca y rotulador. La tortuga ya está; le salen burbujas por
// detrás y una flecha dice «¡AQUÍ!»; la tortuga del río Fitzroy (Australia) saca oxígeno del agua por la cloaca;
// «la misma que usa para todo lo demás»; ¡BUM!: bajo el agua días enteros; «cada uno respira como puede».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'HAY TORTUGAS QUE RESPIRAN <em>POR EL TRASERO</em>', claves: ['tortugas', 'respiran', 'trasero', 'fitzroy', 'australia', 'oxígeno', 'cloaca', 'atrás', 'días', 'agua', 'respirar'], manga: '#2a4d8f' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.tortuga(), { x: 60, y: 380, s: 1.9, ya: true });
pinta(DD.burbujas(), { x: 0, y: 330, s: 1.5, t0: 0.05, dur: 0.6, mano: false });
D.dibuja(flecha(380, 1100, 220, 830, 0.2).map((d) => D.linea(d, { w: 11, color: P.r })), at('trasero') - 0.3, 0.3);
texto('¡AQUÍ!', { x: 560, y: 1150, size: 120, color: P.r, t0: at('trasero') - 0.1, dur: 0.4 });

escena(1, at('la') - 0.25);
texto('RÍO FITZROY', { x: 540, y: Y(1, 480), size: 110, color: P.b, t0: at('fitzroy') - 0.2, dur: 0.5 });
texto('AUSTRALIA', { x: 540, y: Y(1, 580), size: 80, t0: at('australia') - 0.1, dur: 0.4 });
pinta(DD.tortuga(), { x: 160, y: Y(1, 520), s: 1.5, t0: at('tortuga') - 0.1, dur: 0.6 });
[[120, 780], [140, 860], [110, 940]].forEach(([x, y], i) => D.dibuja(flecha(x - 90, Y(1, y), x + 80, Y(1, y - 20), 0.1).map((d) => D.linea(d, { w: 9, color: P.b })), at('oxígeno') - 0.1 + i * 0.1, 0.2, { mano: i === 0 }));
texto('O2', { x: 120, y: Y(1, 760), size: 90, color: P.b, t0: at('oxígeno'), dur: 0.3 });
texto('POR LA CLOACA', { x: 540, y: Y(1, 1160), size: 100, color: P.r, t0: at('cloaca') - 0.2, dur: 0.5 });

escena(2, at('es') - 0.25);
texto('LA ABERTURA', { x: 540, y: Y(2, 560), size: 120, t0: at('abertura') - 0.2, dur: 0.5 });
texto('DE ATRÁS', { x: 540, y: Y(2, 700), size: 120, color: P.r, t0: at('atrás') - 0.2, dur: 0.4 });
texto('(sí, la de todo lo demás)', { x: 540, y: Y(2, 900), size: 70, color: P.gr, t0: at('todo') - 0.1, dur: 0.6 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
D.dibuja(D.linea(`M0 ${Y(3, 500)} q45 -20 90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0 t90 0`, { w: 9, color: P.b }), tBum + 0.3, 0.5);
pinta(DD.tortuga(), { x: 80, y: Y(3, 560), s: 1.4, t0: at('días') - 0.3, dur: 0.6 });
pinta(DD.calendario(), { x: 700, y: Y(3, 520), s: 0.7, t0: at('enteros') - 0.2, dur: 0.4 });
texto('DÍAS SIN SUBIR', { x: 540, y: Y(3, 1170), size: 100, color: P.r, t0: at('respirar') - 0.4, dur: 0.5 });

escena(0, at('cada') - 0.25, { dur: 0.35 });
sello('CADA UNO RESPIRA COMO PUEDE', at('respira') - 0.1, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
