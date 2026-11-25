// «La mitad de las células de tu cuerpo no son tuyas.» Pizarra blanca y rotulador. Una persona ya dibujada; el rotulador
// la parte en dos y la mitad se llena de bacterias; 30 billones de células frente a 38 billones de bacterias; ¡BUM!:
// una balanza casi igualada que cambia de lado cuando vas al baño; vuelta a la persona: «MITAD BACTERIA».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LA MITAD DE TUS CÉLULAS <em>NO SON TUYAS</em>', claves: ['mitad', 'tuyas', '30', '38', 'bacterias', 'intestino', 'baño', 'balanza', 'bacteria'], manga: '#2a4d8f' });
const { D, P, at, Y, escena, pinta, texto, sello, par, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.persona(), { x: 280, y: 440, s: 1.3, ya: true, relleno: false });
D.dibuja(D.linea('M540 480 L540 1080', { w: 10, color: P.r, dash: '22 16' }), 0.05, 0.6);
[[600, 640], [640, 760], [590, 880], [650, 980], [610, 560]].forEach(([x, y], i) => pinta(DD.bacteria(), { x, y, s: 0.22, t0: at('tuyas') - 0.6 + i * 0.12, dur: 0.15, mano: false }));
texto('TUYAS', { x: 330, y: 1150, size: 90, color: P.b, t0: at('mitad') - 0.05, dur: 0.4 });
texto('NO TUYAS', { x: 790, y: 1150, size: 90, color: P.g, t0: at('tuyas') - 0.2, dur: 0.45 });

escena(1, at('tienes') - 0.25);
pinta(DD.celula(), { x: -10, y: Y(1, 520), s: 1.35, t0: at('tienes'), dur: 0.5 });
texto('30', { x: 280, y: Y(1, 1100), size: 200, color: P.b, t0: at('30') - 0.1, dur: 0.4 });
texto('HUMANAS', { x: 280, y: Y(1, 1180), size: 70, t0: at('humanas') - 0.2, dur: 0.4 });
pinta(DD.bacteria(), { x: 560, y: Y(1, 560), s: 1.15, t0: at('bacterias') - 0.3, dur: 0.5 });
texto('38', { x: 800, y: Y(1, 1100), size: 200, color: P.g, t0: at('38') - 0.1, dur: 0.4 });
texto('BACTERIAS', { x: 800, y: Y(1, 1180), size: 70, t0: at('intestino') - 0.3, dur: 0.4 });
texto('BILLONES', { x: 540, y: Y(1, 500), size: 110, t0: at('billones') - 0.1, dur: 0.5 });

escena(2, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.balanzaBase(), { x: 140, y: Y(2, 470), s: 1.6, t0: at('igualadas') - 0.3, dur: 0.4 });
const brazo = par();
pinta(DD.balanzaBrazo(), { x: 140, y: Y(2, 470), s: 1.6, t0: at('igualadas'), dur: 0.5, en: brazo });
const piv = `${140 + 200 * 1.6} ${Y(2, 470) + 130 * 1.6}`;
D.tl.fromTo(brazo, { rotation: 0 }, { rotation: 6, svgOrigin: piv, duration: 0.4, ease: 'back.out(2)', immediateRender: false }, at('igualadas') + 0.6);
D.tl.to(brazo, { rotation: -6, svgOrigin: piv, duration: 0.5, ease: 'back.out(2)' }, at('cambiar') - 0.1);
pinta(DD.vater(), { x: 380, y: Y(2, 820), s: 0.8, t0: at('baño') - 0.2, dur: 0.5 });
texto('TÚ', { x: 245, y: Y(2, 1180), size: 90, color: P.b, t0: at('balanza') - 0.1, dur: 0.3 });
texto('ELLAS', { x: 835, y: Y(2, 1180), size: 90, color: P.g, t0: at('balanza'), dur: 0.35 });

escena(0, at('así') - 0.25, { dur: 0.35 });
sello('MITAD BACTERIA', at('mitad', 2) - 0.1, { y: 300, rot: -5, clase: 'am' });
D.salida(B.T.END); B.listo();
