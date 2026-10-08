# Synthesis methods for struck and rubbed singing bowls in the browser (Web Audio API)

Scope: how to synthesise singing bowl sounds in sensory-sound (TypeScript, MIT), which today uses OscillatorNode, GainNode, BiquadFilterNode, ConvolverNode and noise buffers, and could add an AudioWorklet. Unless marked as an inference, every claim below has a source link. Numbers marked "computed" are my arithmetic on the sourced values. I ran two small Node.js checks of my own (biquad precision, see section 3), and they are labelled as such.

Main sources:
- Inácio, Henrique & Antunes, "The Dynamics of Tibetan Singing Bowls" (Acta Acustica united with Acustica, 2006): measured modes, damping, the friction model, and how rubbing works. PDF: http://projects.itn.pt/BellTune/File3.pdf (the server's TLS certificate does not match the host name, so I fetched it with curl -k; a mirror is at https://www.academia.edu/18993357/The_Dynamics_of_Tibetan_Singing_Bowls).
- Serafin, Wilkerson & Smith, "Modeling bowl resonators using circular waveguide networks", DAFx-02: https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf
- Burtner, Serafin & Topper, "Real-time spatial processing and transformations of a singing bowl", DAFx-02: https://www.dafx.de/papers/DAFX02_Burtner_Serafin_Topper_singing_bowl.pdf
- STK BandedWG source (Essl & Cook's Tibetan bowl preset, "ICMC'02"): https://github.com/thestk/stk/blob/master/src/BandedWG.cpp
- Faust physmodels.lib: https://github.com/grame-cncm/faustlibraries/blob/master/physmodels.lib
- Mathews & Smith, "Methods for Synthesizing Very High Q Parametrically Well Behaved Two Pole Filters", SMAC-03: https://ccrma.stanford.edu/~jos/smac03maxjos/smac03maxjos.pdf
- Web Audio API specification: https://webaudio.github.io/web-audio-api/ and the browser source code (Chromium, Gecko, WebKit).

---

## 1. What is wrong or missing in the current "singing bowls" layer?

(Current layer: 4 sine partials at ratios 1, 2.76, 5.4, 8.9; each doubled by a second oscillator detuned by 0.7 to 1.7 Hz; a 1.2 s linear attack; exponential decays with time constants of about 1 to 3 s.)

### Takeaway
The partial ratios are borrowed from a bar, not a bowl, although for the first four modes they happen to fall inside the range measured on real bowls. The real problems are elsewhere. The 1.2 s linear attack makes a strike sound like a swell. The decays are about 10 times too short for the fundamental, and the high partials do not die off fast enough by comparison. There are not enough modes for a metallic strike. The beating is uniform and always 100% deep, when real beating depends on the mode, the strike position and the listening angle. There is no strike transient. And there is no separate rubbed ("singing") gesture, whose signature is a slow exponential build-up of the (2,0) mode with amplitude modulation tied to how fast the stick goes round.

### Cited Findings
- **The ratios are STK's bar preset.** STK's "Uniform Bar" preset uses mode ratios 1.0, 2.756, 5.404, 8.933. These are essentially the ratios the library uses now. STK's separate "Tibetan Prayer Bowl" preset has 12 modes in near-degenerate pairs around 1, 2.98, 5.70, 9.01, 12.82, 17.28 and 21.98 — [STK BandedWG.cpp](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp)
- **Measured bowl ratios (mean of each doublet over the (2,0) mode)** — [Inácio et al. 2006, Table I/II](http://projects.itn.pt/BellTune/File3.pdf):
  - Bowl 1 (934 g, 180 mm): 1, 2.8, 5.2, 8.1, 11.6, 15.6, 19.9
  - Bowl 2 (563 g, 152 mm): 1, 2.7, 4.8, 7.5, 10.6, 14.2, 18.1
  - Bowl 3 (557 g, 140 mm): 1, 2.8, 5.2, 7.9, 10.9
  - Bowl 4 (1533 g, 262 mm, f1 = 86.7 Hz): 1, 2.9, 5.7, 9.1, 13.1, 17.7, 22.6, 28.0, 33.9, 40.1
- The same three bowls appear in the Csound manual's modal-ratio table with absolute frequencies: 180 mm bowl [221, 614, 1145, 1804, 2577, 3456, 4419] Hz; 152 mm bowl [314, 836, 1519, 2360, 3341, 4462, 5696] Hz; 140 mm bowl [528, 1460, 2704, 4122, 5694] Hz — [Csound manual, Modal Frequency Ratios](https://csound.com/docs/manual/MiscModalFreq.html)
- **Frequency scaling.** Mode frequencies grow roughly as j² (j is the number of nodal meridian pairs) and fall roughly as 1/diameter². The in-plane ring formula is ω_j ∝ j(j²−1)/√(j²+1) · √(EI/(ρAR⁴)) — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **How many modes are prominent.** Bowls show "5 to 7 prominent resonances with very low modal damping values up to frequencies about 4-6 kHz" — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Damping.** Modal damping ratios are ζ = 0.002% to 0.015%, with the higher values for higher modes. These "may increase one order of magnitude, or more, depending on how the bowls are actually supported or handled". Their simulations used 0.005% for every mode — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Measured doublet splits (f_nA vs f_nB)** — [Inácio et al. 2006, Table I](http://projects.itn.pt/BellTune/File3.pdf):
  - Bowl 1: 219.6/220.6, 609.1/609.9, 1135.9/1139.7, 1787.6/1787.9, 2555.2/2564.8, 3427.0/3428.3, 4376.3/4389.4 Hz
  - Bowl 2: 310.2/312.1, 828.1/828.8, 1503.4/1506.7, 2328.1/2340.1, 3303.7/3312.7, 4413.2/4416.4, 5635.4/5642.0 Hz
  - Bowl 3: 513.0/523.6, 1451.2/1452.2, 2659.9/2682.9, 4083.0/4091.7, 5665.6/5669.8 Hz
- **What a bowl sounds like.** The two main perceptual features are "long sustained partials and a strong characteristic beating", and the three lowest modes decay much more slowly than the rest — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Striking versus rubbing.** Tapping excites many "bell modes", while rubbing "excites mainly the lowest mode, i.e., the (2,0) mode and its harmonics" through stick-slip — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **How a rubbed tone starts.** When rubbed, the (2,0) mode becomes unstable and grows exponentially until nonlinear effects saturate it, at about 7.5 s (F_N = 3 N, V_T = 0.3 m/s). The transient is about 5 s at F_N = 7 N, V_T = 0.5 m/s, and about 7 s for the large Bowl 4 — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **A comparable MIT web synth makes the same simplifications.** evoluteur/tibetan-singing-bowls uses 4 partials, ratios 1/2.71/5.15/8.3, beat offsets 0.55/1.3/2.4/3.7 Hz, decay time constants 3.4/1.9/1.1/0.6 s, and a 4 ms attack for strikes — [github.com/evoluteur/tibetan-singing-bowls, js/bowls.js](https://github.com/evoluteur/tibetan-singing-bowls)

### Inferences
- **Attack.** A 1.2 s linear attack is wrong for a strike, where the attack should be a few milliseconds plus a transient. It is closer to a rub, but a rub grows exponentially (concave on a linear amplitude scale) over roughly 3 to 8 s and then saturates. A linear ramp is the wrong shape.
- **Decay of the fundamental (computed from ζ).** τ = 1/(ζ·2πf).
  - Bowl 2's fundamental (311 Hz) at the paper's ζ = 0.005% gives τ ≈ 10 s (T60 ≈ 71 s).
  - At ζ = 0.002% it gives τ ≈ 26 s.
  - At 10× damping (a bowl held in the hand) it gives τ ≈ 2.6 s.
  - So τ = 1–3 s on the fundamental matches only a heavily damped bowl. For a bowl on a cushion, a fundamental τ of 8–20 s is more realistic.
- **Decay of the upper modes (computed).** Upper modes decay much faster because τ ∝ 1/(ζ f) and ζ also rises with mode order. For example, 2340 Hz at ζ = 0.015% gives τ ≈ 0.45 s.
- **Beating.** The split between the two members of a pair is not a uniform 0.7–1.7 Hz. Measured splits run from about 0.3 Hz to about 23 Hz and are not monotonic in mode number. For example, Bowl 2 has 1.9, 0.7, 3.3, 12.0, 9.0, 3.2 and 6.6 Hz. Some pairs give slow "wah" beats, others a fast roughness, and some are nearly steady. Randomising the split per mode and per bowl, roughly in proportion to frequency (about 0.05%–1% of f, occasionally up to 2%), is closer to reality.
- **Too few modes.** With 4 modes the strike lacks the 11×–20× partials (about 2.5–6 kHz on a small bowl) that make the metallic "tink" of a hard mallet. 6–8 mode pairs cover what Inácio et al. found to be prominent.

### Gaps
- I found no perceptual study that sets the minimum number of modes for a convincing bowl. The figure of 5–7 is based on which modes are prominent in measurements, not on listening tests.
- I could not access the Essl & Cook ICMC 2002 paper itself; the University of Michigan library returned 403. Its parameters are known here only through the STK preset that cites it.

---

## 2. Modal / additive synthesis: number of modes, degenerate pairs and beating, per-mode decay, strike position, mallet hardness, transient

### Takeaway
Additive synthesis with two sinusoids per mode pair, each with its own exponential decay, is physically right for a struck bowl and is cheap with native nodes. Three things matter most:
- **Two close frequencies, not amplitude modulation.** This gives correct beating, and the beat depth falls out of the relative amplitudes of the pair.
- **Strike position.** It sets those relative amplitudes, through cos(jθ) and sin(jθ).
- **Mallet hardness.** It sets how much the upper modes are excited, so in practice it acts as a spectral tilt or low-pass on the excitation.

### Cited Findings
- **Why modes come in pairs.** A perfectly axisymmetric structure has double modes in orthogonal pairs with identical frequencies. A slight loss of symmetry splits them by Δω_n, and "the use of these modal pairs is essential for the correct dynamical description of axi-symmetric bodies" — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Beating comes from the asymmetry.** Beats are due to slight asymmetries of the bowl's shape; without them the modes would be degenerate — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Strike position sets the balance of a doublet.** In bells, "the relative loudness of each frequency pair depends on the strike point". There are four strike points, 90° apart, at which one frequency is at its maximum and the other at its minimum — [Hibbert, "Doublets or warble in bells"](https://www.hibberts.co.uk/doublets-or-warble-in-bells/) (search snippet only; the page's TLS certificate had expired and I could not fetch it in full).
- **STK's bowl preset.** It encodes pairs explicitly, with fundamental ratios 0.996108344 and 1.0038916562, and pairs (2.979178, 2.99329767), (5.704452, 5.704452) [identical], (8.9982, 9.01549726) and (12.83303, 12.807382), plus single modes 17.2808219 and 21.97602739726. The per-mode excitation weights are 1.19, 1.09, 4.30, 4.01, 0.71 and 5.71 — [STK BandedWG.cpp](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp)
- **Strike position changes the spectrum.** Recordings at 8 strike positions show the spectrum changing with position — [Burtner et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Burtner_Serafin_Topper_singing_bowl.pdf). Serafin et al. show the frequency response "of the bowl hit at different positions" — [DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Mallet hardness.** In impact simulations, raising the contact stiffness from 10⁵ to 10⁷ N/m excites the higher modes more and makes them ring longer. The sound becomes "progressively brighter, denoting the 'metallic' bell-like tone which is clearly heard when impacting real bowls using wood or metal pujas" — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Strike transient (Serafin et al.).** A raised-cosine force pulse 1−cos(2πt/τ) and nonlinear contact models (Marhefka–Orin, Avanzini–Rocchesso) "were not able to reproduce faithfully the strength of the impact between hard surfaces such as a metal and a hard mallet". Instead they inverse-filtered recordings to extract a residual excitation, then filtered it according to strike force and position — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Faust's strike excitation.** `strikeModel(HPcutoff, LPcutoff, sharpness, gain, trigger)` is white noise → 2nd-order high-pass → 2nd-order low-pass → AR envelope with attack = release = 0.002·sharpness seconds — [Faust physmodels.lib](https://github.com/grame-cncm/faustlibraries/blob/master/physmodels.lib)
- **Faust's bell models** take `(nModes, exPos, t60, t60DecayRatio, t60DecaySlope)`, with up to 50 modes, 7 strike positions, t60 ≈ 30 s recommended, and a decay slope of 2.5–3 recommended — [Faust physmodels docs](https://faustlibraries.grame.fr/libs/physmodels/)
- **The web synth's transient.** evoluteur's strike transient is a noise burst through a bandpass at 2600 Hz, Q 0.8, with gain 0.10·strength — [evoluteur/tibetan-singing-bowls](https://github.com/evoluteur/tibetan-singing-bowls)
- **Restriking a ringing mode.** A "phase-preserving restrike" adds to a ringing mode's magnitude without changing its phase. It is best timed at a zero-crossing to avoid clicks — [Mathews & Smith, SMAC-03](https://ccrma.stanford.edu/~jos/smac03maxjos/smac03maxjos.pdf)

### Inferences
- **Two oscillators or amplitude modulation?** For a pair with amplitudes a and b at frequencies f and f+Δ, the sum beats at Δ with depth (a−b)/(a+b) at the minima, not to full silence unless a = b. Amplitude modulation of a single oscillator gives sidebands at ±Δ symmetric around f, which is not the same spectrum. Two oscillators also make each member decay independently, with slightly different τ, so the beat depth changes over the tail as in real bowls. Two oscillators per pair are therefore preferable, and cost the same as the current layer.
- **Strike-position model** (standard ring/shell theory, consistent with Hibbert's 90° observation for the j = 2 doublet). For mode order j (2,3,4,…), striking at angle θ from the A-mode axis gives amplitude ∝ cos(jθ) on member A and ∝ sin(jθ) on member B. The listener at angle φ hears roughly A·cos(jφ) + B·sin(jφ). A seeded random θ per strike gives natural variation in beat depth, from almost none to full.
- **Mallet hardness, practical mapping.** Scale mode n's amplitude by a low-pass weight, e.g. w_n = 1/(1 + (f_n/f_c)²) with f_c of about 1–2 kHz for a felt or suede mallet and 5–10 kHz for wood or metal. Alternatively, pass the excitation burst through a lowpass at f_c. Contact duration and cutoff are inversely related; a hard mallet means a short contact and so a wide-band excitation.
- **Strike transient options (cheap first):**
  - (a) A 2–10 ms noise burst, high-passed at about 1 kHz and low-passed at f_c, mixed in directly at low level. This gives the "tick" and is cheap.
  - (b) The same burst driving the resonators, if a resonator bank is used.
  - (c) A short sampled residual, as Serafin et al. did. This needs a recording, so it is less suited to a pure-synthesis MIT library.
- **Per-mode decay.** Use a base τ1 (for example 8–20 s) and scale τ_n = τ1·(f1/f_n)^p with p of about 1–1.5. This follows from τ ∝ 1/(ζf) with ζ rising for higher modes. Faust's "t60DecaySlope" plays the same role. Make the two members of a pair differ slightly, for example ±5–15% in τ, so the beating evolves.
- **Recommended mode set** (Bowl 2 style, mean ratios): 1, 2.7, 4.8, 7.5, 10.6, 14.2, 18.1, as 7 pairs = 14 oscillators. 5 pairs = 10 oscillators is a reasonable mobile budget. Drop modes above about 0.45·fs and modes whose excitation weight falls below −60 dB.
- **Inharmonic tuning.** The library tunes the fundamental to a scale note. Real bowls are tuned only by their (2,0) mode, and the other partials are fixed by shape, so keep the inharmonic ratios. Small per-bowl random variation (±2–4%, within the spread between bowls shown above) makes several bowls sound like different objects.

### Gaps
- I found no published mapping from a specific mallet (felt, suede, wood) to contact time or cutoff frequency for singing bowls. The f_c values above are my suggestions and not sourced.
- I found no published per-mode excitation weights for a strike at the rim with a padded mallet, other than STK's bowl preset. The STK weights are for its banded-waveguide structure and may not carry over directly to sinusoid amplitudes.

---

## 3. Modal resonator banks: BiquadFilterNode with very high Q, precision, and alternatives in an AudioWorklet

### Takeaway
Numerically, BiquadFilterNode can handle bowl-like Q (3,000–25,000). Chrome, Firefox and Safari all compute biquads in double precision, and even single-precision coefficients would be accurate to within about 0.02 Hz at 48 kHz. The practical problems are elsewhere:
- **Tiny gain.** The spec's "bandpass" has a 0 dB peak, so an impulse produces a tiny ringing signal and needs a huge input gain.
- **Q and T60 are coupled.** Q ≈ π·f·T60/ln(1000).
- **Chrome can cut the tail.** Chrome caps a BiquadFilterNode's tail time at 30 s, and its tail estimate assumes a unit impulse, so a high-Q, low-gain bandpass may be judged to have no tail and be silenced once its input goes silent (see Inferences).
- **Changing parameters while ringing causes artefacts.**

In an AudioWorklet, a complex-multiply ("phasor") resonator, or Faust's Chamberlin-form modeFilter, is the robust choice.

### Cited Findings
- **The spec's bandpass coefficients.** With ω0 = 2πf0/Fs and α_Q = sin ω0/(2Q), the "bandpass" is a standard 2nd-order bandpass (b0 = α_Q, b1 = 0, b2 = −α_Q, a0 = 1+α_Q, a1 = −2cos ω0, a2 = 1−α_Q). Q is linear for bandpass, but in dB for lowpass and highpass — [Web Audio API spec, BiquadFilterNode](https://webaudio.github.io/web-audio-api/#BiquadFilterNode)
- **Range of Q.** The Q AudioParam's nominal range is the full single-float range, about ±3.4e38 — [MDN, BiquadFilterNode.Q](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/Q)
- **Precision in the browsers.** Chromium's `Biquad` stores coefficients as `AudioDoubleArray` and state (x1, x2, y1, y2) as `double` — [Chromium biquad.h](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/audio/biquad.h). Gecko's Biquad uses `double m_b0…m_a2` and `double m_x1…m_y2` — [Gecko Biquad.h](https://github.com/mozilla/gecko-dev/blob/master/dom/media/webaudio/blink/Biquad.h). WebKit also uses `AudioDoubleArray` coefficients and `double` state — [WebKit Biquad.h](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/Biquad.h)
- **Chrome's tail-time cap.** Chromium's BiquadFilterHandler sets `kMaxTailTime = 30.0` seconds. The comment says this limits how long nodes are kept alive. The tail is computed by `Biquad::TailFrame` as the time until the analytic impulse response falls below `kMaxTailAmplitude = 1/32768`, then clamped to [0, 30 s] — [Chromium biquad_filter_handler.cc](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/webaudio/biquad_filter_handler.cc) and [biquad.cc](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/audio/biquad.cc)
- **Chrome's IIRFilterNode.** Its tail time is capped at `kMaxTailTime = 10` seconds, with the same 1/32768 threshold — [Chromium iir_filter.cc](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/audio/iir_filter.cc)
- **Gecko decides differently.** It keeps a biquad running with null input while `hasTail()` is true, which checks whether the filter state is non-zero (`m_y1 || m_y2 || m_x1 || m_x2`). That is a state-based test, not an estimate — [Gecko BiquadFilterNode.cpp](https://github.com/mozilla/gecko-dev/blob/master/dom/media/webaudio/BiquadFilterNode.cpp), [Gecko Biquad.h](https://github.com/mozilla/gecko-dev/blob/master/dom/media/webaudio/blink/Biquad.h)
- **Cost and latency.** Biquads are "relatively cheap (five multiplication and four additions per sample)" — [Adenot, Web Audio API performance notes](https://padenot.github.io/web-audio-perf/)
- **Faust's modeFilter.** `modeFilter(freq, t60, gain)` is implemented as a Chamberlin state-variable filter. The code comments explain the choice of coefficients for accuracy when the poles are near z = 1, using r = exp(−u) with u = ln(1000)/(t60·SR) and t = tanh(u/2). `modalModel(n, freqs, t60s, gains)` is a parallel bank of these — [Faust physmodels.lib source](https://github.com/grame-cncm/faustlibraries/blob/master/physmodels.lib)
- **Mathews & Smith's phasor filter.** It is x(n+1) = x1·x(n) − y1·y(n) + u(n), y(n+1) = y1·x(n) + x1·y(n), with x1 = e^(−1/(τ·fs))·cos(2πf/fs) and y1 = e^(−1/(τ·fs))·sin(2πf/fs), where τ is the 1/e decay time. Frequency and damping can change without discontinuities. "Using 64 bit floating point arithmetic seems to be entirely adequate for musical purposes". The "modified coupled form" (magic circle) is the robust choice for low precision — [Mathews & Smith, SMAC-03](https://ccrma.stanford.edu/~jos/smac03maxjos/smac03maxjos.pdf)
- **Modal synthesis as resonators.** Serafin et al. use parallel 2-pole resonators y(n) = 2R cos θ·y(n−1) − R²·y(n−2) + x(n), with R = e^(−d/Fs) and θ = ω/Fs — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **SuperCollider.** Klank is "a bank of fixed frequency resonators", each specified by frequency, amplitude and 60 dB ring time. Its output amplitude depends on the sample rate. Ringz is a constant-skirt-gain filter, so its peak gain depends on Q — [SuperCollider Klank help](https://github.com/supercollider/supercollider/blob/develop/HelpSource/Classes/Klank.schelp), [Ringz help](https://github.com/supercollider/supercollider/blob/develop/HelpSource/Classes/Ringz.schelp)
- **Csound.** The `mode` opcode is a mass-spring-damper filter whose "resonance time is roughly proportional to xQ/xfreq". Its frequency is limited internally to sr/π − sr/100 to stay away from instability — [Csound manual, mode](https://csound.com/docs/manual/mode.html)

### Inferences
- **My precision check (Node.js, the spec's bandpass formula, 48 kHz).**
  - Simulated impulse responses match theory: for f0 = 220 Hz, Q = 3000 the measured T60 is 30.0 s, against T60 = ln(1000)·Q/(π·f0) ≈ 2.2·Q/f0.
  - With single-precision coefficients the pole errors are at most 0.02 Hz (0.4 cents) at 55–110 Hz and negligible above 220 Hz, and T60 is off by under 1%.
  - Since browsers use doubles, precision is not the problem for bowl-range Q at 44.1–48 kHz.
  - Still to watch: errors of about 0.02 Hz would matter only for doublet splits below about 0.3 Hz, and lower sample rates or lower f0 make things worse.
- **Gain problem (from the same simulation).** A unit impulse into a Q = 3000, 220 Hz spec bandpass rings at a peak of about 1e-5. A Q = 10000, 55 Hz bandpass rings at about 7e-7. You therefore need an input gain of about 10⁴–10⁶, or an excitation lasting many periods. That is awkward but workable, because inter-node buffers are float32 with a huge range.
- **Chrome may silence the ring (inferred from the source, untested in a browser).**
  - Because b0 = α_Q is tiny, Chromium's TailFrame estimate (unit impulse vs 1/32768) can come out at or near 0 s.
  - So when the excitation source (an AudioBufferSourceNode noise burst) finishes and the biquad's input becomes silent, Chrome may treat the node as having no tail and stop rendering it, cutting the ringing.
  - Even with large b-coefficients (for example via IIRFilterNode), tails are capped at 30 s for biquads and 10 s for IIR filters.
  - This needs a direct test in Chrome, both in OfflineAudioContext and in real time.
  - Mitigations: keep a live, non-silent input connected, such as a running source at very low level; put the large gain after the filter (this does not change the coefficients, so it does not help the tail estimate); or avoid filter-based resonators for long tails.
  - Gecko's state-based test should not cut the tail.
- **Parameter automation.** Automating frequency or Q on a ringing biquad changes the energy stored in the filter. Mathews & Smith explain this artefact. The phasor form avoids it, which matters for pitch-bend or "water bowl" effects.
- **Bottom line on resonator banks.** For a struck bowl in Web Audio, an oscillator per mode member with a GainNode envelope (`setTargetAtTime` or `exponentialRampToValueAtTime`) is exactly a modal resonator bank driven by an impulse. It avoids all of the above. Resonator filters earn their place only when the excitation is continuous or arbitrary (rubbing, noise, a felt mallet bouncing). In that case, write them in an AudioWorklet as phasor or Chamberlin resonators in JS doubles; JS numbers are IEEE-754 doubles.

### Gaps
- I did not find any bug report or published test confirming that Chrome actually cuts high-Q bandpass ringing after the input goes silent. The risk is inferred from source code only.
- I found no published benchmark of BiquadFilterNode at Q > 1000 in browsers.

---

## 4. Rim rubbing (singing): stick-slip friction models, banded waveguides, and perceptual approximations

### Takeaway
A rubbed bowl is a self-sustained stick-slip oscillation, usually of the (2,0) mode. Its amplitude grows exponentially over seconds and then saturates. The vibration pattern spins with the stick, so a fixed listener hears amplitude modulation at 2j times the stick's rotation rate, even from a perfectly symmetric bowl. Physical friction models need a per-sample nonlinear feedback loop, so they belong in an AudioWorklet. A perceptual approximation with native nodes is cheap and probably good enough for an ambient library. It combines: an exponential or logistic build-up of the (2,0) doublet; AM at 4× the rotation rate; weak 2f1/3f1 harmonics; and quiet band-limited friction noise.

### Cited Findings
- **The puja.** Rubbing uses a stick, the puja. The excitation depends on contact force F_N and tangential velocity V_T. Inácio et al. used a modal model with velocity-Verlet integration — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Friction law (Inácio).** Ft = −Fr·μd(ẏt)·sgn(ẏt) for |ẏt| ≥ ε, regularised to Ft = −Fr·μs·ẏt/ε for |ẏt| < ε, with ε ≈ 10⁻⁴ m/s. The coefficient is μd(ẏ) = μ∞ + (μs − μ∞)·exp(−C|ẏ|).
  - Bowl 2 parameters: μs = 0.4, μ∞ = 0.2, C = 10; contact stiffness Kc = 10⁶ N/m; contact damping Cc = 50 N·s/m.
  - Simulations ran at 22,050 Hz for 20 s per case.
  - [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Playing regimes (Inácio).** "Standard" rubbing is F_N = 3 N, V_T = 0.3 m/s, and the steady state is reached at about 7.5 s.
  - At F_N = 7 N, V_T = 0.5 m/s, contact is lost about 25% of the time and the spectrum has more high-frequency energy.
  - Three regimes appear: steady with permanent contact; steady with periodic contact loss; and unsteady, with amplitude growth followed by "chaotic chattering".
  - Transients lengthen as V_T rises and shorten as F_N rises.
  - [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Rotating radiation pattern.** The excited mode spins with the puja, with the contact near a radial node. At a fixed point the amplitude fluctuates at Ω_fluct = 4·Ω_puja = 4·(2V_T/φ), where φ is the rim diameter. Because the bowl radiates as a rotating 2j-pole, the listener always hears beating, "even if using perfectly symmetrical bowls". Experiments with a microphone near the rim confirmed four beats per revolution for the (2,0) mode with a rubber-covered puja. With a harder wooden puja the (3,0) mode was excited and six beats per revolution were heard — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Which mode sings.** A soft, high-friction puja easily excites the first mode. A harder, lower-friction wooden puja triggers the second mode (about 253 Hz on Bowl 4) after a longer transient — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Earlier models missed the rotation effect.** Inácio et al. say earlier waveguide models "seem to miss" the beating that arises even in near-symmetric bowls. They also say beating from mistuned modes "has been addressed – not without some difficulty" — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Rubbing a wine glass.** Moving a finger round the rim creates "a pulsation of about 4 to 8 beats per second, depending on the speed of the player's finger". Rubbing excites the (2,0) mode and its harmonics — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Serafin et al.'s friction model.** μ = μd + (μs − μd)·v0/(v0 + v_rel), coupled to circular banded waveguides in a feedback loop. Each mode is two detuned delay lines (lengths N1, N2) in a loop with a bandpass filter, which reproduces the beating. It ran in real time as Pd and Max/MSP externals — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **Burtner et al.'s extended model.** Eight waveguides (one per mode), each with a 2nd-order resonator, a 1st-order low-pass for damping and a 1st-order allpass for dispersion. Excitation is a velocity-dependent friction model, solved with the Friedlander–Keller graphical method — [Burtner et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Burtner_Serafin_Topper_singing_bowl.pdf)
- **STK BandedWG bowing.** This is Essl & Cook's model:
  - Each mode is a delay line of length int(fs/(f·ratio)), with a resonance filter (radius 1 − π·32/fs) and loop gain basegain_i.
  - The bow input is (bowVelocity − Σ basegain·delay_out) · bowTable(·), divided by nModes.
  - bowTable(x) = clamp((|slope·(x+offset)| + 0.75)^−4, min, max).
  - The slope defaults to 3; pressure maps to slope = 10 − 9·p; max velocity is 0.03 + 0.1·amplitude.
  - Frequency is clamped to ≤ 1568 Hz, and modes whose delay would be ≤ 2 samples are dropped.
  - [STK BandedWG.cpp](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp), [STK BowTable.h](https://github.com/thestk/stk/blob/master/include/BowTable.h)
- **Faust's bowTable.** `bowTable(offset, slope) = pow(abs(sample) + 0.75, -4) : min(1)`. physmodels.lib has no Tibetan bowl or glass harmonica model — [Faust physmodels.lib](https://github.com/grame-cncm/faustlibraries/blob/master/physmodels.lib)
- **Web Audio limits on loops.** If a DelayNode is part of a cycle, its delay is clamped to at least one render quantum, which is 128 frames by default — [Web Audio API spec, DelayNode](https://webaudio.github.io/web-audio-api/#DelayNode)
- **evoluteur's "Sing (hold)" mode.** It applies a slow LFO (0.28–0.48 Hz, depth 0.16) to the voice gain, with a time-constant swell of 0.9 s — [evoluteur/tibetan-singing-bowls](https://github.com/evoluteur/tibetan-singing-bowls)

### Inferences
- **Banded waveguides need an AudioWorklet.** Native nodes are ruled out by the one-render-quantum minimum delay in cycles: 128 frames is 2.7 ms at 48 kHz, so a loop's fundamental would be at most about 375 Hz, and every higher mode is impossible.
- **STK's integer delays distort the beating (computed from the STK source, 44.1 kHz, 220 Hz bowl).**
  - The fundamental pair's nominal split is 1.71 Hz but becomes about 2.2 Hz after rounding the delays to 201 and 199 samples.
  - The second pair's nominal split is 3.1 Hz but becomes about 10 Hz (delays 67 and 66).
  - A port should use fractional (allpass or Lagrange) delays, or a modal (resonator) formulation.
- **Rotation rates (computed from Inácio's formula).**
  - Bowl 2 (φ = 0.152 m) at V_T = 0.3 m/s: Ω_puja = 3.95 rad/s, about 0.63 rev/s, so AM at about 2.5 Hz.
  - Bowl 4 (0.262 m) at the same V_T: about 0.36 rev/s, so AM at about 1.5 Hz.
  - A reasonable perceptual default is AM at 4 × (0.3–1 rev/s) ≈ 1.2–4 Hz, slower for larger bowls.
- **Perceptual rubbing recipe (native nodes):**
  - (1) Two oscillators for the (2,0) doublet. The split is the bowl's own (for example 0.5–2 Hz) or zero.
  - (2) An amplitude envelope that grows exponentially: `setTargetAtTime` toward the target with τ ≈ 1–2.5 s gives a saturation-like curve. A logistic curve from `setValueCurveAtTime` is closer to "growth then saturation" (about 5–8 s to full level).
  - (3) A GainNode modulated by a low-frequency sine at 2j·f_rev, with depth about 0.3–0.7. Full depth would be correct at a microphone fixed near the rim; a room listener hears less.
  - (4) Optional weak partials at 2·f1 and 3·f1 (−20 to −35 dB), for the stick-slip harmonics Serafin et al. describe. These are harmonics of the (2,0) mode, not the bowl's inharmonic (3,0) mode.
  - (5) Quiet friction noise (seeded noise buffer → bandpass around 1–4 kHz, Q of about 1). Its level follows the stick speed, with occasional short dropouts or rattles if "chatter" is wanted.
  - (6) When rubbing stops, let the doublet decay with the struck τ values.
- **Physical rubbing recipe (AudioWorklet).** Use Inácio-style modal coordinates: 2–4 mode pairs with tangential and radial coupling, the exponential-decay friction law, and a regularised stick zone. Alternatively use STK-style bowTable feedback on a phasor-resonator bank. This produces the build-up, saturation and chatter regimes naturally. It costs more CPU and is very sensitive to parameters (regimes, chaotic chatter), and only partly predictable to tune. For a calming ambient library, the perceptual recipe is lower risk.

### Gaps
- I found no measured data on real players' puja rotation speeds; the 0.3–1 rev/s range is an inference from Inácio's V_T values.
- I could not read the Essl & Cook ICMC 2002 paper (403), so their own account of the bowed bowl and its beating modes is missing, apart from the STK code.
- I did not check the "Smith/Serafin friction models" (for example Serafin's thesis or the elasto-plastic friction model) beyond the DAFx-02 friction curve above.

---

## 5. Existing open-source implementations and licences (sensory-sound is MIT)

### Takeaway
STK is the most reusable reference, with an MIT-style licence and an explicit Tibetan bowl preset. Faust is LGPL, with an exception that frees code generated by the Faust compiler, but hand-porting library source is not covered by that exception. SuperCollider is GPL-3: read it for ideas, do not copy it. evoluteur/tibetan-singing-bowls (MIT, Web Audio) is the closest existing browser implementation, but it is simple additive synthesis.

### Cited Findings
- **STK.** Copyright 1995–2023 Perry R. Cook and Gary P. Scavone. Its permissive licence is MIT-style ("Permission is hereby granted, free of charge… The above copyright notice and this permission notice shall be included…"), with a non-binding request to send modifications back. BandedWG.cpp credits "Georg Essl, 1999–2004. Modified for STK 4.0 by Gary Scavone" — [STK LICENSE](https://github.com/thestk/stk/blob/master/LICENSE), [BandedWG.cpp](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp)
- **STK presets.** BandedWG presets: Uniform Bar (4 modes), Tuned Bar (4), Glass Harmonica (5: 1, 2.32, 4.25, 6.63, 9.38), Tibetan Prayer Bowl (12 modes, "ICMC'02") — [BandedWG.cpp](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp)
- **Faust's licence.** physmodels.lib is under the "GRAME LICENSE", LGPL 2.1+, with an "EXCEPTION TO THE LGPL LICENSE": code generated by the Faust compiler from a program that imports the library may be distributed "under your own copyright and license". Authors: Romain Michon, Pierre-Amaury Grumiaux, Yann Orlarey — [physmodels.lib header](https://github.com/grame-cncm/faustlibraries/blob/master/physmodels.lib)
- **Faust modal tools.** Faust provides `modeFilter`, `modalModel`, five church-bell models (English, French, German, Russian, standard), `strikeModel`, `impulseExcitation` and `bowTable`. There is no bowl model — [Faust physmodels docs](https://faustlibraries.grame.fr/libs/physmodels/)
- **SuperCollider** (Klank, DynKlank, Ringz) is GPL-3.0 — [SuperCollider COPYING](https://github.com/supercollider/supercollider/blob/develop/COPYING). Klank takes `[freqs, amps, ringtimes]`; DynKlank allows real-time parameter changes — [Klank help](https://github.com/supercollider/supercollider/blob/develop/HelpSource/Classes/Klank.schelp), [DynKlank help](https://github.com/supercollider/supercollider/blob/develop/HelpSource/Classes/DynKlank.schelp)
- **Csound.** The `mode` opcode is documented, and the manual has a modal-frequency-ratio table that includes three Tibetan bowls — [Csound mode](https://csound.com/docs/manual/mode.html), [Csound modal ratios](https://csound.com/docs/manual/MiscModalFreq.html)
- **Pd and Max.** Serafin et al.'s circular-waveguide bowl and Burtner et al.'s "blowl" were Pd and Max/MSP externals — [Serafin et al.](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf), [Burtner et al.](https://www.dafx.de/papers/DAFX02_Burtner_Serafin_Topper_singing_bowl.pdf). I found no public source repository for them.
- **JavaScript / Web Audio projects (GitHub search, Oct 2026):**
  - `evoluteur/tibetan-singing-bowls`: JavaScript, MIT. "Strike or rub a set of virtual Tibetan singing bowls: synthesized in the browser with Web Audio, with the beating overtones of the real thing." 4 partials, 2 oscillators each, a generated 3.6 s convolution reverb, a noise-burst strike. Last commit October 2026 — [GitHub](https://github.com/evoluteur/tibetan-singing-bowls)
  - `FranzisWorkshop/SingingBowl`: Web Audio, no licence declared, so it cannot be reused — [GitHub](https://github.com/FranzisWorkshop/SingingBowl)
  - `cpmpercussion/SingingBowls`: an Objective-C iOS app; the licence is shown as NOASSERTION — [GitHub](https://github.com/cpmpercussion/SingingBowls)
  - npm `modal-synthesis` 0.1.2: MIT, "uses the Web Audio API to create a synthesizer for a modal sound" — [npm](https://npmjs.com/package/modal-synthesis)

### Inferences
- **STK.** Porting STK's BandedWG and BowTable logic to TypeScript is licence-compatible with MIT if the STK notice is kept.
- **Faust.** Generated AudioWorklet or WASM code is also usable under MIT thanks to the exception. Hand-translating physmodels.lib functions (for example the modeFilter coefficients) is a derivative of LGPL source, so it is safer to reimplement from the published maths: Chamberlin SVF, Mathews–Smith phasor.
- **SuperCollider and Csound.** Their behaviour (Klank's T60 per mode) is a fine specification to reimplement, but do not copy their code.
- **What is missing.** None of the browser projects found implements physically based rubbing, rotating-source AM, or strike-position-dependent doublets. sensory-sound would be ahead by adding those three cheaply.

### Gaps
- I did not verify Csound's licence (believed to be LGPL-2.1) or the details of Faust's WebAudio/WASM toolchain (faustwasm).
- I found no Web Audio implementation of banded waveguides or friction-driven bowls to benchmark against.

---

## 6. CPU cost in the browser (oscillators per note, overlapping long decays, AudioWorklet vs native nodes, phones)

### Takeaway
Struck bowls with 5–7 mode pairs need 10–14 OscillatorNodes and gains per strike. With realistic 10–30 s tails, overlapping strikes multiply this to roughly 50–150 live oscillators. That is fine on desktop but should be budgeted on phones by voice-stealing, culling quiet modes early, and stopping oscillators when their envelope falls below about −80 dB. A single AudioWorklet resonator bank (one node, a tight loop) scales better than hundreds of native nodes, and is the natural home for rubbing models. Because sensory-sound renders offline, the real-time constraint applies mainly to the live "/sound" playback path.

### Cited Findings
- **OscillatorNode.** Basic waveforms use multiple wave tables computed by inverse FFT, with linear interpolation between tables. Changing waveform or frequency can require new tables — [Adenot, Web Audio performance notes](https://padenot.github.io/web-audio-perf/)
- **BiquadFilterNode.** About 5 multiplies and 4 adds per sample — [Adenot](https://padenot.github.io/web-audio-perf/)
- **GainNode.** A fixed-gain GainNode is "essentially free" in Gecko because the gain is applied lazily. Automated gain is applied per sample in all browsers — [Adenot](https://padenot.github.io/web-audio-perf/)
- **ConvolverNode.** "Very expensive, and depending on the duration of the convolution impulse", with multiple FFTs per block. Some browsers use a background thread, but "computational burst can occur in some browsers" — [Adenot](https://padenot.github.io/web-audio-perf/)
- **AudioParam.** a-rate parameters are computed per sample and k-rate once per 128-frame block. Implementations take faster paths when a parameter is constant for the block, and non-Gecko browsers scan event lists linearly, so many automation events can cost — [Adenot](https://padenot.github.io/web-audio-perf/)
- **Android latency** ranges from 12.5 ms to 150 ms on cheap devices — [Adenot](https://padenot.github.io/web-audio-perf/)
- **Render quantum.** The default is 128 frames. A `renderSizeHint` option now exists ("default" = 128, "hardware", or an integer) — [Web Audio API spec](https://webaudio.github.io/web-audio-api/)
- **Pre-rendering.** OfflineAudioContext can pre-render ("bake") expensive processing to cut per-playback CPU — [Adenot](https://padenot.github.io/web-audio-perf/)

### Inferences
- **Arithmetic cost (computed).** One phasor resonator is 4 multiplies + 3 adds per sample. 14 resonators × 8 overlapping bowls × 48,000 Hz ≈ 5.4 M resonator-steps per second, roughly 40 M floating-point operations per second. That should fit easily in a JIT-compiled AudioWorklet on a mid-range phone, but I found no measurement to confirm it.
- **Overhead of many native nodes.** With native oscillators each partial costs an OscillatorNode + a GainNode with automation, plus per-node, per-quantum scheduling overhead in the graph. Hundreds of short-lived nodes also create garbage-collection and main-thread scheduling load in live use.
- **Practical budget:**
  - Cap concurrent bowl voices (for example 6).
  - Give higher modes shorter τ, so they can be stopped early (`osc.stop(t0 + 7·τ_n)`, about −60 dB).
  - Drop pairs whose amplitude starts below −50 dB for the chosen mallet.
  - Share one ConvolverNode for all layers rather than one per bowl.
- **Fidelity versus cost.** Splitting a long decay into "first 10 s at full detail, then only the (2,0) and (3,0) pairs" keeps most of the perceptual detail. The upper modes have died by then anyway.

### Gaps
- I found no published benchmarks of OscillatorNode count or AudioWorklet throughput on mid-range phones in 2025–2026. The numbers above are operation counts, not timings, and should be measured on target devices (for example with Chrome's Web Audio profiling or by rendering an OfflineAudioContext against wall-clock time).

---

## 7. Spatial and room: reverb, stereo width, near-field "pressure"

### Takeaway
A rubbed bowl is a rotating quadrupole, so its sound genuinely varies with listening angle. Two virtual microphones at different angles hear the beating out of phase, which gives a cheap and physically motivated stereo image. Struck bowls also have angle-dependent doublet balance. Reverb is used in every implementation found, but I found no sourced bowl-specific settings.

### Cited Findings
- **Radiation pattern.** Radiation is mainly from radial motion. A microphone near the rim of a rubbed bowl records 4 pressure maxima per revolution (j = 2), and radiation is minimal near the contact point — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **"Rotating quadrupoles."** "For the listener, singing bowls behave as rotating quadropoles", or in general a spinning 2j-pole — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)
- **Spatialising modes.** Burtner et al. sent each of the 8 modes to its own loudspeaker channel, and used impulse responses taken at different positions on the bowl to move the listener from "outside" to "inside" the bowl — [Burtner et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Burtner_Serafin_Topper_singing_bowl.pdf)
- **Mapping modes to space.** Modal synthesis "does not conventionally retain any spatial information"; circular waveguides were proposed partly to keep spatial representation — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- **The comparable web synth's reverb.** evoluteur uses a 3.6 s generated impulse response (low-passed noise with a power-law decay), with the dry gain reduced by 0.45·wet as wet rises — [evoluteur/tibetan-singing-bowls](https://github.com/evoluteur/tibetan-singing-bowls)

### Inferences
- **Cheap stereo for rubbing.** Render the (2,0) doublet once, then apply AM at 2j·f_rev to the left and right channels with a phase offset of j·Δφ, where Δφ is the angle between the virtual microphones. Under a rotating pattern the pressure goes as cos[2(θ−Ωt)] for j = 2, so microphones 45° apart see envelope maxima alternate between them (the sound appears to circle between the ears), while 90° apart only reverses polarity and leaves the envelope the same. (Corrected after review.)
- **Cheap stereo for strikes.** Compute the doublet amplitudes A·cos(jφ_L) + B·sin(jφ_L) for each ear separately. The two channels then beat with different depths and phases, which widens a large bowl without a panner.
- **Near-field "pressure".** This probably comes from low f1 (about 87 Hz for a 26 cm bowl, per Inácio's Bowl 4), a long dry sustain and slow beating. Keep the fundamental drier than the upper partials, for example by sending more of the high modes to reverb, and avoid long pre-delay.
- **Reverb level.** Bowls already have T60s of tens of seconds, so long reverbs mostly blur the beating. A moderate room (about 1.5–3 s) at a modest wet level preserves it.

### Gaps
- I found no sourced listening studies on the reverb or stereo width that suits singing bowls, nor measurements of a bowl's directivity for strikes.

---

## 8. Determinism with OfflineAudioContext (seeded, repeatable output)

### Takeaway
Determinism is easy for additive synthesis with native oscillators and envelopes, and for AudioWorklet code driven only by a seeded PRNG. The main risks are three: `Math.random()` anywhere, including in noise buffers and per-strike detune; reliance on browser-specific node internals, such as oscillator wavetables, FFT convolution and Chrome's biquad tail cut, which can differ across browsers even if each is repeatable; and the sample rate.

### Cited Findings
- **Oscillator implementations.** Oscillators are implemented with interpolated wave tables, and FFT libraries differ between browsers and platforms (FFmpeg or OpenMAX DL in Gecko, other libraries elsewhere), so outputs are not bit-identical across engines — [Adenot](https://padenot.github.io/web-audio-perf/)
- **Biquad tail handling differs between engines.** Chrome uses an estimate capped at 30 s, Firefox a check on the filter state — [Chromium biquad_filter_handler.cc](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/webaudio/biquad_filter_handler.cc), [Gecko BiquadFilterNode.cpp](https://github.com/mozilla/gecko-dev/blob/master/dom/media/webaudio/BiquadFilterNode.cpp)
- **Restrikes.** Phase-preserving restrikes (Mathews–Smith) let a re-struck mode continue deterministically from its current state, rather than restarting an oscillator with a new phase — [Mathews & Smith, SMAC-03](https://ccrma.stanford.edu/~jos/smac03maxjos/smac03maxjos.pdf)
- **The comparable web synth is not seeded.** evoluteur uses `Math.random()` for beat offsets, LFO rates and strike strengths — [evoluteur/tibetan-singing-bowls](https://github.com/evoluteur/tibetan-singing-bowls)

### Inferences
- **Seed every random choice.** All random parameters (doublet splits, strike angle θ, mallet f_c, per-mode τ jitter, noise samples) should come from the library's seeded PRNG, keyed by (seed, layer, event index). Then adding or removing a layer does not shift other layers' random streams.
- **AudioWorklet determinism.** An AudioWorklet resonator bank in JS doubles is bit-exact across runs in a given engine. It is also more consistent across engines than native nodes, because the maths is the library's own. The only remaining difference is the final float32 conversion.
- **Fix the sample rate.** Render OfflineAudioContext at a fixed rate (for example 48 kHz), because decay coefficients and the precision of very high-Q filters depend on fs.
- **Long tails and loops.** If the offline render is looped, long tails (T60 of 30–70 s) will cross the loop boundary. Either render with pre-roll and wrap the tail back to the start (circular overlap-add), or cap τ so tails end inside the loop.

### Gaps
- I did not test whether Chrome's OfflineAudioContext gives bit-identical output for oscillators and convolvers across machines with different SIMD support.

---

## 9. Practical comparison and recommendation

### Takeaway
For sensory-sound, the best quality per unit of effort is an upgraded additive model, with native nodes and no new dependencies, for struck bowls. Pair it with a perceptual rubbing gesture. Keep a small AudioWorklet phasor-resonator bank as an optional path for continuous excitation; true friction rubbing would come later. Avoid filter-based high-Q resonator banks in BiquadFilterNode, because of the gain scaling and Chrome's tail-time behaviour.

### Cited Findings
- Modal or additive synthesis is the usual choice for "few strongly inharmonic modes" — [Serafin et al., DAFx-02](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf)
- Banded or circular waveguides add spatial and harmonic structure, and work in real time in C externals — [Serafin et al.](https://www.dafx.de/papers/DAFX02_Serafin_Wilkerson_Smith_bowl_resonators.pdf), [STK BandedWG](https://github.com/thestk/stk/blob/master/src/BandedWG.cpp)
- Physical friction modal models reproduce build-up, rotation beating and chatter, but they need small time steps, and the earlier stick-slip version is costly — [Inácio et al. 2006](http://projects.itn.pt/BellTune/File3.pdf)

### Inferences
- **Comparison of approaches:**

| Approach | Struck realism | Rubbed realism | Web Audio fit | Cost | Risk |
|---|---|---|---|---|---|
| A. Improved additive (2 oscillators per mode pair, per-member τ, strike-angle amplitudes, mallet tilt, noise tick) | High | Low (needs B) | Native nodes; deterministic | 10–14 oscillators per strike | Low |
| B. Perceptual rub (exponential/logistic build-up of the (2,0) doublet, AM at 4·f_rev, 2f/3f harmonics, friction noise) | n/a | Medium to good | Native nodes | About 4–6 nodes per rub | Low |
| C. AudioWorklet phasor/Chamberlin modal bank driven by an excitation signal | High | Medium (with B-style excitation) | Needs a worklet module | One node; about 7 flops per mode per sample | Medium |
| D. AudioWorklet banded waveguide with bowTable (STK port) | Medium | Good | Worklet only (cycle-delay limit) | Moderate | Medium (integer-delay detuning, tuning) |
| E. AudioWorklet modal + friction (Inácio-style) | High | Best (build-up, chatter, mode choice) | Worklet only | Moderate to high | High (parameter sensitivity, chaotic regimes) |
| F. BiquadFilterNode high-Q bank | High | Medium | Native | Cheap per sample | Gain of 10⁴–10⁶ needed; Chrome tail cap of 30 s, possibly a premature cut |

- **Starting parameters for A (struck)**, from Bowl 2 and Bowl 1 with randomised variation:
  - Ratios 1, 2.7, 4.8, 7.5, 10.6, 14.2, 18.1, each ±2% per bowl.
  - Splits Δ_n drawn per mode from about 0.1%–1% of f_n (occasionally 2%).
  - Member amplitudes a_n·cos(jθ) and a_n·sin(jθ), with θ a seeded random angle.
  - Mallet weights w_n = 1/(1 + (f_n/f_c)²), with f_c 1.5 kHz for soft and 6 kHz for hard.
  - Decay τ_n = τ1·(f1/f_n)^1.2, with τ1 = 8–20 s, and ±10% between the members of a pair.
  - Attack 2–5 ms, plus a 3–8 ms filtered noise tick about −20 dB under the fundamental.
  - These are suggestions built from the cited measurements, not published presets.
- **Starting parameters for B (rubbed):**
  - The (2,0) doublet at f1, with its split.
  - Envelope: a logistic rise to full level over 4–8 s.
  - AM at 4 × 0.3–1 rev/s (1.2–4 Hz), depth 0.3–0.6, with a phase offset between left and right.
  - 2f1 at −25 dB and 3f1 at −35 dB.
  - Friction noise: a 1–4 kHz bandpass at −40 dB.
  - On release, hand over to the struck decay τ1.

### Gaps
- None of these recommendations has been tested in listening tests. They should be checked by A/B listening against recordings, for example the sound files Inácio et al. mention.
