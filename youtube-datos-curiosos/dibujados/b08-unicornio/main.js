// «El animal nacional de Escocia es el unicornio.» Boceto a lápiz, como un grabado heráldico. El unicornio ya está; el
// lápiz dibuja la bandera de Escocia; el escudo con su corona (oficial, desde hace siglos); pureza, fuerza, libertad;
// ¡BUM!: el unicornio encadenado y la corona: solo un rey podía domarlo; «por si acaso».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
const B = await arranque({ gancho: 'EL ANIMAL NACIONAL DE ESCOCIA ES <em>EL UNICORNIO</em>', claves: ['escocia', 'unicornio', 'oficial', 'escudo', 'siglos', 'pureza', 'fuerza', 'libertad', 'encadenado', 'rey', 'cadenas'], manga: '#5b4636' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.unicornio(), { x: 40, y: 400, s: 1.55, ya: true });
pinta(DD.escudo(), { x: 620, y: 560, s: 1.0, t0: 0.05, dur: 1.0 });
texto('ESCOCIA', { x: 820, y: 1060, size: 90, color: P.b, t0: at('escocia') - 0.1, dur: 0.5 });

escena(1, at('es', 2) - 0.25);
pinta(DD.corona(), { x: 300, y: Y(1, 330), s: 1.2, t0: at('oficial') - 0.2, dur: 0.5 });
pinta(DD.escudo(), { x: 220, y: Y(1, 560), s: 1.6, t0: at('escudo') - 0.2, dur: 0.6 });
sello('OFICIAL', at('oficial') - 0.05, { y: 330, t1: T1('siglos') + 0.6, rot: -8 });
function T1(w, n = 1) { return at(w, n); }
texto('DESDE HACE SIGLOS', { x: 540, y: Y(1, 1180), size: 80, t0: at('siglos') - 0.3, dur: 0.6 });

escena(2, at('para') - 0.25);
pinta(DD.unicornio(), { x: 20, y: Y(2, 520), s: 1.0, t0: at('para'), dur: 0.6 });
texto('PUREZA', { x: 760, y: Y(2, 640), size: 100, color: P.b, t0: at('pureza') - 0.1, dur: 0.4 });
texto('FUERZA', { x: 760, y: Y(2, 820), size: 100, color: P.r, t0: at('fuerza') - 0.1, dur: 0.4 });
texto('LIBERTAD', { x: 760, y: Y(2, 1000), size: 100, color: P.g, t0: at('libertad') - 0.15, dur: 0.45 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.unicornio(), { x: 60, y: Y(3, 440), s: 1.55, ya: false, t0: at('escudo', 2) - 0.1, dur: 0.7 });
pinta(DD.cadena(), { x: 200, y: Y(3, 690), s: 1.4, rot: -20, t0: at('encadenado') - 0.2, dur: 0.6 });
pinta(DD.corona(), { x: 640, y: Y(3, 380), s: 0.9, t0: at('rey') - 0.2, dur: 0.4 });
texto('SOLO UN REY PODÍA DOMARLO', { x: 540, y: Y(3, 1170), size: 64, color: P.r, t0: at('rey') - 0.1, dur: 0.7 });

escena(0, at('un', 2) - 0.25, { dur: 0.35 });
pinta(DD.cadena(), { x: 150, y: 660, s: 1.3, rot: -20, t0: at('cadenas') - 0.2, dur: 0.5 });
sello('¡POR SI ACASO!', at('acaso') - 0.3, { y: 300, rot: 5, clase: 'am' });
D.salida(B.T.END); B.listo();
