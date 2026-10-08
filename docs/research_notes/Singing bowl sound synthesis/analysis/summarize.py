"""Turn struck_results.json into markdown tables + cross-bowl summary."""
import json, numpy as np
R = json.load(open('struck_results.json'))
WIN = [(2, 0.99, 1.01), (3, 2.45, 3.1), (4, 4.4, 6.1), (5, 7.0, 9.6), (6, 10.0, 13.0), (7, 14.0, 17.5), (8, 18.0, 22.0)]
BRONZE = ['B11', 'B45', 'SB1', 'SL6', 'AS10', 'ST', 'C1', 'C2', 'C3', 'C4', 'C5', 'RIN']
CRYSTAL = ['PSQ', 'AQ12']


def beat(p):
    tw = [t for t in p['twins'] if t[1] >= -20 and abs(t[0] - p['f']) > 0.05]
    m = p['mod'] or {}
    good = m and m['snr'] >= 8 and m['f'] > 1.05 * m['fmin']
    s = []
    if tw:
        s.append('twin %.2f Hz (%+.0f dB) -> Δf %.2f' % (tw[0][0], tw[0][1], abs(tw[0][0] - p['f'])))
    if good:
        s.append('env. mod %.2f Hz, %.0f dB p-p' % (m['f'], m['depth_db']))
    return '; '.join(s) or '-'


def table(cid):
    o = R[cid]
    lines = ['**%s** (%s; onset %.2f s, analysed to %.1f s; peak-picking window %.1f-%.1f s, Hann resolution %.3f Hz)' % (cid, o['note'], o['onset'], o['end'], o['window'][0], o['window'][1], o['resolution_hz']), '',
             '| f (Hz) | ratio | level (dB) | T60 (s) | tau (s) | fit R2 / span | beating |', '|---|---|---|---|---|---|---|']
    for p in o['partials']:
        fr = p['fit_range']
        lines.append('| %.2f%s | %.3f | %.1f | %s | %s | %.2f / %.0f-%.0f s, %.0f dB | %s |' % (
            p['f'], ' (2f)' if p['harm'] else '', p['ratio'], p['level_db'],
            '%.1f' % p['T60'] if p['T60'] and np.isfinite(p['T60']) else '-', '%.2f' % p['tau'] if p['tau'] and np.isfinite(p['tau']) else '-',
            p['r2'] if p['r2'] is not None else -1, fr[0], fr[1], fr[2], beat(p)))
    if 'attack' in o:
        a, t = o['attack'], o['transient']
        lines += ['', 'Attack: 10-90 %% rise %.1f ms, peak %.1f ms after onset; non-partial residual drops 20 dB in %.0f ms; residual centroid (0-20 ms) %.0f Hz; whole-signal centroid %s.' % (
            a['rise_10_90_ms'], a['peak_ms_after_onset'], t['res_drop20_ms'], t['res_centroid_0_20ms'], ', '.join('%s %.0f Hz' % kv for kv in t['centroids'].items()))]
    return '\n'.join(lines)


def modes(cid):
    o = R[cid]; out = {}
    for n, lo, hi in WIN:
        c = [p for p in o['partials'] if lo <= p['ratio'] <= hi and not p['harm'] and p['level_db'] > -40]
        if c:
            out[n] = max(c, key=lambda p: p['level_db'])
    return out


if __name__ == '__main__':
    import sys
    if 'tables' in sys.argv:
        for cid in R: print(table(cid)); print()
    print('## Mode-ratio summary (strongest peak per ratio window, level > -40 dB, harmonics excluded)')
    print('| bowl | f1 (Hz) | ' + ' | '.join('n=%d' % n for n, _, _ in WIN[1:]) + ' |')
    print('|---|---|' + '---|' * (len(WIN) - 1))
    col = {n: [] for n, _, _ in WIN}
    for cid in BRONZE + CRYSTAL:
        m = modes(cid)
        f1 = m[2]['f'] if 2 in m else float('nan')
        print('| %s | %.1f | ' % (cid, f1) + ' | '.join('%.3f (%.0f dB, T60 %s)' % (m[n]['ratio'], m[n]['level_db'], '%.0f' % m[n]['T60'] if m[n]['T60'] and np.isfinite(m[n]['T60']) else '-') if n in m else '' for n, _, _ in WIN[1:]) + ' |')
        if cid in BRONZE:
            for n in m: col[n].append((m[n]['ratio'], m[n]['level_db'], m[n]['T60'], m[n]['f']))
    print('\nBronze, struck: per mode  n | count | ratio min / median / max | level median (dB) | T60 median (s) | T60 min-max')
    for n, _, _ in WIN:
        v = col[n]
        if not v: continue
        r = np.array([a[0] for a in v]); l = np.array([a[1] for a in v]); t = np.array([a[2] for a in v if a[2] and np.isfinite(a[2])])
        print('  n=%d | %d | %.3f / %.3f / %.3f | %.1f | %.1f | %.1f-%.1f' % (n, len(v), r.min(), np.median(r), r.max(), np.median(l), np.median(t), t.min(), t.max()))
    # decay vs frequency: per bowl log-log slope of T60 vs f over modes
    print('\nDecay vs mode: T60(n)/T60(n=2) per bowl')
    al = []
    for cid in BRONZE + CRYSTAL:
        m = modes(cid)
        if 2 not in m: continue
        t2 = m[2]['T60']
        print('  %-5s ' % cid + '  '.join('n=%d %.2f' % (n, m[n]['T60'] / t2) for n in sorted(m) if m[n]['T60'] and np.isfinite(m[n]['T60'])))
        fs = np.array([m[n]['f'] for n in sorted(m) if n >= 3 and m[n]['T60']]); ts = np.array([m[n]['T60'] for n in sorted(m) if n >= 3 and m[n]['T60']])
        if len(fs) >= 3 and cid in BRONZE:
            a = np.polyfit(np.log(fs), np.log(ts), 1)[0]; al.append(a)
            print('        T60 ~ f^%.2f over modes n>=3' % a)
    print('  median exponent (bronze, n>=3): %.2f, range %.2f..%.2f' % (np.median(al), min(al), max(al)))
    # Q = pi f tau for fundamentals and n=3
    print('\nQ = pi*f*tau:')
    for cid in BRONZE + CRYSTAL:
        m = modes(cid)
        print('  %-5s ' % cid + '  '.join('n=%d Q=%.0f' % (n, np.pi * m[n]['f'] * m[n]['tau']) for n in sorted(m) if m[n]['tau'] and np.isfinite(m[n]['tau'])))
