// «Tu cuerpo brilla en la oscuridad. De verdad.» Neón: una persona encendida en la oscuridad con un halo que se dibuja;
// la cara brilla más; mil veces más débil de lo que ven tus ojos; ¡BUM!: una cámara ultrasensible y un reloj a las 16:00:
// brillas más por la tarde; «ahora mismo estás brillando».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { circulo } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'TU CUERPO <em>BRILLA</em> EN LA OSCURIDAD', claves: ['cuerpo', 'brilla', 'oscuridad', 'luz', 'cara', 'mil', 'débil', 'japón', 'cámaras', 'tarde', 'brillando'] });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.busto(), { x: 160, y: 430, s: 1.9, ya: true, color: P.p });
const halo = (y0, k) => [0, 1, 2].map((i) => D.linea(circulo(540, y0, 330 + i * 50, 300 + i * 50, 0.05), { w: 8, color: [P.y, P.p, P.b][i], op: 0.85 - i * 0.2 }));
D.dibuja(halo(820), 0.05, 1.2, { mano: false });

escena(1, at('emite') - 0.25, { s: 1.5, dy: -320 });
pinta(DD.busto(), { x: 160, y: Y(1, 430), s: 1.9, ya: true, color: P.p });
D.dibuja([0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i / 8) * Math.PI * 2; return D.linea(`M${540 + Math.cos(a) * 190} ${Y(1, 740) + Math.sin(a) * 210} L${540 + Math.cos(a) * 250} ${Y(1, 740) + Math.sin(a) * 270}`, { w: 8, color: P.y }); }), at('luz') - 0.1, 0.5, { mano: false });
texto('LA CARA', { x: 540, y: Y(1, 440), size: 110, color: P.y, t0: at('cara') - 0.2, dur: 0.4 });

escena(2, at('pero') - 0.25);
pinta(DD.ojo(), { x: 140, y: Y(2, 330), s: 2.0, t0: at('pero'), dur: 0.6, color: P.b });
texto('× 1.000', { x: 540, y: Y(2, 1000), size: 180, color: P.y, t0: at('mil') - 0.2, dur: 0.5 });
texto('MÁS DÉBIL', { x: 540, y: Y(2, 1160), size: 100, color: P.p, t0: at('débil') - 0.2, dur: 0.4 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.camara(), { x: 20, y: Y(3, 330), s: 1.5, t0: at('cámaras') - 0.3, dur: 0.6, color: P.b });
pinta(DD.reloj(4, 0), { x: 560, y: Y(3, 380), s: 1.15, t0: at('tarde') - 0.6, dur: 0.6, color: P.y });
texto('JAPÓN', { x: 300, y: Y(3, 960), size: 110, color: P.r, t0: at('japón') - 0.1, dur: 0.4 });
texto('16:00', { x: 790, y: Y(3, 960), size: 120, color: P.y, t0: at('tarde') - 0.2, dur: 0.4 });

escena(0, at('así') - 0.25, { dur: 0.35 });
sello('AHORA MISMO ESTÁS BRILLANDO', at('brillando') - 0.4, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
