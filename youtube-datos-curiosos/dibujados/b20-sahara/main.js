// «El Sahara fue verde… y tenía hipopótamos.» Tinta china y pincel. Dunas y sol ya pintados; el pincel dibuja un
// hipopótamo encima; hace 10.000 años había lagos, ríos y sabana; restos de hipopótamos y cocodrilos en pleno desierto;
// ¡BUM!: la Tierra inclinada cambió su clima; «podría volver a ser verde».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'EL SAHARA FUE VERDE… <em>Y TENÍA HIPOPÓTAMOS</em>', claves: ['sahara', 'verde', 'hipopótamos', '10.000', 'lagos', 'sabana', 'desierto', 'cocodrilos', 'inclinación', 'tierra', 'mayor'], manga: '#3b2a1e' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.dunas(), { x: 0, y: 650, s: 2.7, ya: true });
pinta(DD.sol(), { x: 720, y: 460, s: 0.8, ya: true });
pinta(DD.hipo(), { x: 60, y: 520, s: 1.5, t0: 0.05, dur: 1.0 });
texto('VERDE', { x: 820, y: 900, size: 110, color: P.g, t0: at('verde') - 0.1, dur: 0.4 });

escena(1, at('hace') - 0.25);
texto('HACE 10.000 AÑOS', { x: 540, y: Y(1, 480), size: 100, t0: at('10.000') - 0.2, dur: 0.6 });
pinta(DD.lago(), { x: 0, y: Y(1, 380), s: 2.7, t0: at('lagos') - 0.2, dur: 0.6 });
D.dibuja(D.linea(`M0 ${Y(1, 1100)} Q300 ${Y(1, 1040)} 540 ${Y(1, 1110)} T1080 ${Y(1, 1080)}`, { w: 14, color: P.b }), at('ríos') - 0.15, 0.4);
texto('SABANA', { x: 540, y: Y(1, 1180), size: 90, color: P.g, t0: at('sabana') - 0.2, dur: 0.4 });

escena(2, at('en') - 0.25);
pinta(DD.cocodrilo(), { x: 40, y: Y(2, 380), s: 2.2, t0: at('cocodrilos') - 0.5, dur: 0.6 });
pinta(DD.hipo(), { x: 120, y: Y(2, 700), s: 1.4, t0: at('restos') - 0.1, dur: 0.6 });
texto('EN PLENO DESIERTO', { x: 540, y: Y(2, 1170), size: 92, color: P.o, t0: at('desierto') - 0.2, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.tierraInclinada(), { x: 120, y: Y(3, 380), s: 2.1, t0: at('inclinación') - 0.3, dur: 0.7 });
texto('UN PEQUEÑO CAMBIO', { x: 540, y: Y(3, 500), size: 90, color: P.r, t0: at('pequeño') - 0.1, dur: 0.5 });
texto('= DESIERTO', { x: 540, y: Y(3, 1170), size: 120, color: P.o, t0: at('mayor') - 0.1, dur: 0.5 });

escena(0, at('y', 4) - 0.25, { dur: 0.35 });
sello('PODRÍA VOLVER A SER VERDE', at('volver') - 0.2, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
