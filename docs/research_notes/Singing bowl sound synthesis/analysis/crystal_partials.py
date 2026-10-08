"""Upper-partial ratios of crystal (quartz) bowls from segments where the
higher modes are visible (strike or start of rubbing)."""
import sys
sys.path.insert(0, '.')
from bowlan import *
SEGS = [('QA  Lufke bowl A (strike-like start)', 'Binaural_Cuencos_de_Cuarzo', 5.3, 13.5),
        ('QB  Lufke bowl B (start of playing)', 'Binaural_Cuencos_de_Cuarzo', 80.0, 104.0),
        ('JK  juskiddink quartz bowl (start)', 'fs_129219', 0.5, 20.0),
        ('AQ8 Asuriya 8in crystal (whole)', 'fs_530846', 0.0, 68.0),
        ('PSQ psuess crystal (strike)', 'fs_194434', 0.4, 12.0),
        ('AQ12 Asuriya 12in crystal #2', 'fs_530848', 0.0, 16.0)]
for lab, fn, a, b in SEGS:
    sr, x = load('../wav/%s.wav' % fn)
    f, d, res = spectrum(x, sr, a, b, pad=8)
    pk = pick_partials(f, d, floor=-70, prom=12, n=25, fmin=150, fmax=12000, min_sep=2.0)
    f1 = max(pk, key=lambda p: p[1])[0]
    print('%-38s %5.1f-%5.1f s res %.3f Hz | fundamental %.2f Hz' % (lab, a, b, res, f1))
    print('    ' + ', '.join('%.1f Hz r%.3f (%.0f dB)' % (p[0], p[0] / f1, p[1]) for p in pk if p[0] >= f1 * 0.99))
