// LÓNG · doodles for the drawing films, as path data, built from a few numbers so they can be drawn, coloured and
// re-used: a Chinese dragon in profile (its body from a spine with a width, its head drawn by hand, legs with a chosen
// number of claws), a claw on its own, a western dragon, clouds, rain, a scroll, a bone, a crown and some more.
import { suave } from './dibujo.js';

const f1 = (v) => +v.toFixed(1);
const P = (pts) => 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L');
// sample a Catmull-Rom spine into n points with tangents
function spine(pts, n) {
  const P2 = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(u)), t = u - k;
    const [p0, p1, p2, p3] = [P2[k], P2[k + 1], P2[k + 2], P2[k + 3]];
    const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
    out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out.map((p, i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(n - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return { x: p[0], y: p[1], tx: dx / L, ty: dy / L, nx: -dy / L, ny: dx / L }; });
}

// a claw: a palm and n hooked talons fanned out around direction ang (radians), size r; with pierna, the scaly leg
// it hangs from (going the other way)
export function garra(cx, cy, n = 5, r = 40, ang = Math.PI / 2, abre = 1.6, pierna = false) {
  const talons = [];
  for (let i = 0; i < n; i++) {
    const a = ang + (n === 1 ? 0 : (i / (n - 1) - 0.5) * abre);
    const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
    const b = [cx + ux * r * 0.5, cy + uy * r * 0.5];          // where the toe leaves the palm
    const k = [cx + ux * r * 1.3, cy + uy * r * 1.3];          // the last knuckle
    const tip = [cx + ux * r * 2.05 + vx * r * 0.5, cy + uy * r * 2.05 + vy * r * 0.5];   // the hooked tip
    const w = r * 0.27;
    talons.push({
      toe: suave([[b[0] + vx * w, b[1] + vy * w], [k[0] + vx * w * 0.85, k[1] + vy * w * 0.85], [k[0] + ux * r * 0.16, k[1] + uy * r * 0.16], [k[0] - vx * w * 0.85, k[1] - vy * w * 0.85], [b[0] - vx * w, b[1] - vy * w]]),
      una: `M${f1(k[0] + vx * w * 0.75)} ${f1(k[1] + vy * w * 0.75)} Q${f1(tip[0] - ux * r * 0.05 + vx * r * 0.2)} ${f1(tip[1] - uy * r * 0.05 + vy * r * 0.2)} ${f1(tip[0])} ${f1(tip[1])} Q${f1(k[0] + ux * r * 0.55 + vx * r * 0.1)} ${f1(k[1] + uy * r * 0.55 + vy * r * 0.1)} ${f1(k[0] - vx * w * 0.75)} ${f1(k[1] - vy * w * 0.75)} Z`,
    });
  }
  const palma = suave(Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return [cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.6]; }), true);
  let leg = null;
  if (pierna) {
    const ux = -Math.cos(ang), uy = -Math.sin(ang), vx = -uy, vy = ux, L = r * 2.4;
    const p0 = [cx + ux * r * 0.4, cy + uy * r * 0.4];
    const side = (sg) => suave([[p0[0] + vx * r * 0.62 * sg, p0[1] + vy * r * 0.62 * sg], [p0[0] + ux * L * 0.5 + vx * r * 0.5 * sg, p0[1] + uy * L * 0.5 + vy * r * 0.5 * sg], [p0[0] + ux * L + vx * r * 0.62 * sg, p0[1] + uy * L + vy * r * 0.62 * sg]]);
    let esc = ''; for (let k2 = 0.2; k2 < 0.95; k2 += 0.22) { const c = [p0[0] + ux * L * k2, p0[1] + uy * L * k2]; esc += `M${f1(c[0] - vx * r * 0.5)} ${f1(c[1] - vy * r * 0.5)} Q${f1(c[0] - ux * r * 0.5)} ${f1(c[1] - uy * r * 0.5)} ${f1(c[0] + vx * r * 0.5)} ${f1(c[1] + vy * r * 0.5)} `; }
    leg = { a: side(1), b: side(-1), escamas: esc };
  }
  return { palma, talons, leg };
}

// the Chinese dragon in profile, facing left, in a 1000 x 700 box. Options: claws per foot, a chimu bump on the head
export function dragon({ garras = 5, chimu = false } = {}) {
  const S = spine([[250, 300], [360, 250], [480, 330], [570, 450], [690, 485], [800, 410], [870, 310], [940, 265]], 64);
  const W = (u) => (u < 0.12 ? 62 + u * 220 : u < 0.6 ? 88 + Math.sin(((u - 0.12) / 0.48) * Math.PI) * 14 : 88 * Math.pow(1 - (u - 0.6) / 0.4, 1.15) + 12);
  const top = [], bot = [], mid = [], bel = [];
  S.forEach((p, i) => { const u = i / (S.length - 1), w = W(u) / 2; top.push([p.x - p.nx * w, p.y - p.ny * w]); bot.push([p.x + p.nx * w, p.y + p.ny * w]); mid.push([p.x, p.y]); bel.push([p.x + p.nx * w * 0.45, p.y + p.ny * w * 0.45]); });
  const range = (a, b, arr) => arr.slice(Math.round(a * 63), Math.round(b * 63) + 1);
  const poly = (a, b, A, B) => suave([...range(a, b, A), ...range(a, b, B).reverse()], true);
  // the body: back and belly lines, the belly band and its plates, scalloped carp scales, a spiky crest, the tail tuft
  const lomo = suave(range(0.02, 1, top)), panza = suave(range(0.02, 1, bot));
  const bandaV = suave(range(0.06, 0.86, bel));
  let placas = ''; for (let u = 0.08; u < 0.85; u += 0.035) { const i = Math.round(u * 63), a = bel[i], b = bot[i]; placas += `M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])} `; }
  const escamas = [0.3, 0.0, -0.3].map((off, row) => {
    let d = '';
    for (let u = 0.12 + row * 0.012; u < 0.84; u += 0.04) {
      const i = Math.round(u * 63), j = Math.min(63, Math.round((u + 0.04) * 63)), p = S[i], q = S[j], w = W(u) / 2;
      const a = [p.x - p.nx * w * off, p.y - p.ny * w * off], b = [q.x - q.nx * w * off, q.y - q.ny * w * off];
      const r = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.55;
      const m = [(a[0] + b[0]) / 2 + p.tx * r * 1.2 + p.nx * r * 0.6, (a[1] + b[1]) / 2 + p.ty * r * 1.2 + p.ny * r * 0.6];
      d += `M${f1(a[0])} ${f1(a[1])} Q${f1(m[0])} ${f1(m[1])} ${f1(b[0])} ${f1(b[1])} `;
    }
    return d;
  });
  let cresta = ''; let fc = true;
  for (let u = 0.06; u < 0.93; u += 0.028) { const i = Math.round(u * 63), p = S[i], w = W(u) / 2, h = 14 + (u < 0.5 ? u * 20 : (1 - u) * 20); const a = [p.x - p.nx * w, p.y - p.ny * w], t = [p.x - p.nx * (w + h) + p.tx * 10, p.y - p.ny * (w + h) + p.ty * 10]; cresta += (fc ? `M${f1(a[0])} ${f1(a[1])} ` : `L${f1(a[0])} ${f1(a[1])} `) + `L${f1(t[0])} ${f1(t[1])} `; fc = false; }
  const e = S[63], cola = [`M${f1(e.x)} ${f1(e.y)} Q${f1(e.x + 30)} ${f1(e.y - 60)} ${f1(e.x + 70)} ${f1(e.y - 70)} Q${f1(e.x + 40)} ${f1(e.y - 30)} ${f1(e.x + 80)} ${f1(e.y - 10)} Q${f1(e.x + 40)} ${f1(e.y)} ${f1(e.x + 60)} ${f1(e.y + 40)} Q${f1(e.x + 20)} ${f1(e.y + 20)} ${f1(e.x)} ${f1(e.y)}`];
  // the head, facing left
  const cabeza = 'M262 268 Q236 236 212 236 Q182 228 150 238 Q118 244 92 250 Q70 254 62 268 Q60 280 74 284 Q100 294 140 298 L186 300 Q172 312 150 320 Q118 330 92 330 Q74 326 78 314 Q84 304 100 306 L150 304 Q200 330 258 338';
  const cabezaZona = 'M262 268 Q236 236 212 236 Q182 228 150 238 Q118 244 92 250 Q70 254 62 268 Q60 280 74 284 Q100 294 140 298 L186 300 Q172 312 150 320 Q118 330 92 330 Q74 326 78 314 Q84 304 100 306 L150 304 Q200 330 258 338 Z';
  const ojo = 'M150 262 Q170 246 192 258 Q172 274 150 262 Z', pupila = 'M171 256 Q177 260 171 266 Q165 260 171 256 Z', ceja = 'M146 248 Q170 232 198 244';
  const nariz = 'M84 258 Q76 252 72 260 Q74 268 82 266';
  const colmillos = ['M100 296 L106 310 L112 297', 'M132 300 L136 312 L141 301', 'M118 318 L122 306 L127 318'];
  const oreja = 'M214 258 Q236 222 266 216 Q252 246 226 268 Z';
  const cuernos = ['M202 238 Q210 205 236 172 Q252 152 280 138', 'M216 204 Q200 186 196 166', 'M240 168 Q232 148 236 128', 'M262 150 Q270 132 290 120',
                   'M224 240 Q236 212 258 190 Q272 176 296 168', 'M258 190 Q256 172 264 156'];
  const bigotes = ['M70 270 Q40 246 22 274 Q8 296 -20 284', 'M96 294 Q70 330 44 316 Q26 306 2 336'];
  const crin = 'M226 244 L250 214 L258 246 L284 222 L286 254 L310 236 L304 266';
  const chimuD = chimu ? 'M148 240 Q154 214 176 214 Q194 216 196 236' : null;
  // legs: thick limbs from the belly, a foot with talons
  const pata = (u, back) => {
    const i = Math.round(u * 63), b = bot[i], p = S[i];
    const knee = [b[0] - 26 + (back ? 34 : 0), b[1] + 62], foot = [b[0] - 40 + (back ? 16 : 0), b[1] + 118];
    const w0 = 36, w1 = 24;
    const L = suave([[b[0] - w0, b[1] - 6], [knee[0] - w0 * 0.8, knee[1]], [foot[0] - w1, foot[1] - 8]]), R = suave([[foot[0] + w1, foot[1] - 10], [knee[0] + w0 * 0.8 + 6, knee[1] + 4], [b[0] + w0, b[1] - 6]]);
    const zona = suave([[b[0] - w0, b[1] - 6], [knee[0] - w0 * 0.8, knee[1]], [foot[0] - w1, foot[1] - 8], [foot[0], foot[1] + 4], [foot[0] + w1, foot[1] - 10], [knee[0] + w0 * 0.8 + 6, knee[1] + 4], [b[0] + w0, b[1] - 6]], true);
    return { L, R, zona, g: garra(foot[0] - 6, foot[1] + 10, garras, 28, Math.PI * 0.62, 1.7), foot };
  };
  const delante = pata(0.2, false), detras = pata(0.66, true);
  // zones to colour in (the nine resemblances)
  const zonas = {
    cuello: poly(0.0, 0.16, top, bot),
    vientre: suave([...range(0.06, 0.86, bel), ...range(0.06, 0.86, bot).reverse()], true),
    escamas: suave([...range(0.16, 0.86, top), ...range(0.16, 0.86, bel).reverse()], true),
    cabeza: cabezaZona, ojo, oreja,
  };
  const costuras = [0.16, 0.86].map((u) => { const i = Math.round(u * 63), a = top[i], b = bot[i], p = S[i]; let d = `M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])} `; for (let k = 0.12; k < 0.95; k += 0.17) { const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k; d += `M${f1(x - p.tx * 13)} ${f1(y - p.ty * 13)} L${f1(x + p.tx * 13)} ${f1(y + p.ty * 13)} `; } return d; });
  costuras.push('M246 244 L258 340 M236 262 L262 258 M240 286 L266 282 M244 310 L268 306');
  return { S, lomo, panza, bandaV, placas, escamas, cresta, cola, cabeza, ojo, pupila, ceja, nariz, colmillos, oreja, cuernos, bigotes, crin, chimu: chimuD, delante, detras, zonas, costuras, top, bot };
}

// a western dragon: bat wings, a lizard body, fire from the mouth (facing right, 0..700 x 0..500)
export function dragonOeste() {
  return {
    cuerpo: 'M120 330 Q180 280 260 300 Q340 320 400 300 Q450 284 480 250 Q500 226 530 230 Q560 236 556 262 Q550 290 520 300 Q480 312 450 340 Q420 380 340 390 Q260 398 190 380 Q140 366 120 330 Z',
    cola: 'M120 330 Q70 320 50 360 Q36 392 60 410 Q40 380 70 368 Q100 360 130 352',
    ala1: 'M300 300 Q270 200 300 120 Q330 170 370 170 Q380 120 420 90 Q430 150 470 160 Q470 210 430 250 Q390 280 360 300',
    ala2: 'M280 304 Q230 230 220 160 Q250 196 280 200',
    patas: 'M220 380 L210 430 L190 436 M240 384 L246 432 L230 440 M380 380 L392 428 L376 436 M410 370 L430 420 L414 428',
    ojo: 'M520 246 Q528 240 534 248 Q528 254 520 246 Z',
    cuerno: 'M530 232 Q536 206 556 196 Q548 218 548 236',
    fuego: ['M556 262 Q600 240 640 262 Q610 266 650 290 Q610 286 640 318 Q596 296 556 280', 'M600 268 Q624 262 636 272 Q620 276 632 290 Q610 284 600 280'],
  };
}

export const nube = (x, y, s = 1) => `M${x} ${y} q${-60 * s} 0 ${-60 * s} ${-40 * s} q0 ${-40 * s} ${50 * s} ${-40 * s} q${10 * s} ${-50 * s} ${70 * s} ${-50 * s} q${50 * s} 0 ${65 * s} ${40 * s} q${55 * s} ${-10 * s} ${65 * s} ${40 * s} q${5 * s} ${50 * s} ${-50 * s} ${50 * s} Z`;
export const lluvia = (x, y, n = 7, s = 1, seed = 3) => { let d = ''; let r = seed; for (let i = 0; i < n; i++) { r = (r * 9301 + 49297) % 233280; const dx = (i - n / 2) * 26 * s + (r / 233280) * 10, dy = (r % 40) * s; d += `M${f1(x + dx)} ${f1(y + dy)} l${f1(-10 * s)} ${f1(36 * s)} `; } return d; };
export const hueso = (x, y, L = 360, h = 70) => { const r = h * 0.42; return `M${x + r} ${y - h * 0.22} L${x + L - r} ${y - h * 0.22} a${r} ${r} 0 1 1 ${r * 0.2} ${-r * 1.0} a${r} ${r} 0 1 1 ${r * 0.9} ${r * 1.5} a${r} ${r} 0 1 1 ${-r * 0.9} ${r * 1.5} a${r} ${r} 0 1 1 ${-r * 0.2} ${-r * 1.0} L${x + r} ${y + h * 0.22} a${r} ${r} 0 1 1 ${-r * 0.2} ${r * 1.0} a${r} ${r} 0 1 1 ${-r * 0.9} ${-r * 1.5} a${r} ${r} 0 1 1 ${r * 0.9} ${-r * 1.5} a${r} ${r} 0 1 1 ${r * 0.2} ${r * 1.0} Z`; };
export const corona = (x, y, w = 160) => { const h = w * 0.6; return `M${x} ${y} L${x} ${y - h * 0.55} L${x + w * 0.22} ${y - h * 0.25} L${x + w * 0.5} ${y - h} L${x + w * 0.78} ${y - h * 0.25} L${x + w} ${y - h * 0.55} L${x + w} ${y} Z`; };
export const pergamino = (x, y, w = 520, h = 300) => ({
  hoja: `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`,
  rollos: [`M${x - 20} ${y - 18} Q${x - 40} ${y + h / 2} ${x - 20} ${y + h + 18} Q${x + 10} ${y + h / 2} ${x - 20} ${y - 18} Z`, `M${x + w + 20} ${y - 18} Q${x + w + 40} ${y + h / 2} ${x + w + 20} ${y + h + 18} Q${x + w - 10} ${y + h / 2} ${x + w + 20} ${y - 18} Z`],
});
export const flecha = (x0, y0, x1, y1, curva = 0.25) => { const mx = (x0 + x1) / 2 - (y1 - y0) * curva, my = (y0 + y1) / 2 + (x1 - x0) * curva; const a = Math.atan2(y1 - my, x1 - mx), L = 26; return [`M${f1(x0)} ${f1(y0)} Q${f1(mx)} ${f1(my)} ${f1(x1)} ${f1(y1)}`, `M${f1(x1 - L * Math.cos(a - 0.45))} ${f1(y1 - L * Math.sin(a - 0.45))} L${f1(x1)} ${f1(y1)} L${f1(x1 - L * Math.cos(a + 0.45))} ${f1(y1 - L * Math.sin(a + 0.45))}`]; };
export const circulo = (cx, cy, rx, ry = rx, giro = 0.15) => { const pts = []; for (let i = 0; i <= 26; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI * 2 * (1 + giro / 6); const k = 1 + (i > 22 ? 0.06 : 0); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return suave(pts); };
export const subrayado = (x0, x1, y, ola = 6) => suave(Array.from({ length: 8 }, (_, i) => [x0 + ((x1 - x0) * i) / 7, y + Math.sin(i * 1.7) * ola]));
export const tacha = (x, y, w, h) => [`M${x} ${y} L${x + w} ${y + h}`, `M${x + w} ${y} L${x} ${y + h}`];
