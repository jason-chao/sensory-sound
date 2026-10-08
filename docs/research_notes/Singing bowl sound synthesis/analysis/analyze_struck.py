"""Per-strike analysis of struck bowls: partials, levels, decay, beating, attack.
Usage: python3 analyze_struck.py [id ...]   (no args = all)
Audio is read from ../wav/<file>.wav (mono float WAV made with ffmpeg -ac 1)."""
import sys, json
import numpy as np
from scipy.signal import butter, sosfiltfilt, hilbert
sys.path.insert(0, '.')
from bowlan import *

# id: (file, onset s, end s, noise segment or None, note)
CASES = {
 'B11':  ('Tibetan_Singing_Bowl_hit_11inch', 0.0, 16.4, None, '11in bronze, struck'),
 'B45':  ('Tibetan_Singing_Bowl_hit_4.5inch', 0.0, 23.7, None, '4.5in bronze, struck'),
 'SB1':  ('SingingBowl1', 0.10, 12.5, None, 'bronze, struck (same bowl as SingingBowl2 rubbed)'),
 'SL6':  ('fs_415141', 0.0, 46.0, None, 'bronze, soft mallet'),
 'SL5':  ('fs_411487', 0.0, 11.0, None, 'bronze (same bowl as SL6), soft mallet'),
 'AS10': ('fs_531269', 0.0, 44.0, None, '10in "ancient Tibet" bronze; file starts after the strike'),
 'ST':   ('Small_tibetan_singing_bowl', 41.45, 54.3, None, 'small bronze, struck (3rd strike, longest decay)'),
 'ST1':  ('Small_tibetan_singing_bowl', 0.0, 8.15, None, 'small bronze, struck (1st strike)'),
 'C1':   ('Cuencos_tibetanos_al_ser_percutidos', 745.30, 777.2, None, 'multi-bowl rec., bowl ~163 Hz'),
 'C1b':  ('Cuencos_tibetanos_al_ser_percutidos', 808.22, 834.3, None, 'bowl ~163 Hz, another strike'),
 'C1c':  ('Cuencos_tibetanos_al_ser_percutidos', 983.72, 1006.6, None, 'bowl ~163 Hz, another strike'),
 'C2':   ('Cuencos_tibetanos_al_ser_percutidos', 550.63, 567.9, None, 'bowl ~122/124 Hz'),
 'C2b':  ('Cuencos_tibetanos_al_ser_percutidos', 398.83, 414.6, None, 'bowl ~122/124 Hz, another strike'),
 'C3':   ('Cuencos_tibetanos_al_ser_percutidos', 377.19, 386.3, None, 'bowl ~407 Hz'),
 'C4':   ('Cuencos_tibetanos_al_ser_percutidos', 734.57, 745.2, None, 'bowl ~357 Hz'),
 'C5':   ('Cuencos_tibetanos_al_ser_percutidos', 465.64, 479.8, None, 'bowl ~529/531 Hz'),
 'RIN':  ('Japanese_rin_played_as_struck_idiophone', 4.52, 23.9, None, 'Japanese rin (bronze bowl-bell), struck'),
 'PSQ':  ('fs_194434', 0.30, 41.6, None, 'crystal bowl, struck (psuess, 96k/24 original)'),
 'AQ12': ('fs_530847', 0.0, 8.8, None, '12in crystal bowl, free decay only (file starts mid-decay)'),
}


JUMP = {'C1','C1b','C1c','C2','C2b','C3','C4','C5'}
NOATTACK = {'AS10', 'AQ12'}  # files that begin at/after the strike  # multi-bowl: keep only partials that jump at the onset


def group_partials(pk):
    """merge peaks closer than max(12 Hz, 1.5%) into one group (doublets)."""
    groups = []
    for f, l in pk:
        if groups and f - groups[-1][-1][0] < max(12.0, 0.015 * f):
            groups[-1].append((f, l))
        else:
            groups.append([(f, l)])
    return groups


def attack(x, sr, t_on):
    """onset refinement, rise time, transient (non-partial residual) duration."""
    i0 = int(max(0, t_on - 0.1) * sr); i1 = int((t_on + 0.6) * sr)
    seg = x[i0:i1]
    sos = butter(2, 40 / (sr / 2), 'highpass', output='sos')
    a = np.abs(hilbert(sosfiltfilt(sos, seg)))
    k = int(0.001 * sr)
    a = np.convolve(a, np.ones(k) / k, 'same')
    lead = int(min(0.1, t_on) * sr)              # samples before the nominal onset
    ipM = int(np.argmax(a[: lead + int(0.4 * sr)]))
    M = a[ipM]
    base = np.median(a[: max(1, lead - int(0.01 * sr))]) if lead > int(0.02 * sr) else 0.0
    thr = max(0.1 * M, 2.0 * base)
    below = np.where(a[:ipM] < thr)[0]
    ion = below[-1] + 1 if len(below) else 0
    ip = ion + int(np.argmax(a[ion: ion + int(0.05 * sr)]))
    lp = a[ip]
    seg_r = a[ion:ip + 1]
    t10 = (ion + int(np.argmax(seg_r >= max(0.1 * lp, thr)))) / sr
    t90 = (ion + int(np.argmax(seg_r >= 0.9 * lp))) / sr
    return dict(onset=(i0 / sr + ion / sr), rise_10_90_ms=1000 * (t90 - t10), peak_ms_after_onset=1000 * (ip - ion) / sr,
                peak_to_prelevel_db=float(db(lp) - db(base + 1e-9)) if base > 0 else None)


def residual_transient(x, sr, t_on, groups, t_end):
    """notch out the partial groups; measure the residual (strike noise)."""
    i0 = int(max(0, t_on - 0.2) * sr); i1 = int(min(t_end, t_on + 3.0) * sr)
    seg = x[i0:i1].copy()
    r = seg.copy()
    for g in groups:
        fl = min(f for f, _ in g); fh = max(f for f, _ in g)
        w = max(8.0, 0.012 * fl)
        lo, hi = (fl - w) / (sr / 2), (fh + w) / (sr / 2)
        if hi >= 0.99 or lo <= 0: continue
        sos = butter(3, [lo, hi], 'bandstop', output='sos')
        r = sosfiltfilt(sos, r)
    sos = butter(2, 40 / (sr / 2), 'highpass', output='sos'); r = sosfiltfilt(sos, r)
    k = int(0.005 * sr)
    rr = np.sqrt(np.convolve(r ** 2, np.ones(k) / k, 'same'))
    tt = np.sqrt(np.convolve(seg ** 2, np.ones(k) / k, 'same'))
    ion = int((t_on - i0 / sr) * sr)
    ipk = ion + int(np.argmax(rr[ion: ion + int(0.2 * sr)]))
    floor = np.percentile(rr[ion + int(1.0 * sr):], 50) if len(rr) > ion + int(1.2 * sr) else rr[-k:].mean()
    rdb = db(rr); fl = db(floor)
    after = np.where(rdb[ipk:] < max(rdb[ipk] - 20, fl + 3))[0]
    dur20 = after[0] / sr * 1000 if len(after) else np.nan
    # spectral centroid of residual in first 20 ms and of full signal at times
    def centroid(sig, a, b):
        s = sig[int(a * sr): int(b * sr)]
        if len(s) < 16: return np.nan
        S = np.abs(np.fft.rfft(s * np.hanning(len(s)), 1 << 15)); f = np.fft.rfftfreq(1 << 15, 1 / sr)
        m = f > 40
        return float(np.sum(f[m] * S[m] ** 2) / np.sum(S[m] ** 2))
    t0 = t_on - i0 / sr
    cents = {lab: centroid(seg, t0 + a, t0 + b) for lab, (a, b) in
             {'0-20ms': (0, .02), '20-100ms': (.02, .1), '0.5-1s': (.5, 1.0), '2-3s': (2.0, 3.0)}.items()}
    res_cent = centroid(r, t0, t0 + 0.02)
    return dict(res_peak_re_total_db=float(rdb[ipk] - db(tt[ipk])), res_peak_re_signal_peak_db=float(rdb[ipk] - db(tt[ion:ion + int(0.2 * sr)].max())),
                res_drop20_ms=float(dur20), res_floor_re_peak_db=float(fl - rdb[ipk]), res_centroid_0_20ms=res_cent, centroids=cents)


def analyse(cid, verbose=True):
    fn, t_on, t_end, noise_seg, note = CASES[cid]
    sr, x = load('../wav/%s.wav' % fn)
    out = dict(id=cid, file=fn, note=note, onset=t_on, end=t_end)
    dur = t_end - t_on
    # partials in an early window (after attack)
    w0, w1 = t_on + 0.3, t_on + min(dur, 6.0)
    f, d, res = spectrum(x, sr, w0, w1, pad=8)
    pk = pick_partials(f, d, floor=-50, prom=10, n=14, fmin=70, fmax=15000, min_sep=1.0)
    if cid in JUMP:
        a = x[int(w0 * sr):int((w0 + 2.0) * sr)]; b = x[int((t_on - 2.05) * sr):int((t_on - 0.05) * sr)]
        A = np.abs(np.fft.rfft(a * np.hanning(len(a)))); Bm = np.abs(np.fft.rfft(b * np.hanning(len(b))))
        fa = np.fft.rfftfreq(len(a), 1 / sr); keep = []
        for fp, lp in pk:
            j = np.argmin(abs(fa - fp)); sl = slice(max(0, j - 2), j + 3)
            if 20 * np.log10(A[sl].max() / (Bm[sl].max() + 1e-12)) > 12: keep.append((fp, lp))
        out['rejected_preexisting'] = [round(p[0], 1) for p in pk if p not in keep]
        pk = keep
    groups = group_partials(pk)
    out['resolution_hz'] = res; out['window'] = (w0, w1)
    # strongest group defines 0 dB; lowest group defines ratio 1
    gl = [max(l for _, l in g) for g in groups]
    f1 = max(groups[0], key=lambda p: p[1])[0]
    parts = []
    for gi, g in enumerate(groups):
        fmain, lmain = max(g, key=lambda p: p[1])
        fl = min(p[0] for p in g); fh = max(p[0] for p in g)
        # envelope half-bandwidth: cover the group, but stay clear of neighbours
        nb = [abs(fmain - max(h, key=lambda p: p[1])[0]) for hj, h in enumerate(groups) if hj != gi]
        B = max(3.0, (fh - fl) / 2 + 3.0, 0.004 * fmain)
        B = min(B, 0.45 * min(nb)) if nb else B
        fc = (fl + fh) / 2
        te, env = envelope(x, sr, fc, B, t_on, t_end)
        noise = None
        if noise_seg:
            ten, envn = envelope(x, sr, fc, B, *noise_seg)
            noise = float(np.median(db(envn)))
        fit = fit_decay(te, env, noise=noise, margin=6.0)
        # two-stage check: early (0.2-2 s) vs late slope
        e2 = fit_decay(te, env, t_start=t_on + 0.2, t_end=t_on + 2.0, noise=-400)
        e3 = fit_decay(te, env, t_start=t_on + min(4.0, dur / 2), t_end=t_end, noise=noise, margin=6.0)
        mod = modulation(fit['tt'], fit['res'], fmax=min(25.0, B)) if fit else None
        tw, tres = twins(x, sr, fmain, t_on + 0.2, t_on + min(dur, 25.0), span=max(B + 2, 4.0))
        parts.append(dict(f=fmain, members=[(round(a, 2), round(b, 1)) for a, b in g], ratio=fmain / f1, level_db=lmain,
                          B=B, T60=fit['T60'] if fit else None, tau=fit['tau'] if fit else None, r2=fit['r2'] if fit else None,
                          fit_range=(fit['t0'] - t_on, fit['t1'] - t_on, fit['range_db']) if fit else None,
                          T60_early=e2['T60'] if e2 else None, T60_late=e3['T60'] if e3 else None,
                          mod=mod, twins=tw, twin_res=tres))
    # drop non-bowl lines: no decay fit, steady (hum), or exact 10-Hz-multiple test tones
    keep = []
    for p in parts:
        steady = p['T60'] is None or not np.isfinite(p['T60']) or p['T60'] > 400 or (p['r2'] is not None and p['r2'] < 0.3)
        tone = abs(p['f'] / 10 - round(p['f'] / 10)) < 0.004 and p['level_db'] < -25
        if (steady and p['level_db'] < -20) or tone:
            out.setdefault('dropped', []).append(round(p['f'], 2))
        else:
            keep.append(p)
    parts = keep
    f1 = min(p['f'] for p in parts if p['level_db'] > -30)
    for p in parts:
        p['ratio'] = p['f'] / f1
        # flag exact harmonics (2f, 3f) of the fundamental or of one of its twins
        cands = [f1] + [t[0] for t in parts[[q['f'] for q in parts].index(f1)]['twins']]
        p['harm'] = any(abs(p['f'] / c - round(p['f'] / c)) < 0.0015 and round(p['f'] / c) >= 2 for c in cands)
    out['partials'] = parts
    if cid not in NOATTACK:
        att = attack(x, sr, t_on)
        out['attack'] = att
        out['transient'] = residual_transient(x, sr, att['onset'], groups, t_end)
    if verbose:
        print('=== %s  %s  [%s]  onset %.2f s, end %.2f s, peak window %.1f-%.1f s, res %.3f Hz' % (cid, fn, note, t_on, t_end, w0, w1, res))
        print(' %8s %6s %6s %6s %7s %7s %5s %15s %7s %7s | %6s %5s %5s | twins' % ('f Hz', 'ratio', 'dB', 'B', 'T60 s', 'tau s', 'R2', 'fit (s..s, dB)', 'T60e', 'T60l', 'modHz', 'snr', 'depth'))
        for p in parts:
            fr = p['fit_range']; m = p['mod'] or {}
            flag = '' if not m else ('~' if m['f'] <= 1.05 * m['fmin'] or m['snr'] < 8 else '*')
            print('%s%8.2f %6.3f %6.1f %6.1f %7.2f %7.2f %5.2f %15s %7.2f %7.2f | %6.3f%s %5.1f %5.1f | %s %s' % ('h' if p['harm'] else ' ',
                p['f'], p['ratio'], p['level_db'], p['B'], p['T60'] or -1, p['tau'] or -1, p['r2'] or -1,
                '%.1f..%.1f,%.0f' % fr if fr else '-', p['T60_early'] or -1, p['T60_late'] or -1,
                m.get('f', -1), flag, m.get('snr', -1), m.get('depth_db', -1),
                ' '.join('%.2f(%.0f)' % t for t in p['twins']), ('members ' + ' '.join('%.2f(%.0f)' % t for t in p['members'])) if len(p['members']) > 1 else ''))
        if out.get('dropped'): print(' dropped (hum/steady/test-tone/other bowl):', out['dropped'], out.get('rejected_preexisting', ''))
        if 'attack' in out:
            a = out['attack']; tr = out['transient']
            print(' attack: onset %.3f s, rise10-90 %.1f ms, peak +%.1f ms, jump over pre-level %s dB | residual(non-partial) peak %.1f dB re total at that instant, %.1f dB re signal peak; drops 20 dB in %.0f ms; residual floor %.0f dB; residual centroid 0-20ms %.0f Hz' % (
                a['onset'], a['rise_10_90_ms'], a['peak_ms_after_onset'], ('%.0f' % a['peak_to_prelevel_db']) if a['peak_to_prelevel_db'] else '-', tr['res_peak_re_total_db'], tr['res_peak_re_signal_peak_db'], tr['res_drop20_ms'], tr['res_floor_re_peak_db'], tr['res_centroid_0_20ms']))
            print(' spectral centroid (whole signal): ' + ', '.join('%s %.0f Hz' % kv for kv in tr['centroids'].items()))
    return out


if __name__ == '__main__':
    ids = sys.argv[1:] or list(CASES)
    allout = {}
    for cid in ids:
        o = analyse(cid)
        for p in o['partials']:
            p['twins'] = [list(t) for t in p['twins']]
        allout[cid] = o
    json.dump(allout, open('struck_results.json' if not sys.argv[1:] else 'struck_partial.json', 'w'), default=float, indent=0)
