// «Una jirafa tiene las mismas vértebras en el cuello que tú.» Boceto a lápiz. La jirafa ya está y el lápiz dibuja a una
// persona al lado; 7 vértebras en los dos cuellos; cada una de la jirafa mide unos 25 cm (una regla); ¡BUM!: un corazón
// con un manómetro a tope: una de las tensiones más altas del reino animal; «mismas piezas, otro tamaño».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
const B = await arranque({ gancho: 'UNA JIRAFA TIENE LAS MISMAS VÉRTEBRAS EN EL CUELLO <em>QUE TÚ</em>', claves: ['jirafa', 'vértebras', 'cuello', 'siete', '25', 'centímetros', 'sangre', 'corazón', 'tensiones', 'altas', 'piezas', 'tamaño'], manga: '#5b4636' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.jirafa(), { x: -40, y: 360, s: 1.75, ya: true });
pinta(DD.persona(), { x: 640, y: 560, s: 1.15, t0: 0.05, dur: 0.9 });
texto('=', { x: 640, y: 760, size: 140, color: P.r, t0: at('mismas') - 0.1, dur: 0.3 });

escena(1, at('siete') - 0.25);
pinta(DD.vertebras(), { x: 20, y: Y(1, 420), s: 1.6, t0: at('siete') - 0.1, dur: 0.6 });
pinta(DD.vertebras(), { x: 520, y: Y(1, 420), s: 1.6, t0: at('ni') - 0.1, dur: 0.6 });
texto('7', { x: 540, y: Y(1, 600), size: 260, color: P.r, t0: at('siete'), dur: 0.4 });
texto('TÚ', { x: 340, y: Y(1, 1160), size: 100, t0: at('ni') - 0.1, dur: 0.3 });
texto('JIRAFA', { x: 840, y: Y(1, 1160), size: 100, color: P.o, t0: at('más') - 0.2, dur: 0.4 });

escena(2, at('la') - 0.25);
pinta(DD.regla(), { x: 0, y: Y(2, 380), s: 2.7, t0: at('diferencia') - 0.1, dur: 0.6 });
texto('25 cm', { x: 540, y: Y(2, 1080), size: 200, color: P.r, t0: at('25') - 0.2, dur: 0.5 });
texto('CADA VÉRTEBRA', { x: 540, y: Y(2, 1180), size: 80, t0: at('centímetros') - 0.1, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.corazon(), { x: -20, y: Y(3, 420), s: 1.35, t0: at('corazón') - 0.3, dur: 0.6 });
pinta(DD.manometro(), { x: 520, y: Y(3, 420), s: 1.25, t0: at('tensiones') - 0.4, dur: 0.6 });
texto('TENSIÓN ALTÍSIMA', { x: 540, y: Y(3, 1170), size: 100, color: P.r, t0: at('altas') - 0.3, dur: 0.6 });
texto('SANGRE ARRIBA', { x: 540, y: Y(3, 470), size: 90, color: P.r, t0: at('sangre') - 0.1, dur: 0.5 });

escena(0, at('mismas', 2) - 0.25, { dur: 0.35 });
sello('MISMAS PIEZAS, OTRO TAMAÑO', at('piezas') - 0.2, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
