# sensory-sound

A small sound engine for the browser that makes slow, gentle ambient sound as it plays. It synthesises everything with the Web Audio API, so there are no audio files to load.

I wrote it for [Sensory Space](https://sensory-space.org), an artwork of light and sound designed with autistic adults in mind, and then gave it a home of its own so other projects can use it.

It has fourteen layers you can mix: a warm drone, chimes, singing bowls, plucked strings, ocean, rain, wind, a stream, brown noise, a soft pulse, a breath that follows a breathing pace, and three kinds of singing bowl modelled on real ones: struck bronze, a bowl rubbed with a stick, and crystal. Ten ready-made soundscapes combine them, among them Shore at dusk, Temple bells, Rainy window and Singing bowls, and they are matched in loudness, so you can switch between them without reaching for the volume.

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

For a page that should keep playing with the phone's screen off, send the sound into a media element instead of straight to the speakers, and give the scheduler more room, because browsers slow a background page's timers:

```js
const engine = new SoundEngine({ output: "stream", lookahead: 2 });
await engine.start();
audioElement.srcObject = engine.stream();
await audioElement.play();
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

### The singing bowls

The `bronze`, `rubbed` and `crystal` layers come from a study of how real bowls sound, in the literature and in twenty recordings; the notes are in `docs/`. A bronze bowl here has five partials in the stretched ratios the recordings show, the second often as loud as the first, each split into a pair that beats a few times a second, and a fundamental that rings for half a minute or more while the high partials fade in seconds. A rubbed bowl swells over several seconds and its tone rises and falls slowly as the vibration pattern turns with the stick. Crystal bowls are lower, nearly pure and beat only every few seconds.

The bowls ring at the natural pitch of their size, not in the soundscape's scale, as real bowls do. To keep that from turning harsh, a bowl that would sound within a critical band of something already playing is skipped, beats are kept below six hertz, strikes begin softly, and there is silence between bowls rather than a continuous drone. `tone` sets how hard the mallet is. These are design choices for a sound-sensitive audience; nothing here is a claim about calm or healing, and the notes in `docs/` say what the evidence does and does not support.

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
- `node scripts/regress.mjs capture` saves every soundscape's render to `fixtures/` (not in git), and `check` compares later renders with them, so a change to the engine cannot alter an existing soundscape unnoticed.
- `node scripts/renderwav.mjs out.wav 60 '{"soundscape":"singing"}'` writes a render to a WAV file for listening or measuring.

`npm run build:site` builds the playground and the listening pages under `site/` (a phone benchmark, a blind comparison against recordings, and a comfort session) as a static site in `site-dist/`.

## Versions

Fixes raise the last number, new layers and soundscapes the middle one, and a change to how you call the engine the first. If you depend on it, pin an exact version so the sound only changes when you choose.

## Licence

MIT, by Jason Chao.
