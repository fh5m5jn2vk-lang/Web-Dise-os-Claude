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
  S.cam = c.camPath([
    { t: 0, pos: [0.1, 0.2, 0.22], at: [0, 0.2, 0], fov: 30 },
    { t: 2.6, pos: [0.14, 0.19, 0.3], at: [0, 0.19, 0], fov: 30 },
    { t: 5.0, pos: [0.36, 0.17, 0.62], at: [0, 0.16, 0], fov: 32 },
    { t: 8.8, pos: [0.2, 0.17, 0.42], at: [0, 0.16, 0], fov: 30 },
    // bullet time round the frozen drops
    { t: 9.4, pos: [0.13, 0.19, 0.2], at: [0, 0.18, 0], fov: 30 },
    { t: 10.2, pos: [-0.2, 0.18, 0.08], at: [0, 0.18, 0], fov: 30 },
    { t: 11.0, pos: [-0.12, 0.2, -0.18], at: [0, 0.18, 0], fov: 30 },
    { t: 11.5, pos: [0.06, 0.16, -0.24], at: [0, 0.2, 0], fov: 30 },
    { t: 12.5, pos: [0.22, 0.08, 0.3], at: [0, 0.22, 0], fov: 32 },
    { t: 14.5, pos: [0.45, 0.24, 0.72], at: [0, 0.18, 0], fov: 32 },
    { t: 17.0, pos: [0.3, 0.2, 1.05], at: [0, 0.2, 0], fov: 34 },
    { t: 20.0, pos: [0.18, 0.21, 1.12], at: [0, 0.2, 0], fov: 34 },
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
