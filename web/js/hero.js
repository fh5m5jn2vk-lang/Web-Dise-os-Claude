// The hero's 3D entrance: the mask turns in from the dark and its LEDs light from the middle out.
// The poster (img.hero__bg) stays the picture when WebGL is missing or motion is reduced.
const hero = document.querySelector('[data-hero-3d]');
const canvas = hero && hero.querySelector('.hero__gl');
const pauseBtn = hero && hero.querySelector('.hero__pause');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function start() {
  if (!canvas || reduce || !document.documentElement.classList.contains('gl-3d')) return;
  try {
    const { createMaskScene } = await import('./mask3d.js');
    const wide = innerWidth >= 1024;
    const scene = createMaskScene(canvas, {
      view: 'hero',
      anchorX: (w, h) => (w / h > 1.2 ? 0.7 : 0.5),
      viewOverride: { fill: wide ? 0.72 : 0.9 },
      dpr: Math.min(devicePixelRatio || 1, wide ? 1.5 : 1.25),
    });
    canvas.dataset.live = '1';
    let userPaused = false, hidden = false;
    const apply = () => (userPaused || hidden ? scene.pause() : scene.resume());
    if (pauseBtn) {
      pauseBtn.hidden = false;
      pauseBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        pauseBtn.setAttribute('aria-pressed', String(userPaused));
        pauseBtn.setAttribute('aria-label', userPaused ? 'Reanudar el giro de la mascarilla' : 'Pausar el giro de la mascarilla');
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
