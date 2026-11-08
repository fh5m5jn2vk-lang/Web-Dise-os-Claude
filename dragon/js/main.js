// LÓNG: the intro, the scroll story and the controls. The 3D lives in scene.js.
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) document.documentElement.classList.add('reduce');

const canvas = document.getElementById('gl');
let scene = null;
try {
  const c = document.createElement('canvas');
  if (c.getContext('webgl2') || c.getContext('webgl')) {
    const { createScene } = await import('./scene.js');
    scene = createScene(canvas);
  }
} catch (e) { console.warn('3D off:', e); }

/* ---------- intro: the character draws itself, then the city opens ---------- */
const intro = document.getElementById('intro');
const han = intro.querySelector('.han--fill'), bar = intro.querySelector('.bar i'), count = intro.querySelector('.count');
const prog = { v: 0 };
// split the brand into letters, so they can part one by one
const brandEl = intro.querySelector('.brand');
brandEl.innerHTML = [...brandEl.textContent].map((ch) => `<span class="ch">${ch}</span>`).join('');
const swipe = intro.querySelector('.swipe');
let entered = false;
function finishIntro() {
  if (entered) return; entered = true;
  removeGestures();
  const svg = intro.querySelector('svg');
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { intro.remove(); document.body.classList.remove('is-locked'); ScrollTrigger.refresh(); } });
  tl.to(swipe, { opacity: 0, y: 20, duration: 0.35, ease: 'power2.in' })
    // the letters part and rise, the character rushes toward us and dissolves
    .to(brandEl.querySelectorAll('.ch'), { y: -60, opacity: 0, rotationX: 70, duration: 0.7, stagger: { each: 0.06, from: 'center' }, ease: 'power3.in' }, 0)
    .to([bar.parentNode, count], { opacity: 0, duration: 0.4 }, 0)
    .to(svg, { scale: 7, opacity: 0, filter: 'blur(18px)', duration: 1.25, ease: 'power3.in', transformOrigin: '50% 58%' }, 0.1)
    .to(intro.querySelector('.half--top'), { yPercent: -100, duration: 1.2, ease: 'power4.inOut' }, 0.55)
    .to(intro.querySelector('.half--bot'), { yPercent: 100, duration: 1.2, ease: 'power4.inOut' }, 0.55)
    .add(() => scene && gsap.to({ k: 1 }, { k: 0, duration: 2.4, ease: 'power3.out', onUpdate() { scene.fly(this.targets()[0].k); } }), 0.5)
    .to('#hero .rv', { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 1.25)
    .to('.big-han--hero', { opacity: 1, duration: 2, ease: 'power2.out' }, 1.25);
}
// the intro waits for a swipe: the wheel, a finger, a key or a click on the hint
let touchY = null;
const onWheel = (e) => { e.preventDefault(); if (ready && Math.abs(e.deltaY) > 6) finishIntro(); };
const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
const onTouchMove = (e) => { e.preventDefault(); if (ready && touchY != null && Math.abs(e.touches[0].clientY - touchY) > 40) finishIntro(); };
const onKey = (e) => { if (ready && ['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); finishIntro(); } };
let ready = false;
addEventListener('wheel', onWheel, { passive: false });
addEventListener('touchstart', onTouchStart, { passive: true });
addEventListener('touchmove', onTouchMove, { passive: false });
addEventListener('keydown', onKey);
swipe.addEventListener('click', () => ready && finishIntro());
function removeGestures() { removeEventListener('wheel', onWheel); removeEventListener('touchstart', onTouchStart); removeEventListener('touchmove', onTouchMove); removeEventListener('keydown', onKey); }
// wait for the Chinese face (at most 2.5 s), so the character is drawn whole and never in a fallback font
const fontReady = Promise.race([document.fonts.load('900 220px "Noto Serif TC"', '龍'), new Promise((r) => setTimeout(r, 2500))]).then(() => document.documentElement.classList.add('fonts-ready'));
await fontReady;
const inkRect = document.getElementById('inkRect');
if (reduce) { removeGestures(); gsap.set('.rv, .big-han--hero', { opacity: 1, y: 0 }); inkRect.setAttribute('y', '-20'); if (scene) scene.fly(0); intro.remove(); document.body.classList.remove('is-locked'); }
else {
  const outline = intro.querySelector('.han:not(.han--fill)');
  gsap.timeline()
    .to(outline, { strokeDashoffset: 0, duration: 2.0, ease: 'power2.inOut' })
    .to(inkRect, { attr: { y: -20 }, duration: 1.3, ease: 'power2.inOut' }, '-=0.6')
    .to(outline, { opacity: 0.35, duration: 0.6 }, '<')
    .to(prog, { v: 100, duration: 3.2, ease: 'power1.inOut', onUpdate: () => { const v = Math.round(prog.v); count.textContent = String(v).padStart(3, '0'); bar.style.width = v + '%'; } }, 0)
    .add(() => { ready = true; swipe.hidden = false; }, '+=0.2')
    .fromTo(swipe, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
}

/* ---------- pointer: the pearl, and the turn of a posed dragon ---------- */
addEventListener('pointermove', (e) => { if (scene) scene.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }, { passive: true });

/* ---------- scroll: each section sets the dragon's pose ---------- */
const state = { pose: 'line', w: 0, side: 0 };
const sections = [...document.querySelectorAll('.sec')];
const mobile = matchMedia('(max-width: 860px)').matches;
sections.forEach((sec) => {
  const pose = sec.dataset.pose, side = mobile ? 0 : +(sec.dataset.side || 0);
  ScrollTrigger.create({
    trigger: sec, start: 'top 60%', end: 'bottom 40%',
    onToggle: (self) => { if (!scene || !self.isActive) return; gsap.to(state, { w: pose === 'free' ? 0 : 1, duration: 1.4, ease: 'power3.inOut', onUpdate: apply }); state.pose = pose === 'free' ? state.pose : pose; state.side = side; apply(); },
  });
  // words rise once as the section comes in
  const rv = sec.querySelectorAll('.rv');
  if (sec.id !== 'hero' && rv.length && !reduce) gsap.to(rv, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: sec, start: 'top 70%' } });
});
function apply() { if (scene) scene.setPose(state.pose, state.w, state.side); }

// the ruler fills as section two comes in
gsap.to('.ruler__bar', { '--k': 1, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '#largo', start: 'top 55%' } });
// the whole page's progress: the camera drifts and the side bar fills
ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { if (scene) scene.setScroll(s.progress); document.querySelector('.progress i').style.height = s.progress * 100 + '%'; } });
// the city goes dark by itself while the glow section is on screen, and the switch does it too
const sw = document.getElementById('apagar');
let manual = false;
function setDark(on) { sw.setAttribute('aria-pressed', String(on)); sw.textContent = on ? 'Encender la ciudad' : 'Apagar la ciudad'; if (scene) scene.setGlow(on ? 1 : 0); }
sw.addEventListener('click', () => { manual = true; setDark(sw.getAttribute('aria-pressed') !== 'true'); });
ScrollTrigger.create({ trigger: '#brilla', start: 'top 45%', end: 'bottom 55%', onEnter: () => !manual && setDark(true), onEnterBack: () => !manual && setDark(true), onLeave: () => setDark(false), onLeaveBack: () => setDark(false) });

/* ---------- colours ---------- */
const names = { arcoiris: 'Arcoíris', galaxia: 'Galaxia', plata: 'Plata', fuego: 'Fuego' };
document.querySelectorAll('#sw input').forEach((i) => i.addEventListener('change', () => {
  if (!i.checked) return;
  if (scene) scene.setColor(i.value);
  document.getElementById('buy-color').value = i.value;
  document.getElementById('buy-color-label').textContent = names[i.value];
}));

/* ---------- Shopify: fill in the store and the variant ids (one per colour and pack) ---------- */
const SHOPIFY = { store: '', variants: { arcoiris: { uno: '', dos: '' }, galaxia: { uno: '', dos: '' }, plata: { uno: '', dos: '' }, fuego: { uno: '', dos: '' } } };
document.getElementById('buy').addEventListener('submit', (e) => {
  const d = new FormData(e.target);
  const id = SHOPIFY.store && SHOPIFY.variants[d.get('color')]?.[d.get('pack')];
  if (!id) return; // not set up yet: the mailto stand-in runs
  e.preventDefault(); location.href = `https://${SHOPIFY.store}/cart/${id}:1`;
});

/* ---------- pause the 3D while the tab is hidden ---------- */
document.addEventListener('visibilitychange', () => scene && (document.hidden ? scene.pause() : scene.resume()));
