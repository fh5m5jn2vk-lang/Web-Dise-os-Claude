// «Por cada persona en la Tierra hay 2,5 millones de hormigas.» Cuaderno y boli. Una persona ya dibujada y un ejército de
// hormigas que aparece a su lado; 20.000 billones; una balanza: las hormigas pesan más que aves y mamíferos salvajes;
// ¡BUM!: un T-rex y una hormiga: llevan aquí más de cien millones de años; «el planeta es suyo».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
const B = await arranque({ gancho: 'POR CADA PERSONA HAY <em>2,5 MILLONES</em> DE HORMIGAS', claves: ['persona', '2,5 millones', 'hormigas', '20.000', 'billones', 'aves', 'mamíferos', 'cien', 'dinosaurios', 'suyo'], manga: '#e86b9a' });
const { D, P, at, Y, escena, pinta, texto, sello, par, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.persona(), { x: -10, y: 470, s: 1.15, ya: true });
const hor = [];
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) hor.push([440 + c * 190, 520 + r * 130]);
hor.forEach(([x, y], i) => pinta(DD.hormiga(), { x, y: y - 60, s: 0.42, t0: 0.05 + i * 0.1, dur: 0.12, mano: i % 4 === 0, fdur: 0.12 }));
texto('= 2.500.000', { x: 680, y: 1160, size: 100, color: P.r, t0: at('2,5 millones') - 0.1, dur: 0.6 });

escena(1, at('en', 2) - 0.25);
pinta(DD.hormiga(), { x: 20, y: Y(1, 270), s: 2.4, t0: at('total') - 0.2, dur: 0.8 });
texto('20.000', { x: 540, y: Y(1, 1050), size: 200, color: P.r, t0: at('20.000') - 0.1, dur: 0.5 });
texto('BILLONES', { x: 540, y: Y(1, 1160), size: 110, t0: at('billones') - 0.15, dur: 0.45 });

escena(2, at('juntas') - 0.25);
pinta(DD.balanzaBase(), { x: 140, y: Y(2, 430), s: 1.6, t0: at('juntas') - 0.1, dur: 0.35 });
const brazo = par();
pinta(DD.balanzaBrazo(), { x: 140, y: Y(2, 430), s: 1.6, t0: at('pesan') - 0.2, dur: 0.4, en: brazo });
[[150, 760], [215, 770], [180, 720]].forEach(([x, y], i) => pinta(DD.hormiga(), { x: x - 90, y: Y(2, y - 80), s: 0.35, t0: at('pesan') + i * 0.1, dur: 0.12, mano: false, en: brazo }));
pinta(DD.pajaro(), { x: 590, y: Y(2, 560), s: 0.55, t0: at('aves') - 0.1, dur: 0.35, en: brazo });
pinta(DD.elefante(), { x: 700, y: Y(2, 560), s: 0.5, t0: at('mamíferos') - 0.1, dur: 0.4, en: brazo });
const piv = `${140 + 200 * 1.6} ${Y(2, 430) + 130 * 1.6}`;
D.tl.fromTo(brazo, { rotation: 0 }, { rotation: -8, svgOrigin: piv, duration: 0.5, ease: 'back.out(2)', immediateRender: false }, at('salvajes') - 0.1);
texto('¡PESAN MÁS!', { x: 540, y: Y(2, 1160), size: 110, color: P.r, t0: at('planeta') - 0.2, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.trex(), { x: 120, y: Y(3, 420), s: 1.5, t0: at('llevan'), dur: 0.8 });
pinta(DD.hormiga(), { x: 560, y: Y(3, 820), s: 0.8, t0: at('dinosaurios') - 0.4, dur: 0.4 });
texto('+100 MILLONES', { x: 540, y: Y(3, 520), size: 110, color: P.r, t0: at('cien') - 0.1, dur: 0.5 });
texto('DE AÑOS', { x: 540, y: Y(3, 1160), size: 100, t0: at('años') - 0.1, dur: 0.4 });

escena(0, at('este') - 0.25, { dur: 0.35 });
sello('EL PLANETA ES SUYO', at('suyo') - 0.2, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
