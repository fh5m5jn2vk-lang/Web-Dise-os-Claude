// LÓNG · story 3, the gift: the red box open, the Oro y rojo dragon risen out of it in a spiral, fairy lights.
import { stage, V } from '../kit/kit.js';
const S = await stage({ set: 'regalo', bloom: 0.32 });
function render(t) {
  S.L.lid.position.set(2.3, 0.17, 1.9); S.L.lid.rotation.set(0.15, 0.6, -0.35);   // the lid off, on the table
  S.P.rise(0.4, 1, { base: 1.5, height: 1.9, r: 0.66, turns: 2.4 });
  S.frame(0.4, { cp: V(0.6, 3.55, 9.2), ca: V(0, 3.55, 0), fov: 40, col: 'orojo' });
}
for (const f of ['400 60px Anton', '800 60px Inter', '500 30px Mono', '800 60px Syne', '900 40px Han']) await document.fonts.load(f, 'Aá0龍¡');
window.__dur = 1; window.__render = render; render(0); window.__ready = true;
