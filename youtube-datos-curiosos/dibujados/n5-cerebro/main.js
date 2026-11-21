// «Tu cerebro pesa un 2 % de tu cuerpo… y se come el 20 % de tu energía.» Boceto a lápiz, como un cuaderno de inventor:
// el cerebro ya está dibujado y sombreado en el primer fotograma; el lápiz escribe «2 %», dibuja un quesito con su
// porción del 20 % en rojo; abajo, una bombilla de 20 W que brilla; una luna y «Zzz» (no se apaga ni durmiendo); dos
// barras casi iguales (descansando y pensando) y el remate: «ESTUDIAR ≠ ADELGAZAR».
import { tiempos, capas, sonido } from '../kit/capas.js';
import { pizarra, fuente } from '../kit/dibujo.js';
import { flecha, circulo, subrayado, tacha } from '../kit/garabatos.js';

const T = await tiempos();
await Promise.all([fuente('cv', '../fonts/caveat.ttf'), fuente('ka', '../fonts/kalam-bold.ttf')]);
const DUR = T.G.dur;
const D = pizarra('boceto', { manga: '#5b4636' });
const { el, linea, dibuja, ya, salida, escribe, colorea, camara, camaraYa, tl } = D;
const RED = '#b8322a', SEP = '#3a332b', YEL = '#e8b62c', A = sonido();
const at = (w, n) => T.at(w, n);

// el cerebro de perfil, con sus surcos y sombreado a rayas
const BT = 'translate(540 660) scale(1.18) translate(-580 -620)';
const bg = D.capa(el('g', { transform: BT }, D.art)), bb = el('g', { transform: BT }, D.bajo);
const contorno = 'M300 640 C290 520 380 440 500 450 C560 400 680 410 730 470 C820 480 860 560 830 640 C860 700 810 770 740 770 C700 820 600 820 560 790 C520 820 430 820 400 780 C330 790 290 720 300 640 Z';
const surcos = ['M360 600 C400 560 440 620 480 580', 'M420 700 C460 660 520 720 560 680', 'M520 520 C560 560 600 500 640 540', 'M600 640 C640 600 700 660 740 620', 'M480 480 C470 540 520 560 510 620', 'M650 470 C640 520 690 560 680 600', 'M380 660 C420 640 450 680 480 650', 'M560 600 C590 640 560 700 600 730', 'M700 700 C730 680 770 720 800 690'];
const cerebro = [linea(contorno, { g: bg, w: 5 }), ...surcos.map((d) => linea(d, { g: bg, w: 3.5 })), linea('M700 772 C740 836 822 826 822 762', { g: bg, w: 4.5 }), linea('M650 800 C662 862 652 902 642 950', { g: bg, w: 5 }), linea('M680 800 C690 860 680 900 676 950', { g: bg, w: 5 })];
ya(cerebro);
const sombra = colorea('M320 680 C330 760 420 790 520 790 C620 800 720 790 800 720 C760 770 640 820 520 810 C420 820 340 780 320 680 Z', { color: SEP, t0: 0, dur: 0.01, g: bb, op: 0.35, paso: 9, ancho: 3, mano: false });
ya(sombra);
const rosa = colorea(contorno, { color: '#e9a3a0', t0: 0, dur: 0.01, g: bb, op: 0.35, paso: 14, mano: false }); ya(rosa);
camaraYa({ x: 540, y: 880, s: 1.02, r: -0.6 });
// notas al margen ya escritas, como un cuaderno de inventor
const n0 = escribe('TU CEREBRO', { x: 540, y: 300, size: 130, font: 'ka', t0: 0, dur: 0.01, align: 'center', mano: false }); ya([...n0.g.querySelectorAll('path')]);
const n1 = escribe('fig. 1', { x: 830, y: 430, size: 56, font: 'cv', t0: 0, dur: 0.01, mano: false }); ya([...n1.g.querySelectorAll('path')]);
// «pesa un 2 % de tu cuerpo»
const t2 = at('2');
escribe('2 %', { x: 120, y: 1090, size: 170, font: 'ka', t0: t2 - 0.1, dur: 0.6, align: 'left' });
dibuja(flecha(170, 980, 320, 880, 0.3).map((d) => linea(d, { w: 5 })), t2 + 0.5, 0.3);
escribe('del peso', { x: 130, y: 1170, size: 66, font: 'cv', t0: t2 + 0.55, dur: 0.4, mano: false });
// «se come el 20 % de tu energía»: un quesito
const t20 = at('20');
const PX = 830, PY = 1060, PR = 115;
dibuja(linea(circulo(PX, PY, PR, PR, 0.05), { w: 5 }), at('come') - 0.15, 0.45);
const porcion = `M${PX} ${PY} L${PX} ${PY - PR} A${PR} ${PR} 0 0 1 ${(PX + PR * Math.sin(1.2566)).toFixed(1)} ${(PY - PR * Math.cos(1.2566)).toFixed(1)} Z`;
dibuja(linea(porcion, { w: 5, color: RED }), t20 - 0.15, 0.3);
colorea(porcion, { color: RED, t0: t20 + 0.15, dur: 0.35, op: 0.6, paso: 9 });
escribe('20 %', { x: PX - 20, y: PY + 230, size: 150, font: 'ka', color: RED, t0: t20 + 0.45, dur: 0.5, align: 'center', mano: false });
escribe('de la energía', { x: PX - 20, y: PY + 300, size: 60, font: 'cv', color: RED, t0: at('energía') - 0.05, dur: 0.4, align: 'center', mano: false });
A.fx(t20 + 0.45, 'pop', 0.2);

// «Funciona con unos 20 vatios: como una bombilla tenue»
const tF = at('funciona') - 0.25;
camara(tF, 0.6, { x: 540, y: 1880, s: 1.0, r: 0.5 }, 'power2.inOut'); A.fx(tF, 'whoosh', 0.14);
const ug = D.capa(el('g', {}, D.art)), ub = el('g', {}, D.bajo);
const bulbo = 'M540 1640 C460 1640 420 1710 440 1780 C455 1830 490 1850 495 1890 L585 1890 C590 1850 625 1830 640 1780 C660 1710 620 1640 540 1640 Z';
dibuja([linea(bulbo, { g: ug, w: 5 }), linea('M498 1910 L582 1910 M500 1932 L580 1932 M508 1954 L572 1954', { g: ug, w: 5 }), linea('M520 1975 Q540 1990 560 1975', { g: ug, w: 5 }), linea('M510 1840 L525 1770 L540 1840 L555 1770 L570 1840', { g: ug, w: 3.5 })], at('vatios') - 0.6, 0.8);
escribe('20 W', { x: 800, y: 1800, size: 150, font: 'ka', t0: at('vatios') - 0.15, dur: 0.5, align: 'center' });
const halo = colorea('M540 1770 m-190 0 a190 190 0 1 0 380 0 a190 190 0 1 0 -380 0', { color: YEL, t0: at('bombilla'), dur: 0.5, g: ub, op: 0.4, paso: 16, mano: false });
const rayos = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return linea(`M${540 + Math.cos(a) * 160} ${1760 + Math.sin(a) * 160} L${540 + Math.cos(a) * 215} ${1760 + Math.sin(a) * 215}`, { g: ug, w: 5, color: YEL }); });
dibuja(rayos, at('tenue') - 0.1, 0.35, { mano: false });
A.fx(at('bombilla'), 'shimmer', 0.18);

// «Y no se apaga nunca, ni cuando duermes»: una luna y Zzz; la bombilla sigue encendida
const lg = D.capa(el('g', {}, D.art));
dibuja([linea('M230 1560 A90 90 0 1 0 300 1720 A70 70 0 1 1 230 1560 Z', { g: lg, w: 5 })], at('apaga') - 0.1, 0.4);
escribe('Zzz', { x: 300, y: 1530, size: 90, font: 'cv', t0: at('duermes') - 0.15, dur: 0.4, mano: false });
escribe('24 h', { x: 820, y: 1990, size: 110, font: 'ka', color: RED, t0: at('nunca') - 0.05, dur: 0.45, align: 'center' });
dibuja(linea(circulo(820, 1955, 120, 70), { w: 5, color: RED }), at('nunca') + 0.4, 0.3, { mano: false });

// «Lo malo: pensar mucho apenas gasta más»: dos barras casi iguales
const tP = at('malo') - 0.2;
camara(tP, 0.6, { x: 540, y: 2780, s: 1.0, r: -0.5 }, 'power2.inOut'); A.fx(tP, 'whoosh', 0.14);
const BY = 3000;
const bar = (x, h) => `M${x - 90} ${BY} L${x - 90} ${BY - h} L${x + 90} ${BY - h} L${x + 90} ${BY}`;
dibuja(linea(`M180 ${BY} L900 ${BY}`, { w: 5 }), tP + 0.25, 0.25);
dibuja(linea(bar(380, 330), { w: 5 }), at('pensar') - 0.1, 0.35);
colorea(`${bar(380, 330)} Z`, { color: SEP, t0: at('pensar') + 0.25, dur: 0.3, op: 0.3, paso: 10, ancho: 4, mano: false });
dibuja(linea(bar(700, 350), { w: 5, color: RED }), at('mucho') + 0.05, 0.35);
colorea(`${bar(700, 350)} Z`, { color: RED, t0: at('apenas') - 0.1, dur: 0.3, op: 0.4, paso: 10, ancho: 4, mano: false });
escribe('descansando', { x: 380, y: BY + 80, size: 64, font: 'cv', t0: at('pensar') + 0.2, dur: 0.5, align: 'center', mano: false });
escribe('pensando', { x: 700, y: BY + 80, size: 64, font: 'cv', color: RED, t0: at('apenas') - 0.05, dur: 0.4, align: 'center', mano: false });
escribe('¡casi igual!', { x: 540, y: BY - 450, size: 100, font: 'ka', t0: at('gasta') - 0.05, dur: 0.5, align: 'center' });

// «Así que estudiar no adelgaza. Lo siento.»
const tA = at('así') - 0.2;
camara(tA, 0.55, { x: 540, y: 3620, s: 1.0, r: 0.6 }, 'power2.inOut'); A.fx(tA, 'whoosh', 0.14);
const kg = D.capa(el('g', {}, D.art));
// un libro abierto y una báscula
dibuja([linea('M220 3640 Q300 3600 380 3640 L380 3780 Q300 3740 220 3780 Z M380 3640 Q460 3600 540 3640 L540 3780 Q460 3740 380 3780', { g: kg, w: 5 }), linea('M250 3670 L350 3660 M250 3700 L350 3690 M410 3660 L510 3670 M410 3690 L510 3700', { g: kg, w: 3 })], tA + 0.25, 0.5);
dibuja([linea('M640 3780 L640 3640 Q640 3610 670 3610 L870 3610 Q900 3610 900 3640 L900 3780 Z', { g: kg, w: 5 }), linea('M700 3690 A70 70 0 0 1 840 3690', { g: kg, w: 4 }), linea('M770 3690 L800 3650', { g: kg, w: 4, color: RED })], at('estudiar') + 0.05, 0.5);
escribe('≠', { x: 590, y: 3730, size: 140, font: 'ka', color: RED, t0: at('adelgaza') - 0.1, dur: 0.25, align: 'center', mano: false });
escribe('ESTUDIAR ≠ ADELGAZAR', { x: 540, y: 3470, size: 92, font: 'ka', t0: at('adelgaza') - 0.05, dur: 0.6, align: 'center' });
escribe('lo siento :(', { x: 760, y: 3900, size: 70, font: 'cv', color: RED, t0: at('siento') - 0.25, dur: 0.4, align: 'center', mano: false });
salida(T.END);

const K = capas(T, { keys: ['cerebro', '2', '20', 'vatios', 'bombilla', 'nunca', 'duermes', 'apenas', 'adelgaza'], top: 1480, dur: DUR });
window.__cues = { dur: DUR, voz: { gain: 1 }, sfx: A.SFX, trazos: D.cuesTrazos(0.2), musica: { archivo: 'n5-cerebro.wav', gain: 0.28, duck: 0.5, fadein: 0.05, fadeout: 0.7 } };
window.__dur = DUR;
window.__render = (t) => { D.render(t); K.update(t); };
window.__render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { window.__render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
