import { mulberry32, subSeed, type Rand } from "./prng";
import { LAYERS, SCALES, SOUNDSCAPES } from "./layers";
import { BowlPool, bowlLayer, bronze, crystal } from "./bowls";

/** Everything that shapes the sound. Values are targets; the engine follows them smoothly. */
export interface SoundParams {
  /** 0..1, applied as a curve */
  volume: number;
  /** 0..1, less treble as it rises */
  soften: number;
  /** 0..1 reverb amount */
  reverb: number;
  /** 0..1 brightness of the tonal layers */
  tone: number;
  /** 0..1 how often notes and events happen */
  activity: number;
  /** beats per minute of the pulse layer */
  pulseRate: number;
  /** 0..1 breathing curve, driven by the caller (1 = fully in) */
  breath: number;
  /** key as semitones above C: 0 = C, 2 = D ... */
  root: number;
  /** one of the ids in SCALES */
  scale: string;
  mute: boolean;
}

export const DEFAULT_PARAMS: SoundParams = {
  volume: 0.4, soften: 0.45, reverb: 0.5, tone: 0.45, activity: 0.4, pulseRate: 58, breath: 0, root: 2, scale: "pentaMinor", mute: false,
};

export interface EngineOptions {
  /** the same seed gives the same sequence of notes */
  seed?: number;
  /** supply your own context (for example an OfflineAudioContext); otherwise one is created on start() */
  context?: AudioContext | OfflineAudioContext;
  /** seconds for the sound to rise after start(); default 5 */
  fadeInSeconds?: number;
  /** "speakers" (default) plays through the context's destination; "stream" plays only into the
   *  MediaStream returned by stream(), for a media element with lock-screen controls */
  output?: "speakers" | "stream";
  /** how far ahead notes are scheduled, in seconds; default 0.3. A page whose timers are throttled
   *  in the background (a phone with the screen off) should use 2 or more. */
  lookahead?: number;
}

/** Everything a voice needs from the engine. */
export interface VoiceCtx {
  ctx: BaseAudioContext;
  out: GainNode;
  rand: Rand;
  noise: { white: AudioBuffer; pink: AudioBuffer; brown: AudioBuffer };
  /** frequency of a scale degree; degree may exceed the scale length (wraps by octave) */
  freq(degree: number, octave: number): number;
  params: SoundParams;
  /** seconds ahead to schedule */
  lookahead: number;
  /** the engine's seed, for layers that keep their own random streams */
  seed: number;
  /** shared by the bowl layers: voice budget and roughness guard */
  bowls: BowlPool;
}

/** Per-layer gain so that every layer at full level is about equally loud. Measured with
 *  scripts/measure.mjs (90th percentile of 400 ms loudness windows); re-measure after changing a layer. */
export const CALIBRATION: Record<string, number> = {
  drone: 0.364, chimes: 1.697, bowls: 3.017, koto: 1.813, ocean: 0.49, rain: 2.162,
  wind: 1.397, stream: 3.175, noise: 0.852, pulse: 0.525, breath: 2.713,
  bronze: 1.646, rubbed: 1.232, crystal: 1.626,
};

/** the kind of sound a touch makes */
export type TouchSound = "bell" | "pluck" | "pop" | "drop" | "burst" | "split" | "thump";

export interface Voice {
  /** called about 20 times a second while the voice is audible */
  update(now: number): void;
  stop(): void;
}

type VoiceFactory = (v: VoiceCtx) => Voice;

function noiseBuffers(ctx: BaseAudioContext, rand: Rand) {
  const len = ctx.sampleRate * 8;
  const make = (kind: "white" | "pink" | "brown") => {
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = rand() * 2 - 1;
        if (kind === "white") d[i] = w * 0.5;
        else if (kind === "pink") {
          b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12;
        } else {
          last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2;
        }
      }
      // blend the end into the start so the loop point is inaudible
      const x = Math.floor(ctx.sampleRate * 0.5);
      for (let i = 0; i < x; i++) {
        const k = i / x;
        d[len - x + i] = d[len - x + i] * (1 - k) + d[i] * k;
      }
    }
    return buf;
  };
  return { white: make("white"), pink: make("pink"), brown: make("brown") };
}

function loop(v: VoiceCtx, buf: AudioBuffer): AudioBufferSourceNode {
  const s = v.ctx.createBufferSource();
  s.buffer = buf; s.loop = true;
  s.loopEnd = buf.duration - 0.5;
  s.start(0, v.rand() * 6);
  return s;
}

function lfo(v: VoiceCtx, hz: number, depth: number, target: AudioParam): OscillatorNode {
  const o = v.ctx.createOscillator(); o.frequency.value = hz;
  const g = v.ctx.createGain(); g.gain.value = depth;
  o.connect(g).connect(target); o.start();
  return o;
}

const drone: VoiceFactory = (v) => {
  const { ctx } = v;
  const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 600; filter.Q.value = 0.5;
  filter.connect(v.out);
  const notes = [{ d: 0, o: -1 }, { d: 0, o: 0 }, { d: 2, o: 0 }, { d: 4, o: 0 }, { d: 0, o: 1 }];
  const oscs: { o: OscillatorNode; d: number; oc: number; det: number }[] = [];
  const lfos: OscillatorNode[] = [];
  notes.forEach((n, i) => {
    const g = ctx.createGain(); g.gain.value = 0.11 / (1 + i * 0.25);
    lfos.push(lfo(v, 0.03 + 0.02 * i + v.rand() * 0.02, 0.05 / (1 + i * 0.25), g.gain));
    g.connect(filter);
    for (const det of [-5, 5]) {
      const o = ctx.createOscillator(); o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = v.freq(n.d, n.o); o.detune.value = det + v.rand() * 2;
      o.connect(g); o.start();
      oscs.push({ o, d: n.d, oc: n.o, det });
    }
  });
  return {
    update(now) {
      for (const x of oscs) x.o.frequency.setTargetAtTime(v.freq(x.d, x.oc), now, 1.5);
      filter.frequency.setTargetAtTime(250 + 1700 * Math.pow(v.params.tone, 1.5), now, 1);
    },
    stop() { oscs.forEach((x) => x.o.stop()); lfos.forEach((l) => l.stop()); filter.disconnect(); },
  };
};

/** A bell-like note: sine carrier with a decaying FM shimmer and a soft attack. */
function bell(v: VoiceCtx, when: number, f: number, gain: number, decay: number, pan: number): void {
  const { ctx } = v;
  const car = ctx.createOscillator(); car.frequency.value = f;
  const mod = ctx.createOscillator(); mod.frequency.value = f * 3.5;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(f * 0.6 * (0.3 + v.params.tone), when);
  mg.gain.exponentialRampToValueAtTime(0.01, when + decay * 0.4);
  mod.connect(mg).connect(car.frequency);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.04);
  env.gain.setTargetAtTime(0, when + 0.04, decay / 4);
  const p = ctx.createStereoPanner(); p.pan.value = pan;
  car.connect(env).connect(p).connect(v.out);
  car.start(when); mod.start(when);
  car.stop(when + decay + 1); mod.stop(when + decay + 1);
}

const chimes: VoiceFactory = (v) => {
  let next = v.ctx.currentTime + 1 + v.rand() * 3;
  let last = 2;
  return {
    update(now) {
      if (next < now - 0.5) next = now; // after a stall, do not play the backlog at once
      while (next < now + v.lookahead) {
        const n = SCALES[v.params.scale]?.steps.length ?? 5;
        // mostly small steps: melodies that wander are calmer than leaps
        last = Math.max(0, Math.min(2 * n, last + Math.round((v.rand() - 0.5) * 4)));
        bell(v, Math.max(next, now + 0.02), v.freq(last, 1), 0.10 + v.rand() * 0.05, 5 + v.rand() * 3, v.rand() * 1.4 - 0.7);
        const mean = 11 - 9.5 * v.params.activity;
        next += Math.max(0.7, -Math.log(1 - v.rand() * 0.98) * mean * 0.6 + mean * 0.4);
      }
    },
    stop() {},
  };
};

const bowls: VoiceFactory = (v) => {
  let next = v.ctx.currentTime + 1;
  return {
    update(now) {
      if (next < now - 0.5) next = now; // after a stall, do not play the backlog at once
      while (next < now + v.lookahead) {
        const when = Math.max(next, now + 0.02);
        const f = v.freq(Math.floor(v.rand() * 3) * 2, 0);
        const pan = v.rand() * 1.2 - 0.6;
        [1, 2.76, 5.4, 8.9].forEach((ratio, i) => {
          for (const beat of [0, 0.7 + v.rand()]) {
            const o = v.ctx.createOscillator(); o.frequency.value = f * ratio + beat;
            const g = v.ctx.createGain(); const peak = 0.07 / Math.pow(i + 1, 1.6);
            g.gain.setValueAtTime(0, when);
            g.gain.linearRampToValueAtTime(peak, when + 1.2);
            g.gain.setTargetAtTime(0, when + 1.2, (9 - i * 1.8) / 3);
            const p = v.ctx.createStereoPanner(); p.pan.value = pan;
            o.connect(g).connect(p).connect(v.out); o.start(when); o.stop(when + 22);
          }
        });
        next += 14 + v.rand() * 22 - 8 * v.params.activity;
      }
    },
    stop() {},
  };
};

/** A plucked string: bright at the pluck, darkening as it rings. Phrases of a few notes. */
function pluck(v: VoiceCtx, when: number, f: number, gain: number, pan: number): void {
  const { ctx } = v;
  const o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = f;
  const o2 = ctx.createOscillator(); o2.type = "sawtooth"; o2.frequency.value = f; o2.detune.value = 4;
  const g2 = ctx.createGain(); g2.gain.value = 0.25;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 1;
  lp.frequency.setValueAtTime(f * 6, when); lp.frequency.exponentialRampToValueAtTime(f * 1.5, when + 1.2);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when); env.gain.linearRampToValueAtTime(gain, when + 0.025);
  env.gain.setTargetAtTime(0, when + 0.025, 0.5);
  const p = ctx.createStereoPanner(); p.pan.value = pan;
  o1.connect(lp); o2.connect(g2).connect(lp); lp.connect(env).connect(p).connect(v.out);
  o1.start(when); o2.start(when); o1.stop(when + 3); o2.stop(when + 3);
}

const koto: VoiceFactory = (v) => {
  let next = v.ctx.currentTime + 2;
  return {
    update(now) {
      if (next < now - 0.5) next = now;
      while (next < now + v.lookahead) {
        const when = Math.max(next, now + 0.02);
        const n = SCALES[v.params.scale]?.steps.length ?? 5;
        const len = 3 + Math.floor(v.rand() * 3), start = Math.floor(v.rand() * n), dir = v.rand() < 0.5 ? 1 : -1;
        const pan = v.rand() * 1.2 - 0.6, gap = 0.28 + v.rand() * 0.2;
        for (let i = 0; i < len; i++) pluck(v, when + i * gap, v.freq(start + dir * i + n, 0), 0.11 + v.rand() * 0.04, pan);
        next += len * gap + 5 + v.rand() * 10 - 6 * v.params.activity;
      }
    },
    stop() {},
  };
};

const ocean: VoiceFactory = (v) => {
  const src = loop(v, v.noise.brown);
  const lp = v.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
  const g = v.ctx.createGain(); g.gain.value = 0.5;
  const l1 = lfo(v, 0.085, 0.28, g.gain), l2 = lfo(v, 0.053, 0.16, g.gain);
  const l3 = lfo(v, 0.085, 350, lp.frequency);
  src.connect(lp).connect(g).connect(v.out);
  return { update() {}, stop() { src.stop(); l1.stop(); l2.stop(); l3.stop(); g.disconnect(); } };
};

const rain: VoiceFactory = (v) => {
  const src = loop(v, v.noise.white);
  const hp = v.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
  const lp = v.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
  const g = v.ctx.createGain(); g.gain.value = 0.12;
  src.connect(hp).connect(lp).connect(g).connect(v.out);
  let next = v.ctx.currentTime + 0.5;
  return {
    update(now) {
      if (next < now - 0.5) next = now; // after a stall, do not play the backlog at once
      while (next < now + v.lookahead) {
        const when = Math.max(next, now + 0.02);
        const o = v.ctx.createOscillator(); const f = 900 + v.rand() * 1400;
        o.frequency.setValueAtTime(f, when); o.frequency.exponentialRampToValueAtTime(f * 0.6, when + 0.12);
        const e = v.ctx.createGain();
        e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(0.03 + v.rand() * 0.03, when + 0.008);
        e.gain.setTargetAtTime(0, when + 0.008, 0.04);
        const p = v.ctx.createStereoPanner(); p.pan.value = v.rand() * 1.8 - 0.9;
        o.connect(e).connect(p).connect(v.out); o.start(when); o.stop(when + 0.5);
        next += 0.08 + v.rand() * (1.6 - 1.3 * v.params.activity);
      }
    },
    stop() { src.stop(); g.disconnect(); },
  };
};

const wind: VoiceFactory = (v) => {
  const src = loop(v, v.noise.pink);
  const bp = v.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 500; bp.Q.value = 1.6;
  const g = v.ctx.createGain(); g.gain.value = 0.55;
  const ls = [lfo(v, 0.07, 220, bp.frequency), lfo(v, 0.113, 130, bp.frequency), lfo(v, 0.047, 0.3, g.gain)];
  src.connect(bp).connect(g).connect(v.out);
  return { update() {}, stop() { src.stop(); ls.forEach((l) => l.stop()); g.disconnect(); } };
};

const stream: VoiceFactory = (v) => {
  const src = loop(v, v.noise.white);
  const g = v.ctx.createGain(); g.gain.value = 0.3;
  const ls: OscillatorNode[] = [];
  for (let i = 0; i < 5; i++) {
    const bp = v.ctx.createBiquadFilter(); bp.type = "bandpass";
    const f = 500 + i * 420 + v.rand() * 200; bp.frequency.value = f; bp.Q.value = 9;
    ls.push(lfo(v, 2 + v.rand() * 5, f * 0.25, bp.frequency));
    const bg = v.ctx.createGain(); bg.gain.value = 0.5;
    ls.push(lfo(v, 0.6 + v.rand() * 1.5, 0.4, bg.gain));
    src.connect(bp).connect(bg).connect(g);
  }
  g.connect(v.out);
  return { update() {}, stop() { src.stop(); ls.forEach((l) => l.stop()); g.disconnect(); } };
};

const noise: VoiceFactory = (v) => {
  const src = loop(v, v.noise.brown);
  const g = v.ctx.createGain(); g.gain.value = 0.45;
  src.connect(g).connect(v.out);
  return { update() {}, stop() { src.stop(); g.disconnect(); } };
};

const pulse: VoiceFactory = (v) => {
  let next = v.ctx.currentTime + 0.5;
  const thump = (when: number, gain: number) => {
    const o = v.ctx.createOscillator();
    o.frequency.setValueAtTime(70, when); o.frequency.exponentialRampToValueAtTime(42, when + 0.2);
    const e = v.ctx.createGain();
    e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(gain, when + 0.03);
    e.gain.setTargetAtTime(0, when + 0.03, 0.09);
    o.connect(e).connect(v.out); o.start(when); o.stop(when + 0.8);
  };
  return {
    update(now) {
      if (next < now - 0.5) next = now; // after a stall, do not play the backlog at once
      while (next < now + v.lookahead) {
        const when = Math.max(next, now + 0.02);
        const beat = 60 / v.params.pulseRate;
        thump(when, 0.5); thump(when + beat * 0.3, 0.3);
        next += beat;
      }
    },
    stop() {},
  };
};

const breath: VoiceFactory = (v) => {
  const src = loop(v, v.noise.pink);
  const bp = v.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 700; bp.Q.value = 0.9;
  const g = v.ctx.createGain(); g.gain.value = 0;
  src.connect(bp).connect(g).connect(v.out);
  return {
    update(now) {
      const b = v.params.breath;
      g.gain.setTargetAtTime(0.08 + 0.5 * b, now, 0.15);
      bp.frequency.setTargetAtTime(500 + 600 * b, now, 0.15);
    },
    stop() { src.stop(); g.disconnect(); },
  };
};

const FACTORIES: Record<string, VoiceFactory> = {
  drone, chimes, bowls, koto, ocean, rain, wind, stream, noise, pulse, breath,
  bronze: bowlLayer("bronze", bronze, 0), rubbed: bowlLayer("rubbed", bronze, 1), crystal: bowlLayer("crystal", crystal, 0.4, 0.5),
};

/** Master chain: voices -> dry + reverb -> soften -> volume -> limiter -> soft clip -> out.
 *  The limiter and clip stages sit after everything, so no voice, input or bug
 *  upstream can produce a sudden loud sound. */
export class SoundEngine {
  ctx: AudioContext | OfflineAudioContext | null = null;
  /** current targets; change them with set() */
  readonly params: SoundParams = { ...DEFAULT_PARAMS };
  /** current layer levels by id, 0..1 */
  readonly levels = new Map<string, number>();
  private seed: number;
  private fadeIn: number;
  private given: AudioContext | OfflineAudioContext | undefined;
  private output: "speakers" | "stream";
  private lookahead: number;
  /** running layers by id */
  readonly voices = new Map<string, { voice: Voice; gain: GainNode }>();
  private vctx!: VoiceCtx;
  private dry!: GainNode;
  private wet!: GainNode;
  private soften!: BiquadFilterNode;
  private master!: GainNode;
  private fade!: GainNode;
  private clip!: WaveShaperNode;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  analyser: AnalyserNode | null = null;
  private rng: Rand = mulberry32(1);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(opts: EngineOptions = {}) {
    this.seed = opts.seed ?? 1;
    this.fadeIn = opts.fadeInSeconds ?? 5;
    this.given = opts.context;
    this.output = opts.output ?? "speakers";
    this.lookahead = opts.lookahead ?? 0.3;
  }

  /** Start producing sound. Browsers allow this only after the person has tapped or clicked. */
  async start(): Promise<void> {
    if (this.ctx) { if (this.ctx instanceof AudioContext) await this.ctx.resume(); return; }
    const ctx = this.given ?? new AudioContext({ latencyHint: "playback" });
    this.ctx = ctx;
    this.rng = mulberry32(subSeed(this.seed, "audio"));
    const rand: Rand = () => this.rng();
    const bus = ctx.createGain();
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    const conv = ctx.createConvolver(); conv.buffer = this.impulse(ctx, rand);
    this.soften = ctx.createBiquadFilter(); this.soften.type = "lowpass"; this.soften.Q.value = 0.5;
    this.master = ctx.createGain(); this.master.gain.value = 0;
    this.fade = ctx.createGain(); this.fade.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 14; comp.attack.value = 0.003; comp.release.value = 0.4;
    // the ceiling: the curve peaks at 0.85 of full scale; the 2x oversampling can overshoot that
    // by under 1 %, so the output never exceeds 0.86 (scripts/soundcheck.mjs checks this)
    const clip = ctx.createWaveShaper();
    const curve = new Float32Array(1025);
    for (let i = 0; i < 1025; i++) curve[i] = Math.tanh(((i / 512) - 1) * 1.5) / Math.tanh(1.5) * 0.85;
    clip.curve = curve; clip.oversample = "2x"; this.clip = clip;
    this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 2048;
    bus.connect(this.dry).connect(this.soften);
    bus.connect(conv).connect(this.wet).connect(this.soften);
    this.soften.connect(this.master).connect(this.fade).connect(comp).connect(clip);
    clip.connect(this.analyser);
    if (this.output === "speakers" || !(ctx instanceof AudioContext)) clip.connect(ctx.destination);
    else { this.streamDest = ctx.createMediaStreamDestination(); clip.connect(this.streamDest); }
    // slow start: sound rises over several seconds, never arrives at once
    this.fade.gain.setValueAtTime(0, ctx.currentTime);
    this.fade.gain.linearRampToValueAtTime(1, ctx.currentTime + this.fadeIn);

    const params = this.params;
    // the drone's chord, for the bowls' roughness guard, while the drone is audible
    const steady = () => (this.levels.get("drone") ?? 0) > 0.02 ? [[0, -1], [0, 0], [2, 0], [4, 0], [0, 1]].map(([d, o]) => this.vctx.freq(d, o)) : [];
    this.vctx = {
      ctx: ctx as AudioContext, out: bus, rand, noise: noiseBuffers(ctx, rand), params, lookahead: this.lookahead,
      seed: this.seed, bowls: new BowlPool(64, steady),
      freq(degree, octave) {
        const steps = (SCALES[params.scale] ?? SCALES.pentaMajor).steps;
        const n = steps.length;
        const oct = Math.floor(degree / n) + octave;
        const semis = steps[((degree % n) + n) % n] + Math.round(params.root);
        return 130.81 * Math.pow(2, (semis + 12 * oct) / 12);
      },
    };
    if (ctx instanceof AudioContext) {
      this.timer = setInterval(() => this.update(), 50);
      await ctx.resume();
    }
  }

  /** Change any of the targets. Missing fields are left as they are. */
  set(p: Partial<SoundParams>): void {
    Object.assign(this.params, p);
  }

  /** Set one layer's level, 0..1. */
  setLayer(id: string, level: number): void {
    if (LAYERS.some((l) => l.id === id)) this.levels.set(id, Math.min(1, Math.max(0, level)));
  }

  /** Set every layer at once; layers not named go silent. */
  setLayers(levels: Record<string, number>): void {
    for (const l of LAYERS) this.setLayer(l.id, levels[l.id] ?? 0);
  }

  /** Apply a named soundscape: its layers and its scale. */
  applySoundscape(id: string): boolean {
    const sc = SOUNDSCAPES.find((s) => s.id === id);
    if (!sc) return false;
    this.setLayers(sc.layers);
    this.params.scale = sc.scale;
    return true;
  }

  /** The soundscape the current levels and scale match, if any. */
  currentSoundscape(): string | null {
    for (const sc of SOUNDSCAPES) {
      const ok = LAYERS.every((l) => Math.abs((this.levels.get(l.id) ?? 0) - (sc.layers[l.id] ?? 0)) < 0.005);
      if (ok && this.params.scale === sc.scale) return sc.id;
    }
    return null;
  }

  /** Stop everything and release the audio context. */
  async stop(): Promise<void> {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
    for (const e of this.voices.values()) { e.voice.stop(); e.gain.disconnect(); }
    this.voices.clear();
    this.clip.disconnect();   // a supplied context keeps running: nothing of ours, not even the reverb tail, stays on it
    if (this.ctx instanceof AudioContext && !this.given) await this.ctx.close();
    this.ctx = null; this.streamDest = null; this.analyser = null;
  }

  private impulse(ctx: BaseAudioContext, rand: Rand): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * 4.5);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // the tail darkens as it decays, as in a real room
        const a = 0.25 + 0.7 * (1 - t);
        lp += a * ((rand() * 2 - 1) - lp);
        d[i] = lp * Math.pow(1 - t, 2.2) * Math.min(1, i / (ctx.sampleRate * 0.02));
      }
    }
    return buf;
  }

  /** Called 20 times a second: follows the targets and keeps the layers scheduled. */
  update(): void {
    const ctx = this.ctx;
    if (!ctx || (ctx instanceof AudioContext && ctx.state !== "running")) return;
    const now = ctx.currentTime, p = this.params;
    const vol = p.mute ? 0 : p.volume;
    this.master.gain.setTargetAtTime(vol * vol * 1.4, now, 0.2);
    this.soften.frequency.setTargetAtTime(16000 * Math.pow(0.11, p.soften), now, 0.3);
    const rv = p.reverb;
    this.wet.gain.setTargetAtTime(rv * 0.9, now, 0.5);
    this.dry.gain.setTargetAtTime(1 - rv * 0.35, now, 0.5);
    for (const info of LAYERS) {
      const level = this.levels.get(info.id) ?? 0;
      let entry = this.voices.get(info.id);
      if (!entry && level > 0.005) {
        const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(this.vctx.out);
        entry = { gain, voice: FACTORIES[info.id]({ ...this.vctx, out: gain }) };
        this.voices.set(info.id, entry);
      }
      if (!entry) continue;
      entry.gain.gain.setTargetAtTime(level * level * (CALIBRATION[info.id] ?? 1), now, 0.4);
      if (level > 0.002) entry.voice.update(now);
      else if (level < 0.0005) { entry.voice.stop(); entry.gain.disconnect(); this.voices.delete(info.id); }
    }
  }

  /** A touch plays one soft sound. x and y are 0..1; left to right walks up the scale, so the
   *  same place always sounds the same. The kind matches what a scene does with the touch. */
  touch(x: number, y: number, kind: TouchSound = "bell"): void {
    if (!this.ctx || (this.ctx instanceof AudioContext && this.ctx.state !== "running")) return;
    const v = this.vctx, ctx = this.ctx, when = ctx.currentTime + 0.02;
    const n = (SCALES[this.params.scale] ?? SCALES.pentaMajor).steps.length;
    const degree = Math.floor(Math.min(0.999, Math.max(0, x)) * n * 2);
    const f = v.freq(degree, y > 0.5 ? 1 : 0), pan = x * 1.4 - 0.7;
    switch (kind) {
      case "pluck": pluck(v, when, f, 0.14, pan); break;
      case "pop": {   // a soft pop: a short filtered noise puff and a quick falling blip
        const src = ctx.createBufferSource(); src.buffer = v.noise.pink;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 2;
        const e = ctx.createGain(); e.gain.setValueAtTime(0, when); e.gain.linearRampToValueAtTime(0.25, when + 0.01); e.gain.setTargetAtTime(0, when + 0.01, 0.05);
        const p = ctx.createStereoPanner(); p.pan.value = pan;
        src.connect(bp).connect(e).connect(p).connect(v.out); src.start(when, v.rand() * 5); src.stop(when + 0.5);
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(f * 1.5, when); o.frequency.exponentialRampToValueAtTime(f * 0.8, when + 0.12);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.08, when + 0.01); g.gain.setTargetAtTime(0, when + 0.01, 0.06);
        o.connect(g).connect(p); o.start(when); o.stop(when + 0.5);
        break;
      }
      case "drop": {   // a water drop: a plink that rises slightly, with a soft body
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(f * 0.9, when); o.frequency.exponentialRampToValueAtTime(f * 1.25, when + 0.15);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.14, when + 0.015); g.gain.setTargetAtTime(0, when + 0.015, 0.25);
        const p = ctx.createStereoPanner(); p.pan.value = pan;
        o.connect(g).connect(p).connect(v.out); o.start(when); o.stop(when + 2);
        bell(v, when + 0.02, f * 2, 0.04, 3, pan);
        break;
      }
      case "burst":   // flowers: a small shimmering cluster of three quick bells
        bell(v, when, f, 0.1, 4, pan); bell(v, when + 0.09, v.freq(degree + 2, y > 0.5 ? 1 : 0), 0.08, 4, pan + 0.1); bell(v, when + 0.18, v.freq(degree + 4, y > 0.5 ? 1 : 0), 0.07, 4, pan - 0.1);
        break;
      case "split":   // dots: two quick notes, the second a step up
        bell(v, when, f, 0.11, 3, pan); bell(v, when + 0.12, v.freq(degree + 1, y > 0.5 ? 1 : 0), 0.09, 3, pan);
        break;
      case "thump": {   // lava: a low, soft thump
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(f * 0.25, when); o.frequency.exponentialRampToValueAtTime(f * 0.18, when + 0.25);
        const g = ctx.createGain(); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.3, when + 0.03); g.gain.setTargetAtTime(0, when + 0.03, 0.18);
        o.connect(g).connect(v.out); o.start(when); o.stop(when + 1.2);
        break;
      }
      default: bell(v, when, f, 0.16, 6, pan);
    }
  }

  /** Hush (for a stop control): everything, the reverb tail included, is at least 30 dB down
   *  within 150 ms and 50 dB down within half a second (the compressor's release lets a little
   *  through as it recovers), and stays silent until setStopped(false), which brings the sound
   *  back over a few seconds. The layers keep running quietly, so nothing restarts with a burst. */
  setStopped(stopped: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.fade.gain.cancelScheduledValues(now);
    this.fade.gain.setTargetAtTime(stopped ? 0 : 1, now, stopped ? 0.025 : 1.2);
  }

  /** Restart the generative layers from a seed, so the same notes come again. */
  reseed(seed: number): void {
    this.seed = seed;
    this.rng = mulberry32(subSeed(seed, "audio"));
    for (const [id, e] of this.voices) {
      const g = e.gain;
      g.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3);
      e.voice.stop();
      setTimeout(() => g.disconnect(), 2500);
      this.voices.delete(id);
    }
  }

  /** The output as a media stream: for a media element (lock-screen playback) or a recorder. */
  stream(): MediaStream | null {
    if (!this.ctx || !(this.ctx instanceof AudioContext)) return null;
    if (!this.streamDest) {
      this.streamDest = this.ctx.createMediaStreamDestination();
      this.analyser!.connect(this.streamDest);
    }
    return this.streamDest.stream;
  }

  /** current output peak, 0..1 (for a level meter and for tests) */
  peak(): number {
    if (!this.analyser) return 0;
    const d = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(d);
    let m = 0;
    for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
    return m;
  }

  suspend(): void { if (this.ctx instanceof AudioContext) void this.ctx.suspend(); }
  resume(): void { if (this.ctx instanceof AudioContext) void this.ctx.resume(); }

  /** Render `seconds` of sound to a buffer, offline and faster than real time, with the given
   *  layers and parameters. The same seed and settings give the same buffer. */
  static async render(opts: { seconds: number; seed?: number; sampleRate?: number; layers?: Record<string, number>; soundscape?: string; params?: Partial<SoundParams>; fadeInSeconds?: number;
    /** called once the engine has started, before rendering: for one-off events and for tests */
    setup?: (engine: SoundEngine) => void }): Promise<AudioBuffer> {
    const rate = opts.sampleRate ?? 44100;
    const ctx = new OfflineAudioContext(2, Math.ceil(opts.seconds * rate), rate);
    const engine = new SoundEngine({ seed: opts.seed ?? 1, context: ctx, fadeInSeconds: opts.fadeInSeconds ?? 2 });
    if (opts.soundscape) engine.applySoundscape(opts.soundscape);
    if (opts.layers) engine.setLayers(opts.layers);
    if (opts.params) engine.set(opts.params);
    await engine.start();
    opts.setup?.(engine);
    // the scheduler runs every 50 ms of rendered time
    const step = 0.05;
    for (let t = 0; t < opts.seconds; t += step) {
      void ctx.suspend(t).then(() => { engine.update(); void ctx.resume(); });
    }
    const buf = await ctx.startRendering();
    for (const e of engine.voices.values()) e.voice.stop();
    return buf;
  }
}
