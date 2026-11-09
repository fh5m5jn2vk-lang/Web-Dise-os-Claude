// LÓNG · «¡Espera a que apague la luz!». The bedroom at night, the Luminoso coiled under the lamp. An open loop in the
// first second (the bar fills up to the moment the light goes), a cut every line, a 3-2-1, the click, and it glows.
// Voice VelionF (eleven_v3, no dead air), music with a drop at the click, effects. window.__render(t), window.__dur.
import { stage, V, E, clamp, lerp, prog } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const S = await stage({ set: 'cuarto', bloom: 0.3 });
const C = capas(T, { keys: ['luz', 'ochenta', 'centímetros', 'pieza', 'secreto', 'tres', 'dos', 'uno', 'brilla', 'luminoso', 'perfil'], dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const t3 = T.at('tres'), t2 = T.at('dos'), t1 = T.at('uno'), tOff = T.end('uno') + 0.1, tGlow = tOff + 0.12, tEnd = T.END + 0.05;

C.hook('¡ESPERA A QUE<br>APAGUE LA <em>LUZ</em>!', 0.03, ln(1) - 0.04);
C.progress(0.2, tOff);
C.item('<div class="badge">88 CM <small>de la cabeza a la cola</small></div>', 175, 430, T.at('ochenta'), ln(2) - 0.04, 'slam', -3);
C.item('<div class="sticker">SE MUEVE<br>PIEZA A PIEZA</div>', 300, 440, T.at('mueve') - 0.05, ln(3) - 0.04, 'pop', 3);
C.item('<div class="sticker">TIENE UN<br>SECRETO…</div>', 330, 440, T.at('secreto'), ln(4) - 0.04, 'pop', -4);
C.item('<div class="num">3</div>', 405, 330, t3 - 0.02, t2 - 0.03, 'slam');
C.item('<div class="num">2</div>', 395, 330, t2 - 0.02, t1 - 0.03, 'slam');
C.item('<div class="num"><em>1</em></div>', 430, 330, t1 - 0.02, tOff, 'slam');
C.item('<div class="glowtag">BRILLA EN LA<br>OSCURIDAD<small>color Luminoso</small></div>', 220, 420, tGlow + 0.45, tEnd - 0.05, 'pop', -3);
C.item('<div class="btn">link en mi perfil</div>', 285, 900, T.at('link'), tEnd - 0.05, 'pop');
C.endCard(tEnd);
[ln(1), ln(2), ln(3)].forEach((t) => C.flash(t, 0.18));

function shot(t) {
  const P = S.P;
  if (t < ln(1)) {   // the hook: the dragon coiled under the lamp, a slow push
    P.coil(t, { lift: 0.4 }); const u = prog(t, 0, ln(1));
    return { cp: V(lerp(2.4, 1.95, u), lerp(1.55, 1.3, u), lerp(5.0, 4.2, u)), ca: V(-0.1, 0.5, 0), fov: 38 };
  }
  if (t < ln(2)) {   // 88 cm: high above, the spiral turning under us
    P.coil(t, { lift: 0.3, rot: (t - ln(1)) * 0.35 }); const u = E.inOut(prog(t, ln(1), ln(2))), a = lerp(-0.5, 0.6, u);
    return { cp: V(Math.sin(a) * 1.2, lerp(4.6, 4.0, u), Math.cos(a) * 1.2 + 0.4), ca: V(-0.1, 0, 0.05), fov: 40 };
  }
  if (t < ln(3)) {   // piece by piece: close on the body while the coil slides along itself
    P.coil(t, { lift: 0.3, rot: (t - ln(2)) * 0.9 }); const u = prog(t, ln(2), ln(3)), m = S.spine[17];
    return { cp: V(m.x + 0.95, 0.6, m.z + 0.95), ca: V(m.x, 0.12, m.z), fov: 32 };
  }
  if (t < ln(4)) {   // the secret: it lifts its head and we creep in
    const u = E.inOut(prog(t, ln(3), ln(4))); P.coil(t, { lift: lerp(0.3, 0.62, u) }); const h = S.spine[0];
    return { cp: V(lerp(1.4, 0.8, u), lerp(0.8, 0.66, u), lerp(2.6, 1.8, u)), ca: h.clone().add(V(0, 0.04, 0)), fov: 32 };
  }
  // the countdown and the dark: wide, circling slowly
  P.coil(t, { lift: 0.5, rot: (t - ln(4)) * 0.12 }); const u = prog(t, ln(4), DUR), a = lerp(0.15, 0.85, u), r = lerp(4.3, 3.5, u);
  return { cp: V(Math.sin(a) * r, lerp(2.1, 1.5, u), Math.cos(a) * r + 0.3), ca: V(-0.1, 0.32, 0.1), fov: 38 };
}

function render(t) {
  const s = shot(t), off = t >= tOff ? 1 : 0;
  const lamp = off ? 0 : 1 - (t > t1 ? 0.25 * Math.max(0, Math.sin((t - t1) * 40)) : 0);   // it flickers before it goes
  S.L.lamp(lamp);
  const glow = off ? E.expo(prog(t, tGlow, tGlow + 0.6)) * (0.9 + 0.1 * Math.sin(t * 3)) : 0;
  const macro = t >= ln(2) && t < ln(3);
  S.frame(t, { ...s, col: 'luminoso', glow: glow * 0.85, exposure: off ? 0.9 : macro ? 0.48 : 0.85, bloom: macro ? 0.12 : 0.3, fade: Math.max(1 - prog(t, 0, 0.12), 0), shake: t >= tOff && t < tOff + 0.25 ? 1 : 0 });
  C.update(t, off === 1);
}

for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0龍');
// sound
A.forItems(C.IT);
[ln(1), ln(2), ln(3), ln(4)].forEach((t) => A.fx(t - 0.1, 'whoosh', 0.16));
A.rattle(ln(2) + 0.1, 8, 0.12, 0.28);
A.fx(T.at('secreto'), 'riser', 0.25);
[t3, t2, t1].forEach((t) => A.fx(t, 'heartbeat', 0.5));
A.fx(tOff, 'lightswitch', 0.65); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.05, 'sweep', 0.25);
A.fx(T.at('link'), 'click', 0.4); A.fx(tEnd, 'impact', 0.3); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '443.mp3', desde: 0, gain: 0.4, duck: 0.55, fadein: 0.05, fadeout: 1.2, silencios: [[t3 - 0.1, tGlow + 0.05, 0.12]] }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
