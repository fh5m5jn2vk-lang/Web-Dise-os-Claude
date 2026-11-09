// LÓNG · the kit's 2D layer: timing from tiempos.json, big centred word-by-word captions, the hook line, pop-ups
// (pop, stamp, rise, slam), the progress bar, the end card, and the sound cues the mixer reads.
import { clamp, lerp, prog, E } from './kit.js';

export async function tiempos() {
  const G = await (await fetch('tiempos.json')).json();
  const L = G.lines;
  const words = L.flatMap((l, li) => l.words.map((w, wi) => ({ w: w[0], t0: w[1], t1: w[2], li, wi })));
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  // the time of the n-th time a word is said (n from 1); a word that is not there is an error, not a silent 0
  const at = (word, n = 1) => { const k = norm(word); const hits = words.filter((x) => norm(x.w) === k); if (!hits[n - 1]) throw new Error('no word ' + word + ' #' + n); return hits[n - 1].t0; };
  const end = (word, n = 1) => { const k = norm(word); const hits = words.filter((x) => norm(x.w) === k); if (!hits[n - 1]) throw new Error('no word ' + word + ' #' + n); return hits[n - 1].t1; };
  const line = (i) => L[i];
  const END = L[L.length - 1].t1 + 0.1;
  return { G, L, words, at, end, line, END, norm };
}

export function capas(T, { keys = [], top = 1180, dur }) {
  const $ = (s) => document.querySelector(s);
  const KEYS = new Set(keys.map(T.norm));
  const clean = (x) => x.replace(/[.,:;¿?¡!…"]+/g, '');
  // the phrases: at most four words, broken at punctuation
  const CH = []; T.L.forEach((l) => { let cur = []; l.words.forEach((wd, i) => { cur.push(wd); if (/[.,!?:;…]$/.test(wd[0]) || cur.length >= 4 || i === l.words.length - 1) { CH.push(cur); cur = []; } }); });
  const cap = $('#cap'); cap.style.top = top + 'px'; let shown = null;
  function captions(t, glow = false) {
    let ch = null; for (const c of CH) if (t >= c[0][1] - 0.04) ch = c;
    if (!ch || t > T.END + 0.05) { cap.style.opacity = ch ? 1 - prog(t, T.END + 0.05, T.END + 0.25) : 0; if (!ch || t > T.END + 0.3) return; }
    else cap.style.opacity = 1;
    if (ch !== shown) { cap.innerHTML = ch.map((wd) => `<span class="w${KEYS.has(T.norm(wd[0])) ? ' k' : ''}">${clean(wd[0])}</span>`).join(' '); shown = ch; }
    cap.classList.toggle('glow', glow);
    [...cap.children].forEach((s, i) => {
      const a = t - (ch[i][1] - 0.04), p = E.back(prog(a, 0, 0.2)), next = i + 1 < ch.length ? ch[i + 1][1] - 0.04 : ch[i][2];
      s.style.opacity = a < 0 ? 0 : 1; s.style.transform = `translateY(${(1 - p) * 30}px) scale(${lerp(0.6, 1, p)}) rotate(${(1 - p) * -4}deg)`;
      s.classList.toggle('cur', a >= 0 && t < next + 0.04);
    });
  }
  // pop-ups
  const items = $('#items'), IT = [];
  function item(html, x, y, t0, t1, kind = 'pop', rot = 0) { const d = document.createElement('div'); d.className = 'it'; d.innerHTML = html; items.appendChild(d); const it = { d, x, y, t0, t1, kind, rot }; IT.push(it); return it; }
  function animItems(t) {
    IT.forEach((it) => {
      const a = t - it.t0, d = it.d;
      if (a < 0 || t > it.t1 + 0.25) { d.style.opacity = 0; return; }
      const out = E.in(prog(t, it.t1, it.t1 + 0.2));
      let x = it.x, y = it.y, s = 1, r = it.rot, o = 1, blur = 0;
      if (it.kind === 'pop') { const p = E.back(prog(a, 0, 0.3)); s = lerp(0.3, 1, p); o = clamp(a * 7); r += (1 - p) * 10; }
      else if (it.kind === 'stamp') { const p = E.out(prog(a, 0, 0.15)); s = lerp(2.4, 1, p); o = clamp(a * 8); blur = (1 - p) * 6; x += Math.sin(a * 60) * 5 * Math.exp(-a * 8); }
      else if (it.kind === 'slam') { const p = E.out(prog(a, 0, 0.12)); s = lerp(1.9, 1, p); o = clamp(a * 10); y += Math.sin(a * 50) * 6 * Math.exp(-a * 9); }
      else if (it.kind === 'rise') { const p = E.out(prog(a, 0, 0.45)); y += (1 - p) * 120; o = p; blur = (1 - p) * 8; }
      else if (it.kind === 'left') { const p = E.back(prog(a, 0, 0.4)); x = lerp(-700, x, p); o = clamp(a * 6); }
      y += Math.sin(t * 1.3 + it.x * 0.01) * 4;
      o *= 1 - out; s *= 1 - out * 0.15;
      d.style.opacity = o; d.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : '';
      d.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
    });
  }
  // the hook line at the top: in letter by letter, out with a blur
  const hookEl = $('#hook'); let hookSpec = null;
  function hook(html, t0, t1, green = false, top = null) { hookSpec = { t0, t1 }; hookEl.innerHTML = html; hookEl.classList.toggle('green', green); if (top !== null) hookEl.style.top = top + 'px'; }
  function animHook(t) {
    if (!hookSpec) return;
    const { t0, t1 } = hookSpec, p = E.back(prog(t, t0, t0 + 0.28)), out = E.in(prog(t, t1 - 0.2, t1));
    hookEl.style.opacity = clamp((t - t0) * 8) * (1 - out); hookEl.style.transform = `scale(${lerp(1.35, 1, p) * (1 - out * 0.1)})`; hookEl.style.filter = out > 0.01 ? `blur(${out * 10}px)` : '';
  }
  // the progress bar at the top
  let barSpec = null; const bar = $('#bar'), barI = bar ? bar.firstElementChild : null;
  function progress(t0, t1) { barSpec = { t0, t1 }; }
  function animBar(t) { if (!barSpec || !bar) return; const { t0, t1 } = barSpec; bar.style.opacity = clamp((t - t0) * 5) * (1 - prog(t, t1, t1 + 0.3)); barI.style.width = (prog(t, t0, t1) * 100) + '%'; }
  // the end card, the flash, the dark
  let endT = dur + 1; const endc = $('#endc');
  function endCard(t0) { endT = t0; }
  function animEnd(t) { const p = E.out(prog(t, endT, endT + 0.5)); endc.style.opacity = p; endc.style.transform = `scale(${lerp(1.06, 1, p)})`; }
  const flashes = []; function flash(t0, k = 0.6) { flashes.push([t0, k]); }
  function animFlash(t) { $('#flash').style.opacity = flashes.reduce((a, [t0, k]) => Math.max(a, t >= t0 ? k * Math.exp(-(t - t0) * 10) : 0), 0); }
  // ?clean: the picture alone, no words (a still to use elsewhere)
  if (new URLSearchParams(location.search).has('clean')) ['#items', '#cap', '#hook', '#bar', '#endc', '#flash'].forEach((q) => { const e = $(q); if (e) e.style.display = 'none'; });
  let capFrom = -1; const fromT = (t) => { capFrom = t; };
  function update(t, glow = false) { if (t >= capFrom) captions(t, glow); else cap.style.opacity = 0; animItems(t); animHook(t); animBar(t); animEnd(t); animFlash(t); }
  return { item, IT, hook, progress, endCard, flash, update, CH, fromT };
}

// sound cues for seis/mezcla.py
export function sonido() {
  const SFX = [];
  const fx = (t, tipo, g = 0.3, pan = 0) => { if (t >= 0) SFX.push({ t: +t.toFixed(3), tipo, g, pan }); };
  const rattle = (t0, n, gap, g) => { for (let i = 0; i < n; i++) fx(t0 + i * gap + (i % 3) * 0.013, 'segclick', g * (1 - i / (n + 2)), -0.4 + (i % 4) * 0.12); };
  const forItems = (IT) => IT.forEach((it) => {
    if (it.kind === 'stamp') { fx(it.t0, 'thump', 0.5); fx(it.t0, 'slap', 0.36); }
    else if (it.kind === 'slam') { fx(it.t0, 'impact', 0.32); fx(it.t0, 'thump', 0.35); }
    else if (it.kind === 'pop') { fx(it.t0, 'pop', 0.28, 0.2); fx(it.t0 + 0.03, 'bell', 0.05); }
    else if (it.kind === 'rise' || it.kind === 'left') fx(it.t0 - 0.05, 'whoosh', 0.16);
  });
  return { SFX, fx, rattle, forItems };
}
