# LÓNG · the surfaces the drawing films are drawn on, as seamless tiles (the camera pans across a board much bigger
# than the frame, so the texture repeats): a whiteboard with ghosts of old marker, a slate chalkboard with chalk dust,
# notebook paper, cream sketch paper, rice paper with long fibres. Periodic noise made in the frequency domain.
#   python3 papel.py  ->  kit/papel/<name>.png (768 x 768)
import os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'papel'); os.makedirs(OUT, exist_ok=True)
N = 768; rng = np.random.default_rng(4)

def noise(scale, power=1.0, aniso=1.0, angle=0.0):
    """periodic noise: white noise filtered by a gaussian around the given feature size (pixels)"""
    w = rng.standard_normal((N, N)); F = np.fft.fft2(w)
    fy = np.fft.fftfreq(N)[:, None]; fx = np.fft.fftfreq(N)[None, :]
    c, s = np.cos(angle), np.sin(angle); u = fx * c + fy * s; v = (-fx * s + fy * c) * aniso
    r = np.sqrt(u ** 2 + v ** 2) * scale
    x = np.real(np.fft.ifft2(F * np.exp(-r ** 2) * (r + 1e-3) ** (power - 1)))
    return (x - x.mean()) / (x.std() + 1e-9)

def fibres(n, length, width, val):
    """long thin random strands, wrapping round the tile"""
    img = np.zeros((N, N))
    for _ in range(n):
        x, y = rng.random() * N, rng.random() * N; a = rng.random() * np.pi; L = length * (0.4 + rng.random())
        for k in range(int(L)):
            a += rng.normal(0, 0.05); x += np.cos(a); y += np.sin(a)
            img[int(y) % N, int(x) % N] += val * (0.5 + 0.5 * rng.random())
    k = np.ones(width) / width
    img = np.apply_along_axis(lambda r: np.convolve(np.concatenate([r[-width:], r, r[:width]]), k, 'same')[width:-width], 1, img)
    return img

def save(name, rgb):
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + '.png'), optimize=True)

def tint(base, l):   # base colour, l: lightness offsets per pixel
    return np.stack([base[0] + l, base[1] + l, base[2] + l], -1)

# whiteboard: near-white, broad faint ghosts of erased marker, a fine sheen
g = noise(90) * 1.6 + noise(18) * 0.6 + noise(2.5) * 0.7
ghost = np.clip(noise(60, aniso=1.6, angle=0.4) - 1.4, 0, None) * -4
save('blanca', tint((246, 246, 242), g + ghost))
# chalkboard: dark slate, cloudy chalk dust from wiping, fine grit
dust = np.clip(noise(120) * 0.8 + noise(45, aniso=2.5, angle=0.2) * 0.9, -0.5, None) * 7
grit = noise(1.6) * 3.2
save('tiza', np.stack([36 + dust + grit, 50 + dust * 1.05 + grit, 44 + dust + grit], -1))
# notebook: white with a soft paper grain (the grid is drawn as lines, so it stays sharp)
save('cuaderno', tint((251, 250, 245), noise(2.2) * 2.2 + noise(30) * 1.2))
# sketch paper: cream, toothy grain, fibres, a slight mottling
tooth = noise(1.4) * 4.5 + noise(6) * 2.0
mott = noise(110) * 3.5
f = fibres(260, 60, 2, -10)
save('boceto', np.stack([239 + tooth + mott + f, 228 + tooth + mott + f * 1.05, 205 + tooth * 1.1 + mott + f * 1.2], -1))
# rice paper: warm, long fibres both darker and lighter, cloudy thickness
cloud = noise(70) * 5 + noise(15) * 2
f1 = fibres(420, 140, 1, -12); f2 = fibres(260, 120, 2, 9)
save('arroz', np.stack([241 + cloud + f1 + f2, 229 + cloud + f1 + f2, 203 + cloud * 1.1 + f1 * 1.1 + f2], -1))
print('saved', sorted(os.listdir(OUT)))
