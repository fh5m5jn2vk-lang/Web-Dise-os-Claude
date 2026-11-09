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
// only the Luminoso colour glows: while the city is dark the dragon wears it, then goes back to the chosen colour
function setDark(on) {
  sw.setAttribute('aria-pressed', String(on)); sw.textContent = on ? 'Encender la ciudad' : 'Apagar la ciudad';
  if (scene) { scene.setColor(on ? 'luminoso' : document.getElementById('buy-color').value); scene.setGlow(on ? 1 : 0); }
}
sw.addEventListener('click', () => { manual = true; setDark(sw.getAttribute('aria-pressed') !== 'true'); });
ScrollTrigger.create({ trigger: '#brilla', start: 'top 45%', end: 'bottom 55%', onEnter: () => !manual && setDark(true), onEnterBack: () => !manual && setDark(true), onLeave: () => setDark(false), onLeaveBack: () => setDark(false) });

/* ---------- colours ---------- */
// the keys of the swatches, and the colour names of the Shopify product's variants
const names = { metal: 'Metalizado multicolor', orojo: 'Oro y rojo', azulmorado: 'Azul y morado', azulverde: 'Azul y verde', oro: 'Oro', plata: 'Plata', pastel: 'Pastel variado', luminoso: 'Luminoso' };
function pickColor(key) {
  if (scene && sw.getAttribute('aria-pressed') !== 'true') scene.setColor(key);
  document.getElementById('buy-color').value = key;
  document.getElementById('buy-color-label').textContent = names[key];
}
document.querySelectorAll('#sw input').forEach((i) => i.addEventListener('change', () => { if (i.checked) pickColor(i.value); }));
// «Quiero el Luminoso»: choose it and go to the buy panel
document.getElementById('elegir-luminoso').addEventListener('click', () => {
  const r = document.querySelector('#sw input[value="luminoso"]'); r.checked = true; pickColor('luminoso');
  document.getElementById('comprar').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
});

/* ---------- buying: two separate acceptances, then Shopify's checkout ---------- */
// The store and the variant ids live in js/datos.js (LONG.shopify). Each acceptance travels with the order as a cart
// attribute (it shows under «Detalles adicionales» in the Shopify order): what was accepted, which version, when and how.
const buy = document.getElementById('buy'), buyError = document.getElementById('buy-error');
buy.noValidate = true; // our own messages replace the browser's (the required attributes stay for pages without JS)
buy.addEventListener('submit', (e) => {
  e.preventDefault();
  const missing = ['condiciones', 'privacidad'].filter((n) => !buy.elements[n].checked);
  if (missing.length) {
    buyError.textContent = missing.length === 2 ? 'Marca las dos casillas para continuar.'
      : missing[0] === 'condiciones' ? 'Acepta las condiciones de venta para continuar.' : 'Marca que has leído la política de privacidad para continuar.';
    buyError.hidden = false; buy.elements[missing[0]].focus(); return;
  }
  buyError.hidden = true;
  const L = window.LONG || {}, S = L.shopify || {};
  const d = new FormData(buy), color = d.get('color'), pack = d.get('pack');
  const now = new Date().toISOString(), version = `versión ${L.version} del ${L.fechaISO}`;
  const attrs = {
    'Condiciones de venta aceptadas': `${version} · ${now}`,
    'Política de privacidad leída': `${version} · ${now}`,
    'Cómo se aceptó': 'dos casillas separadas, sin marcar por defecto, en la web de LÓNG',
  };
  // in the Shopify store the theme hands over the live product (LONG_PRODUCTO): its variants are found by colour and pack
  const P = window.LONG_PRODUCTO, cantidad = pack === 'dos' ? '2 dragones' : '1 dragón';
  const live = P && P.variants && P.variants.find((v) => v.option1 === names[color] && v.option2 === cantidad);
  const id = S.tienda && (live ? live.id : S.variantes?.[color]?.[pack]);
  if (id) {
    const q = Object.entries(attrs).map(([k, v]) => `attributes[${encodeURIComponent(k)}]=${encodeURIComponent(v)}`).join('&');
    location.href = `https://${S.tienda}/cart/${id}:1?${q}`;
  } else if (S.tienda) {
    // the variant ids are not filled in yet: open the product page, where the colour and the pack are chosen again
    location.href = `https://${S.tienda}/products/${S.producto}`;
  } else {
    buyError.textContent = 'La tienda aún no está conectada. Vuelve pronto.';
    buyError.hidden = false;
  }
});

/* ---------- pause the 3D while the tab is hidden ---------- */
document.addEventListener('visibilitychange', () => scene && (document.hidden ? scene.pause() : scene.resume()));
