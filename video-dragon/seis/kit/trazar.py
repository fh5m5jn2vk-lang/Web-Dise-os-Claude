# LÓNG · a real photo turned into lines a hand can draw: the edges of the dragon (and the hand holding it) found with
# Canny, thinned to one pixel, followed into chains, simplified, and put in a drawing order (the outline first, then
# each next line starting near where the last one ended), so the films can sketch the real dragon and then let the
# photo itself appear on top of the sketch.
#   python3 trazar.py <photo> <out.json> [--lado 900] [--max 420] [--min 16] [--canny 0.66]
import sys, json, argparse, numpy as np, cv2
from skimage.morphology import skeletonize

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--lado', type=int, default=900); ap.add_argument('--max', type=int, default=420)
ap.add_argument('--min', type=float, default=16); ap.add_argument('--pct', type=float, default=88)
a = ap.parse_args()

img = cv2.imread(a.src); h, w = img.shape[:2]; k = a.lado / max(h, w)
img = cv2.resize(img, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA); h, w = img.shape[:2]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
gray = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(gray)       # local contrast: a gold dragon on grey
g = cv2.bilateralFilter(gray, 9, 50, 9)
# thresholds from how strong the edges in this photo are, not from its brightness
mag = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
hi = float(np.percentile(mag, a.pct)); lo = hi * 0.45
edges = cv2.Canny(g, lo, hi, L2gradient=True)
edges[:3, :] = 0; edges[-3:, :] = 0; edges[:, :3] = 0; edges[:, -3:] = 0
sk = skeletonize(edges > 0)
ys, xs = np.nonzero(sk); P = set(zip(ys.tolist(), xs.tolist()))
NB = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
def nbrs(p): return [(p[0] + dy, p[1] + dx) for dy, dx in NB if (p[0] + dy, p[1] + dx) in P]
deg = {p: len(nbrs(p)) for p in P}
seen = set(); chains = []
def walk(p):
    ch = [p]; seen.add(p); cur = p; prev = None
    while True:
        nx = [q for q in nbrs(cur) if q not in seen]
        if not nx: break
        if prev is not None and len(nx) > 1:   # keep going straight
            d0 = (cur[0] - prev[0], cur[1] - prev[1]); nx.sort(key=lambda q: -((q[0] - cur[0]) * d0[0] + (q[1] - cur[1]) * d0[1]))
        q = nx[0]; seen.add(q); ch.append(q); prev, cur = cur, q
        if deg[q] >= 3 and len(ch) > 2: break
    return ch
for p in sorted(P, key=lambda p: deg[p]):          # from the loose ends first, then whatever is left (loops)
    if p in seen: continue
    if deg[p] == 1 or deg[p] >= 3 or True: chains.append(walk(p))
lines = []
for ch in chains:
    if len(ch) < 3: continue
    pts = np.array([[x, y] for y, x in ch], np.float32).reshape(-1, 1, 2)
    s = cv2.approxPolyDP(pts, 0.9, False).reshape(-1, 2)
    L = float(np.sum(np.linalg.norm(np.diff(s, axis=0), axis=1)))
    if L >= a.min: lines.append((L, s))
lines.sort(key=lambda x: -x[0]); lines = lines[: a.max]
# the drawing order: start top-left, then always the nearest loose end (a chain may be drawn backwards)
order = []; left = [s for _, s in lines]; cur = np.array([0.0, 0.0])
while left:
    best, bi, rev = 1e18, 0, False
    for i, s in enumerate(left):
        d0 = np.sum((s[0] - cur) ** 2); d1 = np.sum((s[-1] - cur) ** 2)
        if d0 < best: best, bi, rev = d0, i, False
        if d1 < best: best, bi, rev = d1, i, True
    s = left.pop(bi); s = s[::-1] if rev else s; order.append(s); cur = s[-1]
out = {'w': w, 'h': h, 'lines': [[round(float(v), 1) for v in s.reshape(-1)] for s in order]}
json.dump(out, open(a.out, 'w'), separators=(',', ':'))
tot = sum(float(np.sum(np.linalg.norm(np.diff(s, axis=0), axis=1))) for s in order)
print(f'{a.src}: {w}x{h}, {len(order)} lines, {tot:.0f} px of line')
