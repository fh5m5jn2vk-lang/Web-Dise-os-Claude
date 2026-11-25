// «Una nube normal pesa unos 500.000 kilos.» Pizarra blanca y rotulador. La nube ya está; 500.000 kg; una manada de
// elefantes (×100); la nube no se cae; ¡BUM!: gotitas diminutas y el aire seco de abajo que pesa más; vuelta a la nube
// con un elefante dentro: «cuenta elefantes».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha, tacha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'UNA NUBE NORMAL PESA <em>500.000 KILOS</em>', claves: ['nube', '500.000', 'kilos', 'cien', 'elefantes', 'cae', 'gotitas', 'aire', 'seco'], manga: '#2a4d8f' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.nube(), { x: 40, y: 380, s: 2.5, ya: true });
texto('500.000 kg', { x: 540, y: 1150, size: 140, color: P.r, t0: 0.05, dur: 0.9, mano: true });

escena(1, at('lo') - 0.25);
for (let i = 0; i < 9; i++) pinta(DD.elefante(), { x: 20 + (i % 3) * 340, y: Y(1, 380 + Math.floor(i / 3) * 230), s: 0.75, t0: at('lo') + i * 0.09, dur: 0.12, mano: i % 3 === 0, fdur: 0.1 });
texto('× 100', { x: 540, y: Y(1, 1160), size: 150, color: P.r, t0: at('cien') - 0.1, dur: 0.4 });

escena(2, at('y') - 0.25);
pinta(DD.nube(), { x: 140, y: Y(2, 330), s: 2.0, t0: at('aun') - 0.1, dur: 0.5 });
D.dibuja(flecha(540, Y(2, 760), 540, Y(2, 1020), 0).map((d) => D.linea(d, { w: 12 })), at('así') - 0.1, 0.3);
D.dibuja(D.linea(`M440 ${Y(2, 830)} L640 ${Y(2, 970)} M640 ${Y(2, 830)} L440 ${Y(2, 970)}`, { w: 14, color: P.r }), at('cae') - 0.15, 0.3, { mano: false });
texto('¡NO SE CAE!', { x: 540, y: Y(2, 1160), size: 120, color: P.r, t0: at('cae') - 0.05, dur: 0.45 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.gotitas(), { x: 40, y: Y(3, 300), s: 2.4, t0: at('gotitas') - 0.2, dur: 0.6 });
[220, 540, 860].forEach((x, i) => D.dibuja(flecha(x, Y(3, 1100), x, Y(3, 900), 0).map((d) => D.linea(d, { w: 10, color: P.b })), at('aire') - 0.1 + i * 0.12, 0.25, { mano: i === 0 }));
texto('AIRE SECO', { x: 540, y: Y(3, 1160), size: 110, color: P.b, t0: at('seco') - 0.2, dur: 0.45 });
texto('¡PESA MÁS!', { x: 540, y: Y(3, 520), size: 110, color: P.r, t0: at('pesa', 2) - 0.1, dur: 0.5 });

escena(0, at('la') - 0.25, { dur: 0.35 });
pinta(DD.elefante(), { x: 360, y: 600, s: 0.85, t0: at('elefantes', 2) - 0.5, dur: 0.5 });
sello('CUENTA ELEFANTES', at('cuenta') - 0.1, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
