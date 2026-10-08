"""bowlan.py - analysis helpers for singing-bowl recordings.

Methods
- spectrum(): Hann-windowed long FFT, zero-padded >= 8x; peaks refined by
  parabolic interpolation on the dB spectrum. Nominal resolution = sr/L
  (L = window length in samples); Hann main lobe full width = 4*sr/L.
- envelope(): complex demodulation (heterodyne to 0 Hz, 4th-order
  Butterworth low-pass of half-bandwidth B, zero-phase) -> partial
  amplitude envelope sampled at 200 Hz. Beats from twin modes inside +-B
  appear as amplitude modulation of this envelope.
- fit_decay(): least-squares line on the dB envelope over the clean decay
  region (after the attack, until the envelope comes within 10 dB of the
  band's noise floor). T60 = 60/|slope|; amplitude time constant
  tau = 8.686/|slope| (envelope ~ exp(-t/tau)).
- modulation(): spectrum of the de-trended dB envelope (fit residual);
  returns the strongest modulation frequency and its peak-to-trough depth.
- twins(): very high resolution spectrum near one partial to resolve
  doublets (split degenerate modes) directly.
"""
import numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks, butter, sosfiltfilt

ENV_SR = 200.0


def load(fn):
    sr, x = wavfile.read(fn)
    x = x.astype(np.float64)
    if x.ndim > 1:
        x = x.mean(1)
    return sr, x


def spectrum(x, sr, t0, t1, pad=8):
    seg = x[int(t0 * sr):int(t1 * sr)]
    L = len(seg)
    N = 1 << int(np.ceil(np.log2(L * pad)))
    X = np.abs(np.fft.rfft(seg * np.hanning(L), N))
    f = np.fft.rfftfreq(N, 1 / sr)
    db = 20 * np.log10(X / X.max() + 1e-15)
    return f, db, sr / L


def _interp(f, db, i):
    a, b, c = db[i - 1], db[i], db[i + 1]
    d = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0.0
    return f[i] + d * (f[1] - f[0]), b - 0.25 * (a - c) * d


def pick_partials(f, db, fmin=60, fmax=16000, floor=-60, prom=12, n=16, min_sep=None):
    df = f[1] - f[0]
    sep = int((min_sep or 8.0) / df)
    pk, pr = find_peaks(db, height=floor, prominence=prom, distance=max(1, sep))
    pk = pk[(f[pk] > fmin) & (f[pk] < fmax)]
    pk = pk[np.argsort(db[pk])[::-1][:n]]
    out = sorted((_interp(f, db, i) for i in pk), key=lambda p: p[0])
    return out  # list of (freq, dB re strongest in window)


def envelope(x, sr, f0, B, t0=0, t1=None):
    t1 = len(x) / sr if t1 is None else t1
    i0, i1 = int(t0 * sr), int(t1 * sr)
    seg = x[i0:i1]
    t = np.arange(len(seg)) / sr
    z = seg * np.exp(-2j * np.pi * f0 * t)
    # decimate in two stages for a stable narrow low-pass
    q1 = int(sr // 2000)
    sos1 = butter(6, 800 / (sr / 2), output='sos')
    z = sosfiltfilt(sos1, z.real) + 1j * sosfiltfilt(sos1, z.imag)
    z = z[::q1]
    sr2 = sr / q1
    sos2 = butter(4, B / (sr2 / 2), output='sos')
    z = sosfiltfilt(sos2, z.real) + 1j * sosfiltfilt(sos2, z.imag)
    q2 = int(round(sr2 / ENV_SR))
    z = z[::q2]
    env = 2 * np.abs(z)  # amplitude of the sinusoid
    te = t0 + np.arange(len(env)) * q2 / sr2
    return te, env


def db(a):
    return 20 * np.log10(np.maximum(a, 1e-12))


def fit_decay(te, env, t_start=None, t_end=None, noise=None, margin=10.0, skip=0.2):
    e = db(env)
    ipk = int(np.argmax(e[: max(5, int(3 * ENV_SR))])) if t_start is None else np.searchsorted(te, t_start)
    i0 = ipk + int(skip * ENV_SR) if t_start is None else ipk
    i1 = len(e) if t_end is None else np.searchsorted(te, t_end)
    # stop where smoothed envelope first comes within `margin` dB of floor
    k = max(1, int(0.25 * ENV_SR))
    sm = np.convolve(e, np.ones(k) / k, mode='same')
    if noise is None:  # auto floor: lowest smoothed level reached in the segment
        noise = np.percentile(sm[i0 + k:i1 - k], 1) if i1 - i0 > 3 * k else -400
    # first fit the whole region; if the tail flattens above the line
    # (noise floor / other sources), cut where the envelope reaches floor+margin
    if i1 - i0 >= int(1.0 * ENV_SR):
        p0 = np.polyfit(te[i0:i1], e[i0:i1], 1)
        r0 = e[i0:i1] - np.polyval(p0, te[i0:i1])
        if r0[int(0.75 * len(r0)):].mean() > 2.0:
            below = np.where(sm[i0:i1] < noise + margin)[0]
            if len(below):
                i1 = i0 + below[0]
    tt, ee = te[i0:i1], e[i0:i1]
    p = np.polyfit(tt, ee, 1)
    res = ee - np.polyval(p, tt)
    r2 = 1 - res.var() / ee.var() if ee.var() > 0 else 0
    slope = p[0]
    return dict(slope=slope, T60=60 / -slope if slope < 0 else np.inf,
                tau=8.686 / -slope if slope < 0 else np.inf, r2=r2,
                t0=tt[0], t1=tt[-1], range_db=ee.max() - ee.min(),
                start_db=np.polyval(p, tt[0]), res=res, tt=tt, noise=noise)


def modulation(tt, res, fmin=0.08, fmax=30.0):
    """Strongest modulation in a de-trended dB envelope."""
    dur = tt[-1] - tt[0]
    if dur < 2.0 / fmin:
        fmin = 2.0 / dur  # need >= 2 cycles
    r = res - res.mean()
    N = 1 << int(np.ceil(np.log2(len(r) * 16)))
    R = np.abs(np.fft.rfft(r * np.hanning(len(r)), N))
    fr = np.fft.rfftfreq(N, 1 / ENV_SR)
    m = (fr >= fmin) & (fr <= fmax)
    if not m.any():
        return None
    i = np.argmax(np.where(m, R, 0))
    snr = R[i] / (np.median(R[m]) + 1e-12)
    # peak-to-trough depth: 95th - 5th percentile of residual (dB)
    depth = np.percentile(r, 97.5) - np.percentile(r, 2.5)
    return dict(f=fr[i], snr=snr, depth_db=depth, fmin=fmin)


def twins(x, sr, f0, t0, t1, span=None, prom=4, floor=-30):
    span = span or max(4.0, 0.01 * f0)
    f, d, res = spectrum(x, sr, t0, t1, pad=32)
    m = (f > f0 - span) & (f < f0 + span)
    fi, di = f[m], d[m]
    di = di - di.max()
    pk, _ = find_peaks(di, prominence=prom, height=floor)
    out = sorted((_interp(fi, di, i) for i in pk if 0 < i < len(fi) - 1), key=lambda p: -p[1])
    return out[:3], res


def stft_peaks(x, sr, win=2.0, hop=2.0, n=6, t0=0, t1=None, floor=-50):
    t1 = len(x) / sr if t1 is None else t1
    rows = []
    t = t0
    while t + win <= t1:
        f, d, _ = spectrum(x, sr, t, t + win, pad=4)
        lev = db(np.sqrt(np.mean(x[int(t * sr):int((t + win) * sr)] ** 2)))
        rows.append((t, lev, pick_partials(f, d, floor=floor, n=n, prom=10)))
        t += hop
    return rows
