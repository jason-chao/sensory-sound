# Singing bowls measured from freely licensed recordings: partials, decay, beating, rubbing, attack

All numbers below were measured by the scripts in `analysis/` (this folder) on 20 freely licensed recordings: 12 from Wikimedia Commons and 8 Freesound previews. The audio is not stored in the repository. `analysis/fetch_recordings.sh` downloads it again and converts it to mono 32-bit float WAV with `ffmpeg -ac 1`. Each measured value cites the page of the recording it comes from. "Script" means the named file in `analysis/`.

Abbreviations: f = frequency; ratio = f / f(lowest bowl partial); level = dB relative to the strongest peak in the analysis window; T60 = time to fall 60 dB (from a straight-line fit to the dB envelope); tau = amplitude time constant (env ∝ e^(−t/tau), tau = T60/6.91); Δf = frequency difference between the two members of a split ("twin") mode, which is the beat rate; p-p = peak-to-trough depth of the envelope modulation; n = mode number (n=2 is the lowest "fundamental" (2,0) mode, n=3 is the next, and so on).

## Q1. Strongest partials, ratios and levels per recording

### Takeaway
I measured 13 bronze bowls (11 struck, including a Japanese rin; one more bowl only from a strike at the start of a rubbed recording) and 6 quartz-crystal bowls. Struck Himalayan-type bronze bowls follow a stretched, inharmonic series of about **1 : 2.85 : 5.45 : 8.4 : 11.9 : 16.2**. The second partial is usually as loud as the fundamental or louder (median −0.7 dB versus −4.5 dB for the fundamental). Crystal bowls follow about **1 : 2.56 : 4.62 : 7.2**, and their upper partials sit 15–40 dB below the fundamental.

### Cited Findings

#### Recordings used (all freely licensed; audio not redistributed)

| ID | Recording (link = licence/description page) | Author | Licence | Bowl / playing | Format, quality notes |
|---|---|---|---|---|---|
| B11 | [Tibetan Singing Bowl hit 11inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac) | דג בלי מלח | CC BY-SA 4.0 | 11" bronze, struck once (the page's description wrongly says 4.5") | FLAC 44.1 kHz. Steady background lines at 100/120/150 Hz (electrical or fan). File starts 80 ms before the strike. 16 s long, so the bowl is still ringing at the end |
| B45 | [Tibetan Singing Bowl hit 4.5inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac) | דג בלי מלח | CC BY-SA 4.0 | 4.5" bronze, struck | FLAC, clean, 24 s |
| R_45 | [Tibetan Singing Bowl 4.5inch.flac](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_4.5inch.flac) | דג בלי מלח | CC BY-SA 4.0 | Labelled 4.5" bronze, rubbed. Its pitch (523.7 Hz) does not match B45 (361 Hz), so it is probably a different bowl | FLAC, 100/120/150 Hz background |
| SB1 | [SingingBowl1.ogg](https://commons.wikimedia.org/wiki/File:SingingBowl1.ogg) | BambooBeast | Public domain | Bronze, struck | Vorbis 80 kbit/s, 12.8 s, fairly high noise floor (−31 dBFS) |
| R_SB2 | [SingingBowl2.ogg](https://commons.wikimedia.org/wiki/File:SingingBowl2.ogg) | BambooBeast | Public domain | Bronze, rubbed. Very likely the same bowl as SB1 (297.5 vs 297.4 Hz) | Vorbis 80 kbit/s, 9 s, constant 14.43 kHz tone (artefact) |
| R_YU | [Singing bowl.ogg](https://commons.wikimedia.org/wiki/File:Singing_bowl.ogg) | Юкатан | CC BY-SA 3.0 | Bronze, struck once and then rubbed for about 33 s | Vorbis. Other objects resonate in the room (120, 299.6, 322, 342, 685 Hz) |
| ST / ST1 / R_ST | [Small tibetan singing bowl.ogg](https://commons.wikimedia.org/wiki/File:Small_tibetan_singing_bowl.ogg) | Cassa342 | CC BY-SA 4.0 | Small bronze bowl: struck (0, 8, 33, 38, 41.5 s) and rubbed (14–31 s) | Vorbis 160 kbit/s. Has a 90 Hz hum and exact 1/2/3 kHz tones near the noise floor (excluded). Hard striker (bright) |
| R_TR | [The sound of a singing bowl.wav](https://commons.wikimedia.org/wiki/File:The_sound_of_a_singing_bowl.wav) | Valera N. Trubin | CC BY 4.0 | Bronze, rubbed throughout | WAV 16-bit, clean |
| C1–C5 | [Cuencos tibetanos al ser percutidos.wav](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav) | Luis Alvaz | CC BY-SA 4.0 | "Tibetan bowls of different sizes, struck": 17 min, 5 bowls struck in rotation, 133 detected strikes | WAV 16-bit, very low noise floor (−87 dBFS). Earlier bowls are still ringing during later strikes, so a partial is accepted only if it jumps by >12 dB at the onset |
| SL6 / SL5 | [singing bowl - single strike 6](https://freesound.org/people/s-light/sounds/415141/) / [strike 5](https://freesound.org/people/s-light/sounds/411487/) | s-light | CC0 | Bronze, soft mallet (tags "soft-mallet") | Freesound HQ preview MP3 (~184 kbit/s), 48 kHz. The originals are 24-bit |
| AS10 | [Aud 10" ancient Tibet bowl pure vibrations](https://freesound.org/people/Asuriya/sounds/531269/) | Asuriya | CC0 | 10" bronze, struck. The file starts just after the strike | Preview MP3 ~152 kbit/s (original m4a) |
| RIN / R_RIN | [Japanese rin played as struck idiophone](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_struck_idiophone.ogg) / [… friction idiophone](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_friction_idiophone.ogg) | MichaelMaggs | CC BY-SA 4.0 | Japanese rin (a heavy temple bowl-bell), struck (a roll of taps, then a last strike at 4.5 s) and rubbed (0–12 s, then released) | Vorbis 240 kbit/s, clean. A related instrument, not a Himalayan bowl |
| PSQ | [CrystalBowl_96Khz24bit.wav](https://freesound.org/people/psuess/sounds/194434/) | psuess | CC0 | Crystal bowl, struck | Preview MP3. 120 Hz hum at −36 to −48 dB |
| AQ12 / AQ12#2 | [Aud 12 inch crystal bowl pure tone](https://freesound.org/people/Asuriya/sounds/530847/), [Aud Pure tone 12" #2](https://freesound.org/people/Asuriya/sounds/530848/) | Asuriya | CC0 | 12" crystal bowl, free decay only (the file starts mid-sound) | Preview MP3. A steady 174.3 Hz line from another source |
| R_AQ8 | [Aud 8" crystal bowl](https://freesound.org/people/Asuriya/sounds/530846/) | Asuriya | CC0 | 8" crystal bowl, rubbed unevenly for 68 s | Preview MP3 |
| R_QA / R_QB | [Binaural Cuencos de Cuarzo.ogg](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg) | Lufke | CC BY-SA 4.0 | Two quartz bowls ("la2 220 Hz" and "sol2 198 Hz"), each rubbed separately, then together | Vorbis 128 kbit/s, binaural (summed to mono). Edited fade-ins. Measured pitches are 220.9 and 195.4 Hz |
| R_JK | [Quartz crystal singing bowl.wav](https://freesound.org/people/juskiddink/sounds/129219/) | juskiddink | CC BY 4.0 | Quartz bowl rubbed for about 190 s, then about 25 s of free decay | Preview MP3, clean |

Excluded after inspection:
- caiogracco "Crystal bowl …" files ([e.g.](https://freesound.org/people/caiogracco/sounds/150453/)): strongest partials at 1428–1786 Hz, unrelated to the note names, and one is titled "Taça" (Portuguese for glass/cup). These are probably glasses.
- [RedwoodRunner, crystal bowls](https://freesound.org/people/RedwoodRunner/sounds/460416/): several bowls (333, 398, 443.5, 499 Hz) overlap, with birdsong.
- The bassimat "generative" soundscapes: synthetic.
- Kevin MacLeod's "Himalayan Atmosphere": music.

Mono MP3/Vorbis decoding can distort levels below roughly −60 dB and the fine detail of noise. Frequencies, decays and slow beats are not affected at the resolutions used.

#### Method (scripts `bowlan.py`, `analyze_struck.py`, `crystal_partials.py`)
- **Partials.** A Hann-windowed FFT over 0.3–6 s after the onset (window up to 5.7 s, zero-padded 8×), with peak picking at prominence ≥10 dB and parabolic interpolation. Nominal resolution is sr/L = **0.175 Hz** for 5.7 s windows (Hann main lobe 0.7 Hz wide). Twin peaks were resolved with longer windows of up to 25 s (0.04 Hz bins, zero-padded 32×).
- **Removed lines.** Lines that do not decay (hum, room objects), exact 10 Hz-multiple test tones, and in the multi-bowl file lines that were already present before the strike are removed. The script lists them under "dropped".
- **Exact harmonics.** Peaks within 0.15 % of 2× or 3× the fundamental or its twin are marked "(2f)". They are not counted as modes.
- **Recording-specific levels.** Levels depend on the microphone position and the striking point, so treat them as examples, not constants.

#### Per-recording partial tables (struck)
All struck rows come from `analyze_struck.py`. The beating column is explained under Q3.

**B11**, 11" bronze ([source](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac)):

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 100.59 | 1.000 | 0.0 | 68.8 | 9.96 | 0.99 / 0–16 s, 14 dB | twins at −28 dB, no measurable beat |
| 201.20 (2f) | 2.000 | −47.6 | 32.8 | 4.74 | 0.81 | Δf 1.87 Hz |
| 299.92 | 2.982 | −6.1 | 53.0 | 7.67 | 0.98 / 19 dB | env. mod 1.32 Hz, 3 dB p-p |
| 400.51 | 3.982 | −38.6 | 41.3 | 5.98 | 0.75 | Δf 1.32 Hz (unclear whether this is a mode) |
| 584.25 / 576.97 | 5.808 / 5.736 | −32 / −33 | 39.7 | 5.75 | 0.65 | Δf 7.28 Hz (equal-level pair) |
| 599.84 | 5.963 | −35.8 | 36.1 | 5.23 | 0.59 | Δf 2.65 Hz, 22 dB p-p |
| 932.30 | 9.268 | −44.5 | 21.3 | 3.08 | 1.00 | – |

**B45**, 4.5" bronze ([source](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac)):

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 361.11 | 1.000 | 0.0 | 58.0 | 8.40 | 0.95 / 0–24 s, 29 dB | twin 354.14 Hz (−13 dB): Δf 6.97 Hz, plus a slow wobble <0.1 Hz |
| 999.37 | 2.767 | −1.5 | 40.6 | 5.88 | 0.96 / 41 dB | twin 1008.99 (−11 dB): Δf 9.63 |
| 1867.48 | 5.171 | −0.6 | 24.6 | 3.56 | 0.99 / 63 dB | twin 1858.55 (−12 dB): Δf 8.92 |
| 1998.73 | 5.535 | −35.3 | 21.2 | 3.07 | 0.99 | – |
| 2884.33 | 7.987 | −7.4 | 18.5 | 2.67 | 1.00 / 84 dB | twin 2907.62 (−16 dB): Δf 23.3, seen as 23.2 Hz env. mod |
| 3734.95 | 10.343 | −33.9 | 11.9 | 1.72 | 0.99 | – |
| 4094.05 | 11.337 | −15.2 | 9.5 | 1.38 | 0.99 / 100 dB | twin 4078.67 (−9 dB): Δf 15.4, 8 dB p-p |

**SB1**, bronze ([source](https://commons.wikimedia.org/wiki/File:SingingBowl1.ogg)):

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 105.17 | 1.000 | −4.4 | 112 | 16.2 | 0.94 / 12 s, 8 dB (low range, low confidence) | twin at −27 dB, 0.96 Hz, 2 dB p-p |
| 297.36 | 2.828 | 0.0 | 55.1 | 7.97 | 0.97 / 16 dB | 0.63 Hz, 2 dB p-p |
| 561.48 | 5.339 | −7.0 | 43.3 | 6.27 | 0.77 | twin 559.77 (−8 dB): Δf 1.72, 9 dB p-p |
| 594.73 (2f) | 5.655 | −33.0 | 29.4 | 4.25 | 0.99 | – |
| 886.26 | 8.427 | −12.6 | 23.3 | 3.37 | 0.96 / 40 dB | twin 888.75 (−15 dB): Δf 2.49 |
| 1276.08 | 12.134 | −19.1 | 17.3 | 2.51 | 0.95 / 69 dB | twin 1270.74 (−12 dB): Δf 5.34, 10 dB p-p |
| 1708.87 | 16.249 | −29.7 | 13.7 | 1.98 | 0.96 / 87 dB | – |

**SL6**, bronze, soft mallet ([source](https://freesound.org/people/s-light/sounds/415141/)):

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 180.14 | 1.000 | −10.1 | 40.3 | 5.83 | 0.94 / 46 s, 105 dB | twin 182.30 (−4 dB): Δf 2.16, env. mod 2.10 Hz, 19 dB p-p |
| 360.27 (2f) | 2.000 | −41.9 | 14.9 | 2.15 | 0.95 | – |
| 518.37 | 2.878 | 0.0 | 68.6 | 9.93 | 1.00 / 46 s, 42 dB | twin 513.44 (−19 dB): Δf 4.93, 2 dB p-p |
| 966.59 | 5.366 | −17.4 | 44.2 | 6.40 | 0.99 / 77 dB | twin 960.25 (−12 dB): Δf 6.34 |
| 1036.74 | 5.755 | −43.3 | 35.9 | 5.20 | 0.97 | – |
| 1508.09 | 8.372 | −26.0 | 30.3 | 4.39 | 0.99 / 80 dB | – |
| 2103.56 | 11.677 | −47.0 | 23.6 | 3.41 | 0.97 | – |

**AS10**, 10" bronze ([source](https://freesound.org/people/Asuriya/sounds/531269/)):

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 159.84 | 1.000 | −4.6 | 136 | 19.7 | 1.00 / 44 s, 20 dB | twin 157.39 (−28 dB): 2.44 Hz, 1 dB p-p |
| 314.77 (≈2f) | 1.969 | −40.8 | 64 | 9.3 | 0.91 | – |
| 460.59 | 2.882 | 0.0 | 95.3 | 13.8 | 0.97 / 32 dB | twin 466.92 (−13 dB): Δf 6.33 |
| 617.98 | 3.866 | −39.0 | 62.4 | 9.0 | 0.94 | Δf 1.93, 14 dB p-p |
| 883.56 | 5.528 | −18.4 | 54.6 | 7.9 | 0.97 / 58 dB | twin 880.33 (−9 dB): Δf 3.22, 7 dB p-p |
| 921.19 | 5.763 | −45.9 | 45.0 | 6.5 | 0.97 | – |
| 1394.52 | 8.725 | −41.0 | 36.2 | 5.2 | 0.98 | – |

**ST**, small bronze, third strike, hard striker ([source](https://commons.wikimedia.org/wiki/File:Small_tibetan_singing_bowl.ogg)). The first strike (ST1) gives the same ratios to within 0.2 %: 2.828, 5.313, 8.339, 11.786.

| f (Hz) | ratio | level dB | T60 s | tau s | fit R² / span | beating |
|---|---|---|---|---|---|---|
| 351.48 | 1.000 | 0.0 | 13.4 | 1.94 | 0.99 / 13 s, 58 dB | twin 352.44 (−14 dB): Δf 0.97, env. 0.96 Hz, 6 dB p-p. In ST1 the 352.48 twin is the stronger one (twin at −4 dB, 12 dB p-p) |
| 702.92 (2f) | 2.000 | −44.6 | 8.9 | 1.28 | 0.90 | – |
| 995.60 | 2.833 | −6.7 | 10.6 | 1.54 | 0.88 / 63 dB | twin 996.61 (−4 dB): Δf 1.00, 17 dB p-p |
| 1875.39 | 5.336 | −12.0 | 6.3 | 0.91 | 0.96 / 87 dB | twin 1872.60 (−4 dB): Δf 2.78, 18 dB p-p |
| 2938.81 | 8.361 | −15.3 | 3.8 | 0.55 | 0.99 / 104 dB | ST1: Δf 1.66 Hz |
| 4153.50 | 11.817 | −33.9 | 2.3 | 0.33 | 0.97 | twin 4156.72 (−11 dB): Δf 3.2 |

**C1**, the bowl at about 163 Hz in the multi-bowl file ([source](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav)). Three strikes were analysed (C1, C1b, C1c); the values in brackets are the spread across them.

| f (Hz) | ratio | level dB | T60 s | tau s | beating |
|---|---|---|---|---|---|
| 162.59 / 163.54 (twins, level difference 0–5 dB) | 1.000 | −1.3 to −4.4 | 28.5 [24.9–29.3] | 4.1 [3.6–4.2] | **Δf 0.95–0.96 Hz; env. mod 0.946–0.949 Hz; 14–17 dB p-p** |
| 325.2 (2f) | 2.000 | −34 to −36 | 11–16 | – | – |
| 469.58 (twin 472.7, −11 to −27 dB) | 2.871–2.888 | 0.0 | 81–95 | 11.8–13.8 | **Δf 3.11–3.13 Hz**, 2.5–6 dB p-p |
| 632–633 | 3.87–3.89 | −45 to −48 | 21–25 | ~3.2 | weak |
| 893.5 (twin 885.1, −6 to −15 dB) | 5.463–5.495 | −12 to −20 | 68–78 | 9.9–11.3 | Δf 8.4 Hz |
| 939.2 | 5.74–5.78 | −32 to −40 | 39–43 | ~6 | – |
| 1400.6 | 8.56–8.61 | −30 to −41 | 35–38 | ~5.3 | Δf 7.0 Hz (C1) |
| 1970.5 | 12.05–12.12 | −34 to −39 | 22.6–23.1 | ~3.3 | – |

**C2**, about 122 Hz (two strikes; [source](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav)):

| f (Hz) | ratio | level dB | T60 s | beating |
|---|---|---|---|---|
| 122.2 / 124.4 (twins: −1 dB in strike C2, −20 dB in C2b) | 1.000 | −8 | 33.7 (C2), 12.6 (C2b) | **Δf 2.14 Hz, env. 2.15 Hz, 21 dB p-p** when both twins are excited equally |
| 363.8 / 361.3 | 2.976 | 0 to −2.5 | 29.8–49.8 | **Δf 2.5 Hz** (env. 2.49–2.50 Hz) |
| 486.0 / 483.5 | 3.976 | −30 to −38 | 8–18 | Δf 2.5 |
| 682.0 | 5.58 | −12 to −20 | 42–58 | – |
| 694.7 | 5.68 | −15 | 39.9 | – |
| 722.6 / 727.6 | 5.91–5.96 | −9 to −15 | 14–32 | **Δf 4.95–5.0 Hz** (env. 4.98 Hz, 14–24 dB p-p) |
| 1080.3 | 8.84 | −22 to −35 | 26–28 | – |

**C3, C4, C5** (quiet strikes, 20–25 dB above the background; [source](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav)):

| bowl | f (Hz), ratio, level | T60 s | beating |
|---|---|---|---|
| C3 | 406.85 (1, 0 dB); 1141.77 (2.806, −14.5); 1155.0 (2.839, −22); 2105.7/2121.4 (5.18/5.21) seen in louder strikes; 3238.4 (7.96) | 28.9; 16.4 | fund. twin 403.76 (−8 dB): **Δf 3.09 Hz**, env. 3.09 Hz, 10 dB p-p |
| C4 | 357.17 (1, −10.7); 1045.21 (2.926, 0); 1995.45 (5.587, −26); 3110/3145 (8.71/8.81) in other strikes | 33.0; 26.4; 13.6 | n=3 twin 1042.12 (−11 dB): **Δf 3.08 Hz**; fund. twin 361.23 (−7 dB): Δf 4.06 |
| C5 | 531.23 (1, −12.7); 1471.34 (2.770, −19); 1461.6 (2.751) twin; 2705.9 (5.09) in another strike | 8.6; 9.5 | fund. twin 528.77 (−6 dB): **Δf 2.46 Hz**, env. 2.48 Hz, 13 dB p-p |

**RIN**, Japanese rin ([source](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_struck_idiophone.ogg)):

| f (Hz) | ratio | level dB | T60 s | tau s | beating |
|---|---|---|---|---|---|
| 814.77 / 814.56 | 1.000 | −6.2 | 24.9 | 3.60 | **Δf 0.21 Hz**, env. 0.21 Hz, 24 dB p-p |
| 1629.12 (2f) | 1.999 | −38.3 | 19.8 | 2.87 | 0.43 Hz (= 2 × 0.21) |
| 2173.53 / 2174.27 | 2.668 | 0.0 | 17.6 | 2.55 | **Δf 0.74 Hz**, 22 dB p-p |
| 3952.02 / 3952.99 | 4.850 | −17.2 | 5.4 | 0.79 | Δf 0.98 Hz |
| 6062 | 7.44 | −35 | – | – | – (survey spectrum only) |

**Crystal bowls** (`analyze_struck.py`, `crystal_partials.py`):

| bowl | partials: f (ratio, level) | source |
|---|---|---|
| PSQ, struck | 233.94 (1, 0 dB); 588.82 (2.517, −21 dB); 1065.4 (4.555, about −39 dB, early only); 2f at 467.8 (−68 dB) | [psuess](https://freesound.org/people/psuess/sounds/194434/) |
| QA, start (light excitation) | 220.74 (1, 0); 568.0 (2.573, −15); 2f 441.4 (−35 during rubbing) | [Lufke](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg) |
| QB, start of playing | 195.24 (1, 0); 499.0 (2.556, −25) and 501.6 (2.569, −34); 900.4 (4.612, −25); 1399.2 (7.166, −33) | [Lufke](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg) |
| JK, start | 221.24 (1, 0); 562.1 (2.541, −33); 1023.5/1026.0 (4.626/4.637, −43); 1603.7 (7.248, −49) | [juskiddink](https://freesound.org/people/juskiddink/sounds/129219/) |
| AQ8 | 501.56 (1, 0); 1307.1 (2.606, −40); 2382.8 (4.751, −51) | [Asuriya 8"](https://freesound.org/people/Asuriya/sounds/530846/) |
| AQ12 | 333.86 (1, 0). Nothing else above −57 dB (very pure) | [Asuriya 12"](https://freesound.org/people/Asuriya/sounds/530847/), [#2](https://freesound.org/people/Asuriya/sounds/530848/) |

**Bronze bowls seen only in rubbed or strike-then-rub recordings:**
- R_YU initial strike: 506.1 (1), 1395.3 (2.757), 2536.1 (5.011), 3863.2 (7.633). This is the lowest-ratio bronze bowl in the set ([source](https://commons.wikimedia.org/wiki/File:Singing_bowl.ogg)).
- R_45 and R_TR: only the rubbed partial and its harmonics are visible.

### Inferences
- **Recipe for a struck bronze bowl:** fundamental f1; partial 2 at about 2.85·f1 (range 2.76–2.98) and as loud as f1 or louder; partial 3 at about 5.45·f1, 0 to −26 dB (median −15); partial 4 at about 8.4·f1, about −15 dB; partial 5 at about 11.9·f1, about −26 dB; partial 6 at about 16.2·f1, about −30 dB.
- **Ratios are bowl-specific and move together.** A bowl with a low second ratio also has a low third ratio (B45 2.767 → 5.171; YU 2.757 → 5.011; C2 2.976 → 5.91). The third-to-second ratio stays at about 1.82–1.99 (median 1.89). A synth can therefore pick one "stretch" parameter per bowl rather than drawing every ratio independently.
- **Weak 2f lines.** Exact second harmonics of the fundamental appear at −34 to −48 dB in most struck recordings. They probably come from nonlinear radiation or the recording chain, and adding them is optional.
- **Extra peaks.** Some bowls show extra peaks near a mode (C2 has 682, 695 and 723 Hz near the third mode). These are probably other modes of the bowl (not the main rim modes) or very widely split pairs. A rich synth can add one or two of them at −10 to −20 dB.

### Gaps
- Bowl sizes, weights and alloys are mostly unknown. Only B11, B45, AS10, AQ12 and AQ8 state a diameter, and B45's rubbed companion does not match it. Ratios therefore cannot be tied to size or wall thickness.
- Levels depend on microphone placement and strike point. They are typical, not universal, and directivity was not measured.
- The upper partials of crystal bowls are only seen at low level in rubbed or lightly excited recordings. Only one clean struck crystal recording was found (PSQ, a 128-192 kbit/s preview). The caiogracco files were rejected as probable glasses.

## Q2. Decay time of each partial after a strike

### Takeaway
Bronze fundamentals ring with T60 of about 9–136 s (median about 33 s; tau 1.3–20 s). Partial 2 often decays as slowly as the fundamental or more slowly: in 6 of 12 bowls its T60 is 0.8–3.2 times the fundamental's. From partial 3 upwards, T60 falls roughly as **f^−0.9** (per-bowl exponents −0.59 to −1.07). The highest audible partials (above 3–4 kHz) last only 2–10 s.

### Cited Findings
Source for all rows: `summarize.py` run on the `analyze_struck.py` output. The recordings are cited in Q1.

| bowl | f1 Hz | T60 n=2 | n=3 | n=4 | n=5 | n=6 | n=7 | T60 ∝ f^α (n≥3) |
|---|---|---|---|---|---|---|---|---|
| B11 ([src](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac)) | 100.6 | 68.8 | 53.0 | 39.7 (weak) | – | – | – | – |
| B45 ([src](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac)) | 361.1 | 58.0 | 40.6 | 24.6 | 18.5 | 9.5 | – | −0.97 |
| SB1 ([src](https://commons.wikimedia.org/wiki/File:SingingBowl1.ogg)) | 105.2 | 112 (low confidence) | 55.1 | 43.3 | 23.3 | 17.3 | 13.7 | −0.84 |
| SL6 ([src](https://freesound.org/people/s-light/sounds/415141/)) | 180.1 | 40.3 | 68.6 | 44.2 | 30.3 | (23.6 at 11.7×) | – | −0.76 |
| AS10 ([src](https://freesound.org/people/Asuriya/sounds/531269/)) | 159.8 | 136 | 95.3 | 54.6 | (36 at 8.7×, −41 dB) | – | – | – |
| ST ([src](https://commons.wikimedia.org/wiki/File:Small_tibetan_singing_bowl.ogg)) | 351.5 | 13.4 | 10.6 | 6.3 | 3.8 | 2.3 | – | −1.07 |
| C1 ([src](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav)) | 163.6 | 29.3 | 93.6 | 77.7 | 38.2 (−41 dB) | 23.1 | – | −1.00 |
| C2 (same src) | 122.2 | 33.7 / 12.6 | 49.8 / 29.8 | 32.1 | 26.5 | – | – | −0.59 |
| C3 (same) | 406.9 | 28.9 | 16.4 | – | – | – | – | – |
| C4 (same) | 357.2 | 33.0 | 26.4 | 13.6 | – | – | – | – |
| C5 (same) | 531.2 | 8.6 | 9.5 | – | – | – | – | – |
| RIN ([src](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_struck_idiophone.ogg)) | 814.8 | 24.9 (31.5 in the free decay after rubbing, [src](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_friction_idiophone.ogg)) | 17.6 | 5.4 | – | – | – | – |
| PSQ crystal ([src](https://freesound.org/people/psuess/sounds/194434/)) | 233.9 | **74.5** (R² 0.93 over 50 dB) | 17.0 | – | – | – | – | – |
| AQ12 crystal ([src](https://freesound.org/people/Asuriya/sounds/530847/)) | 333.9 | 35.6 (R² 0.98, 15 dB) | – | – | – | – | – | – |
| QA crystal, free decay after rubbing ([src](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg)) | 220.7 | 62.9 (13 dB span, moderate confidence) | – | – | – | – | – | – |
| JK crystal, free decay after rubbing ([src](https://freesound.org/people/juskiddink/sounds/129219/)) | 221.3 | **43.0** (R² 1.00 over 35 dB) | – | – | – | – | – | – |
| R_45 bronze, free decay after rubbing ([src](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_4.5inch.flac)) | 523.7 | 8.5 (R² 0.98) | – | – | – | – | – | – |

Pooled bronze statistics (median, with range):

| mode | count | T60 median (range) |
|---|---|---|
| n=2 | 12 | 33.3 s (8.6–136) |
| n=3 | 12 | 45.2 s (9.5–95) |
| n=4 | 10 | 35.9 s (5.4–78) |
| n=5 | 5 | 23.3 s (3.8–30) |
| n=6 | 4 | 13.4 s (2.3–23) |

- **Q factors (Q = π·f·tau):** bronze fundamentals 1,900–9,900; second partials 4,800–20,000; third partials 5,400–31,600. Crystal: PSQ fundamental 7,900, but its partial 2 only 4,600.
- **Decay is not always a straight line.** The early slope (0.2–2 s) is often steeper than the late slope. Examples of "T60 early → late" for the fundamental: B11 43.8 → 70.7 s; SL6 17.4 → 41.8 s; C1 23.0 → 29.4 s; RIN 6.3 → 22.2 s.
  - Part of this is beating, because a twin pair that starts out of phase gives a deep early dip.
  - Part is a genuinely faster early decay, which suggests a two-slope (double-decay) envelope.
  - Some upper partials of C1 appear to rise during the first 1–2 s (early T60 "inf"). This is beating, not true growth.
- **The same bowl can decay very differently.** C2's fundamental gave T60 33.7 s and 12.6 s in two strikes. In the second strike the 124.4 Hz twin was barely excited (−20 dB), so the slower-decaying twin was missing.
- **Anomaly in SL5.** In [SL5](https://freesound.org/people/s-light/sounds/411487/), same bowl as SL6, the main partial (518 Hz) decays with T60 9.9 s instead of 68.6 s, while the other partials keep ringing. The bowl was probably touched or damped, so SL5 is left out of the decay statistics.

### Inferences
- **Simple synthesis rule:** give the fundamental and the second partial similar, long decays (tau 4–14 s for medium and large bowls). For n ≥ 4, shorten tau as roughly 1/f relative to partial 2 (T60 ≈ T60(n=3) · (f/f3)^−0.9).
- **Size and support matter.** Small and high-pitched bowls (ST, C5, at 350–530 Hz) decay much faster (T60 9–13 s) than large bowls (C1, AS10, B11, at 100–165 Hz; 30–136 s). The way the bowl is supported also matters (cushion versus hand); SL5 shows the effect.
- **Crystal bowls:** the fundamental is about as long-ringing as in large bronze bowls (T60 36–75 s), but partial 2 dies 4× faster than the fundamental (PSQ 17 vs 74.5 s). This makes the tail almost a pure sine.
- **Double decay (optional):** model the fundamental as two exponentials, or let a beating twin pair with slightly different damping produce the curvature.

### Gaps
- Several recordings stop while the bowl is still ringing: B11 at 16 s, SB1 at 12.5 s, and the Cuencos strikes, where the next strike arrives after 9–32 s. Long T60s (>60 s) are therefore extrapolated, from as little as 8 dB of measured fall (SB1, 112 s, 8 dB over 12 s) up to about 30 dB. (Corrected after review.)
- Room reverberation was not removed. For partials with T60 above 5 s it is negligible, but it may lengthen the apparent T60 of the fastest partials (2–4 s).
- No recording documents how the bowl was supported, so the size effect and the support effect cannot be separated.

## Q3. Beating pairs (mode splitting) and beat rates

### Takeaway
Almost every bronze partial is a split doublet. Beat rates measured both from resolved twin peaks and from the envelope modulation agree to ±0.03 Hz. Fundamental beats: median about 2.4 Hz, range 0.95–7 Hz in singing bowls (0.21 Hz for the rin). Partial 2: median about 4 Hz, range 1–13 Hz. Partial 3: median about 6 Hz, range 1.7–9 Hz. Partials 4–6: 1.7–23 Hz. The audible depth depends on how equally the two twins are excited, which changes from strike to strike.

### Cited Findings
Δf comes from the twin peaks in a 9–25 s FFT (resolution 0.04–0.11 Hz); "env." is the strongest peak in the spectrum of the de-trended dB envelope (`bowlan.modulation`). The recordings are cited in Q1.

| bowl | n=2 (fund.) | n=3 | n=4 | n=5 | n=6 |
|---|---|---|---|---|---|
| C1 (3 strikes) | 0.95 (env. 0.946–0.949), 14–17 dB p-p | 3.11–3.13, 2–6 dB | 8.4 | 7.0 | – |
| C2 (2 strikes) | 2.14 (env. 2.15), 21 dB p-p | 2.5 (env. 2.49–2.50), 6–11 dB | 4.95–5.0 (723/728), 14–24 dB | – | – |
| C3 | 3.09 (env. 3.09), 10 dB | (13.2 between 1141.8/1155.0) | – | – | – |
| C4 | 4.06 (twin −7 dB) | 3.08 (env. 3.08), 7 dB | – | – | – |
| C5 | 2.46 (env. 2.48), 13 dB | 9.8 (1461.6/1471.4) | – | – | – |
| SL6 / SL5 (same bowl) | 2.16 / 2.00 (env. 2.10 / 2.01), 11–19 dB | 4.93 (twin −19 dB), 2 dB | 6.34 (env. 6.16 in SL5), 14 dB | – | – |
| ST / ST1 (same bowl) | 0.97 / 0.96 (env. 0.96), 6–12 dB | 1.00 (env. 0.98), 17 dB | 2.78–2.81 (env. 2.78), 7–18 dB | 1.66 (env. 1.75) | 3.2 |
| SB1 | weak twin (−27 dB), 0.96 Hz, 2 dB | none resolved (0.63 Hz, 2 dB) | 1.72 (env. 1.715), 9 dB | 2.49 (env. 2.48), 6 dB | 5.34 (env. 5.33), 10 dB |
| AS10 | 2.44 (twin −28 dB), 1 dB | 6.33 (twin −13 dB) | 3.23 (env. 3.22), 7 dB | – | – |
| B45 | 6.97 (twin −13 dB) + <0.1 Hz drift | 9.63 (twin −11 dB) | 8.92 (twin −12 dB) | 23.3 (env. 23.2), 4 dB | 15.4 (env. 15.35), 8 dB |
| B11 | none above −28 dB | 1.32 (env. 1.32), 3 dB | 7.28 (equal pair) | – | – |
| RIN | 0.21 (env. 0.21), 24 dB p-p | 0.74 (env. 0.74), 22 dB | 0.98 (env. 0.98), 9 dB | – | – |
| PSQ crystal ([src](https://freesound.org/people/psuess/sounds/194434/)) | 0.17 (env. 0.19), 6 dB p-p | none | – | – | – |
| AQ12 crystal ([src](https://freesound.org/people/Asuriya/sounds/530847/)) | 0.27 (twin −20 dB), 2 dB | – | – | – | – |
| QA crystal, free decay ([src](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg)) | 0.15 Hz, 2 dB (no twin resolved) | – | – | – | – |
| JK crystal, free decay ([src](https://freesound.org/people/juskiddink/sounds/129219/)) | no twin; ≤0.08 Hz drift, 2 dB | – | – | – | – |

- **Split as a fraction of frequency.** For bronze singing bowls the split is about 0.1–2 % of the mode frequency. Examples: C1 fundamental 0.58 %, C2 1.75 %, B45 fundamental 1.9 % and n=3 0.96 %, SB1 n=4 0.31 %. Crystal splits are 0.07–0.08 %. Source: computed from the table above.
- **Which twin rings depends on the strike.** In repeated strikes on the same bowl, the twin-level difference varied from 0 to 20 dB: C2 −1 dB vs −20 dB; ST1 −4 dB vs ST −14 dB; C1 0 to −5 dB. The beat frequency itself stayed constant to ±0.02 Hz ([Cuencos source](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav); [small-bowl source](https://commons.wikimedia.org/wiki/File:Small_tibetan_singing_bowl.ogg)).
- **Rin 2f line.** The rin's 2f component beats at 0.43 Hz, exactly twice the fundamental's 0.21 Hz. This is consistent with a harmonic generated from the beating fundamental ([source](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_struck_idiophone.ogg)).
- **Literature.** A search-result summary of Inácio, Henrique & Antunes, "The dynamics of Tibetan singing bowls" (Acta Acustica united with Acustica, 2006), says that bowls are never perfectly symmetric, that they produce beating, and that in rubbing the unstable modes spin with the puja so the bowl behaves as a rotating quadrupole ([Southampton ePrints record](https://eprints.soton.ac.uk/43451); the page returned HTTP 403, so this comes from the search summary only).

### Inferences
- **Synthesis:** use two sinusoids per mode at f and f+Δf. Δf for the fundamental is about 1–3 Hz (up to 7); for partials 2–3 use 1–10 Hz, growing roughly with frequency. Randomise the amplitude ratio of the twins per strike between 0 and −20 dB, which sets the depth from about 20 dB p-p down to about 1 dB. Keep Δf fixed for a given bowl.
- **Crystal bowls** need much slower beats on the fundamental (0.15–0.3 Hz, periods of 3–7 s) and shallow depth (2–6 dB). The rin also has slow beats (0.2–1 Hz), but they are very deep.
- **Pairs a few Hz apart above 2 kHz** (B45 at 15–23 Hz) are heard as roughness rather than wobble.

### Gaps
- Beats slower than about 0.1 Hz cannot be confirmed in the shorter recordings (minimum 2 cycles). B45's <0.1 Hz drift and the crystal free decays are uncertain.
- The twin-level ratio depends on where the bowl was struck relative to the microphone, and none of the recordings documents either position.
- Some twin entries with Δf < 0.15 Hz (and no matching envelope modulation) are probably windowing artefacts and were not counted.

## Q4. Rubbed ("singing") playing

### Takeaway
Rubbing excites one partial almost exclusively. In all 10 recordings it is the fundamental; in SB2 the dominant 297.5 Hz matches the struck SB1's strongest partial, while SB1's struck spectrum also has a weaker 105 Hz line that the rubbing leaves unexcited (see Inferences).
- **Build-up:** about 3–16 s to come within 3 dB of steady level, at a mean growth of 0.8–10.6 dB/s.
- **Envelope modulation:** strong in bronze bowls (1–3 Hz, 16–30 dB spread, modulation index about 0.75–0.94). Much gentler in crystal bowls when rubbed steadily (0.3–0.5 Hz, about 5–6 dB, index about 0.3).
- **Pitch:** the rubbed frequency is 0–0.14 % below the free frequency for bronze, and it wanders by ±0.2–0.7 %.
- **Friction:** it adds broadband noise, mostly above 4 kHz (+10 to +18 dB versus free ringing in bronze), plus harmonics of the sung partial (2f at −2 to −50 dB).

### Cited Findings
From `analyze_rubbed.py`. Plateau = median level of the dominant partial over the steady window. AM = strongest peak of the de-trended dB envelope spectrum. Noise = residual energy after notching all partials and harmonics, relative to the dominant partial's energy.

| ID (source) | sung f (Hz) | vs free / struck f | f wander (std, range) | build-up to −3 dB / growth | AM rate (alt. peak), spread | harmonics re sung partial | other modes during rubbing | residual noise re dominant (0.1–1 / 1–4 / 4–12 kHz) | rub − free noise (same bands) |
|---|---|---|---|---|---|---|---|---|---|
| R_ST ([src](https://commons.wikimedia.org/wiki/File:Small_tibetan_singing_bowl.ogg)) | 351.11 | struck twins 351.48/352.44 → −0.37 Hz (−0.1 %) | 0.24 Hz; 350.8–351.8 | 5.2 s from −28 dB; 3.5 dB/s | 1.73 Hz (2.19), 23.5 dB | 2f −44.7 dB | n=3 (994.7) at −27 dB | −41 / −43 / −45 dB | n/a |
| R_SB2 ([src](https://commons.wikimedia.org/wiki/File:SingingBowl2.ogg)) | 297.49 | SB1 struck 297.36 (+0.04 %, separate recordings) | 0.77 Hz; 295.7–297.8 | already sounding at file start | 1.74 Hz (3.48), 30.2 dB | 593.3 Hz at −2.3 dB (1.994×, not exact 2f; see Inferences); 3f −29 dB | – | −33 / −44 / −42 | n/a |
| R_YU ([src](https://commons.wikimedia.org/wiki/File:Singing_bowl.ogg)) | 503.75 and 506.6, alternating | free decay 504.45 (twin 505.72) → −0.70 Hz (−0.14 %) and +2.2 Hz | 1.44 Hz; 503.3–506.9 | 9.9 s from −24 dB; 2.3 dB/s (−1 dB at 15.6 s) | 3.03 Hz, 21.4 dB | 2f not visible | n=3 (1395) −28 dB, n=4 (2536) −30 dB | −22 / −24 / −33 (includes room resonances) | +7.5 / +7.7 / **+10.6 dB** |
| R_45 ([src](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_4.5inch.flac)) | 523.68 | free 523.71 → −0.03 Hz | 0.38 Hz; 523.3–524.5 | 3.1 s from −35 dB; **10.6 dB/s** | 1.47 Hz (2.82), 22.4 dB; sidebands at ±2.8 Hz | 2f −26.5 dB | – | −44 / −52 / −50 | +4.5 / +6.7 / **+14.3 dB** |
| R_TR ([src](https://commons.wikimedia.org/wiki/File:The_sound_of_a_singing_bowl.wav)) | 661.85 | – | 0.25 Hz; 661.3–662.4 | already sounding | 1.09 Hz (4.18), 16.5 dB; sidebands at −4.1/−2.1/+2.2/+4.4 Hz at −14 to −28 dB | 2f −30 dB | – | −39 / −45 / −52 | n/a |
| R_RIN ([src](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_friction_idiophone.ogg)) | 813.36 | free 814.30 → −0.94 Hz (−0.12 %) | 1.03 Hz; 813.2–815.5 | about 9 s to −1 dB from −17.5 dB | 2.03 Hz, 26.9 dB | 2f −50 dB | n=3 (2171.7) −20 dB | −47 / −38 / −41 | −0.2 / +3.9 / **+18.4 dB** |
| R_QA crystal ([src](https://commons.wikimedia.org/wiki/File:Binaural_Cuencos_de_Cuarzo.ogg)) | 220.90 | free 220.74 → +0.17 Hz (+0.08 %) | 0.08 Hz; 220.8–221.05 | 11.8 s from −36 dB; 2.6 dB/s (−1 dB at 21.5 s) | **0.49 Hz**, 5.8 dB (index 0.32) | 2f −35.5 dB | n=3 (568) −48 dB | −39 / −53 / −62 | +2.1 / +4.0 / +1.3 dB |
| R_QB crystal (same src) | 195.47 | – | 0.21 Hz; 195.0–196.3 | 13.0 s from −30 dB; 1.4 dB/s | 0.31 Hz (2.04), 17.3 dB (during build-up with stops) | 2f −40 dB | – | −39 / −55 / −62 | n/a |
| R_JK crystal ([src](https://freesound.org/people/juskiddink/sounds/129219/)) | 221.19 | free 221.30 → −0.11 Hz (−0.05 %) | **0.05 Hz**; 221.07–221.29 | 16.2 s from −17 dB; 0.8 dB/s | **0.33 Hz** (2.06), 5.1 dB (index 0.28) | 2f −60 dB | n=3 (562) −59 dB | −53 / −51 / −64 | +7.7 / +21.5 / +11.1 dB |
| R_AQ8 crystal ([src](https://freesound.org/people/Asuriya/sounds/530846/)) | 501.59 | – | 0.35 Hz | uneven, repeated re-starts | 0.59 Hz (2.43), 20.8 dB (irregular playing) | none above −50 dB | n=3 (1306) −46 dB | −37 / −46 / −54 | n/a |

Additional observations:
- **Envelope of the friction noise.** The noise's own envelope (2–8 kHz residual) shows weak periodicity near **0.9–1.2 Hz** in 6 of 10 recordings: YU 0.96, R_45 1.12, TR 1.11, RIN 0.92, QA 0.98, AQ8 1.21 (peak/median only 4.6–7.9, so low confidence). This is plausibly the puja's revolution rate.
  - The strongest AM rates are 1.0–3.8× that rate. TR's 4.18 Hz AM is 3.8× its 1.106 Hz noise periodicity, and YU's 3.03 Hz is 3.2× its 0.96 Hz. Sources: the R_TR and R_YU rows above.
- **Sidebands.** During rubbing, the sung partial carries a skirt of sidebands spaced about 2–2.5 Hz apart, 14–45 dB down: R_ST 348.5 (−28 dB) and 355.9 (−35 dB); R_45 521.6 (−24), 526.5 (−15), 529.1 (−31); R_RIN 808.0/817.5 (−37 to −39). These disappear or drop to −44 dB or lower in the free decay after rubbing ([R_45 src](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_4.5inch.flac), [rin src](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_friction_idiophone.ogg)).
- **Partial 2 while rubbing.** It stays −20 to −30 dB below the sung partial in bronze (R_ST, R_YU, R_RIN), but is ≤ −46 dB in crystal (QA, JK, AQ8).
- **Free-decay modulation after release.** R_45 1.42 Hz (2.7 dB), RIN 0.20 Hz (2.5 dB; the same 0.21 Hz as its struck twin split), QA 0.15 Hz, JK below the 0.08 Hz resolution limit. Source: the R_* rows above.

### Inferences
- **The sung partial.** Rubbing locks onto the lowest mode (n=2) and sustains it almost as a single, slightly unstable sinusoid. The stick (puja) can make it hop between the two twins (YU: 503.75 ↔ 506.6 Hz). Synthesis: drive one partial's amplitude toward a plateau with a 1st-order rise of about 2–10 dB/s.
  - Superimpose AM at 1–4 Hz with a modulation index of 0.7–0.9 for bronze, or 0.3–0.5 Hz at about 0.3 for crystal.
  - Add slow jitter of ±0.1–0.3 % on the pitch.
  - Add 2f and 3f at −25 to −45 dB, and friction noise high-passed above about 2–4 kHz, gated with the same AM, about 40–50 dB below the tone.
  - Keep the other modes at −20 to −30 dB (bronze), or almost absent (crystal).
- **SB2's 593.3 Hz.** This component (−2.3 dB) holds steady while the sung partial wanders between 295.7 and 297.8 Hz, so it is not a locked harmonic. It may be another resonance or object. Treat it as an outlier, not as typical.
- **Is SB2 rubbing the fundamental?** SB2's sung 297.5 Hz equals SB1's strongest struck partial (297.36 Hz, ratio 2.828 over a 105.17 Hz line). If 105 Hz is the true fundamental, this bowl was rubbed on its second mode, which is possible with a fast or hard puja. The 105 Hz line's identity is not certain (see Gaps).

### Gaps
- Rubbing speed and pressure are not documented in any recording, so AM rate cannot be tied to rotation speed with confidence.
- The noise-periodicity estimate is weak. Room resonances (R_YU) and binaural summing (R_QA, R_QB) contaminate the noise residual.
- Build-up times depend on the player. Three recordings (R_SB2, R_TR, R_AQ8) start mid-rub or are uneven, so no build-up could be measured for them.
- I could not find literature numbers to check the rotating-quadrupole AM ratio against.

## Q5. Consistency across bronze bowls, and how crystal bowls differ

### Takeaway
Across 12 bronze bowls, the n=3 ratio is 2.76–2.98 (median 2.85), n=4 is 5.0–5.9 (median 5.46), n=5 is 8.0–8.8 (median 8.4) and n=6 is 11.3–12.1 (median 11.8): a spread of about ±4–8 %. Five crystal bowls are tightly clustered at a lower series: n=3 2.52–2.61 (median 2.556), n=4 4.56–4.75 (median 4.62), n=5 7.17–7.25. Crystal bowls are also much purer, have weaker and faster-dying upper partials, beat very slowly, and drift less in pitch when rubbed.

### Cited Findings
From `summarize.py`, which takes the strongest peak per ratio window, level > −40 dB, harmonics excluded. YU and the rin are listed separately. Sources are the recordings cited in Q1.

| bowl | f1 (Hz) | n=3 | n=4 | n=5 | n=6 | n=7 |
|---|---|---|---|---|---|---|
| B11 | 100.6 | 2.982 | 5.808 (−32 dB) | – | – | – |
| C2 | 122.2 | 2.976 | 5.912 (alt. 5.580, 5.683) | 8.838 | – | – |
| SB1 | 105.2 | 2.828 | 5.339 | 8.427 | 12.134 | 16.249 |
| AS10 | 159.8 | 2.882 | 5.528 | (8.725 at −41 dB) | – | – |
| C1 | 163.6 | 2.871–2.888 | 5.463–5.495 | 8.56–8.61 | 12.05–12.12 | – |
| SL6 | 180.1 | 2.878 | 5.366 | 8.372 | (11.677 at −47 dB) | – |
| ST | 351.5 | 2.833 | 5.336 | 8.361 | 11.817 | – |
| C4 | 357.2 | 2.926 | 5.587 | (8.71–8.81) | – | – |
| B45 | 361.1 | 2.767 | 5.171 | 7.987 | 11.337 | – |
| C3 | 406.9 | 2.806 | (5.18) | (7.96) | – | – |
| YU (strike) | 506.1 | 2.757 | 5.011 | 7.633 | – | – |
| C5 | 531.2 | 2.770 | (5.09) | – | – | – |
| **bronze median (range)** | | **2.85 (2.757–2.982)** | **5.46 (5.01–5.91)** | **8.4 (7.63–8.84)** | **11.8 (11.34–12.13)** | 16.2 (1 bowl) |
| RIN (Japanese rin) | 814.8 | 2.668 | 4.850 | 7.44 | – | – |
| PSQ crystal | 233.9 | 2.517 | 4.555 | – | – | – |
| QA crystal | 220.7 | 2.573 | – | – | – | – |
| QB crystal | 195.2 | 2.556 | 4.612 | 7.166 | – | – |
| JK crystal | 221.2 | 2.541 | 4.626 | 7.248 | – | – |
| AQ8 crystal | 501.6 | 2.606 | 4.751 | – | – | – |
| **crystal median (range)** | | **2.556 (2.517–2.606)** | **4.62 (4.555–4.751)** | 7.17–7.25 | – | – |

Other contrasts (all measured above):

| property | bronze | crystal |
|---|---|---|
| level of n=3 | median −0.7 dB, often the strongest peak (Q1) | −15 to −40 dB (PSQ −21 dB) |
| level of n=4 | median −15 dB | −25 to −51 dB |
| T60 of n=3 relative to fundamental | 0.5–3.2× | 0.23× (PSQ) |
| fundamental beat rate | 0.95–7 Hz (typical 1–3 Hz) | 0.15–0.27 Hz |
| rubbed pitch wander (std) | 0.24–1.44 Hz, i.e. 0.04–0.29 % | 0.05–0.35 Hz, i.e. 0.02–0.11 % |
| rubbed AM | 16–30 dB spread | 5–6 dB in steady rubbing (QA, JK); 17–21 dB in uneven playing (QB, AQ8) |
| exact 2f line | −34 to −48 dB when struck; −26 to −50 dB when rubbed | −35 to −60 dB when rubbed; −68 dB when struck (PSQ) |

### Inferences
- **Crystal model.** A convincing crystal bowl is essentially one long sine (tau about 5–11 s) with a twin 0.15–0.3 Hz away at −10 to −20 dB, plus a quickly decaying partial at 2.55× (−20 dB, tau about 2.5 s) and a trace at 4.6×.
- **Bronze model.** A bronze bowl needs at least 4–6 modes using the ratios above, each with its own twin split of 0.5–10 Hz.
- **The rin** sits between the two types: lower ratios (2.67, 4.85), very slow and deep beats, and a bright upper partial.

### Gaps
- There is no metallurgical or size information to explain the ratio spread within the bronze group. The two highest-ratio bowls (B11 and C2, about 2.98) are both large and low-pitched, but two cases are not enough to establish a trend.
- Only one crystal recording (PSQ) is a clean strike, so the struck-crystal level and decay data rest on that one recording.

## Q6. Attack: duration and spectral content of the strike transient

### Takeaway
The strike is a very short broadband click: 10–90 % rise of 0.3–16 ms, usually 1–5 ms. For the first few milliseconds the non-partial (noise) component is about as loud as the tonal sound (−0.1 to −8.9 dB relative to total). That noise then falls by 20 dB within 32–125 ms for bronze (about 300 ms in the one crystal strike, where the noise floor limits the measurement). Mallet hardness sets the brightness: a hard striker gives a 7–9 kHz spectral centroid in the first 20 ms, falling to about 0.5 kHz by 2–3 s. Soft or felt mallets give 0.2–0.9 kHz centroids that barely change.

### Cited Findings
From `analyze_struck.py`:
- **Onset.** The broadband Hilbert envelope, smoothed over 1 ms; the onset is the first crossing of 10 % of the strike peak.
- **Residual.** The signal with the partial groups notched out (Butterworth band-stop filters ±max(8 Hz, 1.2 %)), measured as RMS over 5 ms.
- **Centroid.** The spectral centroid of the whole signal in successive windows.

| ID (source in Q1) | rise 10–90 % (ms) | peak after onset (ms) | residual at onset re total (dB) | residual −20 dB after (ms) | residual centroid 0–20 ms (Hz) | whole-signal centroid 0–20 ms → 20–100 ms → 0.5–1 s → 2–3 s (Hz) |
|---|---|---|---|---|---|---|
| ST (hard striker, small bowl) | 0.8 | 1.2 | −0.6 | 125 | 8,823 | 6,774 → 3,736 → 1,393 → 541 |
| ST1 (same bowl) | 1.0 | 1.2 | −2.3 | 204 | 6,595 | 3,758 → 3,459 → 2,160 → 865 |
| B45 | 1.2 | 1.5 | −2.4 | 70 | 2,240 | 1,987 → 2,016 → 1,640 → 1,235 |
| RIN | 0.8 | 1.1 | −2.0 | 97 | 3,274 | 2,941 → 2,966 → 2,289 → 2,044 |
| SL6 (soft mallet) | 1.5 | 1.8 | −2.3 | 38 | 480 | 466 → 498 → 421 → 486 |
| SL5 (soft mallet) | 1.4 | 1.7 | −2.0 | 64 | 208 | 226 → 498 → 471 → 530 |
| SB1 | 12.8 | 13.2 | −4.8 | 35 | 455 | 432 → 427 → 373 → 333 |
| B11 (large) | 8.1 | 48.7 | +2.6 (−8.9 re peak) | 36 | 185 | 172 → 155 → 150 → 141 |
| C1 / C1b / C1c | 3.2 / 3.2 / 1.7 | 3.5 / 3.4 / 10.1 | −0.6 / −1.4 / −3.0 | 46 / 44 / 32 | 384 / 462 / 234 | 280 → 214 → 369 → 386 (C1) |
| C2 / C2b | 0.9 / 4.4 | 1.2 / 4.7 | +0.5 / −2.3 | 32 / 49 | 319 / 321 | 302 → 405 → 401 → 414 (C2) |
| C3 | 1.5 | 2.1 | −0.1 | 56 | 780 | 787 → 505 → 558 → 678 |
| C4 | 4.9 | 6.8 | 0.0 | 72 | 867 | 871 → 833 → 826 → 851 |
| C5 | 7.8 | 8.1 | −0.1 | 35 | 1,166 | 1,134 → 775 → 641 → 595 |
| PSQ crystal | 2.0 | 2.3 | −2.2 | 297 | 607 | 368 → 347 → 241 → 237 |

- **Strike rolls.** The rin "struck" file opens with a roll of light taps every 0.25–0.3 s, each about 2–10 dB louder than the last, before the final strike at 4.5 s ([source](https://commons.wikimedia.org/wiki/File:Japanese_rin_played_as_struck_idiophone.ogg)).
- **Multi-bowl file (C1–C5).** The C3/C4/C5 strikes are only 19–24 dB above the ringing of the other bowls, so their residual numbers include other bowls' partials. The residual "floor" is −15 to −29 dB there ([source](https://commons.wikimedia.org/wiki/File:Cuencos_tibetanos_al_ser_percutidos.wav)).

### Inferences
- **Synthesis:** use a 1–5 ms attack (up to about 15 ms for a padded mallet on a large bowl) and add a noise burst of about equal level that decays with tau of about 5–20 ms (−20 dB in 30–130 ms). Filter the burst by mallet hardness: low-pass at about 0.5–1 kHz for felt or suede, broadband to 8–10 kHz for a wooden or metal striker.
- **Hard strikes also excite the upper partials strongly** (ST: n=4 and n=5 at −12 to −15 dB, fading in 2–6 s). This makes the hard strike's brightness decay naturally even without a filter envelope.
- **Felt-mallet strikes (C1, C2, SL)** keep the centroid near the fundamental and the second partial (200–500 Hz) from the first 20 ms analysis window onward; the analysis cannot resolve the first milliseconds. (Corrected after review.)
- **Delayed peak in B11.** The peak arrives 49 ms after onset (rise only 8 ms), and SB1's rise is 13 ms. This suggests a soft, heavy mallet on a low-pitched bowl, where several cycles of the 100 Hz fundamental pass before the peak.

### Gaps
- Mallet type is stated only for s-light ("soft-mallet"). Others are inferred from brightness.
- Freesound previews are lossy MP3, which smears transients slightly (pre-echo of about 1–2 ms). Rise times under about 2 ms in those files are upper-bound estimates.
- The residual method treats unpicked weak partials and room reverberation as "noise". Transient durations are therefore conservative (too long) where the noise floor is high (PSQ, C3–C5).
- I found no clean, struck crystal-bowl recording with a documented mallet, so crystal attack data rests on PSQ alone.
