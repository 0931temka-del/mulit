"""Своя музыка: спокойный люксовый чилл, 95 ударов/мин, ~30 с, ля минор. Пишет music.wav (стерео 44.1 кГц). Ничего не заимствовано."""
import numpy as np, wave
SR = 44100; BPM = 95; beat = 60 / BPM; bars = 12; N = int(SR * beat * 4 * bars + SR * 1.5); L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(7)
def add(sig, t, pan=0.0, g=1.0):
    i = int(t * SR); sig = sig[: max(0, N - i)]; L[i:i + len(sig)] += sig * g * (1 - max(0, pan)); Rr[i:i + len(sig)] += sig * g * (1 + min(0, pan))
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def lp(x, fc):  # простой однополюсный фильтр
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for k in range(len(x)): s = (1 - a) * x[k] + a * s; y[k] = s
    return y
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def kick():
    n = int(SR * 0.35); t = np.arange(n) / SR; f = 45 + 90 * np.exp(-t * 28); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 1.2
def snare():
    n = int(SR * 0.22); t = np.arange(n) / SR; nz = rng.normal(0, 1, n); hp = nz - lp(nz, 1500); return (hp * np.exp(-t * 22) * 0.45 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.4)
def hat(v):
    n = int(SR * 0.06); t = np.arange(n) / SR; nz = rng.normal(0, 1, n); hp = nz - lp(nz, 6000); return hp * np.exp(-t * 70) * v
def saw(f, n): t = np.arange(n) / SR; return 2 * ((t * f) % 1) - 1
chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]  # Am7 Fmaj7 Cmaj7 G6
roots = [33, 29, 36, 31]
melody = {0: [(0, 76), (1.5, 72), (2.5, 74)], 1: [(0, 72), (1.5, 69), (3, 72)], 2: [(0, 71), (1.5, 74), (2.5, 76)], 3: [(0, 74), (2, 71), (3, 69)]}
kt = []
for b in range(bars):
    t0 = b * 4 * beat; c = b % 4
    for k in (0, 2): add(kick(), t0 + k * beat, g=0.9); kt.append(t0 + k * beat)
    add(kick(), t0 + 2.5 * beat, g=0.35)
    for k in (1, 3): add(snare(), t0 + k * beat, g=0.55)
    for h in range(8): add(hat(0.18 if h % 2 == 0 else 0.1), t0 + h * beat / 2 + (0.02 if h % 2 else 0), pan=0.2 if h % 2 else -0.2)
    n = int(SR * beat * 4); pad = np.zeros(n)
    for m in chords[c]:
        for det in (-0.4, 0, 0.4): pad += saw(midi(m) * 2 ** (det / 120), n) * 0.05
    pad = lp(pad, 900) * np.minimum(1, np.arange(n) / SR / 0.5) * np.minimum(1, (n - np.arange(n)) / SR / 0.4); add(pad, t0, g=1.0)
    for off, m, ln in ((0, roots[c], 1.4), (1.5, roots[c] + 7, 0.5), (2, roots[c] + 12, 1.0)):
        nn = int(SR * beat * ln); tt = np.arange(nn) / SR; add((np.sin(2 * np.pi * midi(m) * tt) + 0.3 * np.sin(2 * np.pi * midi(m) * 2 * tt)) * env(nn, 0.01, 0.5) * 0.45, t0 + off * beat)
    if b >= 2:
        for off, m in melody[c]:
            nn = int(SR * beat * 1.6); tt = np.arange(nn) / SR; w = (np.sin(2 * np.pi * midi(m) * tt) + 0.4 * np.sin(2 * np.pi * midi(m) * 2 * tt) + 0.15 * np.sin(2 * np.pi * midi(m) * 3 * tt)) * env(nn, 0.005, 0.35) * 0.14
            add(w, t0 + off * beat, pan=-0.25); add(w * 0.45, t0 + off * beat + beat * 0.75, pan=0.3)
# лёгкий «насос» от бочки
duck = np.ones(N)
for t in kt:
    i = int(t * SR); m = min(N - i, int(SR * 0.25)); duck[i:i + m] = np.minimum(duck[i:i + m], 0.65 + 0.35 * (np.arange(m) / m) ** 1.5)
L *= duck; Rr *= duck
# затухание
tot = N / SR; fade = np.clip(np.minimum(np.arange(N) / SR / 1.0, (tot - np.arange(N) / SR) / 1.8), 0, 1); L *= fade; Rr *= fade
mx = max(abs(L).max(), abs(Rr).max()); L = L / mx * 0.8; Rr = Rr / mx * 0.8
w = wave.open("music.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.stack([L, Rr], 1) * 32767).astype("<i2").tobytes()); w.close(); print("ok", round(tot, 1), "s")
