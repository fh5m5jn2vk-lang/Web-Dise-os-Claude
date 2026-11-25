// «Tu gato no puede saborear el azúcar.» Cuaderno y boli. El gato ya está; un terrón de azúcar tachado; el ADN roto
// (sin sensor del dulce); solo come carne; ¡BUM!: un perro y una galleta: ellos sí lo notan; vuelta al gato con una
// mantequilla: «va a por la mantequilla».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
const B = await arranque({ gancho: 'TU GATO <em>NO PUEDE SABOREAR</em> EL AZÚCAR', claves: ['gato', 'azúcar', 'dulce', 'gen', 'roto', 'carne', 'perros', 'galletas', 'mantequilla'], manga: '#e86b9a' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.gato(), { x: -20, y: 380, s: 1.6, ya: true });
pinta(DD.terron(), { x: 560, y: 520, s: 1.25, t0: 0.05, dur: 0.8 });
D.dibuja(D.linea('M640 620 L960 940 M960 620 L640 940', { w: 14, color: P.r }), at('azúcar') - 0.1, 0.3, { mano: false });

escena(1, at('le') - 0.25);
pinta(DD.adnRoto(), { x: 20, y: Y(1, 420), s: 2.6, t0: at('sensor') - 0.2, dur: 0.9 });
texto('SIN SABOR DULCE', { x: 540, y: Y(1, 520), size: 96, color: P.r, t0: at('dulce') - 0.1, dur: 0.6 });
texto('GEN ROTO', { x: 540, y: Y(1, 1150), size: 130, color: P.r, t0: at('roto') - 0.2, dur: 0.45 });

escena(2, at('como') - 0.25);
const filete = { t: [['M110 260 Q90 160 220 148 Q340 146 330 240 Q310 330 200 330 Q120 324 110 260 Z'], ['M150 240 Q210 200 280 236', 0.5], ['M300 160 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', 0.9]], f: [['M110 260 Q90 160 220 148 Q340 146 330 240 Q310 330 200 330 Q120 324 110 260 Z', 'r', 0.55]] };
pinta(DD.gato(), { x: -10, y: Y(2, 480), s: 1.1, t0: at('como'), dur: 0.5 });
pinta(filete, { x: 500, y: Y(2, 480), s: 1.3, t0: at('carne') - 0.2, dur: 0.5 });
texto('SOLO CARNE', { x: 540, y: Y(2, 1160), size: 110, t0: at('carne') + 0.1, dur: 0.45 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.perro(), { x: 20, y: Y(3, 430), s: 1.6, t0: at('perros') - 0.1, dur: 0.7 });
pinta(DD.galleta(), { x: 620, y: Y(3, 620), s: 0.95, t0: at('galletas') - 0.3, dur: 0.4 });
texto('¡ELLOS SÍ!', { x: 540, y: Y(3, 1160), size: 120, color: P.g, t0: at('notan') - 0.1, dur: 0.45 });

escena(0, at('si', 2) - 0.25, { dur: 0.35 });
pinta(DD.mantequilla(), { x: 580, y: 760, s: 1.0, t0: at('mantequilla') - 0.4, dur: 0.4 });
sello('VA A POR LA MANTEQUILLA', at('mantequilla') - 0.1, { y: 300, rot: 4, clase: 'am' });
D.salida(B.T.END); B.listo();
