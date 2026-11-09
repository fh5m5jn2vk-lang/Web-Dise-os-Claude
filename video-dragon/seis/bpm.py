# Tempo and beat grid of a track with numpy: spectral-flux onsets, autocorrelation for the tempo, then the beat phase
# that lines up best with the onsets. Also the loudness over time, to pick an energetic section.
#   python3 bpm.py track.mp3 [start end]  ->  prints bpm, first beat, and a loudness bar every 4 s
import sys, subprocess, numpy as np
SR = 22050; HOP = 256
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def analyse(x, lo=70, hi=180):
    n = 1024; frames = np.lib.stride_tricks.sliding_window_view(x, n)[::HOP] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1)); S = np.log1p(S * 50)
    flux = np.maximum(0, np.diff(S, axis=0)).sum(1); flux -= np.convolve(flux, np.ones(16) / 16, 'same'); flux = np.maximum(flux, 0)
    fps = SR / HOP; ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    lags = np.arange(int(fps * 60 / hi), int(fps * 60 / lo)); best = lags[np.argmax(ac[lags])]
    bpm = 60 * fps / best
    # refine around the best lag with parabolic interpolation
    a, b, c = ac[best - 1], ac[best], ac[best + 1]; best_f = best + 0.5 * (a - c) / (a - 2 * b + c); bpm = 60 * fps / best_f
    period = fps * 60 / bpm; phases = np.arange(0, period, 0.5)
    score = [flux[np.minimum(len(flux) - 1, np.round(np.arange(p, len(flux) - 1, period)).astype(int))].sum() for p in phases]
    first = phases[int(np.argmax(score))] / fps
    return bpm, first, flux, fps
if __name__ == '__main__':
    x = load(sys.argv[1]); bpm, first, flux, fps = analyse(x)
    rms = [np.sqrt(np.mean(x[i:i + SR * 4] ** 2)) for i in range(0, len(x), SR * 4)]
    print(f'{sys.argv[1]}: {bpm:.2f} BPM, first beat {first:.3f}s, {len(x)/SR:.0f}s  |', ' '.join(f'{r*100:.0f}' for r in rms))
