// Film 2, "Cuatro colores" (21 s, colores.wav at 120 BPM): a hard cut and a new colour every two bars.
// 0-2 macro of the drops; 2, 6, 10, 14 hielo, ámbar, cobalto, menta, each with its own camera move;
// 17-21 the end card, the light stepping through the four colours on the beat.
export const DUR = 21;
export const AUDIO = 'audio/colores.wav';
export const scene = { light: 'hielo', bg: '#040506', mistGain: 0.07, bloom: 0.85, rate: -0.65, strobe: true, mirrorOpts: { strength: 0.5, fade: 1.3 } };

const COLS = [
  { name: 'Hielo', hex: '#a6e1ff', bg: '#03070b' },
  { name: 'Ámbar', hex: '#ffb259', bg: '#0b0603' },
  { name: 'Cobalto', hex: '#3d63ff', bg: '#04050d' },
  { name: 'Menta', hex: '#6dffc8', bg: '#030a07' },
];
const BEAT = 0.5;
let S = {};

export async function setup(c) {
  const intro = c.words('Cuatro colores de luz.', { top: '250px', fontSize: '84px', fontWeight: '600', letterSpacing: '-0.04em' });
  const label = c.words('Color de la luz', { top: '235px', fontSize: '30px', fontWeight: '500', color: 'rgba(242,245,248,.7)' });
  label.el.classList.add('mono');
  const names = COLS.map((col) => c.words(col.name, { top: '290px', fontSize: '210px', fontWeight: '600', letterSpacing: '-0.06em', color: col.hex }));
  const brand = c.words('Uprain', { top: '200px', fontSize: '170px', fontWeight: '600', letterSpacing: '-0.055em' });
  const l1 = c.words('Cambia de color con un toque.', { top: '410px', fontSize: '52px', fontWeight: '400', letterSpacing: '-0.02em' });
  const l2 = c.words('44,95 € · Envío 24-72 h desde España', { top: '500px', fontSize: '30px', fontWeight: '500', color: 'rgba(242,245,248,.85)' });
  l2.el.classList.add('mono');
  // four dots that show which colour is on
  const dots = c.box(COLS.map((col) => `<i style="display:inline-block;width:22px;height:22px;border-radius:50%;margin:0 9px;background:${col.hex};opacity:.25"></i>`).join(''), { top: '560px', left: '0', right: '0', textAlign: 'center' });
  S = {
    intro, label, names, brand, l1, l2, dots,
    cams: (() => {
      const { orbit, follow, prog } = c;
      return [
        // intro: a macro rise along the drops
        c.camPath(orbit({ t0: 0, t1: 2.05, at: [0, 0.2, 0], a0: 0.4, a1: -0.3, r0: 0.21, r1: 0.18, y0: 0.11, y1: 0.28, fov: 30, ap: 0.035, n: 4 })),
        // hielo: a low half turn
        c.camPath(orbit({ t0: 2, t1: 6.05, at: [0, 0.16, 0], a0: -1.5, a1: 1.8, r0: 0.72, r1: 0.6, y0: 0.05, y1: 0.12, fov: 32, ap: 0.012, roll: 0.03, n: 8 })),
        // ámbar: a spiral down from above
        c.camPath(orbit({ t0: 6, t1: 10.05, at: [0, 0.13, 0], a0: 0.3, a1: 2.7, r0: 0.22, r1: 0.7, y0: 0.95, y1: 0.18, fov: 33, ap: 0.01, n: 8 })),
        // cobalto: a macro climb round the column, rolling
        c.camPath(follow({ t0: 10, t1: 14.05, p: (t) => [0, 0.07 + 0.25 * prog(t, 10, 14), 0], lead: 0.02, fov: 30, ap: 0.035, roll: 0.08, n: 8,
          offset: (t, a) => { const k = prog(t, 10, 14), ang = -0.7 + 1.5 * k; return [Math.sin(ang) * 0.2, a[1] + 0.012, Math.cos(ang) * 0.2]; } })),
        // menta: a sweeping dolly in from wide
        c.camPath(orbit({ t0: 14, t1: 17.05, at: [0, 0.17, 0], a0: -2.5, a1: 0.45, r0: 1.25, r1: 0.6, y0: 0.38, y1: 0.14, fov: 30, fov1: 32, ap: 0.01, roll: 0.02, n: 7 })),
        // end card: a slow drift
        c.camPath(orbit({ t0: 17, t1: 21, at: [0, 0.2, 0], a0: 0.5, a1: -0.25, r0: 1.22, r1: 1.12, y0: 0.21, y1: 0.2, fov: 34, ap: 0.006, n: 4 })),
      ];
    })(),
  };
}

export function update(c, t) {
  const { U } = c, T = U.three, { prog, ease, clamp } = c;
  const seg = t < 2 ? -1 : t < 17 ? Math.min(3, Math.floor((t - 2) / 4)) : 4;
  // the colour: by segment, then stepping on every beat in the end card
  let ci = seg < 0 ? 0 : seg < 4 ? seg : Math.floor((t - 17) / BEAT) % 4;
  if (t > 19.5) ci = 0;
  const col = COLS[ci];
  U.setLight(col.hex);
  const bg = new c.THREE.Color(col.bg);
  T.scene.background = bg; T.renderer.setClearColor(bg);
  c.mirror.mat.uniforms.tint.value.set(col.hex).multiplyScalar(0.035);
  U.setYaw(0.4 + t * 0.05);

  // the beat: bloom breathes on every kick from 2 s
  const sinceBeat = t >= 2 ? (t - 2) % BEAT : 1;
  T.bloom.strength = 0.8 + (t >= 2 && t < 17 ? 0.35 * Math.exp(-sinceBeat * 9) : 0);
  // a white hit on every cut
  const cut = [2, 6, 10, 14, 17].reduce((a, x) => (t >= x && t - x < a ? t - x : a), 9);
  c.fx.flash(0.55 * Math.exp(-cut * 11), '#ffffff');
  c.fx.wash(0.22, `radial-gradient(80% 55% at 50% 45%, ${col.hex} 0%, transparent 75%)`);

  // camera, with a small kick on the beat
  const camI = seg < 0 ? 0 : seg + 1;
  const cam = S.cams[camI](t);
  const kick = t >= 2 && t < 17 ? Math.exp(-sinceBeat * 14) * 0.004 : 0;
  cam.pos[1] += kick; cam.fov -= kick * 120;
  c.cam = cam;

  // words
  c.wordsIn(S.intro, t, 0.25, 1.65, { stagger: 0.07 });
  S.names.forEach((n, k) => {
    const a = 2 + 4 * k;
    c.wordsIn(n, t, a + 0.05, a + 3.65, { stagger: 0, dur: 0.45, rise: 90, blur: 20, out: 0.3 });
    n.el.style.letterSpacing = `${(-0.06 + 0.02 * ease.out(prog(t, a, a + 4))).toFixed(3)}em`;
  });
  c.wordsIn(S.label, t, 2.1, 16.7, { stagger: 0.02 });
  c.wordsIn(S.brand, t, 17.1, null, { stagger: 0, dur: 0.6, rise: 70, blur: 20 });
  c.wordsIn(S.l1, t, 17.5, null, { stagger: 0.05 });
  c.wordsIn(S.l2, t, 17.9, null, { stagger: 0.03, rise: 30 });
  S.dots.style.opacity = prog(t, 18.1, 18.6).toFixed(3);
  [...S.dots.children].forEach((d, k) => { d.style.opacity = k === ci ? '1' : '.25'; d.style.transform = `scale(${k === ci ? 1.25 : 1})`; });
  document.getElementById('stage').style.filter = `brightness(${(clamp(t / 0.4) * (1 - prog(t, 20.6, 21))).toFixed(3)})`;
}
