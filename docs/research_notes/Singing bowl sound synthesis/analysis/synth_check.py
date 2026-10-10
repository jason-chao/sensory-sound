"""Check the measurement helpers against synthetic bowls with known values.

Generates mono 44.1 kHz float WAV files from exact parameters (partial
frequencies and ratios, twin splits and amplitude ratios, per-partial T60,
relative levels, attack time, rubbing swell and amplitude modulation), then
measures them with the same code paths the notes used:

- struck bowls: analyze_struck.analyse() (spectrum / pick_partials /
  group_partials / envelope / fit_decay / modulation / twins / attack)
- crystal ratios: the exact calls made by crystal_partials.py
- rubbed bowls: analyze_rubbed.analyse() (output captured and parsed)

Usage: python3 synth_check.py [--out DIR] [case ...]
  DIR holds the generated audio (default: <system temp>/synth_check).
  Audio is never written into the repository.
  Prints a markdown report to stdout; the summary of the run is written in
  ../analysis_validation.md.
"""
import sys, os, re, io, argparse, tempfile, contextlib
import numpy as np
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bowlan
from bowlan import spectrum, pick_partials
import analyze_struck
import analyze_rubbed

SR = 44100
SEED = 20261010
LN1000 = np.log(1000.0)          # 60 dB in nepers: env = exp(-LN1000 t / T60)
DITHER_DBFS = -96.0              # tiny white noise in every file (16-bit quantisation level)


# ----------------------------------------------------------------- synthesis

def T60_to_tau(T60):
    return T60 / LN1000


def depth_db(r):
    """peak-to-trough depth (dB) of the envelope of two equal-decay sinusoids
    with amplitude ratio r (second / first)."""
    return np.inf if r >= 1 else 20 * np.log10((1 + r) / (1 - r))


def pink(n, rms_dbfs, rng):
    """pink-ish noise: white noise shaped by 1/sqrt(f) above 20 Hz."""
    X = rng.standard_normal(n // 2 + 1) + 1j * rng.standard_normal(n // 2 + 1)
    f = np.fft.rfftfreq(n, 1 / SR)
    x = np.fft.irfft(X / np.sqrt(np.maximum(f, 20.0)), n)
    return x * 10 ** (rms_dbfs / 20) / np.sqrt(np.mean(x ** 2))


def white(n, rms_dbfs, rng):
    return rng.standard_normal(n) * 10 ** (rms_dbfs / 20)


def struck(partials, dur, t_on, rise_10_90_ms, rng, amp1=0.2, phase='random'):
    """partials: list of dict(ratio, level_db, split, r, T60) relative to the
    first entry (ratio 1, level 0). Member A at f = f1*ratio with amplitude
    amp1*10^(level/20); member B at f + split with amplitude r times A.
    Both members share the partial's T60. The attack is a linear ramp whose
    10-90 % rise time is rise_10_90_ms. phase='random' draws every member's
    starting phase from the generator; 'common' starts all members at the
    same phase, as an impulsive strike does."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    f1 = partials[0]['f']
    truth = []
    for p in partials:
        fA = f1 * p['ratio']
        a = amp1 * 10 ** (p['level_db'] / 20)
        tau = T60_to_tau(p['T60'])
        tt = np.maximum(t - t_on, 0)
        env = a * np.exp(-tt / tau) * (t >= t_on)
        for fm, am in ((fA, 1.0), (fA + p['split'], p['r'])):
            if am > 0:
                ph = rng.uniform(0, 2 * np.pi) if phase == 'random' else -np.pi / 2
                x += am * env * np.cos(2 * np.pi * fm * tt + ph)
        truth.append(dict(fA=fA, fB=fA + p['split'], ratio=p['ratio'], level_db=p['level_db'],
                          split=p['split'], r=p['r'], T60=p['T60'], tau=tau,
                          twin_db=20 * np.log10(p['r']) if p['r'] > 0 else -np.inf,
                          depth_db=depth_db(p['r']) if p['r'] > 0 else 0.0))
    ramp = rise_10_90_ms / 1000 / 0.8
    g = np.clip((t - t_on) / ramp, 0, 1)
    x *= g
    return x, dict(partials=truth, onset=t_on, rise_10_90_ms=rise_10_90_ms, f1=f1)


def rubbed(f_rub, f_free, dur, t_mid, tau_swell, t_release, T60_free, am_f, am_m,
           twin_split, twin_r, h2_db, rng, amp=0.3):
    """one mode, logistic swell, AM (index am_m at am_f, switched on 8-9 s),
    release at t_release with exponential free decay and a frequency step to
    f_free; optional twin at +twin_split (amplitude ratio twin_r) and 2f at h2_db."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    swell = 1 / (1 + np.exp(-(t - t_mid) / tau_swell))
    m = am_m * np.clip((t - 8.0) / 1.0, 0, 1)
    env = swell * (1 + m * np.sin(2 * np.pi * am_f * t))
    rel = t >= t_release
    env = np.where(rel, env[np.searchsorted(t, t_release)] * np.exp(-(t - t_release) / T60_to_tau(T60_free)), env)
    f_inst = np.where(rel, f_free, f_rub)
    ph = 2 * np.pi * np.cumsum(f_inst) / SR + rng.uniform(0, 2 * np.pi)
    x = amp * env * np.cos(ph)
    if twin_r > 0:
        ph2 = 2 * np.pi * np.cumsum(f_inst + twin_split) / SR + rng.uniform(0, 2 * np.pi)
        x += amp * twin_r * env * np.cos(ph2)
    if h2_db is not None:
        x += amp * 10 ** (h2_db / 20) * env * np.cos(2 * ph)
    # ground truth for the script's build-up numbers (relative to plateau 0 dB)
    sdb = 20 * np.log10(swell)
    t3 = t[np.argmax(sdb > -3.0)]
    t1 = t[np.argmax(sdb > -1.0)]
    g = np.polyfit(t[t <= t3], sdb[t <= t3], 1)[0]
    truth = dict(f_rub=f_rub, f_free=f_free, shift_hz=f_rub - f_free, shift_pct=100 * (f_rub - f_free) / f_free,
                 t3=t3, t1=t1, growth=g, start_db=sdb[0], am_f=am_f, am_m=am_m,
                 am_depth_db=20 * np.log10((1 + am_m) / (1 - am_m)), T60_free=T60_free,
                 twin_split=twin_split, twin_r=twin_r, twin_depth_db=depth_db(twin_r) if twin_r > 0 else 0.0,
                 h2_db=h2_db)
    return x, truth


def write(path, x):
    peak = np.abs(x).max()
    if peak > 0.98:
        x = x * 0.98 / peak
    wavfile.write(path, SR, x.astype(np.float32))
    return 20 * np.log10(np.abs(x).max())


# ----------------------------------------------------------------- measurement glue

def window_gain_db(tau, t0, t1):
    """level a decaying partial shows in the Hann-windowed spectrum of [t0,t1]
    relative to an undecayed one: 20 log10 of the window-weighted mean of exp(-t/tau)."""
    L = int((t1 - t0) * SR)
    t = t0 + np.arange(L) / SR
    w = np.hanning(L)
    return 20 * np.log10(np.sum(w * np.exp(-t / tau)) / np.sum(w))


def run_struck(cid, path, t_on, t_end, note):
    analyze_struck.CASES[cid] = (os.path.basename(path)[:-4], t_on, t_end, None, note)
    analyze_struck.load = lambda fn: bowlan.load(os.path.join(os.path.dirname(path), os.path.basename(fn)))
    with contextlib.redirect_stdout(io.StringIO()):
        return analyze_struck.analyse(cid, verbose=False)


def run_rubbed(cid, path, f0, t_rub, steady, free, note):
    analyze_rubbed.CASES[cid] = (os.path.basename(path)[:-4], f0, t_rub, steady, free, note)
    analyze_rubbed.load = lambda fn: bowlan.load(os.path.join(os.path.dirname(path), os.path.basename(fn)))
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        analyze_rubbed.analyse(cid)
    return buf.getvalue()


def crystal_pick(x, a, b):
    """the exact calls crystal_partials.py makes."""
    f, d, res = spectrum(x, SR, a, b, pad=8)
    pk = pick_partials(f, d, floor=-70, prom=12, n=25, fmin=150, fmax=12000, min_sep=2.0)
    f1 = max(pk, key=lambda p: p[1])[0]
    return [(p[0], p[0] / f1, p[1]) for p in pk if p[0] >= f1 * 0.99], res


def fnum(v, nd=2, inf='inf'):
    if v is None:
        return '-'
    if isinstance(v, float) and not np.isfinite(v):
        return inf
    return ('%%.%df' % nd) % v


def match(parts, fA, tol):
    c = [p for p in parts if abs(p['f'] - fA) <= tol]
    return min(c, key=lambda p: abs(p['f'] - fA)) if c else None


def struck_table(out, truth, w0, w1, title):
    """markdown rows: ground truth vs measured for each true partial."""
    parts = out['partials']
    lines = ['**%s**' % title, '',
             '| partial | f true / meas (Hz) | ratio true / meas (err %) | level re f1 true (at onset / in window) / meas (err dB) | T60 true / meas (err %) [fit span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |',
             '|---|---|---|---|---|---|---|---|']
    notes = []
    fund = match(parts, truth['partials'][0]['fA'], 5.0)
    lvl1 = fund['level_db'] if fund else 0.0
    tau1 = truth['partials'][0]['tau']
    for i, tp in enumerate(truth['partials']):
        p = match(parts, tp['fA'], max(2.0, 0.003 * tp['fA']))
        if p is None:
            alt = match(parts, tp['fB'], max(2.0, 0.003 * tp['fB']))
            if alt is not None:
                notes.append('partial %d: the weaker twin (%.2f Hz) was taken as the main member, so ratio and level refer to it' % (i + 1, alt['f']))
                p = alt
            else:
                lines.append('| %d | %.2f / not found | %.3f / - | - | - | - | - | - |' % (i + 1, tp['fA'], tp['ratio']))
                notes.append('partial %d (%.1f Hz) not found among the picked partials' % (i + 1, tp['fA']))
                continue
        lw = tp['level_db'] + window_gain_db(tp['tau'], w0 - truth['onset'], w1 - truth['onset']) - window_gain_db(tau1, w0 - truth['onset'], w1 - truth['onset'])
        lm = p['level_db'] - lvl1
        tw = [t for t in p['twins'] if abs(t[0] - p['f']) > 0.05]
        twf = min(tw, key=lambda t: abs(abs(t[0] - p['f']) - tp['split'])) if tw else None
        tw_df = abs(twf[0] - p['f']) if twf else None
        tw_db = twf[1] if twf else None
        m = p['mod'] or {}
        mf = m.get('f'); md = m.get('depth_db')
        flag = ''
        if m:
            flag = ' ~' if (m['f'] <= 1.05 * m['fmin'] or m['snr'] < 8) else ''
        T = p['T60']
        terr = 100 * (T - tp['T60']) / tp['T60'] if T and np.isfinite(T) else np.nan
        fr = p['fit_range']
        lines.append('| %d | %.2f / %.2f | %.3f / %.3f (%+.2f) | %+.1f (%+.1f) / %+.1f (%+.1f) | %.1f / %s (%s) [%.1f-%.1f s, %.0f dB] | %.2f / %s / %s%s | %s / %s | %s / %s%s |' % (
            i + 1, tp['fA'], p['f'], tp['ratio'], p['ratio'], 100 * (p['ratio'] - tp['ratio']) / tp['ratio'],
            tp['level_db'], lw, lm, lm - lw,
            tp['T60'], fnum(T, 1), fnum(terr, 1, 'n/a'), fr[0], fr[1], fr[2],
            tp['split'], fnum(tw_df), fnum(mf), flag,
            fnum(tp['twin_db'], 1, '-inf'), fnum(tw_db, 1),
            fnum(tp['depth_db'], 1), fnum(md, 1), flag))
        if m and (m['f'] <= 1.05 * m['fmin'] or m['snr'] < 8):
            notes.append('partial %d: envelope modulation flagged as unreliable (peak/median %.1f, f %.2f Hz, fmin %.2f)' % (i + 1, m['snr'], m['f'], m['fmin']))
        if tw_df is None and tp['r'] > 0:
            notes.append('partial %d: no twin resolved in the high-resolution spectrum (true split %.2f Hz, twin level %.0f dB)' % (i + 1, tp['split'], tp['twin_db']))
        if T and np.isfinite(T) and abs(terr) > 10:
            notes.append('partial %d: T60 error %+.0f %% (fit over %.1f-%.1f s, %.0f dB, R2 %.2f; early %.1f, late %.1f s)' % (i + 1, terr, fr[0], fr[1], fr[2], p['r2'], p['T60_early'] or -1, p['T60_late'] or -1))
    extra = [p for p in parts if not any(abs(p['f'] - tp['fA']) <= max(2.0, 0.003 * tp['fA']) or abs(p['f'] - tp['fB']) <= max(2.0, 0.003 * tp['fB']) for tp in truth['partials'])]
    if extra:
        notes.append('extra partials picked that are not in the synthesis: ' + ', '.join('%.1f Hz (%.0f dB)' % (p['f'], p['level_db']) for p in extra))
    if out.get('dropped'):
        notes.append('lines dropped by the script as steady/hum: ' + ', '.join('%.1f' % v for v in out['dropped']))
    if 'attack' in out:
        a = out['attack']
        lines += ['', 'Attack: onset true %.3f s / measured %.3f s; 10-90 %% rise true %.1f ms / measured %.1f ms (err %+.1f ms); peak %.1f ms after onset.' % (
            truth['onset'], a['onset'], truth['rise_10_90_ms'], a['rise_10_90_ms'], a['rise_10_90_ms'] - truth['rise_10_90_ms'], a['peak_ms_after_onset'])]
    if notes:
        lines += ['', 'Notes: ' + '; '.join(notes) + '.']
    return '\n'.join(lines)


# ----------------------------------------------------------------- cases

BRONZE = [dict(ratio=1.00, level_db=0.0, split=2.4, r=0.50, T60=30.0),
          dict(ratio=2.85, level_db=3.0, split=4.0, r=0.70, T60=40.0),
          dict(ratio=5.46, level_db=-12.0, split=6.3, r=0.30, T60=12.0),
          dict(ratio=8.40, level_db=-15.0, split=8.9, r=0.50, T60=6.0),
          dict(ratio=11.80, level_db=-26.0, split=15.2, r=0.25, T60=3.0)]
for p in BRONZE:
    p['f'] = 300.0 * p['ratio']
# variant: fundamental 300.7 Hz so that no upper partial lands on an exact
# multiple of 10 Hz, and partial 5 at -8 dB (hard-strike level) so that a
# 3 s partial is above the picking floor of the 0.3-6 s window
BRONZE2 = [dict(p) for p in BRONZE]
BRONZE2[4]['level_db'] = -8.0
for p in BRONZE2:
    p['f'] = 300.7 * p['ratio']

CRYSTAL = [dict(ratio=1.000, level_db=0.0, split=0.2, r=10 ** (-15 / 20), T60=60.0, f=200.0),
           dict(ratio=2.556, level_db=-25.0, split=0.0, r=0.0, T60=15.0),
           dict(ratio=4.620, level_db=-25.0, split=0.0, r=0.0, T60=8.0),
           dict(ratio=7.200, level_db=-25.0, split=0.0, r=0.0, T60=5.0)]

T_ON = 0.1


def case_struck(name, out, partials, dur, rise, rng, noise=None, hum=None, title=''):
    x, truth = struck(partials, dur, T_ON, rise, rng)
    n = len(x)
    x += white(n, DITHER_DBFS, rng)
    if noise is not None:
        x += pink(n, noise, rng)
    if hum is not None:
        t = np.arange(n) / SR
        for fh, lh in hum:
            x += 10 ** (lh / 20) * np.cos(2 * np.pi * fh * t + rng.uniform(0, 2 * np.pi))
    path = os.path.join(out, name + '.wav')
    peak = write(path, x)
    res = run_struck(name, path, T_ON, dur, title)
    w0, w1 = res['window']
    return struck_table(res, truth, w0, w1, '%s (%s; %.0f s file, peak %.1f dBFS, picking window %.1f-%.1f s)' % (name, title, dur, peak, w0, w1)), res, truth


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(tempfile.gettempdir(), 'synth_check'))
    ap.add_argument('cases', nargs='*')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    want = set(args.cases)
    rng = np.random.default_rng(SEED)
    sections = []

    def go(c):
        return not want or c in want or (c == 'w' and not want)

    # (a) clean struck bronze
    if go('a'):
        tbl, res, truth = case_struck('a_bronze', args.out, BRONZE, 45.0, 3.0, rng, title='struck bronze, clean')
        sections.append('## Case a: struck bronze, clean\n\n' + tbl)
        tbl, res, truth = case_struck('a2_bronze_300p7', args.out, BRONZE2, 45.0, 3.0, rng, title='struck bronze variant, f1 300.7 Hz, partial 5 at -8 dB')
        sections.append('## Case a2: the variant bowl used for cases b and c\n\n' + tbl)

    # (b) noise and hum
    if go('b'):
        for lvl in (-50.0, -35.0):
            tbl, res, truth = case_struck('b_bronze_noise%d' % int(-lvl), args.out, BRONZE2, 45.0, 3.0, rng,
                                          noise=lvl, hum=[(100.0, -50.0), (120.0, -56.0)],
                                          title='struck bronze + pink noise %.0f dBFS + hum 100 Hz (-50 dBFS) and 120 Hz (-56 dBFS)' % lvl)
            sections.append('## Case b: pink noise at %.0f dBFS with hum\n\n' % lvl + tbl)

    # (c) short file: extrapolated decay
    if go('c'):
        tbl, res, truth = case_struck('c_bronze_16s', args.out, BRONZE2, 16.0, 3.0, rng, title='struck bronze variant, 16 s file')
        sections.append('## Case c: 16 s file, same bowl as a2\n\n' + tbl)
        LONG = [dict(p) for p in BRONZE2]
        LONG[0]['T60'] = 90.0; LONG[1]['T60'] = 120.0
        tbl, res, truth = case_struck('c2_bronze_16s_long', args.out, LONG, 16.0, 3.0, rng, title='struck bronze, 16 s file, T60 90 s and 120 s on partials 1 and 2')
        sections.append('## Case c2: 16 s file with T60 of 90 s and 120 s on partials 1 and 2\n\n' + tbl)

    # (d) crystal
    if go('d'):
        for p in CRYSTAL:
            p['f'] = 200.0 * p['ratio']
        tbl, res, truth = case_struck('d_crystal', args.out, CRYSTAL, 50.0, 2.0, rng, title='crystal-like, overtones -25 dB, beat 0.2 Hz')
        sections.append('## Case d: crystal-like bowl\n\n' + tbl)
        sr, x = bowlan.load(os.path.join(args.out, 'd_crystal.wav'))
        pk, r = crystal_pick(x, 0.4, 12.0)
        sections.append('crystal_partials.py picking (0.4-12 s window, resolution %.3f Hz): ' % r +
                        ', '.join('%.1f Hz r%.3f (%.0f dB)' % p for p in pk) +
                        '. True: ' + ', '.join('%.1f Hz r%.3f (%.0f dB)' % (p['f'], p['ratio'], p['level_db']) for p in CRYSTAL))

    # (e) rubbed
    if go('e'):
        for tag, tr in (('e1_rubbed', 0.0), ('e2_rubbed_twin', 0.25)):
            x, truth = rubbed(349.5, 350.0, 60.0, 4.0, 0.8, 40.0, 20.0, 1.5, 0.4, 2.0, tr, -30.0, rng)
            x += white(len(x), DITHER_DBFS, rng)
            path = os.path.join(args.out, tag + '.wav')
            write(path, x)
            txt = run_rubbed(tag, path, 349.5, 0.0, (12.0, 39.0), (41.0, 59.0), 'synthetic rubbed')
            g = lambda pat: re.search(pat, txt)
            dom = g(r'dominant ([\d.]+) Hz;')
            trk = g(r'track .*?: mean ([\d.]+), std ([\d.]+), min ([\d.]+), max ([\d.]+)')
            bu = g(r'build-up from [\d.]+ s: level at start ([-\d.]+) dB re plateau; reaches -3 dB at \+([\d.]+) s, -1 dB at \+([\d.]+) s; mean growth ([-\d.]+) dB/s')
            ams = re.findall(r'AM ([\d.]+)-(\d+) Hz: strongest ([\d.]+) Hz \(peak/median ([\d.]+)\); envelope p2.5-p97.5 spread ([\d.]+) dB \(mod. index ~([\d.]+)\)', txt)
            fr = g(r'rubbed minus free = ([-+\d.]+) Hz \(([-+\d.]+) %\)')
            fd = g(r'free decay of dominant .*?: T60 ([\d.]+) s, tau [\d.]+ s, R2 ([\d.]+) over (\d+) dB; modulation ([\d.]+) Hz \(peak/median ([\d.]+), spread ([\d.]+) dB\)')
            h2 = g(r'harmonic 2\*f \([\d.]+ Hz\): ([-\d.]+) dB re dominant')
            rows = ['## Case %s: rubbed bowl%s' % (tag, ' with a twin 2 Hz up at -12 dB' if tr else ', no twin'), '',
                    '| quantity | true | measured | error |', '|---|---|---|---|',
                    '| sung frequency (Hz) | %.2f | %s | %s |' % (truth['f_rub'], dom.group(1) if dom else '-', ('%+.2f' % (float(dom.group(1)) - truth['f_rub'])) if dom else '-'),
                    '| frequency track mean / std (Hz) | %.2f / 0 | %s / %s | %s |' % (truth['f_rub'], trk.group(1) if trk else '-', trk.group(2) if trk else '-', ('%+.2f' % (float(trk.group(1)) - truth['f_rub'])) if trk else '-'),
                    '| rubbed minus free (Hz, %%) | %+.2f, %+.2f %% | %s, %s %% | %s |' % (truth['shift_hz'], truth['shift_pct'], fr.group(1) if fr else '-', fr.group(2) if fr else '-', ('%+.2f Hz' % (float(fr.group(1)) - truth['shift_hz'])) if fr else '-'),
                    '| build-up: level at start (dB re plateau) | %.1f | %s | %s |' % (truth['start_db'], bu.group(1) if bu else '-', ('%+.1f' % (float(bu.group(1)) - truth['start_db'])) if bu else '-'),
                    '| build-up: time to -3 dB / -1 dB (s) | %.2f / %.2f | %s / %s | %s / %s |' % (truth['t3'], truth['t1'], bu.group(2) if bu else '-', bu.group(3) if bu else '-',
                                                                                      ('%+.2f' % (float(bu.group(2)) - truth['t3'])) if bu else '-', ('%+.2f' % (float(bu.group(3)) - truth['t1'])) if bu else '-'),
                    '| build-up: mean growth to -3 dB (dB/s) | %.1f | %s | %s |' % (truth['growth'], bu.group(4) if bu else '-', ('%+.1f' % (float(bu.group(4)) - truth['growth'])) if bu else '-')]
            for lo, hi, f_, snr, d, mi in ams:
                rows.append('| AM %s-%s Hz: rate (Hz) / spread (dB) / index | %.2f / %.2f / %.2f | %s / %s / %s | %+.2f Hz / %+.2f dB / %+.2f |' % (
                    lo, hi, truth['am_f'], truth['am_depth_db'], truth['am_m'], f_, d, mi, float(f_) - truth['am_f'], float(d) - truth['am_depth_db'], float(mi) - truth['am_m']))
            rows.append('| 2f harmonic (dB re dominant) | %.1f | %s | %s |' % (truth['h2_db'], h2.group(1) if h2 else '-', ('%+.1f' % (float(h2.group(1)) - truth['h2_db'])) if h2 else '-'))
            if fd:
                rows.append('| free decay T60 (s) [R2, span] | %.1f | %s [%s, %s dB] | %+.1f %% |' % (truth['T60_free'], fd.group(1), fd.group(2), fd.group(3), 100 * (float(fd.group(1)) - truth['T60_free']) / truth['T60_free']))
                rows.append('| free-decay modulation (Hz, dB) | %s | %s Hz, %s dB (peak/median %s) | |' % (('%.2f Hz, %.1f dB' % (truth['twin_split'], truth['twin_depth_db'])) if tr else 'none', fd.group(4), fd.group(6), fd.group(5)))
            if tr:
                rows.append('| twin beat in the rub window (Hz, dB p-p) | %.2f, %.1f | see AM rows | |' % (truth['twin_split'], truth['twin_depth_db']))
            rows += ['', '<details><summary>analyze_rubbed.py output</summary>', '', '```', txt.rstrip(), '```', '</details>']
            sections.append('\n'.join(rows))

    # (g) attack time sweep: all members in phase (impulsive strike), then three random-phase draws
    if go('g'):
        rows = ['## Case g: attack time sweep (bowl a2, 6 s files)', '', '| rise 10-90 true (ms) | member phases | measured (ms) | error (ms) | onset error (ms) | peak after onset (ms) |', '|---|---|---|---|---|---|']
        for rise in (1.0, 3.0, 8.0, 15.0):
            for k, ph in enumerate(('common', 'random', 'random', 'random')):
                x, truth = struck(BRONZE2, 6.0, T_ON, rise, rng, phase=ph)
                x += white(len(x), DITHER_DBFS, rng)
                name = 'g_attack_%02d_%s%d' % (int(rise), ph, k)
                path = os.path.join(args.out, name + '.wav')
                write(path, x)
                res = run_struck(name, path, T_ON, 6.0, 'attack %.0f ms' % rise)
                a = res['attack']
                rows.append('| %.1f | %s | %.1f | %+.1f | %+.1f | %.1f |' % (rise, ph, a['rise_10_90_ms'], a['rise_10_90_ms'] - rise, 1000 * (a['onset'] - T_ON), a['peak_ms_after_onset']))
        sections.append('\n'.join(rows))

    # window level bias: what a decaying partial shows in the 0.3-6 s Hann window
    if go('w'):
        rows = ['## Level bias of the 0.3-6 s Hann picking window', '',
                'Level a partial shows in the picking window relative to its level at the onset, as a function of its T60 (exact exponential, no beating). Subtract the fundamental\'s own value to get the bias of a level quoted "re fundamental".', '',
                '| T60 (s) | ' + ' | '.join('%g' % v for v in (120, 60, 40, 30, 20, 12, 8, 6, 4, 3, 2)) + ' |',
                '|---|' + '---|' * 11,
                '| window level re onset (dB) | ' + ' | '.join('%+.1f' % window_gain_db(T60_to_tau(v), 0.3, 6.0) for v in (120, 60, 40, 30, 20, 12, 8, 6, 4, 3, 2)) + ' |']
        sections.append('\n'.join(rows))

    # (f) beat depth sweep
    if go('f'):
        rows = ['## Case f: beat depth sweep (one partial, 300 Hz, split 2.4 Hz, T60 30 s, 30 s files)', '',
                '| r (B/A) | twin level true / meas (dB) | split true / twins / env (Hz) | depth true / meas (dB) | implied r from meas depth | T60 meas (err %) [span] | R2 |',
                '|---|---|---|---|---|---|---|']
        for r in (0.1, 0.3, 0.6, 1.0):
            spec = [dict(ratio=1.0, level_db=0.0, split=2.4, r=r, T60=30.0, f=300.0)]
            x, truth = struck(spec, 30.0, T_ON, 3.0, rng)
            x += white(len(x), DITHER_DBFS, rng)
            name = 'f_depth_%02d' % int(r * 10)
            path = os.path.join(args.out, name + '.wav')
            write(path, x)
            res = run_struck(name, path, T_ON, 30.0, 'depth sweep r=%.1f' % r)
            p = res['partials'][0]
            tw = [t for t in p['twins'] if abs(t[0] - p['f']) > 0.05]
            twf = min(tw, key=lambda t: abs(abs(t[0] - p['f']) - 2.4)) if tw else None
            m = p['mod'] or {}
            d = m.get('depth_db', np.nan)
            rimp = (10 ** (d / 20) - 1) / (10 ** (d / 20) + 1)
            fr = p['fit_range']
            rows.append('| %.1f | %s / %s | 2.40 / %s / %s | %s / %.1f | %.2f | %.1f (%+.1f) [%.1f-%.1f s, %.0f dB] | %.2f |' % (
                r, fnum(truth['partials'][0]['twin_db'], 1), fnum(twf[1], 1) if twf else '-', fnum(abs(twf[0] - p['f'])) if twf else '-', fnum(m.get('f')),
                fnum(truth['partials'][0]['depth_db'], 1), d, rimp, p['T60'], 100 * (p['T60'] - 30) / 30, fr[0], fr[1], fr[2], p['r2']))
        sections.append('\n'.join(rows))

    print('# synth_check.py report (seed %d, audio in %s)\n' % (SEED, args.out))
    print('\n\n'.join(sections))


if __name__ == '__main__':
    main()
