# Listening log

Blind comparisons and other listening on the sound-lab site, with what changed in the model after each. The comparison page plays a synthesised bowl beside a trimmed reference recording of the same kind, loudness-matched, in random order, and reveals which was which after the answer. One listener so far (the author), on an Android phone with Chrome.

## 2026-10-10, five rounds of the blind comparison

| Round | Build | Struck bronze: synth judged more real / preferred | Struck crystal | Rubbed bronze | Rubbed crystal | Listener's words |
|---|---|---|---|---|---|---|
| 1 | 7ea11da | 2 of 3 / 2 of 3 | 2 of 3 / 1 of 3 | 0 of 3 / 1 of 3 | 0 of 3 / 1 of 3 | |
| 2 | 2c161b9 | 1 of 3 / 1 of 3 | 1 of 3, 1 cannot tell / 0 of 3 | 0 of 3 / 0 of 3 | 0 of 3 / 1 of 3 | |
| 3 | db7d8a8 | skipped | skipped | 0 of 3 / 0 of 3 | 1 of 3 / 3 of 3 | "The real bowl sounds changing more naturally"; "A sounds a bit sharp and unnatural" |
| 4 | 987f050 | skipped | skipped | 0 of 3 / 0 of 3 | 0 of 3 / 2 of 3 | "A very unnatural"; "A high pitch sounds unnatural, B high pitch more natural"; "B's oscillation and high pitch more natural" |
| 5 | 8e5b2e7 | skipped | skipped | 0 of 3 / 1 of 3 | skipped | "A is more natural. But B is now much closer than before"; "more natural than before except some final bits"; "A is really close, just a bit unnatural" |

Struck bowls, bronze and crystal, sit about level with the recordings over the two rounds in which they were heard. Rubbed crystal came to be preferred over the recordings from round 3. Rubbed bronze was the weak sound throughout and is "really close" by round 5.

What changed between rounds (details and measurements in `synthesis_as_built.md`):

- After round 1: measured the four reference rubs with the analysis tools and matched them: modulation index raised from 0.3 to 0.6 up to 0.6 to 0.9, rate lowered to 1.0 to 2.2 Hz with slow drift, pitch wander of ±4 cents added, the bowl's second partial added, harmonics quietened, swells slowed; crystal swells 12 to 20 s with harmonics 45 to 60 dB down.
- After round 2 (texture, unevenness and space named by the listener): a grainy friction skirt round the pitch (low-passed noise multiplied by the tone), random slow wobble of level, modulation rate and pitch from filtered noise instead of sines, more room in the comparison clips.
- After round 3 (sharp, changing less naturally): the modulation folded into the turning pattern's |sin| shape with a wandering depth, and a darker tone. Round 4 found this worse.
- After round 4 (the high pitch): sine modulation restored, the wandering depth kept, and the high tones given their own swell and their own slower rise and fall.
- After round 5 (the ending): the stick lifts away over about a second, and the undriven twin rises after release so the pair beats in the ring-out. Not yet heard blind.

## Still to come

The phone benchmark (`/bench`) on an Android phone and an iPhone, with the screen on and locked, and the comfort sessions (`/comfort`) with autistic listeners, which are design feedback rather than a study.
