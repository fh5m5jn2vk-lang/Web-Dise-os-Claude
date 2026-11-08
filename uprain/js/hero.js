// The hero: the humidifier rises in from the dark, its light comes on and the drops start to climb.
// Drag to turn it. The poster (the canvas background) stays the picture without WebGL or with reduced motion.
const hero = document.querySelector('[data-hero-3d]');
const canvas = hero && hero.querySelector('.hero__gl');
const pauseBtn = hero && hero.querySelector('.hero__pause');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function start() {
  if (!canvas || reduce || !document.documentElement.classList.contains('gl-3d')) return;
  try {
    const { createUprainScene } = await import('./uprain3d.js');
    const wide = innerWidth >= 1024;
    const scene = createUprainScene(canvas, {
      view: 'hero', live: true, entrance: true, drag: true, rate: -0.55,
      anchorX: (w, h) => (w / h > 1.2 ? 0.72 : 0.5),
      fill: wide ? 0.68 : 0.8,
      dpr: Math.min(devicePixelRatio || 1, wide ? 1.5 : 1.25),
    });
    canvas.dataset.live = '1';
    // a GPU that rejects a shader draws only the ground: swap in a fresh canvas so its poster shows again
    setTimeout(() => { if (scene.failed()) { scene.destroy(); const fresh = canvas.cloneNode(false); delete fresh.dataset.live; canvas.replaceWith(fresh); } }, 700);
    let userPaused = false, hidden = false;
    const apply = () => (userPaused || hidden ? scene.pause() : scene.resume());
    if (pauseBtn) {
      pauseBtn.hidden = false;
      pauseBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        pauseBtn.setAttribute('aria-pressed', String(userPaused));
        pauseBtn.setAttribute('aria-label', userPaused ? 'Reanudar el humidificador en 3D' : 'Pausar el humidificador en 3D');
        pauseBtn.innerHTML = userPaused
          ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l8 5-8 5z"/></svg>'
          : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3h3v10H4zM9 3h3v10H9z"/></svg>';
        apply();
      });
    }
    new IntersectionObserver(([e]) => { hidden = !e.isIntersecting; apply(); }, { threshold: 0.02 }).observe(hero);
    document.addEventListener('visibilitychange', () => { hidden = document.hidden; apply(); });
  } catch (err) {
    document.documentElement.classList.remove('gl-3d');
    console.warn('3D hero off:', err);
  }
}
start();
