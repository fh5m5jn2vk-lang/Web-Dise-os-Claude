// LÓNG · «¡Desliza si te lo pillarías!». 2D: a swipe app of our own, the supplier's real photos of each colour. Every
// card swipes right on its «sí» with a stamp, eight dots fill as they go, four go by in a grid, the Luminoso card turns
// over to show it glowing in the dark, and it is a match. Something changes every second. Voice VelionF, funk, effects.
import { clamp, lerp, prog, E } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const C = capas(T, { keys: ['desliza', 'sí', 'luminoso', 'brilla', 'oscuridad', 'match', 'perfil'], top: 255, dur: DUR });
const A = sonido();
const $ = (s) => document.querySelector(s);
const deck = $('#deck');
const card = (img, name, n, mini = false, back = null) => {
  const d = document.createElement('div'); d.className = 'card' + (mini ? ' mini' : ''); d.style.backgroundImage = `url(img/${img})`;
  d.innerHTML = `<div class="n">${n}/8</div><div class="info"><h2>${name}</h2><p>dragón articulado · <b>88 cm</b></p></div><div class="yes">¡SÍ!</div>` + (back ? `<div class="back" style="background-image:url(img/${back})"><div class="info"><h2>MODO NOCHE</h2><p>brilla en la oscuridad</p></div></div>` : '');
  deck.appendChild(d); return d;
};
const si = (n) => T.at('sí', n + 1);   // the first «si» is the one in «desliza si te lo pillarías»
// the big ones, one by one
const BIG = [
  { d: card('metalizado.jpg', 'Metalizado', 1), show: 0.2, yes: si(1) },
  { d: card('oro-rojo.jpg', 'Oro y rojo', 2), show: si(1), yes: si(2) },
  { d: card('azul-morado.jpg', 'Azul y morado', 3), show: si(2), yes: si(3) },
];
// four at once, in a grid, named fast
const GX = [100, 562], GY = [520, 1050];
const GRID = [
  { d: card('azul-verde.jpg', 'Azul y verde', 4, true), x: GX[0], y: GY[0], show: T.at('azul', 2) - 0.08, yes: si(4) },
  { d: card('oro.jpg', 'Oro', 5, true), x: GX[1], y: GY[0], show: T.at('oro', 2) - 0.08, yes: si(5) },
  { d: card('plata.jpg', 'Plata', 6, true), x: GX[0], y: GY[1], show: T.at('plata') - 0.08, yes: si(6) },
  { d: card('pastel.jpg', 'Pastel', 7, true), x: GX[1], y: GY[1], show: T.at('pastel') - 0.08, yes: si(7) },
];
// the eighth: it turns over and glows
const tLum = T.at('luminoso') - 0.25, tFlip = T.at('brilla') - 0.08, tMatch = T.at('es') - 0.05, tEnd = T.END + 0.05;
const LUM = { d: card('luminoso.jpg', 'Luminoso', 8, false, 'brillo.jpg') };
deck.appendChild(LUM.d);
const hearts = Array.from({ length: 14 }, (_, i) => { const h = document.createElement('div'); h.className = 'heart'; h.textContent = '♥'; $('#stage').appendChild(h); return { h, a: (i / 14) * Math.PI * 2 + i * 0.3, r: 380 + (i % 4) * 90, s: 0.6 + (i % 3) * 0.35 }; });

C.hook('¡DESLIZA SI TE<br>LO <em>PILLARÍAS</em>!', 0.03, 1.62);
C.fromT(1.62);
C.item('<div class="btn">link en mi perfil</div>', 285, 1330, T.at('link'), tEnd - 0.05, 'pop');
C.endCard(tEnd);

const swipe = (d, t, show, yes, base) => {   // in from below/behind, held, out to the right on its «sí»
  const pin = E.back(prog(t, show - 0.05, show + 0.28)), out = E.in(prog(t, yes + 0.1, yes + 0.42));
  const x = base.x + out * 1150, y = base.y + (1 - pin) * 90 + out * -60, r = out * 24 + (1 - pin) * -4, s = lerp(0.9, 1, pin) * base.s;
  d.style.opacity = t < show - 0.05 || out >= 1 ? 0 : clamp((t - show + 0.05) * 8);
  d.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
  const yp = prog(t, yes - 0.02, yes + 0.12), st = d.querySelector('.yes');
  st.style.opacity = t >= yes - 0.02 ? 1 : 0; st.style.transform = `rotate(-16deg) scale(${lerp(1.7, 1, E.out(yp))})`;
};
function render(t) {
  // the next big card waits behind the top one
  BIG.forEach((c, i) => {
    const under = i > 0 && t < c.show ? 1 : 0;
    if (under && t > BIG[i - 1].show - 0.05) { c.d.style.opacity = 0.9; c.d.style.transform = `translate(0px, 34px) scale(0.94)`; c.d.style.zIndex = 1; return; }
    c.d.style.zIndex = 2; swipe(c.d, t, c.show, c.yes, { x: 0, y: 0, s: 1 });
  });
  GRID.forEach((c) => { c.d.style.left = '0px'; c.d.style.top = '0px'; swipe(c.d, t, c.show, c.yes, { x: c.x, y: c.y, s: 1 }); });
  // the Luminoso: in, then it turns over on «brilla»
  const lp = E.back(prog(t, tLum, tLum + 0.3)), fl = E.inOut(prog(t, tFlip, tFlip + 0.35)), lo = E.in(prog(t, tMatch - 0.05, tMatch + 0.2));
  LUM.d.style.opacity = t < tLum ? 0 : clamp((t - tLum) * 8) * (1 - lo);
  LUM.d.style.transform = `translateY(${(1 - lp) * 120}px) scale(${lerp(0.85, 1, lp) * (1 + 0.04 * Math.sin(fl * Math.PI))}) rotateY(${fl < 0.5 ? fl * 180 : (1 - fl) * 180}deg)`;
  LUM.d.querySelector('.back').style.opacity = fl >= 0.5 ? 1 : 0;
  LUM.d.style.boxShadow = fl >= 0.5 ? `0 0 ${90 + 30 * Math.sin(t * 4)}px rgba(63,255,170,.55), 0 50px 90px -30px rgba(0,0,0,.85)` : '';
  $('#night').style.opacity = E.out(prog(t, tFlip + 0.1, tFlip + 0.4)) * (1 - prog(t, tMatch, tMatch + 0.3));
  // the buttons press with each «sí»
  const yeses = [...BIG, ...GRID].map((c) => c.yes);
  const press = yeses.reduce((a, y) => Math.max(a, t >= y - 0.05 ? Math.exp(-(t - y + 0.05) * 9) : 0), 0);
  const bo = clamp((t - 0.3) * 4) * (1 - prog(t, tLum - 0.2, tLum));
  $('#btns').style.opacity = bo; $('#btns .si').style.transform = `scale(${1 + press * 0.22})`;
  // the dots fill
  const done = yeses.filter((y) => t >= y).length + (t >= tFlip + 0.2 ? 1 : 0);
  $('#dots8').style.opacity = clamp((t - 1.5) * 4) * (1 - prog(t, tMatch - 0.1, tMatch + 0.1)); [...$('#dots8').children].forEach((d, i) => d.classList.toggle('on', i < done));
  // a swipe hint at the start
  const hp = prog(t, 0.55, 1.45); $('#hand').style.opacity = hp > 0 && hp < 1 ? Math.sin(hp * Math.PI) : 0; $('#hand').style.transform = `translate(${lerp(380, 820, E.inOut(hp))}px, ${1000 - Math.sin(hp * Math.PI) * 60}px)`;
  // it is a match
  const mp = E.back(prog(t, tMatch, tMatch + 0.4)), mo = 1 - prog(t, tEnd - 0.2, tEnd);
  $('#match').style.opacity = t < tMatch ? 0 : clamp((t - tMatch) * 6) * mo; $('#match').style.transform = `scale(${lerp(0.6, 1, mp)})`;
  hearts.forEach((h) => { const a = t - tMatch, p = E.out(prog(a, 0, 0.9)); h.h.style.opacity = a < 0 ? 0 : (1 - prog(a, 0.5, 1.3)); h.h.style.transform = `translate(${490 + Math.cos(h.a) * h.r * p}px, ${900 + Math.sin(h.a) * h.r * p - a * 120}px) scale(${h.s})`; });
  C.update(t, t >= tFlip && t < tMatch);
}

await Promise.all([...document.querySelectorAll('.card')].map((c) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = c.style.backgroundImage.slice(5, -2); })));
for (const f of ['400 60px Anton', '800 60px Inter', '600 30px Mono', '800 60px Syne', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0龍♥✕');
[...BIG, ...GRID].forEach((c) => { A.fx(c.show - 0.04, 'swish', 0.14, 0.2); A.fx(c.yes, 'correct', 0.22, 0.3); A.fx(c.yes + 0.12, 'whoosh', 0.16, 0.5); });
A.forItems(C.IT);
A.fx(0.03, 'pop', 0.3); A.fx(0.6, 'swish', 0.15);
A.fx(tLum, 'whoosh', 0.18); A.fx(tFlip, 'swish', 0.22); A.fx(tFlip + 0.15, 'shimmer', 0.42); A.fx(tFlip + 0.2, 'sweep', 0.22);
A.fx(tMatch, 'impact', 0.32); A.fx(tMatch + 0.02, 'confetti', 0.3); A.fx(tMatch + 0.1, 'bell', 0.18);
A.fx(T.at('link'), 'click', 0.4); A.fx(T.at('link') + 0.3, 'cash', 0.28); A.fx(tEnd, 'impact', 0.28); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '369.mp3', desde: 0, gain: 0.42, duck: 0.55, fadein: 0.02, fadeout: 1.2 }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
