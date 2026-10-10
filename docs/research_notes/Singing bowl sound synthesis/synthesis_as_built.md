# The bowls as built in sensory-sound 0.2.0, measured against the recordings

This note records what `src/bowls.ts` does and what its output measures, using the same methods as `recording_analysis.md` (long Hann-windowed FFT for partials, complex demodulation for envelopes, a straight-line fit on the dB envelope for T60), so the numbers can be set beside the recordings. Renders were made with `scripts/renderwav.mjs` at 44.1 kHz with reverb off. The tolerances of the methods are in `analysis_validation.md`.

## What the model is

An additive model on native Web Audio nodes: two sine oscillators per mode, one per member of the split pair, each with its own exponential decay. There is no filter bank and no waveguide, for the reasons in the report. Every random choice for a bowl comes from a stream keyed by the layer name and the event's index in that layer, so a seed gives the same bowls whatever the other layers do, and the existing layers' stream is untouched (`scripts/regress.mjs` confirms the eight earlier soundscapes render the same to within 2.4e-7).

Bronze, struck: fundamental log-uniform in 180 to 600 Hz. Partial ratios 1 : 2.85 : 5.46 : 8.4 : 11.8, stretched together by one value per bowl (±3 % at the top) with ±1 % jitter per partial. Levels relative to the fundamental: partial 2 uniform in −2 to +4 dB, partials 3 and 4 −18 to −12 dB, partial 5 −29 to −23 dB, tilted by the mallet (hard adds up to +6.6 dB at the top, padded takes up to −5.4 dB). Fundamental T60 uniform in 28 to 60 s scaled by 0.7 to 1.2 with size, partial 2 1.1 to 1.4 times that, partials 3 to 5 0.8 to 1.2, 0.5 to 0.9 and 0.3 to 0.6 times, and every partial capped at 25,000 / f seconds so that partials above 3 to 4 kHz last only seconds. Members of a pair differ in T60 by ±15 %. The fundamental's split is log-uniform in 1 to 3.2 Hz (clamped to 0.5 to 6), upper splits scale with the ratio and are capped at 8 Hz. The strike angle θ sets member amplitudes ∝ |cos jθ| and |sin jθ| for j = 2 to 6, with the modulation index clamped to 0.15 to 0.6 (3 to 12 dB peak to trough). Onset 5 to 15 ms (hard to padded). The click is pink noise through a low-pass at 0.7 to 4 kHz, 18 dB below the fundamental's peak, decaying in 12 to 32 ms.

Bronze, rubbed: the (2,0) member at 0.999 of its free pitch with its twin at −16.5 dB, exact harmonics at 2f (−34 dB) and 3f (−38 dB), white noise high-passed at 2.5 kHz at −45 dB, all under one logistic swell (steepness 11 over 5 to 10 s, at most 0.6 of the rub's length). Two amplitude modulators, one per ear, half a cycle apart, at 1.2 to 3 Hz (slower for larger bowls) with index 0.3 to 0.6. At release the modulation depth fades with a 1.2 s time constant, the noise with 0.15 s, and the tone continues on the same oscillators into the struck fundamental's decay.

Crystal: fundamental 130 to 350 Hz, ratios 1 : 2.556 : 4.62 : 7.2 (±0.8 %), overtones −24 to −16, −38 to −30 and −48 to −42 dB, T60 36 to 60 s for the fundamental and 0.1 to 0.3 of that for the rest, splits 0.15 to 0.3 Hz times the ratio, modulation index clamped to 0.11 to 0.33 (2 to 6 dB). Rubbed at 0.3 to 0.5 Hz with index 0.3 and a swell of 8 to 15 s, noise at −55 dB. Struck only with a padded mallet (the `tone` setting is halved).

Scheduling: a struck group is one, two or three bowls (probabilities 0.5, 0.2, 0.3) 2 to 6 s apart; the next group waits until the last bowl's loudest partial is 30 dB down at activity 0 and 20 dB down at activity 1, plus 4 to 24 s. A rub lasts 8 to 32 s and is followed by two to three times that of ringing and quiet. A bowl whose loud partials (within 20 dB of its strongest) would sit between 15 Hz and 0.9 of an equivalent rectangular bandwidth from a sounding partial within 12 dB of its level, or from a note of the drone's chord, is skipped, up to eight draws. The three bowl layers share a budget of 64 sources; the oldest bowl fades over 0.3 s when the budget is full; turning a layer off fades its bowls the same way.

## What it measures

Bronze, struck (two bowls from the `bronze` layer, seed 11):

| | Bowl at 572 Hz | Bowl at 238 Hz | Recordings (medians) |
|---|---|---|---|
| Ratios | 1 : 2.87 : 5.44 : 8.43 : 11.7 | 1 : 2.83 : 5.41 : 8.46 : 11.9 | 1 : 2.85 : 5.46 : 8.4 : 11.8 |
| Partial 2 level | −0.5 dB | +2.0 dB | about +3 dB, −15 to +11 |
| Partial 3, 4, 5 | −21, −21, −38 dB | −21, −21, −33 dB | about −15, −15, −26 before the window bias noted in `analysis_validation.md` |
| Fundamental T60 | 32 s | 63 s | 33 s (9 to 136) |
| Partial 2 T60 | 15 s (f = 1.64 kHz) | 41 s | 45 s |
| Fundamental beat | 1.0 Hz, 10 dB | 2.1 Hz, 16 dB | 2.4 Hz, 1 to 24 dB |
| Partial 2 beat | 1.9 Hz, 13 dB | 3.7 Hz, 11 dB | about 4 Hz |

The beat depths read 1 to 4 dB above the design clamp, as `analysis_validation.md` predicts for fits that run towards the floor and for members that decay at different rates.

Bronze, rubbed (a controlled rub at 300 Hz, modulation 1 Hz at index 0.5): the measured rise and fall is 11.4 dB peak to trough in each ear, with the two ears' envelopes correlated at −0.8, so the rises alternate between the ears as the rotating-pattern model predicts. Friction noise above 2.5 kHz measures −49 dB relative to the whole signal. From the `rubbed` layer (seed 11) a rub reached within 3 dB of its plateau 2.8 s after passing −20 dB, that is 4 to 7 dB/s with the final swell settings, against 0.8 to 10.6 dB/s in the recordings; the harmonics measure −34 and −38 dB.

Crystal (from the `crystal` layer, seed 11): ratios 1 : 2.59 and 1 : 2.53 : 4.62; partial 2 at −21 and −24.5 dB; fundamental T60 41 to 54 s; fundamental beat 0.2 to 0.29 Hz at 8 to 16 dB. The last figure is above the 2 to 6 dB of the recordings: the measurement window for a 0.2 Hz beat is long and includes the decay, and the twin decays at a different rate, so the reading is inflated; a listening check is the better test.

The ceiling test in `scripts/soundcheck.mjs` strikes sixteen bronze bowls within 80 ms on top of every layer at full level with reverb at maximum and a rub; the output peaks at 0.85 of full scale. The hush test shows the output 33 dB down 150 ms after `setStopped(true)` and silent within half a second. Loudness calibration (`scripts/measure.mjs`, 90th percentile of 400 ms RMS windows over 60 s): every layer at full level measures 0.0194 ±0.002 and every soundscape 0.0118 to 0.0127, including the two new ones.

## What is not yet known

Whether these sound like bowls to a listener. No one has heard them beside the recordings yet; the comparison page on the listening site exists for that. Whether a phone can play the full mix for ten minutes without drop-outs: the benchmark page exists for that. Whether the design limits make any difference to sound-sensitive listeners: the comfort session exists for that, and it is feedback, not a study.
