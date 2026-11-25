// «Las estrellas de mar no tienen cerebro.» Tinta china y pincel. La estrella ya está; un cerebro tachado; ni sangre:
// agua de mar; saca el estómago para comerse una almeja; ¡BUM!: pierde un brazo y le vuelve a crecer; «todo resuelto».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { tacha, flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LAS ESTRELLAS DE MAR <em>NO TIENEN CEREBRO</em>', claves: ['cerebro', 'sangre', 'agua', 'mar', 'estómago', 'fuera', 'presa', 'brazo', 'crecer', 'resuelto'], manga: '#3b2a1e' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.estrellaMar(), { x: 120, y: 400, s: 2.0, ya: true });
pinta(DD.cerebro(), { x: 700, y: 900, s: 0.75, t0: 0.05, dur: 0.6 });
D.dibuja(tacha(720, 940, 300, 230).map((d) => D.linea(d, { w: 14, color: P.r })), at('cerebro') - 0.2, 0.3, { mano: false });

escena(1, at('ni') - 0.25);
pinta(DD.gota('r'), { x: 0, y: Y(1, 420), s: 1.3, t0: at('sangre') - 0.2, dur: 0.4 });
D.dibuja(tacha(140, Y(1, 560), 240, 280).map((d) => D.linea(d, { w: 14, color: P.r })), at('sangre') + 0.25, 0.25, { mano: false });
pinta(DD.gota('b'), { x: 520, y: Y(1, 420), s: 1.3, t0: at('agua') - 0.2, dur: 0.4 });
texto('AGUA DE MAR', { x: 540, y: Y(1, 1150), size: 110, color: P.b, t0: at('mar', 2) - 0.2, dur: 0.5 });

escena(2, at('y') - 0.25);
pinta(DD.almeja(), { x: 300, y: Y(2, 700), s: 1.3, t0: at('comer') - 0.1, dur: 0.5 });
pinta(DD.estrellaMar(), { x: 220, y: Y(2, 300), s: 1.5, t0: at('sacan') - 0.2, dur: 0.6 });
const est = 'M450 980 Q540 900 630 980 Q600 1040 540 1040 Q480 1040 450 980 Z';
pinta({ t: [[est, 1, 'p']], f: [[est, 'p', 0.55]] }, { x: 0, y: Y(2, 0), s: 1, t0: at('estómago') - 0.1, dur: 0.4 });
texto('ESTÓMAGO FUERA', { x: 540, y: Y(2, 1170), size: 96, color: P.r, t0: at('fuera') - 0.1, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.estrellaMar(), { x: 100, y: Y(3, 380), s: 2.1, t0: at('pierden') - 0.1, dur: 0.7 });
D.dibuja(D.linea(`M760 ${Y(3, 840)} L980 ${Y(3, 980)}`, { w: 14, color: P.g, dash: '20 16' }), at('crecer') - 0.3, 0.4);
texto('¡LE VUELVE A CRECER!', { x: 540, y: Y(3, 1170), size: 92, color: P.g, t0: at('vuelve') - 0.1, dur: 0.6 });

escena(0, at('sin') - 0.25, { dur: 0.35 });
sello('Y LO TIENE TODO RESUELTO', at('resuelto') - 0.5, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
