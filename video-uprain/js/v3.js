// Film 3, "El truco de luz" (20 s, truco.wav): how the drops seem to climb, said in five short lines.
// 0 the drops rise; 2.6 the strobe goes off and the water falls; 5.0 the light comes back slower than the drops
// and slows down; 9.0 the light matches the drops and they freeze (bullet time, the music stops); 11.5 the light
// runs faster and the drops climb (the drop); 17 the end card.
export const DUR = 20;
export const AUDIO = 'audio/truco.wav';
export const scene = { light: 'hielo', bg: '#030405', mistGain: 0.06, bloom: 0.85, rate: -0.6, strobe: true, mirrorOpts: { strength: 0.5, fade: 1.2 } };

let S = {};
export async function setup(c) {
  const css = { fontSize: '76px', fontWeight: '600', letterSpacing: '-0.04em' };
  S.lines = [
    [c.words('Estas gotas suben.', Object.assign({ top: '250px' }, css)), 0.2, 2.45],
    [c.words('Pero el agua cae.', Object.assign({ top: '250px' }, css)), 2.7, 4.85],
    [c.words('El truco es la luz.', Object.assign({ top: '250px' }, css)), 5.1, 8.75],
    [c.words('Al ritmo del agua, se paran.', Object.assign({ top: '250px', fontSize: '68px' }, css)), 9.1, 11.3],
    [c.words('Un poco más rápida: suben.', Object.assign({ top: '250px', fontSize: '68px' }, css)), 11.6, 16.6],
  ];
  // the light's rhythm as a slider, the page's own control
  S.slider = c.box(`
    <div style="width:640px;margin:0 auto;font:500 26px/1 'Geist Mono',monospace;letter-spacing:.06em;color:rgba(242,245,248,.75)">
      <div style="text-align:center;margin-bottom:26px">Ritmo de la luz</div>
      <div style="position:relative;height:10px;border-radius:5px;background:rgba(255,255,255,.14)">
        <div class="fill" style="position:absolute;left:50%;top:0;bottom:0;width:0;border-radius:5px;background:#a6e1ff"></div>
        <div class="knob" style="position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:#fff;box-shadow:0 0 30px #a6e1ff,0 0 4px #fff"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:24px;font-size:22px"><span>Más lenta</span><span>Igual</span><span>Más rápida</span></div>
    </div>`, { top: '400px', left: '0', right: '0' });
  S.knob = S.slider.querySelector('.knob'); S.fill = S.slider.querySelector('.fill');
  S.brand = c.words('Uprain', { top: '200px', fontSize: '170px', fontWeight: '600', letterSpacing: '-0.055em' });
  S.e1 = c.words('Humidificador antigravedad', { top: '410px', fontSize: '52px', fontWeight: '400', letterSpacing: '-0.02em' });
  S.e2 = c.words('44,95 € · Envío 24-72 h desde España', { top: '500px', fontSize: '30px', fontWeight: '500', color: 'rgba(242,245,248,.85)' });
  S.e2.el.classList.add('mono');
  const { orbit } = c;
  S.cam = c.camPath([
    // macro on the climbing drops, drifting round
    ...orbit({ t0: 0, t1: 2.6, at: [0, 0.2, 0], a0: 0.5, a1: 0.05, r0: 0.22, r1: 0.26, y0: 0.18, y1: 0.2, fov: 30, ap: 0.035, n: 4 }),
    // the water falls: pull back and swing to the other side
    ...orbit({ t0: 2.8, t1: 5.0, at: [0, 0.17, 0], a0: -0.1, a1: -0.9, r0: 0.34, r1: 0.62, y0: 0.2, y1: 0.16, fov: 31, ap: 0.014, n: 4 }),
    // the light slows: a slow push back in
    ...orbit({ t0: 5.2, t1: 8.8, at: [0, 0.17, 0], a0: -0.85, a1: 0.25, r0: 0.62, r1: 0.4, y0: 0.15, y1: 0.18, fov: 32, ap: 0.014, n: 5 }),
    // bullet time: almost a full turn round the frozen drops
    ...orbit({ t0: 9.0, t1: 11.5, at: [0, 0.19, 0], a0: 0.3, a1: -4.6, r0: 0.21, r1: 0.23, y0: 0.2, y1: 0.18, fov: 30, ap: 0.03, n: 10 }),
    // the drop: a fast crane down and out, then round
    ...orbit({ t0: 11.7, t1: 14.6, at: [0, 0.2, 0], a0: -4.85, a1: -6.4, r0: 0.28, r1: 0.74, y0: 0.08, y1: 0.24, fov: 31, fov1: 32, ap: 0.012, n: 6 }),
    // end card
    ...orbit({ t0: 15.0, t1: 20.0, at: [0, 0.2, 0], a0: -6.55, a1: -6.15, r0: 0.86, r1: 1.12, y0: 0.22, y1: 0.21, fov: 33, fov1: 34, ap: 0.006, n: 5 }),
  ]);
}

export function update(c, t) {
  const { U } = c, T = U.three, { prog, ease, clamp, lerp } = c;
  // the light's rhythm: -1 slower than the drops (they creep down), 0 the same (they hang), 1 faster (they climb)
  let rhythm;
  if (t < 2.6) rhythm = 0.65;
  else if (t < 5.0) rhythm = 0.65;
  else if (t < 9.0) rhythm = lerp(-0.7, 0, ease.inOut(prog(t, 5.6, 8.9)));
  else if (t < 11.5) rhythm = 0;
  else rhythm = lerp(0, 0.9, ease.outExpo(prog(t, 11.5, 12.2)));
  U.setStrobe(!(t >= 2.6 && t < 5.0));
  U.setRate(-rhythm * 0.85);
  U.setLight('#a6e1ff');
  U.setYaw(0.3 + (t < 9 || t > 11.5 ? t * 0.02 : 0.18));
  const hit = [2.6, 5.0, 9.0, 11.5, 17.0].reduce((a, x) => (t >= x && t - x < a ? t - x : a), 9);
  c.fx.flash((t >= 11.5 && t < 12.5 ? 0.6 : 0.35) * Math.exp(-hit * 9), '#dff4ff');
  T.bloom.strength = 0.8 + (t >= 11.5 && t < 17 ? 0.25 * Math.exp(-((t - 11.5) % 0.6) * 8) : 0);
  // a darker, cooler world while the water falls
  U.setExposure(t >= 2.6 && t < 5 ? 0.85 : 1);
  c.cam = S.cam(t);

  S.lines.forEach(([l, a, b]) => c.wordsIn(l, t, a, b, { stagger: 0.07 }));
  // the slider shows from 5 to 16.6
  const show = prog(t, 5.2, 5.7) * (1 - prog(t, 16.4, 16.8));
  S.slider.style.opacity = show.toFixed(3);
  S.slider.style.transform = `translateY(${((1 - ease.out(prog(t, 5.2, 5.8))) * 30).toFixed(1)}px)`;
  const x = 50 + 50 * rhythm;
  S.knob.style.left = `${x}%`;
  S.fill.style.left = `${Math.min(50, x)}%`; S.fill.style.width = `${Math.abs(x - 50)}%`;
  S.knob.style.transform = `scale(${(1 + 0.25 * Math.exp(-hit * 6)).toFixed(3)})`;
  c.wordsIn(S.brand, t, 17.1, null, { stagger: 0, dur: 0.6, rise: 70, blur: 20 });
  c.wordsIn(S.e1, t, 17.5, null, { stagger: 0.06 });
  c.wordsIn(S.e2, t, 17.9, null, { stagger: 0.03, rise: 30 });
  document.getElementById('stage').style.filter = `brightness(${(clamp(t / 0.4) * (1 - prog(t, 19.6, 20))).toFixed(3)})`;
}
