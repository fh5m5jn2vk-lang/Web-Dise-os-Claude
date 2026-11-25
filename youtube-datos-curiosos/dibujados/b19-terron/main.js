// «Toda la humanidad cabría en un terrón de azúcar.» Neón. Un terrón ya encendido y una multitud que corre hacia él;
// el átomo casi vacío; 8.000 millones de personas encogen hasta caber en el terrón; ¡BUM!: una báscula: pesaría unos
// 400 millones de toneladas; «eres casi todo… nada».
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { flecha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'TODA LA HUMANIDAD CABRÍA <em>EN UN TERRÓN DE AZÚCAR</em>', claves: ['humanidad', 'terrón', 'azúcar', 'átomos', 'vacío', 'ocho', 'personas', '400', 'toneladas', 'nada'] });
const { D, P, at, Y, escena, pinta, texto, sello, par, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.terron(), { x: 240, y: 470, s: 1.5, ya: true, color: P.w });
[[60, 900], [170, 960], [800, 900], [900, 960], [60, 640], [900, 640]].forEach(([x, y], i) => pinta(DD.persona(), { x: x - 60, y: y - 80, s: 0.4, t0: 0.05 + i * 0.12, dur: 0.15, color: [P.p, P.y, P.g, P.b, P.o, P.r][i] }));

escena(1, at('los') - 0.25);
pinta(DD.atomo(), { x: 100, y: Y(1, 420), s: 2.2, t0: at('átomos') - 0.2, dur: 0.8 });
texto('CASI TODO VACÍO', { x: 540, y: Y(1, 1150), size: 110, color: P.y, t0: at('vacío') - 0.3, dur: 0.5 });

escena(2, at('si') - 0.25);
const gente = par();
for (let i = 0; i < 12; i++) pinta(DD.persona(), { x: 40 + (i % 6) * 165, y: Y(2, 380 + Math.floor(i / 6) * 260), s: 0.45, t0: at('quitaras') + i * 0.06, dur: 0.12, color: [P.p, P.y, P.g, P.b][i % 4], en: gente });
D.tl.fromTo(gente, { scale: 1 }, { scale: 0.05, svgOrigin: `540 ${Y(2, 720)}`, duration: 0.8, ease: 'power2.in', immediateRender: false }, at('tamaño') - 0.4);
pinta(DD.terron(), { x: 440, y: Y(2, 640), s: 0.5, t0: at('terrón', 2) - 0.3, dur: 0.3, color: P.w });
texto('8.000 MILLONES', { x: 540, y: Y(2, 1150), size: 100, color: P.y, t0: at('ocho') - 0.1, dur: 0.5 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.bascula(), { x: 140, y: Y(3, 380), s: 2.0, t0: at('pesaría') - 0.2, dur: 0.6, color: P.b });
pinta(DD.terron(), { x: 410, y: Y(3, 600), s: 0.65, t0: at('pesaría'), dur: 0.3, color: P.w });
texto('400', { x: 540, y: Y(3, 560), size: 200, color: P.r, t0: at('400') - 0.2, dur: 0.4 });
texto('MILLONES DE TONELADAS', { x: 540, y: Y(3, 1170), size: 70, color: P.y, t0: at('toneladas') - 0.4, dur: 0.6 });

escena(0, at('eres') - 0.25, { dur: 0.35 });
sello('ERES CASI TODO… NADA', at('nada') - 0.5, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
