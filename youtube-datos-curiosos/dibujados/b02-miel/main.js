// «La miel no caduca. Nunca.» Boceto a lápiz. El tarro ya está; el lápiz le dibuja un ∞; una pirámide con miel dentro
// (miles de años, bien conservada); una bacteria tachada (poca agua, ácida); ¡BUM!: una abeja y una cucharita con una
// gota diminuta: 1/12 de cucharadita en toda su vida; vuelve al tarro: «no la desperdicies».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo, flecha, tacha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LA MIEL <em>NO CADUCA</em>. NUNCA.', claves: ['miel', 'nunca', 'egipcias', 'miles', 'conservada', 'agua', 'ácida', 'bacterias', 'abeja', 'doceava', 'cucharadita'], manga: '#6b5a48' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.tarro(), { x: 200, y: 380, s: 1.7, ya: true });
const inf = 'M430 860 C430 800 520 800 540 860 C560 920 650 920 650 860 C650 800 560 800 540 860 C520 920 430 920 430 860 Z';
D.dibuja(D.linea(inf, { w: 12, color: P.r }), 0.05, 0.9);
texto('SIN FECHA', { x: 540, y: 1150, size: 100, color: P.r, t0: at('nunca') - 0.2, dur: 0.5 });

escena(1, at('en') - 0.25);
pinta(DD.piramide(), { x: 80, y: Y(1, 470), s: 1.75, t0: at('tumbas') - 0.1, dur: 0.8 });
pinta(DD.tarro(), { x: 450, y: Y(1, 760), s: 0.45, t0: at('miel', 2) - 0.1, dur: 0.4 });
texto('MILES DE AÑOS', { x: 540, y: Y(1, 470), size: 100, t0: at('miles') - 0.1, dur: 0.6 });
texto('¡Y SEGUÍA BIEN!', { x: 540, y: Y(1, 1160), size: 100, color: P.g, t0: at('conservada') - 0.3, dur: 0.6 });

escena(2, at('tiene') - 0.25);
pinta(DD.bacteria(), { x: 140, y: Y(2, 560), s: 2.0, t0: at('bacterias') - 0.4, dur: 0.6 });
texto('POCA AGUA', { x: 300, y: Y(2, 500), size: 90, color: P.b, t0: at('agua') - 0.1, dur: 0.45 });
texto('ÁCIDA', { x: 820, y: 500 + 1700 * 2, size: 90, color: P.o, t0: at('ácida') - 0.1, dur: 0.4 });
D.dibuja(tacha(240, Y(2, 820), 600, 300).map((d) => D.linea(d, { w: 16, color: P.r })), at('vivir') - 0.1, 0.35, { mano: false });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.abeja(), { x: 40, y: Y(3, 380), s: 1.3, t0: at('abeja') - 0.1, dur: 0.6 });
pinta(DD.cuchara(), { x: 380, y: Y(3, 700), s: 1.6, t0: at('fabrica') - 0.1, dur: 0.5 });
D.dibuja(D.linea(circulo(580, Y(3, 1022), 70, 60), { w: 9, color: P.r }), at('doceava') - 0.05, 0.3, { mano: false });
texto('1/12', { x: 830, y: Y(3, 560), size: 200, color: P.r, t0: at('doceava') - 0.1, dur: 0.5 });
texto('DE CUCHARADITA', { x: 540, y: Y(3, 1160), size: 90, t0: at('cucharadita') - 0.2, dur: 0.5 });

escena(0, at('así') - 0.25, { dur: 0.35 });
sello('NO LA DESPERDICIES', at('desperdicies') - 0.4, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
