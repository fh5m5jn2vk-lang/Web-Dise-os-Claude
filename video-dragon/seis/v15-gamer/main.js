// LÓNG · «Si tienes un setup gamer, necesitas esto». A dark desk, a synthwave monitor, an RGB keyboard and an LED strip.
// The camera starts on the setup and whips to the dragon on «esto»; then the lights change colour and the dragon changes
// with them, the eight colours in sync («combina con tus luces»); the room goes dark and the Luminoso glows next to the
// keyboard. Voice VelionF, electronic music, effects. window.__render(t), window.__dur.
import { stage, V, E, clamp, lerp, prog, COLS, SWN } from '../kit/kit.js';
import { tiempos, capas, sonido } from '../kit/capas.js';

const T = await tiempos(), DUR = T.G.dur;
const S = await stage({ set: 'gamer', bloom: 0.42 });
const C = capas(T, { keys: ['gamer', 'esto', 'ochenta', 'centímetros', 'luces', 'colores', 'apagada', 'brilla', 'perfil'], top: 1210, dur: DUR });
const A = sonido();
const ln = (i) => T.line(i).t0;
const tEsto = T.at('esto') - 0.08, tC0 = T.at('combina') - 0.05, tC1 = ln(3) - 0.08, tOff = T.at('apagada') + 0.15, tGlow = T.at('brilla') - 0.08, tEnd = T.END + 0.05;
const RGB = ['#8a4dff', '#ff5a1f', '#4a5bff', '#22d39a', '#ffc21a', '#e8ecf5', '#ff8fd0', '#6dffb0'];

C.hook('¿TIENES UN SETUP<br><em>GAMER</em>?', 0.03, tEsto - 0.02);
C.item('<div class="stamp">¡NECESITAS<br>ESTO!</div>', 190, 400, tEsto, ln(1) + 0.4, 'stamp', -6);
C.item('<div class="badge">88 CM <small>articulado</small></div>', 175, 430, T.at('ochenta'), ln(2) - 0.05, 'slam', -3);
const name = C.item('<div class="chip" id="cname">Metalizado</div>', 300, 430, tC0, tC1, 'pop');
C.item('<div class="glowtag">BRILLA EN LA<br>OSCURIDAD<small>color Luminoso</small></div>', 220, 420, tGlow + 0.3, tEnd - 0.05, 'pop', -3);
C.item('<div class="btn">link en mi perfil</div>', 285, 960, T.at('link'), tEnd - 0.05, 'pop');
C.endCard(tEnd);
C.flash(tEsto, 0.3);

const COIL = { cx: 2.3, cz: 0.35 };
function shot(t) {
  const P = S.P;
  P.coil(t, { cx: COIL.cx, cz: COIL.cz, y: 0.03, lift: t < tEsto ? 0.25 : 0.45, rot: t * 0.12, look: -0.15 });
  if (t < tEsto) {   // the setup, and the dragon just out of frame
    const u = prog(t, 0, tEsto); return { cp: V(lerp(-1.6, -0.9, u), lerp(3.4, 3.0, u), lerp(8.2, 7.4, u)), ca: V(-0.7, 1.7, -0.8), fov: 40 };
  }
  if (t < ln(1) + 0.3) {   // the whip to it
    const u = E.out(prog(t, tEsto, tEsto + 0.3)); return { cp: V(lerp(-0.9, 2.6, u), lerp(3.0, 2.1, u), lerp(7.4, 5.0, u)), ca: V(lerp(-0.7, 2.2, u), lerp(1.7, 0.4, u), lerp(-0.8, 0.3, u)), fov: 40, shake: u < 1 ? 0.6 : 0 };
  }
  if (t < tC0) {   // 88 cm: it lifts its head by the keyboard, we push in
    const u = E.inOut(prog(t, ln(1) + 0.3, tC0)); return { cp: V(lerp(2.6, 2.2, u), lerp(2.1, 1.5, u), lerp(5.0, 3.9, u)), ca: V(2.2, 0.45, 0.3), fov: 38 };
  }
  if (t < tOff) {   // the colours, in sync with the lights: wide enough to see the strip and the keys
    const u = prog(t, tC0, tOff), a = lerp(0.3, -0.05, u); return { cp: V(2.0 + Math.sin(a) * 5.2, 2.6, 0.3 + Math.cos(a) * 5.2), ca: V(1.8, 0.75, -0.2), fov: 42 };
  }
  // dark: it glows next to the keyboard
  const u = E.inOut(prog(t, tOff, DUR)); return { cp: V(lerp(3.6, 2.9, u), lerp(2.2, 1.8, u), lerp(4.6, 4.0, u)), ca: V(1.7, 0.45, 0.1), fov: 38 };
}

function render(t) {
  const s = shot(t), off = t >= tOff;
  let ci = -1; if (t >= tC0 && t < tC1) ci = Math.min(7, Math.floor((t - tC0) / ((tC1 - tC0) / 8)));
  const col = ci >= 0 ? COLS[ci] : t >= tC1 ? 'luminoso' : 'metal';
  S.L.rgb(t, ci >= 0 ? RGB[ci] : off ? '#1f6b4a' : t >= tC1 ? RGB[7] : null, off ? 0.25 : 1);
  S.L.lights(off ? lerp(1, 0.06, E.out(prog(t, tOff, tOff + 0.25))) : 1);
  S.L.screen.paint(t);
  const glow = off ? E.expo(prog(t, tGlow - 0.25, tGlow + 0.35)) * (0.9 + 0.1 * Math.sin(t * 3)) : 0;
  S.frame(t, { ...s, col, glow, exposure: off ? 0.95 : 1, glowLight: 1.4 });
  const cn = document.getElementById('cname'); if (cn && ci >= 0 && cn.textContent !== SWN[ci]) { cn.textContent = SWN[ci]; cn.style.background = RGB[ci]; cn.style.color = ci === 5 || ci === 4 || ci === 7 ? '#141414' : '#fff'; }
  C.update(t, off);
}

for (const f of ['400 60px Anton', '800 60px Inter', '700 22px Inter', '500 30px Mono', '800 60px Syne', '700 40px Manrope', '900 40px Han']) await document.fonts.load(f, 'Aá0龍¿');
A.forItems(C.IT);
A.fx(0.03, 'riser', 0.18); A.fx(tEsto, 'whoosh', 0.3, 0.4); A.fx(tEsto + 0.25, 'impact', 0.32);
A.rattle(ln(1) + 0.4, 6, 0.12, 0.24);
for (let i = 0; i < 8; i++) { const ti = tC0 + i * ((tC1 - tC0) / 8); A.fx(ti, 'tick', 0.16 + i * 0.012, -0.4 + i * 0.1); A.fx(ti, 'key', 0.12, 0.2); }
A.fx(tOff, 'lightswitch', 0.55); A.fx(tGlow, 'shimmer', 0.42); A.fx(tGlow + 0.05, 'sweep', 0.24);
A.fx(T.at('link'), 'click', 0.4); A.fx(tEnd, 'impact', 0.3); A.fx(tEnd + 0.08, 'shimmer', 0.2);
window.__cues = { dur: DUR, musica: { archivo: '744.mp3', desde: 0.25, gain: 0.42, duck: 0.55, fadein: 0.02, fadeout: 1.2, silencios: [[tOff - 0.05, tGlow + 0.1, 0.15]] }, voz: { gain: 1 }, sfx: A.SFX };
window.__dur = DUR; window.__render = (t) => render(t);
render(0); window.__ready = true;
if (!new URLSearchParams(location.search).has('record')) { const t0 = performance.now(); const loop = () => { render(((performance.now() - t0) / 1000) % DUR); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
