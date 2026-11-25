// «En los caballitos de mar, los que se quedan embarazados son los machos.» Cuaderno y boli. El caballito ya está; el
// boli le pone el símbolo de macho; la hembra deja los huevos en su bolsa; semanas; ¡BUM!: un enjambre de crías (más de
// mil); vuelta al padre con su corona: «padre del año».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LOS CABALLITOS DE MAR <em>MACHO</em> SE QUEDAN EMBARAZADOS', claves: ['caballitos', 'embarazados', 'machos', 'hembra', 'huevos', 'bolsa', 'macho', 'semanas', 'cientos', 'mil', 'padre'], manga: '#e86b9a' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.caballito(), { x: 20, y: 360, s: 1.75, ya: true });
const macho = 'M700 760 m-70 0 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 M750 710 L830 630 M780 630 L830 630 L830 680';
D.dibuja(D.linea(macho, { w: 12, color: P.b }), 0.1, 0.8);
texto('PAPÁ', { x: 760, y: 1000, size: 110, color: P.b, t0: at('machos') - 0.2, dur: 0.45 });

escena(1, at('la') - 0.25);
pinta(DD.caballito(), { x: 20, y: Y(1, 360), s: 1.75, ya: true });
pinta(DD.huevos(), { x: 560, y: Y(1, 480), s: 1.4, t0: at('huevos') - 0.2, dur: 0.4 });
D.dibuja(flecha(720, Y(1, 760), 360, Y(1, 840), 0.25).map((d) => D.linea(d, { w: 10, color: P.r })), at('bolsa') - 0.15, 0.35, { mano: false });
texto('LA BOLSA', { x: 760, y: Y(1, 1060), size: 100, color: P.r, t0: at('tripa') - 0.3, dur: 0.45 });

escena(2, at('él', 2) - 0.25);
pinta(DD.calendario(), { x: 180, y: Y(2, 380), s: 1.8, t0: at('lleva') - 0.1, dur: 0.6 });
texto('SEMANAS', { x: 540, y: Y(2, 1150), size: 130, color: P.r, t0: at('semanas') - 0.2, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
for (let i = 0; i < 15; i++) pinta(DD.caballito(), { x: 20 + (i % 5) * 200, y: Y(3, 380 + Math.floor(i / 5) * 230), s: 0.42, t0: at('luz') - 0.1 + i * 0.09, dur: 0.1, mano: i % 5 === 0, fdur: 0.08 });
texto('+1.000', { x: 540, y: Y(3, 1160), size: 170, color: P.r, t0: at('mil') - 0.2, dur: 0.45 });

escena(0, at('padre') - 0.25, { dur: 0.35 });
pinta(DD.corona(), { x: 150, y: 330, s: 0.9, t0: at('padre') - 0.1, dur: 0.4 });
sello('PADRE DEL AÑO', at('padre') - 0.05, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
