// LÓNG · the comic. 2D: a comic-book page read like a motion comic, the camera jumping panel to panel on the beat: a
// dull grey room («mi cuarto era un aburrimiento…»), ¡BAM! («¡hasta que llegó él!»), the real dragon on a wrist with a
// 88 CM burst, the hanging dragons ¡CLIC! ¡CLAC!, the eight colours popping in, night, and ¡BRILLA!. The narration boxes
// are the captions, word by word. The supplier's real photos, halftone over them. Voice VelionF, trap, effects.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: [], dur: DUR });
const A = sonido();
const $ = (s) => document.querySelector(s);
const tEnd = T.END + 0.05;
// panels on the page, and when the camera is on each
const PN = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((id) => { const e = $('#' + id); return { e, x: parseFloat(e.style.left), y: parseFloat(e.style.top), w: parseFloat(e.style.width), h: parseFloat(e.style.height) }; });
const ON = [0, T.line(1).t0 - 0.06, T.line(2).t0 - 0.06, T.at('que', 2) - 0.1, T.line(3).t0 - 0.06, T.at('y', 2) - 0.08];   // «que se mueve», «y de noche»
const tFinal = T.line(5).t0 - 0.06;
// the narration boxes: the line's words, each appearing as it is said
const BOX = [['b1', [0]], ['b2', [1]], ['b3', [2], 0, 6], ['b4', [2], 6], ['b5', [3], 0, 3], ['b6', [3], 3]];
BOX.forEach(([id, lines, from = 0, to = 99]) => {
  const ws = lines.flatMap((li) => T.line(li).words).slice(from, to); $('#' + id).innerHTML = ws.map((w) => `<span class="w" data-t="${w[1]}">${w[0]}</span>`).join(' ');
});
// the eight colours, as minis
const MINI = ['metalizado', 'oro-rojo', 'azul-morado', 'azul-verde', 'oro', 'plata', 'pastel', 'luminoso'];
const tC0 = T.at('ocho', 2) - 0.1, tC1 = T.at('y', 2) - 0.2;
$('#minis').innerHTML = MINI.map((m, i) => `<div class="mini" style="left:${40 + (i % 4) * 232}px;top:${300 + Math.floor(i / 4) * 300}px;background-image:url(img/${m}.jpg)"></div>`).join('');
const tBam = T.at('llegó') - 0.05, tBrilla = T.at('brilla') - 0.04;
C.endCard(tEnd);

function camAt(t) {   // which panel, and the pan between: quick, with an overshoot
  let i = 0; for (let k = 0; k < ON.length; k++) if (t >= ON[k]) i = k;
  const fit = (p) => { const s = Math.min(1040 / p.w, 1460 / p.h); return { s, x: 540 - (p.x + p.w / 2) * s, y: 990 - (p.y + p.h / 2) * s }; };
  const a = fit(PN[Math.max(0, i - 1)]), b = fit(PN[i]), u = i === 0 ? 1 : E.back(prog(t, ON[i], ON[i] + 0.32));
  const zoom = 1 + 0.04 * prog(t, ON[i], (ON[i + 1] ?? tFinal));   // a slow push inside each panel
  const s = lerp(a.s, b.s, u) * zoom;
  return { s, x: lerp(a.x, b.x, u) - (zoom - 1) * 540, y: lerp(a.y, b.y, u) - (zoom - 1) * 990, blur: i > 0 && t - ON[i] < 0.2 ? 6 * (1 - (t - ON[i]) / 0.2) : 0 };
}
const pop = (el, t0, t1 = 99, from = 2.2) => { const a = t - t0; };
function render(t) {
  const c = camAt(t), pg = $('#page');
  pg.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.s})`; pg.style.filter = c.blur > 0.1 ? `blur(${c.blur.toFixed(1)}px)` : '';
  // narration words
  document.querySelectorAll('.box .w').forEach((w) => { const a = t - (+w.dataset.t - 0.03); w.style.opacity = a < 0 ? 0 : 1; w.style.transform = `scale(${a < 0 ? 0.6 : lerp(1.25, 1, E.out(clamp(a / 0.15)))})`; });
  document.querySelectorAll('.box').forEach((b, i) => { const p = E.back(prog(t, ON[[0, 1, 2, 3, 4, 5][i]] + 0.05, ON[i] + 0.3)); b.style.transform = `rotate(-2deg) scale(${lerp(0.6, 1, p)})`; b.style.opacity = clamp((t - ON[i]) * 6); });
  // panel 1: zzz floats
  const z = $('#zzz'); z.style.opacity = clamp((t - 0.3) * 3) * 0.9; z.style.transform = `translateY(${-((t * 40) % 60)}px) rotate(-8deg)`;
  // panel 2: rays spin, the photo bursts in, ¡BAM!
  $('#rays2').style.transform = `rotate(${t * 20}deg)`;
  const bp = E.back(prog(t, tBam, tBam + 0.3)); $('#ph2').style.transform = `scale(${lerp(0.2, 1, bp)}) rotate(${(1 - bp) * -20}deg)`; $('#ph2').style.opacity = clamp((t - tBam) * 8);
  const bm = $('#bam'), ba = t - tBam - 0.08; bm.style.opacity = ba < 0 ? 0 : 1; bm.style.transform = `scale(${lerp(2.2, 1, E.out(clamp(ba / 0.14)))}) rotate(-6deg) translate(${Math.sin(ba * 70) * 6 * Math.exp(-ba * 8)}px, 0)`;
  // panel 3: the 88 CM burst
  const ca = t - T.at('ochenta'); $('#cm').style.opacity = ca < 0 ? 0 : 1; $('#cm').style.transform = `scale(${ca < 0 ? 0 : E.back(clamp(ca / 0.3))}) rotate(${10 + Math.sin(t * 6) * 3}deg)`;
  // panel 4: ¡CLIC! ¡CLAC!
  [['#clic', T.at('mueve') - 0.05], ['#clac', T.at('entero') - 0.02]].forEach(([q, t0]) => { const a = t - t0, e = $(q); e.style.opacity = a < 0 ? 0 : 1; e.style.transform = `scale(${lerp(2, 1, E.out(clamp(a / 0.12)))}) rotate(${q === '#clic' ? -10 : 8}deg)`; });
  // panel 5: the minis pop in, one by one
  document.querySelectorAll('.mini').forEach((m, i) => { const ti = tC0 + i * ((tC1 - tC0) / 8), a = t - ti; m.style.opacity = a < 0 ? 0 : 1; m.style.transform = `scale(${a < 0 ? 0 : E.back(clamp(a / 0.22))}) rotate(${(i % 2 ? 4 : -4)}deg)`; });
  // panel 6: night, then it glows
  const g = E.out(prog(t, tBrilla - 0.05, tBrilla + 0.25)); $('#ph6').style.opacity = g; $('#rays6').style.opacity = g * 0.5; $('#rays6').style.transform = `rotate(${t * -25}deg)`;
  const br = $('#brilla'), bb = t - tBrilla; br.style.opacity = bb < 0 ? 0 : 1; br.style.transform = `scale(${lerp(2.4, 1, E.out(clamp(bb / 0.15)))}) rotate(-5deg)`;
  // the last word, and the end card
  const fp = E.back(prog(t, tFinal, tFinal + 0.3)); $('#final').style.opacity = clamp((t - tFinal) * 6) * (1 - prog(t, tEnd - 0.15, tEnd)); $('#final .bub').style.transform = `scale(${lerp(0.4, 1, fp)}) rotate(-3deg)`;
  C.update(t);
}

await Promise.all([...document.images].map((im) => im.decode().catch(() => {})));
await Promise.all(MINI.map((m) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = `img/${m}.jpg`; })));
for (const f of ['400 60px Bungee', '400 60px Marker', '400 60px Anton', '800 60px Syne', '500 30px Mono', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0¡龍');
ON.slice(1).forEach((t) => A.fx(t, 'whoosh', 0.2, 0.3));
A.fx(0.4, 'tick', 0.12); A.fx(0.9, 'tick', 0.12); A.fx(1.4, 'tick', 0.12);
A.fx(tBam, 'impact', 0.42); A.fx(tBam, 'boom', 0.3); A.fx(tBam + 0.08, 'slap', 0.3);
A.fx(T.at('ochenta'), 'pop', 0.3); A.fx(T.at('ochenta'), 'thump', 0.3);
A.rattle(T.at('mueve') - 0.05, 6, 0.09, 0.32); A.fx(T.at('entero') - 0.02, 'slap', 0.25);
for (let i = 0; i < 8; i++) A.fx(tC0 + i * ((tC1 - tC0) / 8), 'pop', 0.16 + i * 0.01, -0.4 + i * 0.1);
A.fx(T.at('noche') - 0.1, 'riser', 0.2); A.fx(tBrilla, 'shimmer', 0.45); A.fx(tBrilla, 'impact', 0.3); A.fx(tBrilla + 0.05, 'sweep', 0.24);
A.fx(tFinal, 'pop', 0.3); A.fx(tFinal + 0.03, 'bell', 0.1); A.fx(tEnd, 'impact', 0.3); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '706.mp3', desde: 0, gain: 0.42, duck: 0.55, fadein: 0.02, fadeout: 1.0, silencios: [[0, T.line(1).t0 - 0.05, 0.25]] }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
