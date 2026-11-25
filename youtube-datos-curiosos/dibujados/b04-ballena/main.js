// «El corazón de una ballena azul pesa como una moto.» Tinta china y pincel. El corazón ya está; el pincel dibuja una
// moto al lado (=); 180 kilos y metro y medio junto a una persona; la ballena entera, el animal más grande de la
// historia, con un T-rex diminuto; ¡BUM!: el electro casi plano: 2 latidos por minuto.
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo, flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'EL CORAZÓN DE UNA BALLENA AZUL PESA <em>COMO UNA MOTO</em>', claves: ['corazón', 'ballena', 'moto', '180', 'metro', 'grande', 'jamás', 'dinosaurio', 'dos', 'minuto'], manga: '#3b2a1e' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.corazon(), { x: -20, y: 470, s: 1.3, ya: true });
texto('=', { x: 520, y: 820, size: 160, color: P.r, t0: 0.1, dur: 0.3 });
pinta(DD.moto(), { x: 560, y: 470, s: 1.15, t0: 0.4, dur: 1.0 });

escena(1, at('unos') - 0.25);
texto('180 kg', { x: 540, y: Y(1, 520), size: 170, color: P.r, t0: at('180') - 0.15, dur: 0.5 });
pinta(DD.corazon(), { x: 40, y: Y(1, 520), s: 1.25, t0: at('kilos') - 0.1, dur: 0.6 });
pinta(DD.persona(), { x: 620, y: Y(1, 640), s: 1.0, t0: at('metro') - 0.3, dur: 0.6 });
D.dibuja(D.linea(`M600 ${Y(1, 660)} L600 ${Y(1, 1100)} M580 ${Y(1, 660)} L620 ${Y(1, 660)} M580 ${Y(1, 1100)} L620 ${Y(1, 1100)}`, { w: 8, color: P.r }), at('medio') - 0.2, 0.3, { mano: false });
texto('1,5 m', { x: 470, y: Y(1, 1160), size: 100, color: P.r, t0: at('medio') - 0.1, dur: 0.4 });

escena(2, at('es') - 0.25);
pinta(DD.ballena(), { x: 10, y: Y(2, 470), s: 2.0, t0: at('animal') - 0.1, dur: 1.0 });
pinta(DD.trex(), { x: 760, y: Y(2, 860), s: 0.5, t0: at('dinosaurio') - 0.3, dur: 0.4 });
texto('EL MÁS GRANDE', { x: 540, y: Y(2, 500), size: 110, color: P.r, t0: at('jamás') - 0.4, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.ecg(), { x: 20, y: Y(3, 600), s: 2.0, t0: at('latir') - 0.3, dur: 1.3, mano: true });
texto('2', { x: 540, y: Y(3, 600), size: 260, color: P.r, t0: at('dos') - 0.1, dur: 0.4 });
texto('LATIDOS / MINUTO', { x: 540, y: Y(3, 1160), size: 90, t0: at('minuto') - 0.3, dur: 0.5 });
sello('DOS. POR MINUTO.', at('dos', 2) - 0.1, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
