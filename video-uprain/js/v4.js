// Film 4, "El regalo" (20 s, regalo.wav): warm and slow, the sand finish with the amber light.
// 0-3 from above, out of warm bokeh; 3-7.5 who it is for, one line at a time; 7.5-14 four facts on glass chips;
// 14-20 the gift pack and the price.
export const DUR = 20;
export const AUDIO = 'audio/regalo.wav';
export const scene = { light: 'ambar', finish: 'arena', bg: '#0b0604', mistGain: 0.1, bloom: 0.75, rate: -0.5, strobe: true, mirrorOpts: { strength: 0.45, fade: 1.3, color: '#0d0705' } };

let S = {};
export async function setup(c) {
  c.U.setFinish('arena');
  // bokeh: soft warm discs drifting in front of the lens
  const bokeh = [];
  for (let i = 0; i < 26; i++) {
    const r = 40 + ((i * 53) % 110);
    const el = c.box('', { left: `${(i * 137) % 1080}px`, top: `${(i * 271) % 1920}px`, width: `${r}px`, height: `${r}px`, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,190,110,.55) 0%, rgba(255,150,70,.18) 55%, transparent 70%)', filter: 'blur(2px)', mixBlendMode: 'screen' });
    bokeh.push({ el, x: (i * 137) % 1080, y: (i * 271) % 1920, s: 0.4 + ((i * 7) % 10) / 10 });
  }
  const big = { fontSize: '92px', fontWeight: '600', letterSpacing: '-0.045em' };
  S.title = c.words('El regalo que nadie espera.', Object.assign({ top: '250px', fontSize: '80px' }, big));
  S.forWho = [
    [c.words('Para Navidad.', Object.assign({ top: '260px' }, big)), 3.2, 4.55],
    [c.words('Para Reyes.', Object.assign({ top: '260px' }, big)), 4.7, 6.05],
    [c.words('Para quien duerme con calefacción.', Object.assign({ top: '270px', fontSize: '64px' }, big)), 6.2, 7.6],
  ];
  const chip = (html, css) => c.box(`<div style="padding:26px 34px;border-radius:28px;background:rgba(255,236,214,.08);border:1px solid rgba(255,220,180,.28);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 20px 60px rgba(0,0,0,.35)">${html}</div>`, css);
  const k = (n, l) => `<div style="font:600 56px/1 Geist,sans-serif;letter-spacing:-.04em;color:#fff1e2">${n}</div><div style="margin-top:10px;font:500 24px/1.2 'Geist Mono',monospace;letter-spacing:.04em;color:rgba(255,226,196,.8)">${l}</div>`;
  S.chips = [
    [chip(k('<span class="n" data-to="800">0</span> ml', 'Depósito'), { left: '60px', top: '430px' }), 7.6],
    [chip(k('Toda la noche', 'Hasta 8 horas'), { left: '60px', top: '650px' }), 8.9],
    [chip(k('&lt; <span class="n" data-to="36">0</span> dB', 'Silencioso'), { left: '60px', top: '870px' }), 10.2],
    [chip(k('4 colores', 'De luz, con un toque'), { left: '60px', top: '1090px' }), 11.5],
  ];
  S.pack = c.words('Pack regalo', { top: '200px', fontSize: '150px', fontWeight: '600', letterSpacing: '-0.055em', color: '#fff1e2' });
  S.p1 = c.words('Caja rígida y tarjeta · 49,95 €', { top: '390px', fontSize: '50px', fontWeight: '400', letterSpacing: '-0.02em', color: '#ffe2c4' });
  S.p2 = c.words('Uprain · Envío 24-72 h desde España', { top: '480px', fontSize: '30px', fontWeight: '500', color: 'rgba(255,226,196,.85)' });
  S.p2.el.classList.add('mono');
  S.bokeh = bokeh;
  const { orbit } = c;
  S.cam = c.camPath([
    // a spiral down from straight above
    ...orbit({ t0: 0, t1: 3.2, at: [0, 0.12, 0], a0: -0.6, a1: 1.2, r0: 0.05, r1: 0.5, y0: 1.0, y1: 0.45, fov: 34, fov1: 32, ap: 0.01, n: 6 }),
    // round to the front, low
    ...orbit({ t0: 3.4, t1: 7.4, at: [0, 0.16, 0], a0: 1.35, a1: -0.4, r0: 0.55, r1: 0.62, y0: 0.38, y1: 0.12, fov: 32, ap: 0.014, n: 6 }),
    // a slow truck to the right, the product on the right, the chips on the left
    { t: 7.8, pos: [0.38, 0.17, 0.8], at: [-0.1, 0.17, 0], fov: 32 },
    { t: 10.8, pos: [0.06, 0.15, 0.92], at: [-0.11, 0.17, 0], fov: 32 },
    { t: 13.6, pos: [-0.3, 0.19, 0.84], at: [-0.08, 0.17, 0], fov: 32 },
    // a sweep round for the pack and the price
    ...orbit({ t0: 14.0, t1: 20.0, at: [0, 0.19, 0], a0: -0.42, a1: 0.25, r0: 0.95, r1: 1.14, y0: 0.2, y1: 0.21, fov: 33, fov1: 34, ap: 0.006, n: 6 }),
  ]);
}

export function update(c, t) {
  const { U } = c, T = U.three, { prog, ease, clamp } = c;
  U.setLight('#ffb259'); U.setYaw(0.2 + t * 0.03);
  c.mirror.mat.uniforms.tint.value.set('#ff9a4a').multiplyScalar(0.05);
  c.fx.wash(0.35, 'radial-gradient(90% 60% at 50% 42%, #ffb259 0%, #ff7a2f 40%, transparent 78%)');
  c.cam = S.cam(t);
  S.bokeh.forEach((b, i) => {
    const y = (b.y - t * 40 * b.s + 1920 * 4) % 2100 - 90;
    b.el.style.transform = `translate(${(Math.sin(t * 0.4 + i) * 20).toFixed(1)}px, ${(y - b.y).toFixed(1)}px)`;
    b.el.style.opacity = (0.6 * (0.4 + 0.6 * Math.sin(t * 0.7 + i * 1.3) ** 2) * (1 - 0.5 * prog(t, 7, 9))).toFixed(3);
  });
  c.wordsIn(S.title, t, 0.4, 2.9, { stagger: 0.08, dur: 0.7 });
  S.forWho.forEach(([l, a, b]) => c.wordsIn(l, t, a, b, { stagger: 0.06 }));
  S.chips.forEach(([el, a]) => {
    const kk = ease.back(prog(t, a, a + 0.6)), ko = ease.in(prog(t, 13.6, 14.0));
    el.style.opacity = (prog(t, a, a + 0.35) * (1 - ko)).toFixed(3);
    el.style.transform = `translateY(${((1 - kk) * 50).toFixed(1)}px) scale(${(0.9 + 0.1 * kk).toFixed(3)})`;
    el.querySelectorAll('.n').forEach((n) => { n.textContent = Math.round(+n.dataset.to * ease.out(prog(t, a, a + 1.1))); });
  });
  c.fx.flash(0.25 * Math.exp(-Math.max(0, t - 14) * 6) * (t >= 14 ? 1 : 0), '#ffd2a0');
  c.wordsIn(S.pack, t, 14.2, null, { stagger: 0, dur: 0.7, rise: 70, blur: 20 });
  c.wordsIn(S.p1, t, 14.7, null, { stagger: 0.05 });
  c.wordsIn(S.p2, t, 15.2, null, { stagger: 0.03, rise: 30 });
  document.getElementById('stage').style.filter = `brightness(${(clamp(t / 0.8) * (1 - prog(t, 19.5, 20))).toFixed(3)})`;
}
