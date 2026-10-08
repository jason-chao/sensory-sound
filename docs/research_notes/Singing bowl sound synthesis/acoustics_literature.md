# Acoustics and physics of singing bowls (Himalayan bronze and quartz crystal), from the scientific literature

Scope note: "measured" means a value a paper reports from its own experiment; "model", "simulated" or "claim" are marked as such. Any "Inference" is my own arithmetic or reasoning from the cited numbers. Main primary sources read in full: Inácio, Henrique & Antunes (2006) full text; Terwagne & Bush (2011) arXiv full text; Wang, Tsai & Wu (MATEC 2018) full text; Imbery, Jensen & Weber (DAGA 2014) full text; Rossing (1994, JASA) full text; Fletcher, McGee & Tarnopolsky (2002, JASA) full text; Serafin, Wilkerson & Smith (DAFx 2002) full text.

Source shorthand used below:
- [Inácio 2006] = O. Inácio, L. Henrique, J. Antunes, "The Dynamics of Tibetan Singing Bowls", Acta Acustica united with Acustica 92(4) 637-653 (2006). Full text: http://projects.itn.pt/BellTune/File3.pdf
- [Terwagne 2011] = D. Terwagne, J.W.M. Bush, "Tibetan singing bowls", Nonlinearity 24 (2011) R51. arXiv: https://arxiv.org/pdf/1106.6348
- [Wang 2018] = B.-T. Wang, C.-L. Tsai, Y.-H. Wu, "Vibration modes and sound characteristic analysis for different sizes of singing bowls", MATEC Web of Conf. 185, 00017 (ICPMMT 2018). https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf (also https://www.matec-conferences.org/articles/matecconf/pdf/2018/44/matecconf_icpmmt2018_00017.pdf)
- [Imbery 2014] = C. Imbery, B. Jensen, R. Weber, "Spectral directivity of singing bowls", DAGA 2014 Oldenburg. https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf
- [Rossing 1994] = T.D. Rossing, "Acoustics of the glass harmonica", J. Acoust. Soc. Am. 95(2) 1106-1111 (1994). Copy read: https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf
- [Fletcher 2002] = N.H. Fletcher, W.T. McGee, A.Z. Tarnopolsky, "Bell clapper impact dynamics and the voicing of a carillon", JASA 111(3) 1437 (2002). https://www.phys.unsw.edu.au/music/people/publications/Fletcheretal2002.pdf
- [Serafin 2002] = S. Serafin, C. Wilkerson, J.O. Smith, "Modeling bowl resonators using circular waveguide networks", DAFx-02. https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf

## 1. Vibrational modes and partial frequency ratios (bronze and crystal)

### Takeaway
A singing bowl's sounding modes are the (j,0) rim-bending modes of a short shell: j = 2, 3, 4 ... gives 2j nodes around the rim and no nodal circles. For Himalayan bronze bowls the measured partial ratios relative to (2,0) are about 1 : 2.7–3.0 : 4.8–6.0 : 7.5–9.5 : 10.6–13.7 : 14–18 : 18–23. Larger, lower-pitched bowls sit at the stretched end of that range, close to ideal-ring theory (1 : 2.83 : 5.42 : 8.77 : 12.87 : 17.7 : 23.3). I found no peer-reviewed partial-ratio data for quartz crystal bowls.

### Cited Findings
**Mode shapes / notation**
- (n,m) or (j,k): n (or j) = number of complete nodal meridians (half the number of nodes seen around the rim), m (or k) = number of nodal circles. The (2,0) fundamental has 4 nodes and 4 antinodes around the rim. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348); [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Bowls are squat (low height/diameter ratio), so only (j,0) modes were identified. Inácio measured 7 mode pairs, (2,0) to (8,0), in Bowl 2. Terwagne: "only modes (n,0) were excited" because modes with m ≠ 0 carry "a high energetic penalty". — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf); [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- In purely flexural motion, radial displacement ∝ cos nθ and tangential displacement ∝ (1/n) sin nθ. For (2,0) the maximum tangential motion is half the maximum radial motion. The tangential share shrinks as n rises, so only low-order modes can easily be self-excited by tangential rubbing. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348); [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- A finite-element model plus experimental modal analysis of a bronze ("copper alloy") bowl found that the sound comes from the "ring" modes (z,θ) = (1,2), (1,3) ... of the upper wall. The bottom-plate modes (r,θ), from FE at 2142–3511 Hz, do not appear in the struck-rim sound spectrum. — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)

**Measured frequencies, Himalayan/Tibetan bronze ([Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf), Tables I–II; values are the A/B pair, ratio = pair mean / (2,0) mean)**

| Mode | Bowl 1: φ 180 mm, 934 g | Bowl 2: φ 152 mm, 563 g | Bowl 3: φ 140 mm, 557 g | Bowl 4: φ 262 mm, 1533 g (single values) |
|---|---|---|---|---|
| (2,0) | 219.6 / 220.6 Hz (1) | 310.2 / 312.1 (1) | 513.0 / 523.6 (1) | 86.7 (1.0) |
| (3,0) | 609.1 / 609.9 (2.8) | 828.1 / 828.8 (2.7) | 1451.2 / 1452.2 (2.8) | 252.5 (2.9) |
| (4,0) | 1135.9 / 1139.7 (5.2) | 1503.4 / 1506.7 (4.8) | 2659.9 / 2682.9 (5.2) | 490.0 (5.7) |
| (5,0) | 1787.6 / 1787.9 (8.1) | 2328.1 / 2340.1 (7.5) | 4083.0 / 4091.7 (7.9) | 788.0 (9.1) |
| (6,0) | 2555.2 / 2564.8 (11.6) | 3303.7 / 3312.7 (10.6) | 5665.6 / 5669.8 (10.9) | 1135 (13.1) |
| (7,0) | 3427.0 / 3428.3 (15.6) | 4413.2 / 4416.4 (14.2) | – | 1533 (17.7) |
| (8,0) | 4376.3 / 4389.4 (19.9) | 5635.4 / 5642.0 (18.1) | – | 1963 (22.6) |
| (9,0)–(11,0) | – | – | – | 2429, 2936, 3480 (28.0, 33.9, 40.1) |

- Inácio: the ratios are "rather similar, in spite of the different bowl shapes, sizes and wall thickness", agree with Rossing's results, and are "roughly proportional to j²". The relationship is "mildly inharmonic, which does not affect the definite pitch ... mainly dominated by the first (2,0) shell mode". Results show "5 to 7 prominent resonances ... up to frequencies about 4~6 kHz". — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Ring theory quoted by Inácio for in-plane ring modes: ω_j = [j(j²−1)/√(j²+1)]·√(EI/(ρAR⁴)). — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Bowl "A" (copper alloy; paper gives "height 128 mm, radius 260 mm", the latter probably the diameter), measured from experimental modal analysis (EMA): 121.1, 361.7, 700.0/712.5, 1123.4/1135.2, 1614.1/1621.9, 2152.3/2169.5, 2752.3, 3357.8/3382.0 Hz for (1,2)…(1,9). In the struck-sound spectrum the peaks were 118.4/120.2, 361.7/363.4, 714.6, 1126/1138, 1619, 2158, 2757/2760, 3401 Hz, giving ratios 1, 3.05, 6.04, 9.51, 13.67, 18.23, 23.29, 28.73. — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- A tuned set of 7 bowls (largest "radius 358 mm, height 148 mm") had fundamentals of 66.76, 75.76, 82.14, 89.4, 99.56, 107.4 and 126 Hz (C2–B2, within 2–3 %). The overtone ratios cluster "near integer ratios, especially 3 and 6", e.g. Bowl 1: 1, 1.01, 3.09, 3.11, 6.04, 6.21, 9.96, 14.38, 16.16, 19.92. The authors claim this near-integer relationship makes the sound "harmony". — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- Terwagne's four antique bowls (measured, Table 1):

  | Bowl | f(2,0) empty | Radius R | Wall thickness a | Mass | Density |
  |---|---|---|---|---|---|
  | Tibet 1 | 236 Hz | 7.5 cm | 0.34 cm | 0.690 kg | 9079 kg/m³ |
  | Tibet 2 | 187 Hz | 8.9 cm | 0.38 cm | 0.814 kg | 8366 kg/m³ |
  | Tibet 3 | 347 Hz | 6.0 cm | 0.31 cm | 0.306 kg | 8754 kg/m³ |
  | Tibet 4 | 428 Hz | 5.9 cm | 0.37 cm | 0.312 kg | 9372 kg/m³ |

  All mode frequencies for n = 2–6 collapse onto f·R²/a ∝ n². — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Thin-cylinder model (French's wine-glass theory, adapted): f(n,m) = (1/12π)·√(3Y/ρs)·(a/R²)·√{[(n²−1)² + (mR/H0)⁴]/(1+1/n²)}. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- A 2 kg bowl, 28.5 cm diameter, struck with a rubber stick, gave 18 reproducible partials between 80 and 2000 Hz, most below 1000 Hz. First modal pair 85.5 / 87.1 Hz, second pair 173.1 / 174.5 Hz. — [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)

**Crystal (quartz) bowls**
- An undergraduate thesis (FEA + EMA, abstract only accessible) compared a crystal bowl and a "handmade" bowl, both nominally the note B. Fundamentals were 471.36 Hz (crystal) and 138.25 Hz (handmade). Mode shapes were similar, both with upper-ring vibration. The handmade bowl rang longer; the crystal bowl gave a "higher, more consistent tone". — [Koed 2022, TAR UMT thesis](https://eprints.tarc.edu.my/22274/)
- Not peer-reviewed (retailer blog, Feb 2026, Python FFT/Hilbert analysis; method, microphone and striking not disclosed). Fourteen bowls: frosted crystal bowls showed 2–3 partials and no dominant beat (274 Hz, 3 partials; 323 Hz, 2; 385 Hz, 2). Clear crystal showed 3–8 partials (C4 clear, 262 Hz: 8 partials with a 1.8 Hz beat). Bronze bowls showed 4–31 partials, with beats of 0.8–8.2 Hz (102 Hz bowl: 31 partials, 2.2 Hz beat; 220 Hz: 15 partials, 8.2 Hz). It claims crystal is "homogeneous and isotropic ... almost no mode splitting". — [The Ohm Store](https://www.theohmstore.co/blogs/our-stories/metal-vs-crystal-singing-bowls-spectral-analysis)
- Closest peer-reviewed analogue, glass vessels: a wineglass's modes "resemble the flexural modes of a bell". Striking an armonica bowl (glass) excites (3,0), (4,0), (5,0) and (6,0) as well as (2,0); rubbing gives the (2,0) fundamental and its 2nd harmonic. — [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf)

### Inferences
- The measured ratios bracket the ideal-ring prediction (1 : 2.83 : 5.42 : 8.77 : 12.87 : 17.71 : 23.30 : 29.63, my calculation from Inácio's Eq. 3). Large, low bowls (Inácio Bowl 4 at 262 mm, Wang bowls at 67–126 Hz) match or exceed it: about 2.9–3.1, 5.7–6.0, 9.1–9.5, 13.1–13.7. Small, high bowls (140–180 mm, 220–520 Hz) are compressed: about 2.7–2.8, 4.8–5.2, 7.5–8.1, 10.6–11.6. A plausible cause is extra stiffening of the low modes by the base and wall curvature, but no source tests this.
- Practical synthesis default for a 15–20 cm bronze bowl: ratios ≈ [1, 2.75, 5.1, 7.9, 11.3, 15.2, 19.5]. For a 25–30 cm bowl: ≈ [1, 2.95, 5.8, 9.2, 13.3, 17.9, 22.9, 28.4]. Detune each by a few percent per bowl to model individuality.
- The [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf) pairs at 85.5/87.1 and 173.1/174.5 Hz give a second-to-first ratio of about 2.02. That is far from the ≈2.7–3.0 of every other bronze bowl, so the 85.5 Hz pair may not be (2,0), or this bowl may be unusual. The source does not explain it, so treat it with caution.

### Gaps
- No peer-reviewed measurement of quartz crystal bowl partial frequencies, ratios, splitting or decay was found. Only an inaccessible thesis abstract and a retailer blog exist. The inharmonic glass-shell analogy (Rossing) suggests crystal bowls also have (2,0), (3,0)… modes with similar ring-like ratios, but this is not measured.
- Rossing's own singing-bowl tables (Science of Percussion Instruments, 2000; Fletcher & Rossing) could not be accessed. Inácio says his ratios are "entirely in agreement" with Rossing's.

## 2. Beating / "wobble": mode splitting of degenerate pairs

### Takeaway
Every (j,0) mode of a perfectly axisymmetric bowl is a degenerate pair (cos jθ and sin jθ). Hand-made bronze bowls are never perfectly symmetric, so each pair splits by roughly 0.1 % to 2 %, and the two members beat at the difference frequency. Measured fundamental splits are about 1–2 Hz on 85–310 Hz bowls and up to about 10 Hz on a 520 Hz bowl, giving slow 0.3–3 Hz "wah-wah" on the fundamental and faster beats (up to about 23 Hz) on upper partials. When a bowl is rubbed, an additional "pseudo-beat" appears that is unrelated to asymmetry (see Section 4).

### Cited Findings
- "Perfectly axi-symmetrical structures exhibit double vibrational modes, occurring in orthogonal pairs with identical frequencies"; slight asymmetry splits them by Δω_n. The two members of each pair have the same shape, rotated by π/(2j): π/4 for (2,0). — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf); [Terwagne 2011](https://arxiv.org/pdf/1106.6348) ("two peaks separated by several Hz arise and a beating mode is heard"; angular shift π/4 for (2,0) and π/2n for other (n,0))
- Measured splits (B − A) from the table in Section 1 ([Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)):
  - Bowl 1 (180 mm): 1.0, 0.8, 3.8, 0.3, 9.6, 1.3, 13.1 Hz for (2,0)…(8,0)
  - Bowl 2 (152 mm): 1.9, 0.7, 3.3, 12.0, 9.0, 3.2, 6.6 Hz
  - Bowl 3 (140 mm): 10.6, 1.0, 23.0, 8.7, 4.2 Hz
- Bowl A (≈260 mm) struck-sound pairs: 118.4/120.2 Hz (1.8 Hz), 361.7/363.4 (1.7), 1126/1138 (12), 2757/2760 (3). Smaller set bowls: 66.76/67.63 (0.87 Hz), 82.14/83.59 (1.45), 107.4/109.1 (1.7), 126/128.9 (2.9), 370.6/375.3 (4.7). — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- 285 mm, 2 kg bowl: pair 85.5/87.1 Hz (1.6 Hz) and pair 173.1/174.5 Hz (1.4 Hz). Within the second pair the two partials differ in level by about 20 dB. Modal pairs "often have a distinct amplitude and decay pattern". Some pairs give a direction-independent modulation, others a direction-dependent one, so "the resulting beats ... also have a directivity pattern". — [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)
- "Experiments clearly show that beating phenomena arises even for near-perfectly symmetrical bowls". In simulation Inácio models asymmetry crudely as a 2 % split (Δω_n = 0.02 ω_n) on every pair. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Perceptually, the Tibetan bowl sound has "two main characteristics: long sustained partials and a strong characteristic beating", caused by slight asymmetries of shape. — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- A 2023 study (from a search-result summary only, not verified in full text) reports a component near the fundamental, 6.68 Hz from it, producing the beating. It also reports components at 773.15, 1102.56, 1464.81 and 1870.86 Hz. — [Kim & Choi 2023, IJERPH 20:6180](https://www.mdpi.com/1660-4601/20/12/6180)
- Crystal: the only claim of "almost no mode splitting" comes from a retailer, which still lists a 1.8 Hz beat in one clear crystal bowl. — [The Ohm Store](https://www.theohmstore.co/blogs/our-stories/metal-vs-crystal-singing-bowls-spectral-analysis)

### Inferences
- Relative split: (2,0) splits range from about 0.45 % (Bowl 1) to about 2 % (Bowl 3, 85.5/87.1 Hz bowl). Upper modes can split by up to about 0.9 % in absolute terms (Bowl 3 (4,0): 23 Hz on 2670 Hz). The split does not grow monotonically with mode number; it varies erratically from mode to mode, as expected from random imperfections. For synthesis, draw each pair's split independently, e.g. log-uniform between 0.03 % and 1.5 % of f, with an occasional near-zero split.
- Beat depth (how deep the "wah" goes) depends on how the strike divides energy between the A and B members. In Inácio's modal model the modal amplitude coefficient is A_ner = φ_n(θe)·φ_n(θr)/m_n, so the strike angle θe relative to the bowl's own asymmetry axes, and the listener or microphone angle θr, set the relative amplitudes of the cos and sin members. Striking at a node of one member excites only the other, giving no beat on that partial. This is why the beat changes with strike point and with listening direction (consistent with Imbery 2014's directional beats).
- Hand-hammered bronze versus cast bronze versus crystal: no peer-reviewed comparison exists. A homogeneous, lathe-turned or moulded glass bowl should have smaller splits than a hand-hammered bowl (physical reasoning only).

### Gaps
- No peer-reviewed measurement of split magnitudes in crystal bowls, or of hammered versus cast bronze bowls.
- Rossing's bowl splitting data (Science of Percussion Instruments) was not accessible.

## 3. Decay: time constants, dependence on partial number, and support damping

### Takeaway
Bronze bowls have extremely low damping. Inácio measured modal damping ratios of ζ ≈ 0.002–0.015 % on unencumbered, struck bowls, higher for higher modes. That implies T60 of minutes for the fundamental and a few seconds for the highest partials (about 4–6 kHz). Holding or supporting the bowl can raise damping by "one order of magnitude, or more". Recordings show the sound persisting for about 40–50 s or more, and higher partials die first.

### Cited Findings
- "Dissipation is very low, with modal damping ratios typically in the range ζn = 0.002~0.015 % (higher values pertaining to higher-order modes). However, these values may increase one order of magnitude, or more, depending on how the bowls are actually supported or handled." — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Method detail: accelerometers and cables noticeably increased damping, so the damping values were taken from the logarithmic decrement of band-pass-filtered sound-pressure decays of non-instrumented struck bowls. Those also showed "slightly higher values for the natural frequencies and much longer decay times". Simulations used an average ζ = 0.005 % for all modes. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Spectrogram of a Tibetan bowl: "the three modes at the lowest frequency show a very long decay time"; the main modes decay more slowly. — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- Recordings of a 285 mm bowl lasted 45 s per strike. — [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)
- 2023 study (search-result summary only): the sound "gradually diminishes in amplitude for more than 40 seconds" and "persists for approximately 50 seconds"; higher-frequency modes decay faster within the first seconds. — [Kim & Choi 2023](https://www.mdpi.com/1660-4601/20/12/6180)
- Not peer-reviewed: crystal decay of "60–180+ seconds" and "60 to 90 seconds" for professional frosted bowls (retailer claims, method undisclosed). — [The Ohm Store](https://www.theohmstore.co/blogs/our-stories/metal-vs-crystal-singing-bowls-spectral-analysis)
- A handmade (bronze) bowl had a longer sound duration than a crystal bowl of the same note (thesis abstract). — [Koed 2022](https://eprints.tarc.edu.my/22274/)
- Glass analogue: "Wine glasses have a shorter decay time" than the Tibetan bowl. — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)

### Inferences
- Converting with T60 = 3 ln 10 / (ζ·2πf) ≈ 1.1/(ζ·f), my arithmetic:
  - Bowl 1 (2,0) at 220 Hz: about 250 s at ζ = 2×10⁻⁵, about 33 s at ζ = 1.5×10⁻⁴.
  - Bowl 2 (2,0) at 310 Hz with ζ = 5×10⁻⁵: about 71 s.
  - Bowl 1 (8,0) at 4376 Hz with ζ = 1.5×10⁻⁴: about 1.7 s.
  - The upper ends are longer than the 40–50 s audible persistence reported. That is consistent with room noise floors and the "minutes" being in the far tail, but treat ζ = 0.002 % (2×10⁻⁵) as a best case for a freely resting bowl.
- For synthesis, a reasonable model is constant-Q-like damping with ζ rising with mode number. For example ζ_j ≈ 3×10⁻⁵ … 2×10⁻⁴ from j = 2 to j = 8 (bowl on a cushion), multiplied by about 3–10 for a hand-held bowl. That gives a fundamental T60 of about 20–100 s on a cushion, a few to about 15 s when hand-held, and upper partials (≥3 kHz) of about 1–5 s.
- Because each pair's two members can have "distinct ... decay pattern[s]" (Imbery), give A and B slightly different damping as well as different frequencies. The beat depth then drifts over the decay.

### Gaps
- No paper gave measured T60 per partial for a bowl resting on a cushion versus held in the palm. Only Inácio's qualitative "one order of magnitude, or more".
- No peer-reviewed decay measurement for crystal bowls. Fused silica has very low internal loss, but crystal bowls are usually played on rubber rings or feet, which may dominate damping. Not measured in any source found.

## 4. Rim rubbing (puja/stick): stick–slip, mode selection, rotating pattern, build-up, chatter

### Takeaway
Rubbing excites a single shell mode, usually (2,0), by stick–slip friction. That mode locks to integer harmonics of its own frequency and its vibration pattern spins with the puja. A listener at a fixed point hears amplitude modulation at 2j × (puja revolutions per second): 4 beats per revolution for (2,0) and 6 for (3,0). This happens even for a perfectly symmetric bowl. Simulated and measured build-up takes about 5–14 s. Light pressure combined with fast motion gives intermittent contact and audible "chatter"/rattle.

### Cited Findings
**Stick–slip and harmonics**
- In stick–slip, during the stick phase the rim follows the mallet; during the slip phase it relaxes to equilibrium. The result is "a fundamental frequency plus a number of harmonics". One node follows the contact point. Rubbing excites "primarily the (2,0) fundamental mode", and the measured rubbed spectrum of Tibet 4 (f(2,0) = 428 Hz) shows the (2,0) peak plus "harmonics induced by mode lock-in". — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Glass: the rubbing force "is rich in harmonics, [but] only the fundamental component matches the frequency of a vibrational mode". Only one mode can couple stably at a time unless a harmonic of one mode lands near another mode. In one wineglass the 5th harmonic of (2,0) at 5990 Hz and the (5,0) mode at 5997 Hz coupled and showed up prominently, as did the 7th harmonic at 8380 Hz and the (6,0) mode at 8423 Hz. Rubbing an armonica bowl gave the fundamental and 2nd harmonic of (2,0). A violin bow could excite either (2,0) or (3,0), but not both at once. — [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf)

**Which mode sings**
- Simulations and experiments: instability of "typically the first 'elastic' mode, with 4 azimuthal nodes", with "an exponential increase of the vibration amplitude followed by ... saturation". "Pujas made of different materials may trigger self-excited motions at different fundamental frequencies", and singing in different modes "is easier to obtain in larger bowls". On Bowl 4 (262 mm), a rubber-covered puja gave (2,0) at about 87 Hz with 4 beats per revolution. A harder naked-wood puja gave a longer transient, then (3,0) with "six beats per revolution". — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Tibetan bowls must be rubbed externally on the rim to self-excite; they do not sing when rubbed internally (per the search summary of Inácio's work). — [Inácio et al., Southampton eprint](https://eprints.soton.ac.uk/43451)

**Rotating pattern and amplitude modulation**
- "The unstable modes spin at the angular velocity of the puja. As a consequence, for the listener, singing bowls behave as rotating quadropoles. The sound will always be perceived as beating phenomena, even if using perfectly symmetrical bowls." At a fixed point the amplitude fluctuates at Ω_fluct = 4 Ω_puja, with Ω_puja = 2V_T/φ (rad/s; V_T = puja tangential speed, φ = bowl diameter). In general the source is a spinning 2j-pole. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Experimental confirmation on Bowl 4: an observer marked each puja passage by the microphone, and "4 sound pressure maxima are recorded" per revolution. Radiation is minimal near the contact point, which therefore sits near a radial node; the radial motion at a fixed point exceeds that at the contact point by a factor of about 2. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Glass: a brandy snifter showed a 5 Hz beat at 1¼ finger rotations per second, i.e. 4 per revolution, and in general "about 4 to 8 beats per second, depending upon the speed of the player's finger". — [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf); repeated in [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- Contested detail: Rossing quotes Rayleigh's observation that on a rubbed glass bell jar "the line of vibration was seen to revolve with an angular velocity double that of the finger". Rossing interprets this as a complicated stick–slip tangential motion. That differs from Inácio's statement that the mode pattern spins at the puja's angular velocity. The two may describe different quantities (the direction of a rim point's motion versus the nodal pattern), but neither source reconciles them. — [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf); [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Rubbing imparts angular momentum to liquid in the bowl because a node follows the contact. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)

**Playing parameters, build-up and chatter (Inácio simulations of Bowl 2, 152 mm, plus Bowl 4 experiments)**
- Puja modelled as 20 g. The usual playing range explored was normal force F_N = 1–9 N and tangential speed V_T = 0.1–0.5 m/s. Friction parameters were μs = 0.8 and μ∞ = 0.4 for a soft puja, and μs = 0.4 and μ∞ = 0.2 for a harder one. Contact stiffness K_c ranged from 10⁵ N/m (soft, rubber) to 10⁶–10⁷ N/m (hard, wood). — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Build-up ("initial transient"):
  - Up to about 14 s in the parameter map (Fig. 12a). About 5 s at F_N = 7 N, V_T = 0.5 m/s.
  - "Transients are shorter for increasing normal forces".
  - On real Bowl 4 the motion "settles after about 7 seconds of exponential divergence".
  - Simulations were run for 20–30 s "to cope with the large settling times". — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Three regimes:
  - (1) Steady self-excited vibration with permanent contact.
  - (2) Steady vibration with periodic contact loss. At F_N = 7 N, V_T = 0.5 m/s the contact force is zero about 25 % of the time, radial force peaks reach about 3 F_N, and the spectrum has more high-frequency energy.
  - (3) Unsteady, intermittent build-up followed by collapse after "chaotic chattering". At F_N = 1 N, V_T = 0.5 m/s, a steady state is never reached; "curious sounds, which interplay the aerial characteristics of 'singing' with a distinct 'ringing' response due to chaotic chattering".
  - Chattering "is more prone to arise at low excitation forces and higher velocities". "Higher values of F_N should enable a better control ... shorter transients and ... less prone to chattering." — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Rubbing amplitude: tangential RMS displacement at the contact point is up to about 1.6–2×10⁻⁴ m, and radial components are much lower (Fig. 13). Radial amplitude is roughly independent of F_N in regime (1) and grows with F_N in regime (3). — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- In simulation, a 2 % frequency split was enough to change the regime from (1) to (3) at F_N = 3 N, V_T = 0.3 m/s. For symmetric bowls, the beating from the spinning mode shape dominates over the beating from the modal split. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)

### Inferences
- Amplitude-modulation rate for rubbing (my arithmetic): f_AM = 2j·V_T/(π·φ).
  - 152 mm bowl: V_T = 0.3 m/s gives 0.63 rev/s and a (2,0) AM of about 2.5 Hz; V_T = 0.5 m/s gives about 4.2 Hz.
  - 262 mm bowl: V_T = 0.3 m/s gives about 1.5 Hz (2,0), or about 2.2 Hz if (3,0) sings.
  - With an asymmetric bowl this AM combines with the modal-split beat. The relative angle between the spinning pattern and the bowl's fixed asymmetry axes produces a slower, irregular envelope.
- Synthesis recipe implied by the literature:
  - Rubbing drives one mode pair (usually (2,0)) toward a limit cycle with exponential build-up over a few seconds.
  - It adds weak integer harmonics of that mode's frequency (not the inharmonic higher modes), plus prominence wherever a harmonic falls near a bowl mode.
  - It modulates amplitude at a fixed listening point at 2j × the revolution rate.
  - Chatter appears as irregular bursts of broadband "ringing" from the inharmonic higher modes being struck by repeated micro-impacts.

### Gaps
- No measured build-up times from real players beyond Inácio's single about-7 s example. No measured harmonic-amplitude roll-off (dB per harmonic) for rubbed bronze bowls (Rossing's armonica example has its 2nd harmonic 26 dB below the fundamental for one recorded note).
- No source quantified the pitch shift during rubbing. Stick–slip normally locks to the mode frequency, and none reported a shift.

## 5. Striking: mallet hardness, strike position, attack transient

### Takeaway
A harder or stiffer striker shortens the contact time, which pushes the spectral "turnover" frequency up and excites more high, inharmonic modes. The result is brighter, more "metallic" or "clangy" attacks. Soft mallets favour the low modes. Strike position selects modes by mode shape: striking the rim excites the ring modes, not the base modes, and the strike azimuth sets the A/B balance of each pair.

### Cited Findings
- Simulated impact on Bowl 2 (impact velocity 1 m/s): "as the contact stiffness increases from 10⁵ N/m to 10⁷ N/m, higher-order modes become increasingly excited and resonate longer. The corresponding simulated sounds become progressively brighter, denoting the 'metallic' bell-like" character. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- A soft-tip stick struck at the top of the ring excited mostly the lower modes, with "the sound pressure level becom[ing] descending at higher modes". Only the ring (z,θ) modes appear; the base (r,θ) modes are "not excited for striking on the ring surface". — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- Bell physics (carillon, bronze):
  - Contact time is "typically about 1 ms", while the effective impact time is "only a few tenths of a millisecond".
  - Shortening the impact (a worn, flattened clapper) "has the effect of increasing the relative amplitude of higher modes ... making it 'brighter' or even 'clangy'".
  - Measured spectral turnover frequencies were 4 kHz before and 1.8 kHz after re-voicing (bell 29), and 900 Hz versus 600 Hz for a larger bell.
  - After voicing, "soft notes have relatively little harmonic development and loud notes are both louder and brighter". That is, a non-linear (Hertzian) contact makes brightness rise with strike velocity. — [Fletcher 2002](https://www.phys.unsw.edu.au/music/people/publications/Fletcheretal2002.pdf)
- Glass: tapping with a yarn-wrapped vibraphone mallet excites several modes, whereas rubbing excites one. Radiation efficiency "increases rapidly with frequency near the coincidence frequency", so higher modes radiate much more efficiently than (2,0) for the same vibration amplitude. — [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf)
- A Tibetan bowl struck at different positions gave different frequency responses (figure only, no numbers). — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- Practice-related: the puja is "frequently made of wood and eventually covered with a soft skin". Sound depends on "excitation location, the hardness and friction characteristics" of the stick, and impact and rubbing can be combined. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)

### Inferences
- Synthesis model: treat the strike as a force pulse of duration τ (about 0.3–1 ms for wood on bronze, several ms for felt or rubber). Shape the excitation spectrum by a low-pass with corner near 1/τ, and make τ shrink with strike velocity (Hertzian contact). Weight each mode by its shape at the strike point, so that modes with an antinode at the strike are excited.
- The attack transient is dominated by the upper inharmonic modes (high radiation efficiency, fast decay). Within roughly 1–5 s the sound collapses onto the (2,0)/(3,0) pairs and their beats.

### Gaps
- No measured spectra comparing felt, rubber, leather and wood mallets on a singing bowl were found. Contact times for bowl mallets have not been measured.
- No data on strike height (rim versus mid-wall) for bowls.

## 6. Water in the bowl; size, wall thickness and material versus pitch and timbre

### Takeaway
Pitch scales roughly as wall thickness / radius² (f ∝ a/R²), with partials ∝ n². Measured (2,0) fundamentals run from about 67 Hz for very large bowls (~70 cm) to about 520 Hz for 14 cm bowls. Filling with water lowers every mode, by about 20–23 % for a full bowl. At high rim amplitude water makes edge-induced Faraday waves at half the mode frequency, then ejects and bounces droplets. Those are visual and fluid effects, not part of the sound.

### Cited Findings
**Size and thickness scaling**
- Bending-wave argument: f ∝ a/R² ("frequency increases with rim thickness, but decreases with radius"), and per mode f_n ∝ n²a/R². This is verified by collapsing the four bowls' data with f·R²/a. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- (2,0) frequency from French's theory: f0 = (1/2π)·√(3Y/5ρs)·(a/R²)·√[1 + (4/3)(R/H0)⁴]. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Frequencies are "roughly proportional to j², as in cylindrical shells, and inversely proportional to φ²", attributed to Rossing. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- Measured fundamental versus size:
  - 140 mm / 557 g: 513–524 Hz
  - 152 mm / 563 g: 310 Hz
  - 180 mm / 934 g: 220 Hz
  - 262 mm / 1533 g: 86.7 Hz — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
  - R = 5.9–8.9 cm (a = 3.1–3.8 mm): 187–428 Hz — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
  - 285 mm / 2 kg: about 85.5 Hz — [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)
  - Tuned set, largest "radius 358 mm": 66.8–126 Hz; "the fundamental frequency and overtone frequencies ... are higher for the smaller size". — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- Thickness matters as much as diameter. Inácio's Bowls 2 (152 mm) and 3 (140 mm) have nearly equal mass, yet differ by 1.67× in pitch. Terwagne's Tibet 3 and Tibet 4 have nearly equal radii (6.0 versus 5.9 cm), yet differ (347 versus 428 Hz) because of thickness (3.1 versus 3.7 mm). — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf); [Terwagne 2011](https://arxiv.org/pdf/1106.6348)

**Material**
- Bowl alloy composition is "unknown, but generally ... a bronze alloy that can include copper, tin, zinc, iron, silver, gold and nickel". — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- From the mode fits, Y/ρs = 8.65×10⁶ Pa·m³/kg for all four bowls ("likely made of the same material"). With a mean density of 8893 kg/m³ this gives Y ≈ 77 GPa ± 6 %, "lower than typical brass, copper or bronze alloys for which Y > 100 GPa". — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- FE model calibrated to measurement: density 4802.6 kg/m³ and E = 39.37 GPa, Poisson ratio 0.3. The density is physically implausible for bronze, but E/ρ ≈ 8.2×10⁶ is close to Terwagne's ratio. Frequency depends on E/ρ (and geometry) only. RMS FE–EMA error was 4.27 %. — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)

**Water (Terwagne & Bush 2011)**
- Fill lowers frequency per French: (f0/fH)² ≈ 1 + (α/5)(ρl R/ρs a)(H/H0)⁴, with α ≈ 1.25. Because of the (H/H0)⁴ term, small fills barely change pitch and the last part of the fill matters most. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Measured fill effects:
  - Tibet 1 (2,0): 236 Hz empty → 188 Hz full of water (−20 %).
  - Tibet 2: (2,0) 187 → 144 Hz full (−23 %); its (3,0) is 524 Hz when full. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Surface-wave sequence with rising rim acceleration Γ = Δω²/g:
  - Axisymmetric progressive capillary waves at the forcing frequency come first.
  - Then circumferential standing ripples at the wall ("edge-induced Faraday waves") at half the forcing frequency, spaced about one Faraday wavelength.
  - Then chaotic waves, and finally wave breaking with droplet ejection. Ejected drops can bounce, skid or roll on the surface.
  - Example, Tibet 1 full of water at 188 Hz: Γ = 1.8, 2.8, 6.2, 16.2 for the successive stages.
  - Tibet 2 (2,0) at 144 Hz: Γ = 1.0, 1.7, 5.0, 12.7. Tibet 2 (3,0) at 524 Hz: Γ = 5.7, 7.7, 15.1, 33.8. Higher modes need more acceleration and make shorter wavelengths. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Thresholds scale as Γ_F ∝ f^(5/3) (Faraday onset) and Γ_d ∝ f^(4/3) (droplet ejection), measured over 50–750 Hz with bowls, wineglasses and cans. The bowl's "relatively low vibration frequency makes it a more efficient generator of edge-induced Faraday waves" than a wine glass. In the experiments the bowl was driven by a loudspeaker at its resonance, not played. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- Rubbing with water: rotation of the node with the mallet imparts angular momentum to the liquid. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)

### Inferences
- Rim displacement at those thresholds (my arithmetic, Δ = Γg/ω²): about 0.013 mm at Γ = 1.8 and 188 Hz, and about 0.11 mm at Γ = 16.2 (droplet ejection). So a vigorously played bowl's rim moves on the order of 0.01–0.1 mm. That is consistent with Inácio's simulated rubbing RMS amplitudes of about 0.05–0.2 mm (tangential).
- For synthesis, "water" can be modelled as a fill-dependent downward scaling of all mode frequencies, following (H/H0)⁴. Sloshing or rotation of the water would add slow, small frequency and damping fluctuations (not measured). Water also adds damping, but that was not quantified.

### Gaps
- No measurement of how water changes damping/T60 or partial ratios (French's formula is for the (2,0) mode; Terwagne only gives (3,0) full-bowl frequency for Tibet 2).
- No peer-reviewed size/pitch table for crystal bowls. Quartz density (about 2200 kg/m³) and modulus imply a different E/ρ from bronze, but no crystal-bowl modal study was found.
- Pitch-versus-size ranges for commercial bowls (e.g. 10–40 cm) come from the few measured examples above. No large survey exists.

## 7. The "singing" quality: which partials dominate when struck versus rubbed

### Takeaway
When struck, a bowl sounds a bell-like chord of 5–10+ inharmonic, beating partials. The perceived pitch is set by (2,0), and (3,0) is usually strong. The upper partials fade within seconds, leaving (2,0) and (3,0) to hum with slow beats. When rubbed, the sound becomes nearly harmonic: one mode, usually (2,0), plus its integer harmonics, with a spinning-quadrupole pulsation tied to the stick's speed. That pulsation is the "singing".

### Cited Findings
- Tapping excites several modes; rubbing excites primarily the (2,0) mode plus its harmonics (mode "lock-in"). — [Terwagne 2011](https://arxiv.org/pdf/1106.6348); [Rossing 1994](https://forums.futura-sciences.com/attachments/physique/331690d1483890481-experience-tipe-obtenir-hologrammes-chant-verres-jas001106-hologrammes-.pdf)
- The pitch is "mainly dominated by the first (2,0) shell mode" despite mild inharmonicity. — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- In the struck spectrum of Tibet 4 (wooden mallet, f(2,0) = 428 Hz) the strongest peak was (3,0), with (2,0), (4,0), (5,0) and (6,0) also labelled, up to about 6 kHz (Fig. 3a relative magnitudes). In the rubbed spectrum (leather mallet), (2,0) and its harmonics appear. — [Terwagne 2011](https://arxiv.org/pdf/1106.6348)
- A soft-tip strike gives the highest level at the lowest modes, decreasing with mode number. — [Wang 2018](https://val.npust.edu.tw/wp-content/uploads/2021/09/330-Vibration-Modes-and-Sound-Characteristic-Analysis-for-Different-Sizes-of-Singing-Bowls.pdf)
- Rubbed bowl: "for a listener, the rubbed bowl behaves as a spinning quadropole – or, in general, a 2j-pole ... and the radiated sound will always be perceived with beating phenomena". — [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)
- "Long sustained partials and a strong characteristic beating" are the two perceptual hallmarks. — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- Radiation is directional and partial-specific. Across 18 partials the azimuthal patterns were about 29 % omnidirectional, 24 % dipole and 7 % cardioid. In elevation the most common shape (about 38 %) radiates about 10 dB more upward than sideways. The sound "changes on the one hand with passing of time and on the other hand in different spatial directions". — [Imbery 2014](https://pub.dega-akustik.de/DAGA_2014/data/articles/000254.pdf)
- Physical-modelling precedents for synthesis: banded or circular waveguide networks, each band representing one mode pair, driven by a friction model for rubbing (Serafin et al., DAFx 2002). Essl & Cook, "Banded waveguides on circular topologies and of beating modes: Tibetan singing bowls and glass harmonicas" (ICMC 2002) handles beating by mistuned mode pairs. Inácio notes that waveguide models of the time missed the rotating-pattern beating and the radial/tangential coupling. — [Serafin 2002](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf); [Essl & Cook 2002](https://quod.lib.umich.edu/i/icmc/bbp2372.2002.010/--banded-waveguides-on-circular-topologies-and-of-beating?view=image); [Inácio 2006](http://projects.itn.pt/BellTune/File3.pdf)

### Inferences
- Approximate struck-bowl perception timeline:
  - 0–50 ms: bright, inharmonic attack (upper modes, radiation-efficient).
  - 0.1–5 s: chord of (2,0), (3,0) and (4,0), each with its own beat.
  - Beyond about 5–10 s: (2,0) (+ (3,0)) hum with a slow 0.5–3 Hz wobble, decaying over tens of seconds.
- For crystal bowls the same physics should apply with fewer audible partials and weaker beating. That rests on non-peer-reviewed spectral counts (2–3 partials for frosted crystal), so it should be treated as a hypothesis.

### Gaps
- No listening tests found on which partials listeners weight for pitch or "singing" quality.
- Essl & Cook's ICMC 2002 paper was not read in full (page-image only). Its measured bowl data, if any, are not included here.
