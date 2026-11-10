// LÓNG · story 2, the glow: the bedroom at night, the lamp off, the Luminoso glowing on the nightstand.
import { stage, V } from '../kit/kit.js';
const S = await stage({ set: 'cuarto', bloom: 0.3 });
function render(t) {
  S.P.coil(0.4, { lift: 0.52, rot: 0.6 }); S.L.lamp(0);
  const a = 0.4, r = 5.6; S.frame(0.4, { cp: V(Math.sin(a) * r, 2.0, Math.cos(a) * r + 0.3), ca: V(-0.1, 0.95, 0.1), fov: 40, col: 'luminoso', glow: 0.95, exposure: 0.95, glowLight: 1.4 });
}
for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '900 40px Han']) await document.fonts.load(f, 'Aá0龍…');
window.__dur = 1; window.__render = render; render(0); window.__ready = true;
