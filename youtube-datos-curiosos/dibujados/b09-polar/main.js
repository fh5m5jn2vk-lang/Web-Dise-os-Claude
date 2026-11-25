// «Cuando miras la estrella Polar, ves luz de la época de Cervantes.» Neón. La Osa Menor ya brilla, con la Polar en
// amarillo; un ojo y un rayo de luz que viaja hasta él; 430 años luz; siglo XVI; ¡BUM!: pluma y libro: el Quijote
// (1605) aún no existía cuando salió esa luz; «mirar al cielo es mirar al pasado».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LA ESTRELLA POLAR TE ENSEÑA <em>LA ÉPOCA DE CERVANTES</em>', claves: ['polar', 'cervantes', '430', 'luz', 'xvi', 'quijote', 'pasado'] });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.osaMenor(), { x: 60, y: 430, s: 1.7, ya: true });
pinta(DD.ojo(), { x: 640, y: 860, s: 0.85, t0: 0.05, dur: 0.6, color: P.g });
D.dibuja(D.linea('M180 560 L760 1020', { w: 8, color: P.y, dash: '18 18' }), at('luz') - 0.3, 0.8, { mano: false });

escena(1, at('está') - 0.25);
texto('430', { x: 540, y: Y(1, 820), size: 300, color: P.y, t0: at('430') - 0.15, dur: 0.6 });
texto('AÑOS LUZ', { x: 540, y: Y(1, 1000), size: 120, color: P.p, t0: at('luz', 2) - 0.2, dur: 0.5 });
D.dibuja(D.linea(`M60 ${Y(1, 540)} L1020 ${Y(1, 540)}`, { w: 8, color: P.y, dash: '18 18' }), at('está'), 1.4, { mano: false });

escena(2, at('la', 3) - 0.25);
pinta(DD.calendario(), { x: 200, y: Y(2, 400), s: 1.7, t0: at('llega') - 0.1, dur: 0.6, color: P.p });
texto('SIGLO XVI', { x: 540, y: Y(2, 900), size: 130, color: P.y, t0: at('xvi') - 0.4, dur: 0.6 });
texto('ESTA NOCHE', { x: 540, y: Y(2, 1160), size: 80, t0: at('noche') - 0.1, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.pluma(), { x: 450, y: Y(3, 380), s: 1.3, t0: at('cervantes', 2) - 0.3, dur: 0.6, color: P.y });
pinta(DD.libro(), { x: 40, y: Y(3, 300), s: 1.6, t0: at('publicado') - 0.3, dur: 0.6, color: P.p });
texto('EL QUIJOTE: 1605', { x: 540, y: Y(3, 1160), size: 96, color: P.y, t0: at('quijote') - 0.2, dur: 0.6 });
texto('AÚN NO EXISTÍA', { x: 540, y: Y(3, 520), size: 100, color: P.r, t0: at('todavía') - 0.1, dur: 0.6 });

escena(0, at('mirar') - 0.25, { dur: 0.35 });
sello('ES EL PASADO', at('pasado') - 0.3, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
