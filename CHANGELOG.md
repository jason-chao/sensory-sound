# Changes

## 0.2.0

Three new layers of singing bowls, built from measurements of real bowls (see `docs/`): `bronze` (struck bronze bowls), `rubbed` (a bowl rubbed with a stick) and `crystal` (quartz bowls, struck softly or rubbed slowly). Each bowl rings at the natural pitch of its size rather than in the soundscape's scale, with the stretched partials, the loud second partial, the slow beating and the long uneven decay of the recordings. Two new soundscapes use them, Singing bowls and Crystal bowls. The existing `bowls` layer and the eight earlier soundscapes are unchanged, sample for sample.

The bowl layers share a budget of sounding voices, fade the oldest bowl out when it is full, and skip a bowl that would sit within a critical band of something already sounding. `setStopped(true)` now has a stated contract (30 dB down within 150 ms, 50 dB within half a second, reverb included), `stop()` disconnects the engine from a context you supplied, and `render()` takes a `setup` callback for one-off events. `scripts/regress.mjs` checks that the earlier soundscapes still render the same, and the sound check now tests the ceiling with sixteen bowls struck at once.

Bowl sessions: `startSession`, `stopSession`, `sessionState` and `onSessionEvent` play a tuned set (C to B, crystal exact, bronze approximately, C3 or C4, 440 or 432 Hz) to a score with phases, an overlap limit, allowed combinations and pauses, with the opening and closing sequences and the closing silence that practitioner guides describe. Four scores are supplied. Hush holds the session clock. `scripts/sessioncheck.mjs` checks it.

## 0.1.2

Two options for pages that play in the background: `output: "stream"` sends the sound only into the stream from `stream()`, for a media element with lock-screen controls, and `lookahead` sets how far ahead notes are scheduled.

## 0.1.1

Every soundscape is now about as loud as every other. Before, they ranged over 17 dB, and Mountain stream and Chimes alone were hard to hear. Each layer has a calibrated gain, the soundscapes' layer levels are reset to keep their balance, and Shore at dusk is as loud as before. `scripts/measure.mjs` measures it. The README is rewritten.

## 0.1.0

First release: the engine as extracted from Sensory Space, unchanged in sound. Eleven layers, eight soundscapes, five scales, touch sounds, offline rendering, the playground and the sound check.
