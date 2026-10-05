# Changes

## 0.1.2

Two options for pages that play in the background: `output: "stream"` sends the sound only into the stream from `stream()`, for a media element with lock-screen controls, and `lookahead` sets how far ahead notes are scheduled.

## 0.1.1

Every soundscape is now about as loud as every other. Before, they ranged over 17 dB, and Mountain stream and Chimes alone were hard to hear. Each layer has a calibrated gain, the soundscapes' layer levels are reset to keep their balance, and Shore at dusk is as loud as before. `scripts/measure.mjs` measures it. The README is rewritten.

## 0.1.0

First release: the engine as extracted from Sensory Space, unchanged in sound. Eleven layers, eight soundscapes, five scales, touch sounds, offline rendering, the playground and the sound check.
