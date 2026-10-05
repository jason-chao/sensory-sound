# sensory-sound

A small sound engine for the browser that makes slow, gentle ambient sound as it plays. It synthesises everything with the Web Audio API, so there are no audio files to load.

I wrote it for [Sensory Space](https://sensory-space.org), an artwork of light and sound designed with autistic adults in mind, and then gave it a home of its own so other projects can use it.

It has eleven layers you can mix: a warm drone, chimes, singing bowls, plucked strings, ocean, rain, wind, a stream, brown noise, a soft pulse and a breath that follows a breathing pace. Eight ready-made soundscapes combine them, among them Shore at dusk, Temple bells and Rainy window, and they are matched in loudness, so you can switch between them without reaching for the volume.

Sound fades in over five seconds when it starts, notes begin softly, and a limiter at the end holds the output below a fixed ceiling.

## Install

```bash
npm install sensory-sound
```

## Use

```js
import { SoundEngine } from "sensory-sound";

const engine = new SoundEngine({ seed: 7 });
engine.applySoundscape("shore");
engine.set({ volume: 0.4 });

document.querySelector("#play").onclick = () => engine.start();
```

Browsers expect a tap or click before a page plays sound, which is why `start()` sits in a click handler.

You can change anything while it plays. Levels and tone glide to their new values, and a new scale or key takes effect from the next note:

```js
engine.set({ scale: "yo", root: 4, activity: 0.2 });   // the yo scale in E, fewer notes
engine.setLayer("bowls", 0.3);                         // add a little singing bowl
engine.touch(0.25, 0.6, "pluck");                      // a plucked note; x picks the pitch
engine.setStopped(true);                               // quick fade to silence
```

To make a recording, render it offline:

```js
const buffer = await SoundEngine.render({ seconds: 60, seed: 42, soundscape: "garden" });
```

The same seed gives the same notes, so a render can be repeated.

### Settings

| Setting | Range | What it does |
|---|---|---|
| `volume` | 0 to 1 | overall level |
| `soften` | 0 to 1 | takes the edge off the treble |
| `reverb` | 0 to 1 | how much room the sound sits in |
| `tone` | 0 to 1 | brightness of the drone and the bells |
| `activity` | 0 to 1 | how often notes and drops happen |
| `pulseRate` | 40 to 90 | beats per minute of the pulse |
| `breath` | 0 to 1 | the breathing curve the breath layer follows, which you drive |
| `root` | 0 to 11 | the key, in semitones above C |
| `scale` | name | `pentaMajor`, `pentaMinor`, `lydian`, `yo` or `insen` |
| `mute` | true or false | |

The lists of layers, scales and soundscapes are exported as `LAYERS`, `SCALES` and `SOUNDSCAPES`, with labels to build a menu from. Layers and soundscapes also carry a short description.

Touch sounds come in seven kinds: `bell`, `pluck`, `pop`, `drop`, `burst`, `split` and `thump`.

## Working on it

```bash
npm install
npm run dev     # a playground for trying every layer and soundscape
npm test
npm run build
```

Two browser scripts check the sound itself. They need Playwright's Chromium (`npx playwright install chromium`) and the playground running on port 5174 (`npx vite --port 5174`):

- `node scripts/soundcheck.mjs` renders the same seed twice and expects the same result, then plays every layer at full volume and makes sure the output stays under the ceiling.
- `node scripts/measure.mjs` measures the loudness of each layer and soundscape. Run it after adding or changing a layer, and adjust `CALIBRATION` in `src/engine.ts` so the new layer matches the rest.

## Versions

Fixes raise the last number, new layers and soundscapes the middle one, and a change to how you call the engine the first. If you depend on it, pin an exact version so the sound only changes when you choose.

## Licence

MIT, by Jason Chao.
