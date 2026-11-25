// «¡El plátano es una baya… y la fresa no!» Cuaderno y boli. Plátano pintado y fresa a medio dibujar en el primer
// fotograma; un plátano cortado enseña las semillas dentro; la fresa, de cerca, las lleva por fuera (NO ES BAYA);
// ¡BUM!: sandía, calabaza y pepino también son bayas; vuelve a la fresa, «fuera del club».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo, flecha } from '../kit/garabatos.js';

const B = await arranque({ gancho: 'EL PLÁTANO ES UNA <em>BAYA</em>… Y LA FRESA <em>NO</em>', claves: ['plátano', 'baya', 'fresa', 'semillas', 'dentro', 'fuera', 'sandía', 'calabaza', 'pepino', 'bayas', 'club'], manga: '#e86b9a' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;

// escena 0: el plátano ya está; la fresa se dibuja
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.platano(), { x: 10, y: 470, s: 1.45, ya: true });
pinta(DD.fresa(), { x: 540, y: 470, s: 1.38, t0: 0.02, dur: 1.1 });
texto('BAYA', { x: 260, y: 1150, size: 110, color: P.g, t0: at('baya') - 0.1, dur: 0.45 });
texto('¿BAYA?', { x: 815, y: 1150, size: 110, color: P.r, t0: at('fresa') - 0.05, dur: 0.45 });
D.dibuja(D.linea('M670 560 L960 960 M960 560 L670 960', { w: 14, color: P.r }), at('no') - 0.05, 0.3, { mano: false });

// «una baya es un fruto carnoso con las semillas dentro»: un plátano cortado
escena(1, T0('para') - 0.25);
function T0(w, n = 1) { return at(w, n); }
pinta(DD.platanoCorte(), { x: 160, y: Y(1, 390), s: 1.9, t0: at('fruto') - 0.2, dur: 0.9 });
texto('FRUTO CARNOSO', { x: 540, y: Y(1, 500), size: 96, t0: at('carnoso') - 0.1, dur: 0.55 });
D.dibuja(D.linea(circulo(540, Y(1, 770), 110, 110), { w: 8, color: P.r }), at('semillas') - 0.05, 0.35);
texto('SEMILLAS DENTRO', { x: 540, y: Y(1, 1150), size: 92, color: P.r, t0: at('dentro') - 0.25, dur: 0.5 });

// «El plátano cumple. La fresa lleva sus semillas por fuera, así que no cuenta.»
escena(0, at('el', 2) - 0.25);
pinta({ t: [['M0 50 L40 90 L110 0', 2.2, 'g']], f: [] }, { x: 330, y: 600, s: 1.4, t0: at('cumple') - 0.1, dur: 0.3 });
escena(0, at('fresa', 2) - 0.2, { s: 1.3, x: 780, dy: -200 });
D.dibuja(D.linea(circulo(815, 760, 200, 230), { w: 9, color: P.r }), at('semillas', 2) - 0.05, 0.4);
texto('POR FUERA', { x: 790, y: 545, size: 84, color: P.r, t0: at('fuera') - 0.15, dur: 0.4 });
sello('NO ES BAYA', at('cuenta') - 0.1, { y: 300, t1: tBum - 0.05, rot: -6 });

// ¡BUM! sandía, calabaza y pepino también son bayas
escena(2, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.sandia(), { x: 10, y: Y(2, 400), s: 1.25, t0: at('sandía') - 0.15, dur: 0.55 });
pinta(DD.calabaza(), { x: 560, y: Y(2, 330), s: 1.15, t0: at('calabaza') - 0.15, dur: 0.55 });
pinta(DD.pepino(), { x: 260, y: Y(2, 650), s: 1.35, t0: at('pepino') - 0.2, dur: 0.5 });
texto('¡TAMBIÉN BAYAS!', { x: 540, y: Y(2, 1160), size: 112, color: P.g, t0: at('también') - 0.05, dur: 0.6 });

// «La fresa, en cambio, se queda fuera del club.»
escena(0, at('fresa', 3) - 0.25, { dur: 0.35 });
sello('FUERA DEL CLUB', at('fuera', 2) - 0.1, { y: 300, rot: 5, clase: 'bl' });
D.salida(B.T.END);
B.listo();
