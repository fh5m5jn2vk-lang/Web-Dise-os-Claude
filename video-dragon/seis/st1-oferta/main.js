// LÓNG · story 1, the offer: the Metalizado coiled on the studio turntable under rim lights; the price, free
// shipping and the link. A still: window.__render(t) draws it.
import { stage, V } from '../kit/kit.js';
const S = await stage({ set: 'estudio', bloom: 0.3 });
function render(t) {
  S.P.coil(0.4, { y: 0.14, rot: 1.0, lift: 0.26, look: 0.1 }); S.L.disc.rotation.y = 0.4; S.L.base.rimA = 1.1; S.L.lights(1);
  const a = 0.35; S.frame(0.4, { cp: V(Math.sin(a) * 6.0, 2.35, Math.cos(a) * 6.0), ca: V(0, 0.55, 0), fov: 38, col: 'metal' });
}
for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '900 40px Han']) await document.fonts.load(f, 'Aá0龍');
window.__dur = 1; window.__render = render; render(0); window.__ready = true;
