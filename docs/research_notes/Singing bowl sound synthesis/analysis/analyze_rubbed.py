"""Rubbed ("singing") bowl analysis: dominant partial, frequency shift vs free
ringing, build-up, amplitude modulation, harmonics, friction noise.
Usage: python3 analyze_rubbed.py [id ...]"""
import sys, json
import numpy as np
from scipy.signal import butter, sosfiltfilt
sys.path.insert(0, '.')
from bowlan import *
from bowlan import _interp

# id: file, f_dom (approx), rub start, steady window (a,b), free-decay window or None, note
CASES = {
 'R_ST':  ('Small_tibetan_singing_bowl', 351.0, 14.4, (20.0, 30.0), None, 'small bronze; struck partial 351.5/352.4 Hz (twins)'),
 'R_SB2': ('SingingBowl2', 297.5, 0.0, (2.0, 8.0), None, 'bronze; same bowl struck in SingingBowl1 (297.36 Hz)'),
 'R_YU':  ('Singing_bowl', 506.6, 4.5, (14.0, 37.0), (38.5, 42.4), 'bronze, rubbed after an initial strike'),
 'R_45':  ('Tibetan_Singing_Bowl_4.5inch', 523.7, 1.0, (4.0, 13.0), (14.5, 17.7), 'bronze 4.5in (label), rubbed'),
 'R_TR':  ('The_sound_of_a_singing_bowl', 661.9, 0.0, (2.0, 25.0), None, 'bronze, rubbed throughout'),
 'R_RIN': ('Japanese_rin_played_as_friction_idiophone', 813.4, 0.0, (6.0, 11.5), (13.0, 24.0), 'Japanese rin, rubbed then released'),
 'R_QA':  ('Binaural_Cuencos_de_Cuarzo', 220.9, 14.0, (35.0, 52.0), (56.0, 70.0), 'quartz crystal bowl A'),
 'R_QB':  ('Binaural_Cuencos_de_Cuarzo', 195.5, 104.0, (125.0, 145.0), None, 'quartz crystal bowl B (A also faintly present)'),
 'R_JK':  ('fs_129219', 221.2, 12.0, (30.0, 98.0), (197.0, 222.0), 'quartz crystal bowl (juskiddink)'),
 'R_AQ8': ('fs_530846', 501.6, 0.0, (50.0, 64.0), None, '8in crystal bowl (Asuriya)'),
}


def partial_table(x, sr, a, b, f0, floor=-60):
    f, d, res = spectrum(x, sr, a, b, pad=4)
    pk = pick_partials(f, d, floor=floor, prom=10, n=14, fmin=60, fmax=12000, min_sep=2.0)
    return pk, res


def analyse(cid):
    fn, f0, t_rub, (sa, sb), free, note = CASES[cid]
    sr, x = load('../wav/%s.wav' % fn)
    print('=== %s  %s  [%s]' % (cid, fn, note))
    pk, res = partial_table(x, sr, sa, sb, f0)
    fd = min(pk, key=lambda p: abs(p[0] - f0))
    # refine the dominant frequency with a high-resolution spectrum
    tw, tres = twins(x, sr, fd[0], sa, sb, span=3.0, prom=6)
    fdom = tw[0][0] if tw else fd[0]
    print(' steady window %.1f-%.1f s (res %.3f Hz): dominant %.2f Hz; peaks (Hz, dB re strongest): %s' % (sa, sb, res, fdom, ', '.join('%.1f(%.0f)' % p for p in pk)))
    for k in (2, 3, 4, 5):
        hk = [p for p in pk if abs(p[0] - k * fdom) < 0.004 * k * fdom]
        print('   harmonic %d*f (%.1f Hz): %s' % (k, k * fdom, ('%.1f dB re dominant' % (hk[0][1] - fd[1])) if hk else 'not above floor/prominence'))
    if free:
        twf, _ = twins(x, sr, fdom, free[0], free[1], span=4.0, prom=6)
        if twf:
            print(' free-decay window %.1f-%.1f s: dominant %.2f Hz -> rubbed minus free = %+.2f Hz (%+.2f %%)' % (free[0], free[1], twf[0][0], fdom - twf[0][0], 100 * (fdom - twf[0][0]) / twf[0][0]))
        pkf, _ = partial_table(x, sr, free[0], free[1], f0)
        print('   free-decay peaks: %s' % ', '.join('%.1f(%.0f)' % p for p in pkf))
    # frequency track of the dominant partial in 1-s windows (pad x16, parabolic)
    trk = []
    t = sa
    while t + 1.0 <= sb:
        f_, d_, _ = spectrum(x, sr, t, t + 1.0, pad=16)
        m_ = (f_ > fdom - 4) & (f_ < fdom + 4)
        i_ = np.argmax(np.where(m_, d_, -999))
        trk.append(_interp(f_, d_, i_)[0])
        t += 0.5
    trk = np.array(trk)
    print(' dominant frequency track (1-s windows, 0.5-s hop): mean %.2f, std %.2f, min %.2f, max %.2f Hz' % (trk.mean(), trk.std(), trk.min(), trk.max()))
    if free:
        tef, envf = envelope(x, sr, fdom, 4.0, free[0], free[1])
        fit = fit_decay(tef, envf, t_start=free[0] + 0.3, noise=None, margin=6.0)
        if fit:
            mdf = modulation(fit['tt'], fit['res'], fmax=4.0)
            print(' free decay of dominant (%.1f-%.1f s): T60 %.1f s, tau %.2f s, R2 %.2f over %.0f dB; modulation %.3f Hz (peak/median %.1f, spread %.1f dB); twins %s' % (
                fit['t0'], fit['t1'], fit['T60'], fit['tau'], fit['r2'], fit['range_db'], mdf['f'] if mdf else -1, mdf['snr'] if mdf else -1, mdf['depth_db'] if mdf else -1,
                ' '.join('%.2f(%.0f)' % q for q in twins(x, sr, fdom, free[0], free[1], span=4.0, prom=4)[0])))
    # envelope of the dominant partial
    B = 12.0
    te, env = envelope(x, sr, fdom, B, 0, len(x) / sr)
    e = db(env)
    plateau = np.median(e[(te >= sa) & (te <= sb)])
    print(' dominant envelope (dB re steady median), 0.5 s steps from 0 s:')
    print('   ' + ' '.join('%.0f' % v for v in (e[::int(ENV_SR / 2)] - plateau)))
    # build-up: from rub start, first time within 3 dB / 1 dB of plateau
    i_r = np.searchsorted(te, t_rub)
    k = int(0.5 * ENV_SR)
    sm = np.convolve(e, np.ones(k) / k, 'same') - plateau
    i3 = i_r + np.argmax(sm[i_r:] > -3.0); i1 = i_r + np.argmax(sm[i_r:] > -1.0)
    start_lvl = sm[i_r + k // 2] if i_r + k // 2 < len(sm) else np.nan
    # growth rate: fit from rub start to the -3 dB point
    if i3 - i_r > int(0.5 * ENV_SR):
        g = np.polyfit(te[i_r:i3], sm[i_r:i3], 1)[0]
    else:
        g = np.nan
    print(' build-up from %.1f s: level at start %.1f dB re plateau; reaches -3 dB at +%.1f s, -1 dB at +%.1f s; mean growth %.1f dB/s' % (
        t_rub, start_lvl, (i3 - i_r) / ENV_SR, (i1 - i_r) / ENV_SR, g))
    # amplitude modulation in steady window
    m = (te >= sa) & (te <= sb)
    tt, ee = te[m], e[m]
    k3 = int(3 * ENV_SR)
    trend = np.convolve(np.pad(ee, k3, mode='edge'), np.ones(k3) / k3, 'same')[k3:-k3]
    resid = ee - trend
    for lo, hi in ((0.3, 12.0), (2.0, 12.0)):
        md = modulation(tt, resid, fmin=lo, fmax=hi)
        if md:
            d = md['depth_db']; mi = (10 ** (d / 20) - 1) / (10 ** (d / 20) + 1)
            print(' AM %.1f-%.0f Hz: strongest %.3f Hz (peak/median %.1f); envelope p2.5-p97.5 spread %.1f dB (mod. index ~%.2f)' % (lo, hi, md['f'], md['snr'], d, mi))
    sl = (e[m].max() - e[m].min())
    # slow level wander (0.05-0.3 Hz): std of the 3-s trend
    print(' slow level wander (3-s moving average) std %.1f dB, range %.1f dB' % (np.std(trend), trend.max() - trend.min()))
    # friction noise: notch all detected partials + harmonics; compare to free decay
    def residual(a, b):
        seg = x[int(a * sr):int(b * sr)].copy()
        fl = sorted(set([p[0] for p in pk] + [k * fdom for k in range(1, 9) if k * fdom < 0.45 * sr]))
        for fp in fl:
            w = max(6.0, 0.01 * fp)
            sos = butter(3, [(fp - w) / (sr / 2), (fp + w) / (sr / 2)], 'bandstop', output='sos')
            seg = sosfiltfilt(sos, seg)
        return seg
    def bands(sig):
        S = np.abs(np.fft.rfft(sig * np.hanning(len(sig)))) ** 2; f = np.fft.rfftfreq(len(sig), 1 / sr)
        out = {}
        for lo, hi in ((100, 1000), (1000, 4000), (4000, 12000)):
            mm = (f >= lo) & (f < hi)
            out['%d-%d' % (lo, hi)] = 10 * np.log10(S[mm].sum() + 1e-20)
        return out
    rs = residual(sa, sb)
    # dominant level in same window, same scaling
    seg = x[int(sa * sr):int(sb * sr)]
    Sd = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; fdd = np.fft.rfftfreq(len(seg), 1 / sr)
    mm = abs(fdd - fdom) < 6
    Ldom = 10 * np.log10(Sd[mm].sum())
    br = bands(rs)
    print(' residual (non-partial) energy in steady rub window, dB re dominant partial energy: ' + ', '.join('%s Hz %.1f' % (k_, v - Ldom) for k_, v in br.items()))
    if free:
        rf = residual(*free); bf = bands(rf)
        segf = x[int(free[0] * sr):int(free[1] * sr)]
        Sf = np.abs(np.fft.rfft(segf * np.hanning(len(segf)))) ** 2; ff = np.fft.rfftfreq(len(segf), 1 / sr)
        Lf = 10 * np.log10(Sf[abs(ff - fdom) < 6].sum())
        print('   rub minus free-decay residual (absolute, per band, length-normalised): ' + ', '.join('%s %+.1f dB' % (k_, (br[k_] - 10 * np.log10(sb - sa)) - (bf[k_] - 10 * np.log10(free[1] - free[0]))) for k_ in br))
    # periodicity of friction noise (2-8 kHz residual envelope)
    sos = butter(4, [2000 / (sr / 2), min(8000, 0.45 * sr) / (sr / 2)], 'bandpass', output='sos')
    hn = sosfiltfilt(sos, rs)
    kk = int(0.01 * sr)
    ne = np.sqrt(np.convolve(hn ** 2, np.ones(kk) / kk, 'same'))[::int(sr / ENV_SR)]
    ned = db(ne); tn = np.arange(len(ned)) / ENV_SR
    md = modulation(tn, ned - np.convolve(np.pad(ned, 300, mode='edge'), np.ones(300) / 300, 'same')[300:-300], fmin=0.3, fmax=12)
    if md:
        print(' friction-noise (2-8 kHz residual) envelope modulation: %.3f Hz (peak/median %.1f), spread %.1f dB' % (md['f'], md['snr'], md['depth_db']))
    return dict(id=cid, fdom=fdom, plateau=plateau)


if __name__ == '__main__':
    for cid in (sys.argv[1:] or list(CASES)):
        analyse(cid)
