# Validation of the measurement scripts on synthetic bowls with known values

The numbers in `recording_analysis.md` come from the scripts in `analysis/`. This note checks those scripts against synthetic bowls whose partials, decays, beats, levels, attack and rubbing behaviour are known exactly, so that each measurement has a tolerance and its failure modes are documented before synthesised bowls are compared with the recordings. Everything here was produced by `analysis/synth_check.py` (random seed 20261010); the generated audio is written to a scratch folder outside the repository and is not kept.

## Method

`synth_check.py` builds mono 44.1 kHz 32-bit float WAV files from exact parameters and then measures them with the same code paths the notes used, not with re-implementations:

- Struck bowls go through `analyze_struck.analyse()`, which calls `bowlan.spectrum`, `pick_partials`, `group_partials`, `envelope`, `fit_decay`, `modulation`, `twins` and `attack` exactly as for the recordings (peak picking in the 0.3 to 6 s window after the onset, twins from a window of up to 25 s, decay fits with the automatic noise floor and a 6 dB margin).
- Crystal ratios also go through the exact calls made by `crystal_partials.py` (0.4 to 12 s window, picking floor -70 dB).
- Rubbed bowls go through `analyze_rubbed.analyse()`; its printed output is captured and parsed.

Each synthetic partial is a twin pair: member A at f, member B at f plus the split, with amplitude ratio r (B over A), both members sharing the partial's T60 (exponential decay, envelope e^(-t/tau), T60 = tau ln 1000). Members start with random phases unless stated. The attack is a linear ramp whose 10 to 90 % rise time is the stated attack time. Every file carries white noise at -96 dBFS (the level of 16-bit quantisation noise) so that no envelope falls to numerical zero. Ground truth for the derived quantities:

- ratio = f(A of partial n) / f(A of partial 1); the scripts report the stronger member's frequency, which is member A here.
- beat frequency = the split; twin level = 20 log10(r); beat depth (peak to trough of the envelope) = 20 log10((1 + r) / (1 - r)).
- relative level is given twice: at the onset (the synthesis parameter), and as the level the Hann-windowed 0.3 to 6 s spectrum should show for a partial that decays with that T60 (the window-averaged truth; see the bias table below). The scripts' "level" column is the second kind.
- for the rubbed bowl the build-up times (to -3 dB and -1 dB of the plateau) and the mean growth rate are computed from the logistic swell the same way the script computes them from the envelope.

Cases:

| case | content |
|---|---|
| a | struck bronze, fundamental 300 Hz, ratios 1 : 2.85 : 5.46 : 8.4 : 11.8; splits 2.4, 4.0, 6.3, 8.9, 15.2 Hz; twin ratios r 0.5, 0.7, 0.3, 0.5, 0.25; T60 30, 40, 12, 6, 3 s; levels at onset 0, +3, -12, -15, -26 dB; attack 3 ms; 45 s file |
| a2 | the same bowl with fundamental 300.7 Hz and partial 5 at -8 dB (see the failures in case a for why); used for b and c |
| b | a2 plus pink noise (1/f above 20 Hz) at -50 dBFS and at -35 dBFS RMS, each with steady hum at 100 Hz (-50 dBFS) and 120 Hz (-56 dBFS). The signal peaks at about -2 dBFS |
| c | a2 in a 16 s file, so the 30 s and 40 s decays must be extrapolated from 39 to 40 dB of fall |
| c2 | as c but with T60 90 s and 120 s on partials 1 and 2 (19 and 23 dB of fall in 16 s) |
| d | crystal-like: fundamental 200 Hz, ratios 1 : 2.556 : 4.62 : 7.2, overtones -25 dB with T60 15, 8 and 5 s and no split; fundamental T60 60 s with a twin 0.2 Hz up at -15 dB (r 0.178, depth 3.1 dB); attack 2 ms; 50 s file |
| e1 | rubbed: one mode at 349.5 Hz, logistic swell (midpoint 4 s, time constant 0.8 s, from -43.5 dB), then amplitude modulation at 1.5 Hz with index 0.4 (7.4 dB peak to trough) switched on between 8 and 9 s; 2f at -30 dB; release at 40 s with a free decay of T60 20 s during which the frequency steps to 350.0 Hz (rubbed minus free = -0.5 Hz, -0.14 %); 60 s file; steady window 12 to 39 s, free window 41 to 59 s |
| e2 | e1 plus a twin 2 Hz up at -12 dB (r 0.25, 4.4 dB beat) throughout, to see whether the modulation measurement confuses rubbing AM with beating |
| f | one partial at 300 Hz, split 2.4 Hz, T60 30 s, twin ratio r 0.1, 0.3, 0.6 and 1.0; 30 s files |
| g | attack sweep on bowl a2: 10 to 90 % rise 1, 3, 8 and 15 ms, once with all members starting in phase (as an impulsive strike does) and three times with random member phases; 6 s files |

## Results

Column key for the struck tables: f and ratio true / measured (error in %); level re fundamental: true at onset (true as seen by the picking window) / measured (error against the window truth); T60 true / measured (error %) with the fitted span; beat: true split / from twin peaks / from the envelope modulation; twin level true / measured; depth true / measured. A tilde marks a modulation reading the script itself flags as unreliable (peak over median below 8, or at the low-frequency limit).

### Case a: struck bronze as specified (300 Hz fundamental)

| partial | f true / meas (Hz) | ratio true / meas (err %) | level re f1 onset (window) / meas (err dB) | T60 true / meas (err %) [span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |
|---|---|---|---|---|---|---|---|
| 1 | 300.00 / 300.00 | 1.000 / 1.000 (0.00) | 0.0 (0.0) / 0.0 (0.0) | 30.0 / 30.0 (-0.1) [0.5-44.9 s, 98 dB] | 2.40 / 2.40 / 2.39 | -6.0 / -6.0 | 9.5 / 9.5 |
| 2 | 855.00 / 855.00 | 2.850 / 2.850 (0.00) | +3.0 (+4.5) / +4.5 (0.0) | 40.0 / 39.9 (-0.2) [0.4-44.9 s, 82 dB] | 4.00 / 4.00 / 3.99 | -3.1 / -3.1 | 15.1 / 14.9 |
| 3 | 1638.00 / 1638.00 | 5.460 / 5.460 (0.00) | -12.0 (-20.2) / -20.2 (0.0) | 12.0 / 12.1 (+1.1) [0.2-20.4 s, 107 dB] | 6.30 / 6.30 / 6.29 | -10.5 / -10.5 | 5.4 / 7.4 |
| 4 | 2520.00 / dropped | 8.400 / - | - | - | - | - | - |
| 5 | 3540.00 / not picked | 11.800 / - | - | - | - | - | - |

Attack: onset 0.100 s measured 0.101 s; rise 3.0 ms measured 4.1 ms; peak 4.3 ms after onset.

Two failures, both reproducible and both explained:

- Partial 4 was picked (at -39 dB in the window) and then dropped by the "test tone" rule in `analyze_struck.py`, which removes any line quieter than -25 dB that lies within 0.04 Hz of a multiple of 10 Hz. With a 300 Hz fundamental, 300 x 8.4 = 2520 Hz and 300 x 11.8 = 3540 Hz are exact multiples of 10 Hz. The rule exists because one recording carries exact 1, 2 and 3 kHz tones; on a real bowl the chance of a quiet partial landing within 0.04 Hz of a 10 Hz multiple is under 1 % per partial, but it is not zero, and the script does list what it drops.
- Partial 5 (T60 3 s, -26 dB at onset) never rose above the -50 dB picking floor: in the 0.3 to 6 s Hann window a partial that is gone within a second shows about 43 dB below its onset level (table below), so it sat at -67 dB relative to the strongest peak.

### Case a2: the variant bowl (300.7 Hz, partial 5 at -8 dB)

| partial | f true / meas (Hz) | ratio true / meas (err %) | level re f1 onset (window) / meas (err dB) | T60 true / meas (err %) [span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |
|---|---|---|---|---|---|---|---|
| 1 | 300.70 / 300.70 | 1.000 / 1.000 (0.00) | 0.0 (0.0) / 0.0 (0.0) | 30.0 / 30.0 (-0.1) [0.6-44.9 s, 97 dB] | 2.40 / 2.40 / 2.39 | -6.0 / -6.0 | 9.5 / 9.5 |
| 2 | 857.00 / 856.99 | 2.850 / 2.850 (0.00) | +3.0 (+4.5) / +4.5 (0.0) | 40.0 / 39.9 (-0.2) [0.4-44.9 s, 82 dB] | 4.00 / 4.00 / 3.99 | -3.1 / -3.1 | 15.1 / 14.9 |
| 3 | 1641.82 / 1641.82 | 5.460 / 5.460 (0.00) | -12.0 (-20.2) / -20.2 (0.0) | 12.0 / 12.1 (+1.1) [0.2-20.6 s, 112 dB] | 6.30 / 6.30 / 6.29 | -10.5 / -10.5 | 5.4 / 6.9 |
| 4 | 2525.88 / 2525.88 | 8.400 / 8.400 (0.00) | -15.0 (-34.7) / -34.7 (0.0) | 6.0 / 6.1 (+1.3) [0.3-9.9 s, 111 dB] | 8.90 / 8.90 / 8.88 | -6.0 / -6.0 | 9.5 / 11.1 |
| 5 | 3548.26 / 3548.26 | 11.800 / 11.800 (0.00) | -8.0 (-44.9) / -44.9 (0.0) | 3.0 / 3.1 (+1.9) [0.2-5.3 s, 115 dB] | 15.20 / 15.17 / 1.16 ~ | -12.0 / -12.0 | 4.4 / 9.6 ~ |

Attack: rise 3.0 ms measured 3.8 ms; peak 4.0 ms after onset.

Partial 5's beat is found by the twin peaks (15.17 Hz) but not by the envelope route, because the modulation search stops at the demodulation half-bandwidth B (14.2 Hz here, about 0.4 % of the partial frequency), which is below the 15.2 Hz split.

### Case b: pink noise and hum

Pink noise at -50 dBFS (signal peak -1 dBFS):

| partial | f true / meas (Hz) | ratio err % | level window truth / meas (err dB) | T60 true / meas (err %) [span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |
|---|---|---|---|---|---|---|---|
| 1 | 300.70 / 300.70 | 0.00 | 0.0 / 0.0 (0.0) | 30.0 / 30.5 (+1.7) [0.3-30.6 s, 75 dB] | 2.40 / 2.40 / 2.39 | -6.0 / -6.0 | 9.5 / 11.7 |
| 2 | 857.00 / 857.00 | 0.00 | +4.5 / +4.5 (0.0) | 40.0 / 40.9 (+2.2) [0.3-44.9 s, 100 dB] | 4.00 / 4.00 / 3.99 | -3.1 / -3.1 | 15.1 / 15.7 |
| 3 | 1641.82 / 1641.82 | 0.00 | -20.2 / -20.2 (0.0) | 12.0 / 12.1 (+0.6) [0.2-10.4 s, 70 dB] | 6.30 / 6.30 / 6.28 | -10.5 / -9.9 | 5.4 / 9.6 |
| 4 | 2525.88 / 2525.88 | 0.00 | -34.7 / -34.7 (+0.1) | 6.0 / 6.5 (+8.8) [0.3-5.7 s, 78 dB] | 8.90 / 8.97 / 8.91 | -6.0 / -6.1 | 9.5 / 13.9 |
| 5 | 3548.26 / dropped | - | - | - | - | - | - |

Pink noise at -35 dBFS (signal peak -2 dBFS):

| partial | f true / meas (Hz) | ratio err % | level window truth / meas (err dB) | T60 true / meas (err %) [span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |
|---|---|---|---|---|---|---|---|
| 1 | 300.70 / 300.70 | 0.00 | 0.0 / 0.0 (0.0) | 30.0 / 30.5 (+1.5) [0.6-20.5 s, 57 dB] | 2.40 / 2.40 / 2.40 | -6.0 / -6.0 | 9.5 / 11.3 |
| 2 | 857.00 / 856.99 | 0.00 | +4.5 / +4.5 (0.0) | 40.0 / 40.5 (+1.3) [0.3-31.8 s, 79 dB] | 4.00 / 4.00 / 3.99 | -3.1 / -3.1 | 15.1 / 15.3 |
| 3 | 1641.82 / 1641.82 | 0.00 | -20.2 / -20.1 (0.0) | 12.0 / 12.6 (+5.1) [0.2-7.7 s, 58 dB] | 6.30 / 6.32 / 6.29 | -10.5 / -9.5 | 5.4 / 9.5 |
| 4 | 2525.88 / dropped | - | - | - | - | - | - |
| 5 | 3548.26 / not picked | - | - | - | - | - | - |

In both files the 100 Hz and 120 Hz hum lines were picked and then correctly dropped as steady. The lost partials (5 at -50 dBFS; 4 at -35 dBFS) were picked but discarded because their decay fit failed: each starts only about 35 dB above the noise in its demodulation band and reaches that floor within 3 to 4 s of a 45 s analysis span. `fit_decay` first fits a line to the whole span and only cuts at the floor if the last quarter of that fit sits more than 2 dB above the line; when 90 % of the span is floor, the line fits the floor, the test does not trigger, and the result is T60 of about 300 s with R2 of 0.1, which `analyze_struck` then treats as a steady line. The early-window estimate the script also computes (0.2 to 2 s) would have given about 6 s and 3 s, but it is not reported for dropped partials. A one-line fix was tried (cutting wherever the 1 s running maximum of the smoothed envelope falls below floor plus margin); it recovered partial 4 only roughly (7.4 s) and made the fundamental's fit worse in the -35 dBFS file, so the script was left as it is.

The attack readings in these two files (31 and 29 ms, peak 47 ms after onset) are not caused by the noise; see case g.

### Cases c and c2: extrapolating long decays from a 16 s file

| partial | T60 true | measured in 16 s (err %) [span] | beat twins / env (Hz) | depth true / meas (dB) |
|---|---|---|---|---|
| c: 1 | 30.0 | 29.9 (-0.4) [0.3-15.9 s, 40 dB] | 2.40 / 2.40 | 9.5 / 9.5 |
| c: 2 | 40.0 | 39.9 (-0.4) [0.3-15.9 s, 39 dB] | 4.00 / 3.99 | 15.1 / 14.9 |
| c: 3 | 12.0 | 12.0 (+0.1) [0.3-15.9 s, 82 dB] | 6.30 / 6.29 | 5.4 / 5.4 |
| c: 4 | 6.0 | 6.1 (+2.3) [0.2-10.2 s, 116 dB] | 8.90 / 8.88 | 9.5 / 12.4 |
| c: 5 | 3.0 | 3.0 (+0.6) [0.2-5.1 s, 102 dB] | 15.21 / 5.29 ~ | 4.4 / 5.0 ~ |
| c2: 1 | 90.0 | 89.5 (-0.6) [0.4-15.9 s, 19 dB] | 2.40 / 2.40 | 9.5 / 9.5 |
| c2: 2 | 120.0 | 117.3 (-2.3) [0.3-15.9 s, 23 dB] | 4.00 / 3.99 | 15.1 / 14.9 |
| c2: 3 | 12.0 | 12.1 (+0.8) [0.3-15.9 s, 89 dB] | 6.30 / 6.29 | 5.4 / 5.7 |
| c2: 4 | 6.0 | 6.1 (+2.0) [0.3-10.1 s, 116 dB] | 8.90 / 8.88 | 9.5 / 12.9 |

Ratios, levels and twin levels were exact in both files, as in a2. Partial 5 of c2 was not picked (it was quieter in this draw, see the window bias). For a straight exponential decay, 16 s is enough: 19 dB of fall gives T60 90 s within 1 %, and 23 dB gives 120 s within 3 %. The length of the fit is therefore not what limits the long T60 values in `recording_analysis.md` (B11, SB1, AS10); what limits them is that real decays are not straight (the early and late slopes differ), which no synthetic case here reproduces.

### Case d: crystal-like bowl

| partial | f true / meas (Hz) | ratio true / meas (err %) | level re f1 onset (window) / meas (err dB) | T60 true / meas (err %) [span] | beat true / twins / env (Hz) | twin level true / meas (dB) | depth true / meas (dB) |
|---|---|---|---|---|---|---|---|
| 1 | 200.00 / 199.98 | 1.000 / 1.000 (0.00) | 0.0 (0.0) / 0.0 (0.0) | 60.0 / 59.8 (-0.3) [0.4-49.9 s, 51 dB] | 0.20 / 0.21 / 0.20 | -15.0 / -15.1 | 3.1 / 3.1 |
| 2 | 511.20 / 511.20 | 2.556 / 2.556 (+0.01) | -25.0 (-33.5) / -33.0 (+0.6) | 15.0 / 15.3 (+2.0) [0.2-23.4 s, 104 dB] | none / none / 0.09 ~ | - | 0 / 7.2 ~ |
| 3 | 924.00 / 924.00 | 4.620 / 4.620 (+0.01) | -25.0 (-42.2) / -41.6 (+0.6) | 8.0 / 8.5 (+6.2) [0.2-14.0 s, 105 dB] | none / none / 2.48 ~ | - | 0 / 16.1 ~ |
| 4 | 1440.00 / not picked | 7.200 / - | - | - | - | - | - |

The 0.2 Hz split at -15 dB was resolved by the twin peaks (0.21 Hz, -15.1 dB) and by the envelope (0.20 Hz, 3.1 dB), so the 0.15 to 0.27 Hz crystal beats in the recordings are within reach of the method. The two unsplit overtones correctly produced no twin; their flagged envelope readings (7 and 16 dB "depth" at 0.09 and 2.5 Hz) are noise from fitting all the way down to the -96 dBFS floor, and the script's own flag marks them as unreliable. `crystal_partials.py` picked all four partials with exact ratios (2.556, 4.620, 7.200) but reported the overtones at -40, -52 and -64 dB instead of -25 dB, because its 0.4 to 12 s window averages over most of their 15, 8 and 5 s decays. The crystal overtone levels quoted in the notes (-15 to -51 dB) are therefore window-averaged values and understate the onset levels of fast-decaying overtones by 10 to 40 dB.

### Cases e1 and e2: rubbed bowl

| quantity | true | e1 measured (error) | e2 measured, with twin (error) |
|---|---|---|---|
| sung frequency (Hz) | 349.50 | 349.50 (0.00) | 349.50 (0.00) |
| frequency track mean / std (Hz) | 349.50 / 0 | 349.50 / 0.00 | 349.51 / 0.02 |
| rubbed minus free (Hz, %) | -0.50, -0.14 % | -0.50, -0.14 % | -0.50, -0.14 % |
| build-up: level at start re plateau (dB) | -43.5 | -40.8 (+2.7) | -41.0 (+2.5) |
| build-up: time to -3 dB / -1 dB (s) | 4.71 / 5.68 | 4.8 / 5.8 (+0.09 / +0.12) | 4.8 / 6.0 (+0.09 / +0.32) |
| build-up: mean growth to -3 dB (dB/s) | 9.0 | 8.0 (-1.0) | 8.0 (-1.0) |
| AM 0.3 to 12 Hz: rate / spread / index | 1.50 Hz / 7.36 dB / 0.40 | 1.497 / 6.8 / 0.37 (0.00 Hz / -0.6 dB / -0.03) | 1.497 / 10.5 / 0.54 (0.00 Hz / +3.1 dB / +0.14) |
| AM 2 to 12 Hz: rate / spread / index | 1.50 Hz / 7.36 dB / 0.40 | 2.994 / 6.8 / 0.37 | 2.000 / 10.5 / 0.54 |
| 2f harmonic re dominant (dB) | -30.0 | -30.0 (0.0) | -30.0 (0.0) |
| free decay T60 (s) | 20.0 | 20.0 (0 %; R2 1.00, 53 dB) | 20.0 (0 %; R2 0.99, 56 dB) |
| free-decay modulation | none / 2.00 Hz, 4.4 dB | 0.375 Hz, 0.0 dB (flagged, peak/median 3) | 1.996 Hz, 4.3 dB |

The AM rate is exact in the 0.3 to 12 Hz band. The 2 to 12 Hz band, which the notes list as the "alternative peak", returns the second harmonic of the true rate (2.994 Hz) when no twin is present and the twin beat (2.000 Hz) when one is. With a twin at -12 dB the envelope spread combines the rubbing AM (7.4 dB) and the beat (4.4 dB) into 10.5 dB, so the implied modulation index (0.54) overstates the true AM index (0.40) by 0.14; the script cannot separate the two, and only the free decay after release shows the twin beat on its own (1.996 Hz, 4.3 dB against a true 4.4 dB). The 2.5 to 2.7 dB error in the start level comes from the 0.5 s smoothing the script applies before reading the build-up, and the growth rate is about 1 dB/s (11 %) low for the same reason.

### Case f: beat depth sweep (one partial, split 2.4 Hz, T60 30 s)

| r (B/A) | twin level true / meas (dB) | split twins / env (Hz) | depth true / meas (dB) | r implied by measured depth | T60 meas (err %) [span] | R2 |
|---|---|---|---|---|---|---|
| 0.1 | -20.0 / -20.0 | 2.40 / 2.39 | 1.7 / 1.7 | 0.10 | 30.0 (0.0) [0.3-29.9 s, 60 dB] | 1.00 |
| 0.3 | -10.5 / -10.5 | 2.40 / 2.39 | 5.4 / 5.4 | 0.30 | 30.0 (0.0) [0.5-29.9 s, 63 dB] | 0.99 |
| 0.6 | -4.4 / -4.4 | 2.40 / 2.39 | 12.0 / 12.0 | 0.60 | 29.9 (-0.3) [0.3-29.9 s, 70 dB] | 0.95 |
| 1.0 | 0.0 / 0.0 | 2.40 / 2.39 | infinite / 28.1 | 0.92 | 30.1 (+0.2) [0.5-29.9 s, 107 dB] | 0.82 |

Measured depth tracks the twin ratio exactly up to r = 0.6 and the twin level is exact throughout. For equal twins the envelope nulls completely, the measured depth is limited by the floor (28 dB here), and the T60 fit still holds to 0.2 % despite R2 falling to 0.82 (the beat troughs, not the slope, drive R2 down). A depth above about 25 dB should be read as "twins within 1 dB of each other", not as a number.

### Case g: attack time

| rise 10 to 90 % true (ms) | member phases | measured (ms) | error (ms) | peak after onset (ms) |
|---|---|---|---|---|
| 1 | common | 1.7 | +0.7 | 2.0 |
| 1 | random (three draws) | 1.1, 2.0, 24.1 | +0.1, +1.0, +23.1 | 3.0, 2.2, 47.2 |
| 3 | common | 2.7 | -0.3 | 8.2 |
| 3 | random | 11.8, 34.3, 34.2 | +8.8, +31.3, +31.2 | 47.5, 48.7, 48.7 |
| 8 | common | 9.2 | +1.2 | 9.5 |
| 8 | random | 22.1, 38.5, 33.2 | +14.1, +30.5, +25.2 | 45.5, 49.5, 49.4 |
| 15 | common | 14.8 | -0.2 | 16.8 |
| 15 | random | 15.8, 14.7, 14.7 | +0.8, -0.3, -0.3 | 19.9, 16.6, 18.3 |

With all members starting in phase, as an impulsive strike excites them, the rise time is right to within 1.2 ms from 1 to 15 ms. With random member phases the reading is right in some draws and 25 to 40 ms in others: when the two members of a pair start partly out of phase the broadband envelope keeps growing for a fraction of a beat period, the script's peak search (limited to 50 ms after onset) finds its maximum at the edge of that search window, and the 10 to 90 % rise is then measured up to that later maximum. The signature is a "peak after onset" reading of 45 to 50 ms. The onset itself is found to within 3 ms in every draw. B11 in `recording_analysis.md` (rise 8.1 ms, peak 48.7 ms after onset) has exactly this signature, so its "delayed peak" may be a still-rising beat envelope rather than evidence of a soft, heavy mallet; the other recordings have peaks within 1 to 13 ms of the onset and are not affected.

### Level bias of the 0.3 to 6 s picking window

Level a partial shows in the Hann-windowed 0.3 to 6 s spectrum relative to its level at the onset, for an exact exponential decay with the given T60. The bias of a level quoted relative to the fundamental is this value minus the fundamental's own value.

| T60 (s) | 120 | 60 | 40 | 30 | 20 | 12 | 8 | 6 | 4 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| window level re onset (dB) | -1.6 | -3.1 | -4.6 | -6.1 | -8.9 | -14.2 | -20.3 | -25.8 | -35.1 | -43.0 | -55.6 |

Measured levels matched this window truth to 0.1 dB in every struck case (0.6 dB for the crystal overtones), so the scripts measure what the window shows very precisely; the window simply does not show the onset level of short partials. For the bowl in case a, a partial at -15 dB with T60 6 s reads -35 dB and a partial at -8 dB with T60 3 s reads -45 dB relative to a 30 s fundamental. The level columns in `recording_analysis.md` carry the same bias, which grows with the partial's decay rate. The `crystal_partials.py` window (0.4 to 12 s) is longer and biases faster decays even more.

## Tolerances to use when comparing synthesis to the recordings

These are the measurement errors found above, rounded up. A synthesised bowl should be measured with the same scripts and the same windows as the recordings, and then compared with the recordings' values using these tolerances; a difference inside the tolerance is not evidence of a mismatch.

| quantity | tolerance | condition |
|---|---|---|
| partial frequency | 0.05 Hz | any partial above the picking floor (measured error 0.02 Hz or less) |
| partial ratio | 0.001 (0.03 %) | ratios are exact to 0.0001 in all cases, so the bowl-to-bowl spread in the notes (about 4 to 8 %) is entirely real |
| relative level | 1 dB, measured the same way | compare window-averaged levels with window-averaged levels; never compare a synthesis onset level with a "level" from the notes without applying the bias table (10 to 45 dB for T60 under 12 s) |
| T60, clean recording, fit span 20 dB or more | 3 % | includes extrapolation: 16 s of a 120 s decay gave 2.3 % |
| T60, noisy recording or partial within 15 dB of its band floor | 10 % | 5 to 9 % seen with pink noise; partials that reach the floor early in the analysed span are lost altogether |
| beat frequency (twin peaks or envelope) | 0.03 Hz | splits from 0.2 Hz (25 s window) to 15 Hz; above about 0.4 % of the partial frequency only the twin-peak route works |
| twin level ratio | 0.5 dB clean, 1 dB with noise at -35 dBFS | twin at -3 to -20 dB |
| beat depth (envelope peak to trough) | 0.5 dB | when the fit region stays more than 10 dB above the floor; otherwise the reading is 1.5 to 4.5 dB too high, and readings above 25 dB saturate (equal twins) |
| attack rise 10 to 90 % | 2 ms | only when the "peak after onset" is under 40 ms; a peak reading of 45 to 50 ms means the envelope was still rising and the rise value is meaningless |
| onset time | 3 ms | all draws |
| rubbed: sung frequency and rubbed-minus-free shift | 0.02 Hz | 1 s windows, 0.5 s hop; track standard deviation resolves 0.02 Hz |
| rubbed: build-up time to -3 dB and -1 dB | 0.3 s | plateau defined by the steady window median |
| rubbed: start level and growth rate | 3 dB and 1 dB/s (about 10 %) | the 0.5 s smoothing rounds off the start |
| rubbed: AM rate | 0.02 Hz | 0.3 to 12 Hz band; the 2 to 12 Hz band may return a harmonic of the rate or the twin beat |
| rubbed: AM spread and index | 1 dB and 0.05 | only when no twin beat is present; a twin beat adds to the spread (index +0.14 for a twin at -12 dB) and cannot be separated in the rub window |
| rubbed: harmonic levels | 0.5 dB | 2f at -30 dB was exact |
| rubbed: free-decay T60 | 1 % | straight decay over 50 dB |

## Limits found

1. Exact 10 Hz multiples. A partial quieter than -25 dB within 0.04 Hz of a multiple of 10 Hz is dropped as a test tone. Synthesised bowls should avoid round fundamentals when they are to be measured with `analyze_struck.py`, or the dropped list should be checked.
2. Short partials are invisible or understated. In the 0.3 to 6 s window a partial with T60 of 3 s loses 43 dB and one with T60 of 6 s loses 26 dB relative to its onset level; at -26 dB onset level a 3 s partial falls below the -50 dB picking floor. The levels in the notes are window-averaged and should be compared only with values measured the same way.
3. The floor cut in `fit_decay` can fail. When a partial reaches its band's noise floor early in a long analysed span, the whole-span line fits the floor, the cut is not applied, and the partial is reported as steady and dropped. This affected a 6 s partial with pink noise at -35 dBFS and a 3 s partial at -50 dBFS. The early-window estimate (0.2 to 2 s) is right in these cases but is not printed for dropped partials.
4. Beat depth is inflated by the floor. Whenever the fit runs to within the 6 dB margin of the floor, the residual's 2.5 to 97.5 percentile spread includes floor noise and the depth reads 1.5 to 4.5 dB high. Depths in the notes measured over fit spans that reach the floor (most upper partials) are upper bounds.
5. The envelope route cannot see beats faster than the demodulation half-bandwidth (about 0.4 % of the partial frequency, or half the twin spacing plus 3 Hz); the twin-peak route has no such limit.
6. Rubbing AM and twin beating are summed, not separated, in the rub window. The AM rate is still right when the AM is stronger than the beat; the spread and index are the combined value.
7. Attack rise time is only meaningful when the peak follows the onset within about 40 ms. Twin pairs that start partly out of phase (possible at a microphone off the strike axis) make the envelope rise over a fraction of a beat period and give rise readings of 25 to 45 ms that are not attack times.
8. Not tested here: two-slope decays, frequency drift during a decay, room reverberation, lossy codecs, and twins with unequal decay rates. The clean agreement on straight exponentials means that the spread of early versus late T60 in the notes is a property of the recordings, not of the fit.

## Scripts and notes

No existing script or note was modified. The one weakness that looks like a bug (limit 3, the floor cut in `fit_decay`) was reproduced and a candidate fix was tried in scratch, but the fix was not robust (it recovered the lost partial only approximately and degraded another fit in the noisy file), so `bowlan.py` was left unchanged and the values in `recording_analysis.md` remain reproducible as they stand. The new script is `analysis/synth_check.py`.

To re-run: `cd analysis && python3 synth_check.py --out /some/scratch/folder` (about four minutes; cases can be selected by letter, for example `python3 synth_check.py --out /tmp/x a f g`). The report is printed as markdown. The audio (about 120 MB) must stay outside the repository.
