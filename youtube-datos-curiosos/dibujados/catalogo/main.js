// Hoja de catálogo de los dibujos de doodles.js (para revisarlos de un vistazo).
import { pizarra } from '../kit/dibujo.js';
import * as DD from '../kit/doodles.js';
import { PAL } from '../kit/bomba.js';
const estilo = new URLSearchParams(location.search).get('estilo') || 'blanca';
const D = pizarra(estilo, { mano: false });
const P = PAL[estilo];
const nombres = Object.keys(DD).filter((k) => !['C', 'EL', 'estrella'].includes(k)).slice(+(new URLSearchParams(location.search).get('desde') || 0));
const cols = 6, cw = 180, ch = 190;
nombres.forEach((n, i) => {
  const dd = DD[n](), x = (i % cols) * cw + 10, y = Math.floor(i / cols) * ch + 20, s = 0.38;
  const tf = `translate(${x} ${y}) scale(${s})`;
  const gb = D.grupo(D.bajo, { transform: tf }), g = D.capa(D.grupo(D.art, { transform: tf }));
  const lines = dd.t.map(([d, k = 1, c = null, giro = 0]) => { const l = D.linea(d, { g, color: c ? P[c] : P.k, w: 8 * k }); if (giro) l.setAttribute('transform', `rotate(${giro} 200 200)`); return l; });
  D.ya(lines);
  dd.f.forEach(([d, c, o = 0.55]) => { const z = D.colorea(d, { color: P[c] || c, t0: 0, dur: 0.01, g: gb, op: o, mano: false, paso: 30 }); D.ya(z); });
  D.el('text', { x: x + 5, y: y + ch - 18, 'font-size': 22, 'font-family': 'sans-serif', fill: '#c00' }, D.art).textContent = n;
});
window.__dur = 1; window.__cues = {}; window.__render = (t) => D.render(t); window.__render(0); window.__ready = true;
