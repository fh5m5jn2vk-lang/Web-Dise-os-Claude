// LÓNG · «3 cosas que no sabías de este dragón». A dark studio and a turntable. The three are on screen from the first
// second, locked, and open one by one (people stay for number one): it moves piece by piece, it measures 88 cm (seen
// from straight above, the whole length), and it glows in the dark. Voice VelionF, EDM music, effects.
import { stage, V, E, clamp, lerp, prog, SEG } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const S = await stage({ set: 'estudio', bloom: 0.3 });
const C = capas(T, { keys: ['tres', 'dos', 'uno', 'pasada', 'pieza', 'ochenta', 'centímetros', 'metro', 'brilla', 'oscuridad', 'perfil'], top: 1200, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const t3 = ln(1), t2 = ln(2), t1 = ln(3), tOff = T.at('uno') + 0.35, tGlow = T.at('brilla') - 0.05, tEnd = T.END + 0.05;
const $ = (s) => document.querySelector(s);
const REV = { r3: [t3 + 0.35, 'SE MUEVE ENTERO'], r2: [t2 + 0.35, '88 CM · ¡CASI 1 METRO!'], r1: [tGlow, 'BRILLA EN LA OSCURIDAD'] };

C.hook('3 COSAS QUE<br><em>NO SABÍAS</em>', 0.03, 1.75, false, 760);
C.item('<div class="btn">link en mi perfil</div>', 285, 960, T.at('link'), tEnd - 0.05, 'pop');
C.endCard(tEnd);
[t3, t2, t1].forEach((t) => C.flash(t, 0.22));

function shot(t) {
  const P = S.P;
  S.L.disc.rotation.y = t * 0.35;
  if (t < t3) {   // the hook: on the turntable, circling
    P.coil(t, { y: 0.14, rot: t * 0.35, lift: 0.42 }); const u = prog(t, 0, t3), a = lerp(0.5, 1.4, u);
    return { cp: V(Math.sin(a) * 5.4, lerp(2.4, 1.9, u), Math.cos(a) * 5.4), ca: V(0, 0.55, 0), fov: 40 };
  }
  if (t < t2) {   // 3: it slithers across the floor, the camera alongside, close
    P.slither(t, { z: 2.9, amp: 0.34, speed: 1.4 }); const m = S.spine[16], u = prog(t, t3, t2);
    return { cp: V(m.x + lerp(1.3, 0.6, u), 0.75, m.z + 1.6), ca: V(m.x - 0.2, 0.15, m.z), fov: 36 };
  }
  if (t < t1) {   // 2: stretched out, from straight above: the whole 88 cm
    P.stretch(t, { x0: -3.2, z: 2.8, wave: 0.04, lift: 0.18 }); const u = E.inOut(prog(t, t2, t1));
    return { cp: V(0.05, lerp(10.5, 9.4, u), 2.8), ca: V(0.05, 0, 2.8), fov: 40, up: V(-1, 0, 0) };
  }
  // 1: lights out, it glows; low, circling
  P.coil(t, { y: 0.14, rot: t * 0.35, lift: 0.5 }); const u = prog(t, t1, DUR), a = lerp(-0.3, 0.5, u);
  return { cp: V(Math.sin(a) * 4.2, lerp(1.2, 1.7, u), Math.cos(a) * 4.2), ca: V(0, 0.5, 0), fov: 40 };
}

const pj = V();
function render(t) {
  const s = shot(t), off = t >= tOff ? 1 : 0;
  S.L.lights(off ? 0.04 : 1);
  const glow = off ? E.expo(prog(t, tGlow - 0.25, tGlow + 0.4)) * (0.9 + 0.1 * Math.sin(t * 3)) : 0;
  S.frame(t, { ...s, col: t >= t1 ? 'luminoso' : 'metal', glow, exposure: off ? 0.95 : 1, shake: t >= tOff && t < tOff + 0.2 ? 1 : 0 });
  C.update(t, off === 1);
  // the list: in with the hook, each line opens when it is said
  const lo = E.out(prog(t, 0.25, 0.6)) * (1 - prog(t, tEnd - 0.3, tEnd));
  ['r3', 'r2', 'r1'].forEach((id, i) => {
    const r = $('#' + id), p = E.back(prog(t, 0.3 + i * 0.12, 0.6 + i * 0.12)), [tr, txt] = REV[id], on = t >= tr, sp = r.querySelector('span');
    r.style.opacity = lo * clamp((t - 0.3 - i * 0.12) * 5); r.style.transform = `translateX(${(1 - p) * -80}px) scale(${on ? 1 + 0.06 * Math.exp(-(t - tr) * 8) : 1})`;
    if (on && sp.classList.contains('q')) { sp.classList.remove('q'); sp.textContent = txt; } if (!on && !sp.classList.contains('q')) { sp.classList.add('q'); sp.textContent = '? ? ?'; }
    r.classList.toggle('on', on && t < tr + 1.6);
  });
  // the rule beside the stretched dragon, from head to tail on screen
  const ro = E.out(prog(t, T.at('ochenta') - 0.1, T.at('ochenta') + 0.35)) * (1 - prog(t, t1 - 0.25, t1));
  const rg = $('#regla');
  if (ro > 0) {
    pj.copy(S.spine[0]).project(S.cam); const y0 = (1 - pj.y) * 960, x0 = (pj.x + 1) * 540;
    pj.copy(S.spine[SEG]).project(S.cam); const y1 = (1 - pj.y) * 960, x1 = (pj.x + 1) * 540;
    rg.style.opacity = ro; rg.style.left = (Math.max(x0, x1) + 110) + 'px'; rg.style.top = Math.min(y0, y1) + 'px'; rg.style.height = Math.abs(y1 - y0) + 'px'; rg.style.transform = `scaleY(${ro})`;
  } else rg.style.opacity = 0;
}

for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0龍');
A.forItems(C.IT);
A.fx(0.03, 'impact', 0.3); A.fx(0.3, 'whoosh', 0.18);
[t3, t2, t1].forEach((t) => { A.fx(t - 0.1, 'whoosh', 0.18); });
Object.values(REV).forEach(([t]) => { A.fx(t, 'pop', 0.3); A.fx(t, 'tick', 0.2); });
A.rattle(t3 + 0.2, 9, 0.12, 0.28);
A.fx(T.at('ochenta'), 'impact', 0.28);
A.fx(T.at('uno'), 'riser', 0.22); A.fx(tOff, 'lightswitch', 0.6); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.05, 'sweep', 0.24);
A.fx(T.at('link'), 'click', 0.4); A.fx(tEnd, 'impact', 0.3); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '124-123bpm.wav', desde: 0.6, gain: 0.42, duck: 0.55, fadein: 0.02, fadeout: 1.2, silencios: [[tOff - 0.05, tGlow + 0.1, 0.15]] }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
