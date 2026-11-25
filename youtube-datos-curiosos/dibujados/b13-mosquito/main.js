// «El animal más mortal del mundo cabe en la punta de tu dedo.» Neón. Un dedo ya encendido y un mosquito que aparece en
// la punta; ni el tiburón ni la serpiente (tachados): el mosquito; malaria, cientos de miles de muertes al año; ¡BUM!:
// solo pican las hembras, por sus huevos; los machos solo beben néctar.
import { arranque } from '../kit/bomba.js';
import * as DD from '../kit/doodles.js';
import { tacha } from '../kit/garabatos.js';
const B = await arranque({ gancho: 'EL ANIMAL MÁS MORTAL <em>CABE EN TU DEDO</em>', claves: ['mortal', 'dedo', 'tiburón', 'serpiente', 'mosquito', 'malaria', 'miles', 'hembras', 'sangre', 'machos', 'néctar'] });
const { D, P, at, Y, escena, pinta, texto, sello, tBum } = B;
D.camaraYa({ x: 540, y: 960, s: 1 });
pinta(DD.dedo(), { x: 220, y: 560, s: 1.6, ya: true, color: P.p });
pinta(DD.mosquito(), { x: 330, y: 380, s: 1.2, t0: 0.05, dur: 0.8 });

escena(1, at('no') - 0.25);
pinta(DD.tiburon(), { x: 60, y: Y(1, 330), s: 0.95, t0: at('tiburón') - 0.2, dur: 0.4, color: P.b });
D.dibuja(tacha(80, Y(1, 470), 420, 180).map((d) => D.linea(d, { w: 12, color: P.r })), at('tiburón') + 0.2, 0.25, { mano: false });
pinta(DD.serpiente(), { x: 560, y: Y(1, 300), s: 1.1, t0: at('serpiente') - 0.2, dur: 0.4 });
D.dibuja(tacha(600, Y(1, 470), 420, 180).map((d) => D.linea(d, { w: 12, color: P.r })), at('serpiente') + 0.2, 0.25, { mano: false });
pinta(DD.mosquito(), { x: 220, y: Y(1, 620), s: 1.6, t0: at('mosquito') - 0.2, dur: 0.6, color: P.y });

escena(2, at('las') - 0.25);
texto('ENFERMEDADES', { x: 540, y: Y(2, 430), size: 100, color: P.b, t0: at('enfermedades') - 0.1, dur: 0.5 });
texto('MALARIA', { x: 540, y: Y(2, 600), size: 170, color: P.r, t0: at('malaria') - 0.2, dur: 0.5 });
texto('CIENTOS DE MILES', { x: 540, y: Y(2, 820), size: 100, color: P.y, t0: at('cientos') - 0.1, dur: 0.6 });
texto('DE MUERTES AL AÑO', { x: 540, y: Y(2, 960), size: 80, t0: at('personas') - 0.1, dur: 0.6 });

escena(3, tBum + 0.05, { dur: 0.3, sonar: false });
pinta(DD.mosquito(), { x: 40, y: Y(3, 360), s: 1.9, t0: at('pican') - 0.1, dur: 0.6, color: P.p });
pinta(DD.gota('r'), { x: 660, y: Y(3, 380), s: 0.9, t0: at('sangre') - 0.2, dur: 0.35, color: P.r });
pinta(DD.huevos(), { x: 560, y: Y(3, 720), s: 1.2, t0: at('huevos') - 0.2, dur: 0.35, color: P.o });
texto('SOLO LAS HEMBRAS', { x: 540, y: Y(3, 1170), size: 92, color: P.p, t0: at('hembras') - 0.2, dur: 0.6 });

escena(4, at('los') - 0.25);
pinta(DD.flor(), { x: 200, y: Y(4, 400), s: 1.6, t0: at('machos') - 0.1, dur: 0.6 });
sello('LOS MACHOS: NÉCTAR', at('néctar') - 0.4, { y: 300, rot: -4, clase: 'am' });
D.salida(B.T.END); B.listo();
