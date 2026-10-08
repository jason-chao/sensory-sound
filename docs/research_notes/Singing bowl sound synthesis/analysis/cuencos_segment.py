"""Segment the 17-min multi-bowl recording (Luis Alvaz, Commons) into strikes.
Onsets: broadband 10 ms energy rising > 8 dB above the previous 50 ms minimum.
For each strike, partials are picked in [onset+0.3, onset+2.3] s and the
"new" partials (those that jumped > 6 dB versus the 1 s before the onset)
identify which bowl was struck."""
import numpy as np, sys
sys.path.insert(0, '.')
from bowlan import *
sr, x = load('../wav/Cuencos_tibetanos_al_ser_percutidos.wav')
h = int(0.01 * sr); w = int(0.04 * sr)
n = (len(x) - w) // h
cs = np.concatenate([[0], np.cumsum(x ** 2)])
e = 10 * np.log10((cs[np.arange(n) * h + w] - cs[np.arange(n) * h]) + 1e-12)
on = []
for i in range(5, n):
    if e[i] - e[i - 5:i].min() > 8 and (not on or i * 0.01 - on[-1] > 0.5):
        on.append(i * 0.01)
print('n onsets', len(on))
rows = []
for k, t in enumerate(on):
    if t < 1.2 or t + 2.3 > len(x) / sr: continue
    nxt = on[k + 1] if k + 1 < len(on) else len(x) / sr
    f, d, _ = spectrum(x, sr, t + 0.3, t + 2.3, pad=4)
    fb, db_, _ = spectrum(x, sr, t - 1.05, t - 0.05, pad=8)
    # absolute levels to compare before/after
    def lev(ff, dd, seg_t0, seg_t1, f0):
        return None
    pk = pick_partials(f, d, floor=-40, prom=10, n=8, fmin=80, fmax=8000)
    # absolute spectra
    a = x[int((t + 0.3) * sr):int((t + 2.3) * sr)]; b = x[max(0, int((t - 2.05) * sr)):int((t - 0.05) * sr)]
    A = np.abs(np.fft.rfft(a * np.hanning(len(a)))); Bm = np.abs(np.fft.rfft(b * np.hanning(len(b))))
    fa = np.fft.rfftfreq(len(a), 1 / sr)
    new = []
    for fp, lp in pk:
        j = np.argmin(abs(fa - fp)); s = slice(max(0, j - 2), j + 3)
        jump = 20 * np.log10(A[s].max() / (Bm[s].max() + 1e-9))
        new.append((fp, lp, jump))
    lev_db = 10 * np.log10(np.mean(a ** 2) + 1e-12)
    rows.append((t, nxt - t, lev_db, new))
    print('%7.2f gap %5.1f lev %5.1f | ' % (t, nxt - t, lev_db) + ' '.join('%.1f(%d,%+d)' % (fp, lp, jp) for fp, lp, jp in new if jp > 6))
