// Utilidades compartidas: interpolación y curvas de aceleración.
export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t, inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};
