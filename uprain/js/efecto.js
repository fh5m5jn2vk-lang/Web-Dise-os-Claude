// The live demo in #efecto: the strobe switch and the light's rhythm drive the drop column.
// Right of the middle the light flashes faster than the drops fall (they seem to rise), at the middle they hang still,
// left of it they creep down; with the strobe off the drops fall at their real speed.
const section = document.getElementById('efecto');
const canvas = section && section.querySelector('.demo canvas');
const toggle = document.getElementById('efecto-luz');
const range = document.getElementById('efecto-ritmo');
const status = document.getElementById('efecto-estado');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let scene = null;

const rateOf = (v) => -(v / 100) * 0.9;
function describe() {
  const on = toggle.getAttribute('aria-pressed') === 'true';
  const v = +range.value;
  range.disabled = !on;
  if (!on) return 'Sin destellos ves lo que pasa de verdad: el agua cae rápido.';
  if (v > 8) return 'La luz va más rápida que las gotas: las ves subir.';
  if (v < -8) return 'La luz va más lenta que las gotas: las ves bajar despacio.';
  return 'La luz va al mismo ritmo que las gotas: se quedan quietas en el aire.';
}
function update() {
  status.textContent = describe();
  if (!scene) return;
  scene.setStrobe(toggle.getAttribute('aria-pressed') === 'true');
  scene.setRate(rateOf(+range.value));
}
toggle.addEventListener('click', () => {
  toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true'));
  update();
});
range.addEventListener('input', update);

async function start() {
  if (!canvas || reduce || !document.documentElement.classList.contains('gl-3d')) return;
  try {
    const { createUprainScene } = await import('./uprain3d.js');
    scene = createUprainScene(canvas, {
      view: 'column', live: true, rate: rateOf(+range.value), floor: true, mist: true,
      dpr: Math.min(devicePixelRatio || 1, 1.5), yaw: 0,
    });
    canvas.dataset.live = '1';
    // a GPU that rejects a shader draws only the ground: swap in a fresh canvas so its poster shows again
    setTimeout(() => { if (scene.failed()) { scene.destroy(); const fresh = canvas.cloneNode(false); delete fresh.dataset.live; canvas.replaceWith(fresh); } }, 700);
    update();
    let hidden = false;
    new IntersectionObserver(([e]) => { hidden = !e.isIntersecting; hidden ? scene.pause() : scene.resume(); }, { threshold: 0.02 }).observe(section);
    document.addEventListener('visibilitychange', () => (document.hidden || hidden ? scene.pause() : scene.resume()));
  } catch (err) {
    console.warn('3D demo off:', err);
  }
}
// start the demo's renderer only when the section comes near, so the first screen loads one 3D scene
if (canvas) {
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); start(); } }, { rootMargin: '400px 0px' });
  near.observe(section);
}
update();
