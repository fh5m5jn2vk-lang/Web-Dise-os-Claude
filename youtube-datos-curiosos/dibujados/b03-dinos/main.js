// «En la época de los dinosaurios, el día duraba media hora menos.» Pizarra de tiza. El T-rex ya está; la tiza dibuja
// un reloj que marca 23:30 (−30 min); 70 millones de años; un calendario de 372 días; ¡BUM!: la Luna frena a la Tierra
// y se aleja 3,8 cm al año; vuelta al reloj: «tu día se alarga».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo, flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'CON LOS DINOSAURIOS EL DÍA DURABA <em>MEDIA HORA MENOS</em>', claves: ['dinosaurios', 'media', 'menos', '70', '23,5', '372', 'luna', 'frena', 'aleja', 'centímetros', 'alargando'], manga: '#7a2f3b' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.trex(), { x: 0, y: 470, s: 1.3, ya: true });
pinta(DD.reloj(11.5, 30), { x: 560, y: 470, s: 1.12, t0: 0.05, dur: 1.0 });
texto('−30 MIN', { x: 785, y: 1110, size: 110, color: P.y, t0: at('media') - 0.1, dur: 0.5 });

escena(1, at('hace') - 0.25);
texto('HACE 70 MILLONES', { x: 540, y: Y(1, 500), size: 96, t0: at('70') - 0.15, dur: 0.6 });
pinta(DD.reloj(11.5, 30), { x: 300, y: Y(1, 540), s: 1.2, t0: at('día', 2) - 0.1, dur: 0.7 });
texto('23,5 h', { x: 540, y: Y(1, 1150), size: 150, color: P.y, t0: at('23,5') - 0.1, dur: 0.5 });

escena(2, at('y') - 0.25);
pinta(DD.calendario(), { x: 180, y: Y(2, 400), s: 1.8, t0: at('año') - 0.15, dur: 0.6 });
texto('372', { x: 540, y: Y(2, 930), size: 230, color: P.y, t0: at('372') - 0.1, dur: 0.6 });
texto('DÍAS AL AÑO', { x: 540, y: Y(2, 1170), size: 92, t0: at('días') - 0.1, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.tierraLuna(), { x: 40, y: Y(3, 450), s: 2.1, t0: at('luna') - 0.1, dur: 0.8 });
D.dibuja(flecha(250, Y(3, 610), 430, Y(3, 610), 0.5).map((d) => D.linea(d, { w: 10, color: P.r })), at('frena') - 0.05, 0.35, { mano: false });
texto('FRENA', { x: 330, y: Y(3, 560), size: 80, color: P.r, t0: at('frena'), dur: 0.35 });
texto('+3,8 cm', { x: 540, y: Y(3, 1050), size: 150, color: P.y, t0: at('centímetros') - 0.25, dur: 0.5 });
texto('CADA AÑO', { x: 540, y: Y(3, 1170), size: 80, t0: at('cada') - 0.1, dur: 0.4 });

escena(1, at('ahora') - 0.25, { dur: 0.35 });
sello('TU DÍA SE ALARGA', at('alargando') - 0.5, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
