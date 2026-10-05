# sensory-sound

A small generative ambient sound engine for the browser. Everything is synthesised live with the Web Audio API: no samples, nothing to download, nothing to license. It was made for [Sensory Space](https://sensory-space.org), an art project of slow light and sound designed with care for autistic adults, and it stands on its own.

- **Eleven layers:** warm drone, chimes, singing bowls, plucked strings, ocean, rain, wind, stream, brown noise, soft pulse, breath. Each has a level from 0 to 1.
- **Named soundscapes:** Shore at dusk, Temple bells, Night garden, Deep hush, Mountain stream, Chimes alone, Rainy window, Breathing. A soundscape is a set of layer levels plus a scale.
- **Five scales:** major and minor pentatonic, lydian, and the Japanese yo and in scales, in any key.
- **Gentle by design:** sound rises slowly after start, every note has a soft attack, and a compressor and soft clipper sit after everything, with a fixed ceiling. Nothing upstream can produce a sudden loud sound.
- **Touch sounds:** a bell, a pluck, a pop, a water drop, a burst, a split, a thump, pitched by position.
- **Repeatable:** the same seed gives the same sequence of notes. Offline rendering to an audio buffer is built in.

## Use

```bash
npm install sensory-sound
```

```js
import { SoundEngine, SOUNDSCAPES } from "sensory-sound";

const engine = new SoundEngine({ seed: 7 });
engine.applySoundscape("shore");          // or engine.setLayer("rain", 0.5) ...
engine.set({ volume: 0.4, soften: 0.5 });

button.onclick = () => engine.start();    // browsers allow sound only after a tap or click
```

Change anything at any time; the engine follows smoothly:

```js
engine.set({ tone: 0.7, activity: 0.2, scale: "yo", root: 4 });   // key of E, yo scale
engine.setLayer("bowls", 0.3);
engine.touch(0.25, 0.6, "pluck");       // x and y in 0..1; left to right walks up the scale
engine.setStopped(true);                // quick fade to silence, and back with false
engine.stream();                        // a MediaStream of the output, for a media element or a recorder
await engine.stop();
```

Render to a buffer, faster than real time:

```js
const buffer = await SoundEngine.render({ seconds: 60, seed: 42, soundscape: "garden" });
```

### Parameters

| Parameter | Range | Meaning |
|---|---|---|
| `volume` | 0..1 | overall level, applied as a curve |
| `soften` | 0..1 | less treble as it rises |
| `reverb` | 0..1 | shared reverb amount |
| `tone` | 0..1 | brightness of the tonal layers |
| `activity` | 0..1 | how often notes and events happen |
| `pulseRate` | 40..90 | beats per minute of the pulse layer |
| `breath` | 0..1 | the breathing curve the breath layer follows; you drive it |
| `root` | 0..11 | key, as semitones above C |
| `scale` | id | one of `SCALES` |
| `mute` | boolean | |

`LAYERS`, `SCALES` and `SOUNDSCAPES` are exported as data, with labels and plain-word descriptions, so an interface can be built from them.

## Developing

```bash
npm install
npm run dev          # playground at http://localhost:5173: layers, soundscapes, parameters, touch sounds
npm test             # unit tests
npm run build        # dist/
npx vite --port 5174 & node scripts/soundcheck.mjs   # browser check: repeatable render, loudness ceiling
```

The sound check renders the same seed twice and requires the samples to match within floating-point rounding, then runs every layer at full level with the volume at maximum and requires the output to stay under the ceiling.

## Versions

Releases follow semantic versioning: a patch for fixes, a minor for new layers and soundscapes, a major only when the interface changes. Projects should pin an exact version.

## Licence

MIT. The sound it makes is yours.
