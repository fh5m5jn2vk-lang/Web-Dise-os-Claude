// «El Everest no es la montaña más alta del mundo.» Pizarra de tiza. El Everest ya está; la tiza escribe «¿Nº 1?» y lo
// tacha; 8.849 m sobre el nivel del mar; el Mauna Kea con su mitad bajo el agua: +10.000 m desde la base; ¡BUM!: la
// Tierra achatada y el Chimborazo, la cima más cercana al espacio; «depende de cómo lo midas».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo, flecha, tacha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'EL EVEREST <em>NO</em> ES LA MONTAÑA MÁS ALTA', claves: ['everest', 'alta', '8.849', 'mauna', '10.000', 'océano', 'chimborazo', 'espacio', 'achatada'], manga: '#7a2f3b' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.montana(), { x: 160, y: 400, s: 1.75, ya: true });
texto('¿Nº 1?', { x: 830, y: 620, size: 120, color: P.y, t0: 0.1, dur: 0.6 });
D.dibuja(tacha(700, 520, 260, 140).map((d) => D.linea(d, { w: 12, color: P.r })), at('montaña') - 0.1, 0.3, { mano: false });

escena(1, at('es', 2) - 0.25);
D.dibuja(D.linea(`M0 ${Y(1, 1000)} Q270 ${Y(1, 980)} 540 ${Y(1, 1000)} T1080 ${Y(1, 1000)}`, { w: 8, color: P.b }), at('nivel') - 0.3, 0.4);
pinta(DD.montana(), { x: 0, y: Y(1, 340), s: 1.35, t0: at('alta', 2) - 0.2, dur: 0.6 });
texto('8.849 m', { x: 270, y: Y(1, 430), size: 100, color: P.y, t0: at('8.849') - 0.1, dur: 0.5 });
pinta(DD.maunakea(), { x: 520, y: Y(1, 520), s: 1.45, t0: at('mauna') - 0.2, dur: 0.7 });
texto('+10.000 m', { x: 810, y: Y(1, 430), size: 100, color: P.r, t0: at('10.000') - 0.1, dur: 0.5 });
texto('DESDE LA BASE', { x: 810, y: Y(1, 1150), size: 70, color: P.r, t0: at('base') - 0.1, dur: 0.4 });

escena(2, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.tierraAchatada(), { x: 20, y: Y(2, 460), s: 2.5, t0: at('chimborazo') - 0.4, dur: 0.9 });
texto('CHIMBORAZO', { x: 540, y: Y(2, 500), size: 110, color: P.y, t0: at('chimborazo') - 0.1, dur: 0.5 });
texto('LA MÁS CERCA DEL ESPACIO', { x: 540, y: Y(2, 1170), size: 64, t0: at('espacio') - 0.3, dur: 0.6 });
sello('DEPENDE DE CÓMO LO MIDAS', at('depende') - 0.1, { y: 300, rot: -4, clase: 'bl' });
D.salida(B.T.END); B.listo();
