// «Te han mentido: la Gran Muralla china no se ve desde el espacio.» Pizarra de tiza. La muralla ya está; la estación
// espacial la mira y se tacha; mide unos metros de ancho y es del color del terreno; ni los astronautas la ven; ¡BUM!:
// los invernaderos de Almería, una mancha blanca enorme; «Almería 1 · China 0».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha, tacha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'LA GRAN MURALLA <em>NO SE VE</em> DESDE EL ESPACIO', claves: ['mentido', 'muralla', 'espacio', 'metros', 'color', 'astronautas', 'estación', 'blanca', 'invernaderos', 'almería'], manga: '#7a2f3b' });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.muralla(), { x: 80, y: 300, s: 2.3, ya: true });
pinta(DD.estacion(), { x: 650, y: 470, s: 0.9, t0: 0.05, dur: 0.6 });
D.dibuja(D.linea('M800 640 L520 900', { w: 8, dash: '18 16', color: P.y }), at('muralla') - 0.2, 0.5, { mano: false });
D.dibuja(tacha(560, 700, 180, 150).map((d) => D.linea(d, { w: 14, color: P.r })), at('espacio') - 0.15, 0.3, { mano: false });

escena(1, at('es') - 0.25, { s: 1.55, dy: -40 });
D.dibuja(D.linea(`M520 ${Y(1, 820)} L520 ${Y(1, 960)} M500 ${Y(1, 820)} L540 ${Y(1, 820)} M500 ${Y(1, 960)} L540 ${Y(1, 960)}`, { w: 8, color: P.y }), at('metros') - 0.2, 0.3);
pinta(DD.muralla(), { x: 80, y: Y(1, 300), s: 2.3, ya: true });
texto('UNOS METROS', { x: 540, y: Y(1, 720), size: 70, color: P.y, t0: at('ancho') - 0.2, dur: 0.4 });
texto('MISMO COLOR', { x: 540, y: Y(1, 1060), size: 70, color: P.o, t0: at('color') - 0.1, dur: 0.4 });

escena(2, at('ni') - 0.25);
pinta(DD.estacion(), { x: 140, y: Y(2, 330), s: 2.0, t0: at('astronautas') - 0.3, dur: 0.6 });
pinta(DD.ojo(), { x: 300, y: Y(2, 700), s: 1.2, t0: at('distinguen') - 0.3, dur: 0.4 });
D.dibuja(tacha(360, Y(2, 830), 360, 200).map((d) => D.linea(d, { w: 14, color: P.r })), at('vista') - 0.1, 0.3, { mano: false });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.invernaderos(), { x: 80, y: Y(3, 300), s: 2.3, t0: at('mancha') - 0.2, dur: 0.9 });
texto('ALMERÍA', { x: 540, y: Y(3, 520), size: 130, color: P.y, t0: at('almería') - 0.2, dur: 0.5 });
texto('¡ESTO SÍ SE VE!', { x: 540, y: Y(3, 1170), size: 100, color: P.g, t0: at('blanca') - 0.1, dur: 0.5 });
sello('ALMERÍA 1 · CHINA 0', at('uno') - 0.2, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
