/** Singing bowls, struck and rubbed, bronze and crystal, built from the measurements in
 *  docs/reports/Singing bowl sound synthesis.md. Each bowl rings at the natural pitch of its
 *  size, not in the soundscape's scale.
 *
 *  A bowl sounds through its rim modes, (2,0), (3,0) ... and each mode is really a pair of
 *  shapes, cos jθ and sin jθ, split slightly in frequency by the bowl's asymmetry. A strike
 *  at angle θ excites the pair in the proportion cos jθ : sin jθ, and the two members beat at
 *  their difference frequency as they decay, each at its own rate. A rub drives only the
 *  lowest mode: it swells over several seconds and its vibration pattern turns with the
 *  stick, so a listener hears a slow rise and fall at a few hertz. These are the sounds here.
 *
 *  Every random choice for a bowl comes from a stream keyed by the layer and the event index,
 *  so the same seed gives the same bowls whatever the other layers do. */
import { mulberry32, subSeed, type Rand } from "./prng";
import type { Voice, VoiceCtx } from "./engine";

export type Material = "bronze" | "crystal";

/** A partial of a ringing bowl, for the roughness guard: its frequency and amplitude over time. */
interface Partial { f: number; amp: (t: number) => number }

/** One bowl still sounding: what the pool needs to count voices and to fade it out early. */
interface Ring {
  layer: string;
  born: number;
  gain: GainNode;
  nodes: { node: AudioScheduledSourceNode; until: number }[];
  partials: Partial[];
  stolen: boolean;
}

/** Equivalent rectangular bandwidth of the ear at f (Glasberg and Moore 1990), in hertz. */
const erb = (f: number) => 24.7 * (4.37 * f / 1000 + 1);

/** Shared between the bowl layers: a budget of sounding sources, the fade-out of the oldest
 *  bowl when the budget is full, and the roughness guard. */
export class BowlPool {
  private rings: Ring[] = [];
  private counters = new Map<string, number>();

  /** @param budget most oscillators and noise sources sounding at once across the bowl layers
   *  @param steady frequencies of steady tones in other layers (the drone's chord), for the guard */
  constructor(readonly budget: number, private steady: () => number[]) {}

  /** The next event index of a layer. Indices continue for the life of the engine. */
  index(layer: string): number {
    const i = this.counters.get(layer) ?? 0;
    this.counters.set(layer, i + 1);
    return i;
  }

  /** Sources still scheduled to sound at `now`. */
  alive(now: number): number {
    this.rings = this.rings.filter((r) => r.nodes.some((n) => n.until > now));
    let n = 0;
    for (const r of this.rings) for (const x of r.nodes) if (x.until > now) n++;
    return n;
  }

  /** Make room for `need` more sources by fading out the oldest bowls. */
  reserve(now: number, need: number): void {
    while (this.alive(now) + need > this.budget) {
      const r = this.rings.find((x) => !x.stolen);
      if (!r) return;
      BowlPool.fade(r, now, 0.3);
    }
  }

  /** Would a bowl with these loud partials sound rough against what is already sounding?
   *  Two tones within about a critical band of each other, but not nearly in unison, beat too
   *  fast to hear as a wobble and are heard as roughness (Plomp and Levelt 1965). The band is
   *  taken as 15 Hz to 0.9 of the equivalent rectangular bandwidth at the pair's mean frequency.
   *  This is a design heuristic for a sound-sensitive audience, not a demonstrated safety limit.
   *  @param floor amplitude below which a sounding partial no longer counts */
  rough(freqs: number[], now: number, floor: number): boolean {
    const others = [...this.steady()];
    for (const r of this.rings) if (!r.stolen) for (const p of r.partials) if (p.amp(now) >= floor) others.push(p.f);
    for (const f of freqs) for (const o of others) {
      const d = Math.abs(f - o);
      if (d >= 15 && d <= 0.9 * erb((f + o) / 2)) return true;
    }
    return false;
  }

  add(ring: Ring): void { this.rings.push(ring); }

  /** Fade every bowl of a layer and free its sources: the layer has been turned off. */
  stopLayer(layer: string, now: number): void {
    for (const r of this.rings) if (r.layer === layer && !r.stolen) BowlPool.fade(r, now, 0.3);
  }

  private static fade(r: Ring, now: number, seconds: number): void {
    r.stolen = true;
    r.gain.gain.cancelScheduledValues(now);
    r.gain.gain.setTargetAtTime(0, now, seconds / 3);
    for (const x of r.nodes) { x.node.stop(now + seconds + 0.3); x.until = Math.min(x.until, now + seconds + 0.3); }
  }
}

/** One mode pair of a bowl: frequency, level, decay and split, before a strike sets the
 *  balance of its two members. */
interface Mode {
  f: number;
  /** amplitude relative to the fundamental's, 0..1 */
  level: number;
  /** seconds to fall 60 dB, for each member */
  t60: [number, number];
  /** frequency difference between the members, hertz */
  split: number;
  /** the mode's j: its number of nodal diameters, from 2 upward */
  j: number;
}

interface Bowl { material: Material; f0: number; modes: Mode[] }

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const dB = (x: number) => Math.pow(10, x / 20);
/** uniform in [lo, hi] */
const uni = (r: Rand, lo: number, hi: number) => lo + (hi - lo) * r();
/** log-uniform in [lo, hi] */
const logUni = (r: Rand, lo: number, hi: number) => lo * Math.pow(hi / lo, r());
/** seconds to fall 60 dB -> amplitude time constant of exp(-t/tau) */
const tau = (t60: number) => t60 / 6.908;

/** A bronze bowl of a seeded size. Fundamentals 180 to 600 Hz: medium to small bowls; ratios
 *  are the medians measured from recordings, stretched together by one value per bowl; the
 *  second partial is often as loud as the fundamental; the fundamental rings for about 30 to
 *  60 s and the upper partials for less, shorter the higher they are. */
export function bronze(r: Rand): Bowl {
  const size = r();                                   // 0 = small and high, 1 = large and low
  const f0 = 600 * Math.pow(180 / 600, size);
  const stretch = uni(r, -0.03, 0.03);
  const ratios = [1, 2.85, 5.46, 8.4, 11.8];
  const levels = [0, uni(r, -2, 4), uni(r, -18, -12), uni(r, -18, -12), uni(r, -29, -23)];
  const t60a = uni(r, 28, 60) * (0.7 + 0.5 * size);   // larger bowls ring longer
  const t60k = [1, uni(r, 1.1, 1.4), uni(r, 0.8, 1.2), uni(r, 0.5, 0.9), uni(r, 0.3, 0.6)];
  const split0 = clamp(logUni(r, 1, 3.2), 0.5, 6);
  const modes: Mode[] = ratios.map((ratio, n) => {
    const f = f0 * (n === 0 ? 1 : ratio * (1 + stretch * n / 4) * (1 + uni(r, -0.01, 0.01)));
    const t = Math.min(t60a * t60k[n], 25000 / f);   // partials above 3 to 4 kHz last only seconds
    const split = n === 0 ? split0 : clamp(split0 * ratio * uni(r, 0.5, 1), 0.5, 8);
    return { f, level: dB(levels[n]), t60: [t * uni(r, 0.85, 1.15), t * uni(r, 0.85, 1.15)], split, j: n + 2 };
  });
  return { material: "bronze", f0, modes };
}

/** A crystal (quartz) bowl of a seeded size: a nearly pure, low tone with its partials far
 *  down, splits of about 0.07 % that beat only every few seconds, and a long ring. The
 *  evidence behind these values is five recordings, so they are a sketch of the sound. */
export function crystal(r: Rand): Bowl {
  const size = r();
  const f0 = 350 * Math.pow(130 / 350, size);
  const ratios = [1, 2.556, 4.62, 7.2];
  const levels = [0, uni(r, -24, -16), uni(r, -38, -30), uni(r, -48, -42)];
  const t60a = uni(r, 36, 60);
  const t60k = [1, uni(r, 0.2, 0.3), uni(r, 0.15, 0.25), uni(r, 0.1, 0.2)];
  const modes: Mode[] = ratios.map((ratio, n) => {
    const f = f0 * ratio * (1 + uni(r, -0.008, 0.008));
    const t = Math.min(t60a * t60k[n], 25000 / f);
    return { f, level: dB(levels[n]), t60: [t * uni(r, 0.9, 1.1), t * uni(r, 0.9, 1.1)], split: uni(r, 0.15, 0.3) * ratio, j: n + 2 };
  });
  return { material: "crystal", f0, modes };
}

/** What a strike does to a bowl: where it lands and how hard the mallet is. */
export interface Strike {
  /** angle round the rim, radians: sets how deep each mode pair beats */
  angle: number;
  /** 0 = padded mallet (dark, slow), 1 = hard striker (bright, quick) */
  mallet: number;
  /** peak amplitude of the fundamental, before the layer's own gain */
  gain: number;
  pan: number;
}

/** amplitude of each member of a pair for a strike at `angle`, with the beat depth held
 *  between about 3 and 12 dB peak to trough: real strikes range from 1 to 24 dB */
function members(j: number, angle: number, depthMin = 0.15, depthMax = 0.6): [number, number] {
  let a = Math.abs(Math.cos(j * angle)), b = Math.abs(Math.sin(j * angle));
  const hi = Math.max(a, b), lo = Math.min(a, b);
  const m = clamp(lo / hi, depthMin, depthMax);        // modulation index min/max
  const norm = 1 / Math.sqrt(1 + m * m);
  [a, b] = a >= b ? [norm, m * norm] : [m * norm, norm];
  return [a, b];
}

/** Strike a bowl at `when`. Returns the ring for the pool. */
export function strike(v: VoiceCtx, pool: BowlPool, layer: string, when: number, bowl: Bowl, s: Strike): void {
  const { ctx } = v;
  const onset = 0.015 - 0.010 * s.mallet;
  const out = ctx.createGain(); out.gain.value = 1;
  const pan = ctx.createStereoPanner(); pan.pan.value = s.pan;
  out.connect(pan).connect(v.out);
  const ring: Ring = { layer, born: when, gain: out, nodes: [], partials: [], stolen: false };
  const tilt = (s.mallet - 0.45) * 12;                  // dB per partial index at the top, hard = bright
  bowl.modes.forEach((m, n) => {
    const level = m.level * dB(tilt * n / (bowl.modes.length - 1));
    const [a, b] = members(m.j, s.angle, bowl.material === "crystal" ? 0.11 : 0.15, bowl.material === "crystal" ? 0.33 : 0.6);
    [a, b].forEach((amp, k) => {
      const peak = s.gain * level * amp;
      if (peak < 1e-4) return;
      const o = ctx.createOscillator(); o.frequency.value = m.f + (k ? m.split : 0);
      const g = ctx.createGain();
      const tc = tau(m.t60[k]);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + onset);
      g.gain.setTargetAtTime(0, when + onset, tc);
      o.connect(g).connect(out);
      const until = when + onset + m.t60[k] + 0.1;      // 60 dB down: silent
      o.start(when); o.stop(until);
      ring.nodes.push({ node: o, until });
      if (n < 3) ring.partials.push({ f: o.frequency.value, amp: (t) => t < when ? 0 : peak * Math.exp(-(t - when - onset) / tc) });
    });
  });
  // the contact: a short burst of noise, darker for a padded mallet, 20 dB below the tone
  const click = ctx.createBufferSource(); click.buffer = v.noise.pink;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700 + 3300 * s.mallet; lp.Q.value = 0.7;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0, when); cg.gain.linearRampToValueAtTime(s.gain * 0.12, when + 0.003);
  cg.gain.setTargetAtTime(0, when + 0.003, 0.012 + 0.02 * (1 - s.mallet));
  click.connect(lp).connect(cg).connect(out);
  click.start(when, 1 + s.angle); click.stop(when + 0.2);
  ring.nodes.push({ node: click, until: when + 0.2 });
  pool.add(ring);
}

/** How a bowl is rubbed. */
export interface Rub {
  /** seconds from the first contact to the release */
  seconds: number;
  /** rises and falls per second heard as the pattern turns: about 1 to 3 for bronze, 0.3 to 0.5 for crystal */
  rate: number;
  /** modulation index of that rise and fall, 0..1 */
  depth: number;
  /** seconds for the tone to swell to within a few percent of full */
  swell: number;
  gain: number;
}

/** Rub a bowl from `when` and release it after `rub.seconds`, into its own ringing decay.
 *  Against the recordings: a rubbed bronze bowl rises and falls 16 to 22 dB at 1 to 2 Hz with
 *  the rate wandering, its pitch wanders by 0.2 to 0.5 %, the exact second harmonic sits about
 *  26 dB down and the bowl's own second partial about 27 dB down; crystal swells over 10 to
 *  20 s and moves only 3 to 7 dB at 0.3 to 0.45 Hz. */
export function rub(v: VoiceCtx, pool: BowlPool, layer: string, when: number, bowl: Bowl, rub: Rub): void {
  const { ctx } = v;
  const q = bowl.material === "crystal";
  const m = bowl.modes[0];
  const release = when + rub.seconds;
  const ringFor = m.t60[0];
  const out = ctx.createGain(); out.gain.value = 1;
  const ring: Ring = { layer, born: when, gain: out, nodes: [], partials: [], stolen: false };
  const stop = release + ringFor + 0.1;
  const source = (node: AudioScheduledSourceNode, until = stop) => ring.nodes.push({ node, until });
  // the swell: logistic rise, held, then the struck decay once the stick leaves
  const swell = Math.min(rub.swell, rub.seconds * 0.7);
  const env = ctx.createGain(); env.gain.value = 0;
  const steps = 64, curve = new Float32Array(steps), k = q ? 6 : 8;
  for (let i = 0; i < steps; i++) curve[i] = rub.gain / (1 + Math.exp(-(i / (steps - 1) - 0.6) * k));
  env.gain.setValueCurveAtTime(curve, when, swell);
  env.gain.setTargetAtTime(0, release, tau(ringFor));
  // the turning pattern: the two ears sit at different angles, so their rises alternate; the
  // stick's speed wanders, so the rate drifts by about a seventh
  const merge = ctx.createChannelMerger(2);
  const drift = ctx.createOscillator(); drift.frequency.value = 0.05 + (rub.rate % 0.07);
  const driftGain = ctx.createGain(); driftGain.gain.value = rub.rate * 0.14;
  drift.connect(driftGain); drift.start(when); drift.stop(stop); source(drift);
  for (const side of [0, 1]) {
    const am = ctx.createGain(); am.gain.value = 1;
    const lfo = ctx.createOscillator(); lfo.frequency.value = rub.rate;
    driftGain.connect(lfo.frequency);
    const depth = ctx.createGain(); depth.gain.value = rub.depth;
    depth.gain.setTargetAtTime(0, release, 1.2);         // the pattern stops turning
    lfo.connect(depth).connect(am.gain);
    const t0 = when + side * 0.5 / rub.rate;             // half a cycle apart
    lfo.start(t0); lfo.stop(stop); source(lfo);
    env.connect(am).connect(merge, 0, side);
  }
  merge.connect(out).connect(v.out);
  // the pitch wanders slowly, as the stick's pressure changes
  const wander = ctx.createOscillator(); wander.frequency.value = 0.12 + (rub.rate % 0.18);
  const wanderGain = ctx.createGain(); wanderGain.gain.value = q ? 1.5 : 4;   // cents
  wander.connect(wanderGain); wander.start(when); wander.stop(stop); source(wander);
  // the sung mode, slightly below the free pitch, its twin far weaker than after a strike
  // (the stick drives one member), faint locked harmonics, and the bowl's own second partial
  const sung = m.f * 0.999;
  const tones: [number, number][] = [
    [sung, 1], [sung + m.split, 0.15],
    [sung * 2, dB(q ? -45 : -28)], [sung * 3, dB(q ? -60 : -50)],
    [bowl.modes[1].f, dB(q ? -48 : -30)],
  ];
  for (const [f, level] of tones) {
    const o = ctx.createOscillator(); o.frequency.value = f;
    wanderGain.connect(o.detune);
    const g = ctx.createGain(); g.gain.value = level;
    o.connect(g).connect(env);
    o.start(when); o.stop(stop); source(o);
  }
  ring.partials.push({ f: sung, amp: (t) => t < when ? 0 : t < release ? rub.gain * curve[Math.min(steps - 1, Math.floor((t - when) / swell * steps))] : rub.gain * Math.exp(-(t - release) / tau(ringFor)) });
  // friction: a breath of noise above the tone, far below it, gone when the stick leaves
  const fr = ctx.createBufferSource(); fr.buffer = v.noise.white; fr.loop = true; fr.loopEnd = fr.buffer.duration - 0.5;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500; hp.Q.value = 0.5;
  const fg = ctx.createGain(); fg.gain.value = dB(q ? -55 : -45) / 0.27;   // the buffer's RMS above the filter is about 0.27
  fg.gain.setTargetAtTime(0, release, 0.15);
  fr.connect(hp).connect(fg).connect(env);
  fr.start(when, 2 + (rub.rate % 1) * 3); fr.stop(release + 1); source(fr, release + 1);
  pool.add(ring);
}

/** sources a rub needs from the pool's budget */
export const RUB_SOURCES = 10;

/** Random values for one event, keyed by the layer and the event's index. */
const eventRand = (seed: number, layer: string, i: number) => mulberry32(subSeed(subSeed(seed, "bowls:" + layer), "e" + i));

/** The loudest partials of a bowl, for the roughness guard: those within 20 dB of the strongest. */
function loudest(bowl: Bowl): number[] {
  const top = Math.max(...bowl.modes.map((m) => m.level));
  return bowl.modes.filter((m) => m.level >= top * 0.1).map((m) => m.f);
}

/** Tries up to eight seeded bowls for one that does not sound rough against what is already
 *  sounding, and gives up quietly: the gap is then just a little longer. */
function pick(r: Rand, make: (r: Rand) => Bowl, pool: BowlPool, now: number, floor: number): Bowl | null {
  for (let i = 0; i < 8; i++) {
    const b = make(r);
    if (!pool.rough(loudest(b), now, floor)) return b;
  }
  return null;
}

const STRIKE_GAIN = 0.1;

/** A layer of bowls of one material. Each event is a strike, or a rub with probability
 *  `rubChance`. Strikes come singly or as two or three bowls a few seconds apart. Between
 *  events there is silence: the next waits until the last bowl has fallen well down, 30 dB at
 *  the lowest activity and 20 dB at the highest, and after a rub at least as long again as the
 *  rub itself. `soft` scales the mallet: crystal is only ever struck softly. */
export function bowlLayer(layer: string, make: (r: Rand) => Bowl, rubChance: number, soft = 1): (v: VoiceCtx) => Voice {
  return (v) => {
    const pool = v.bowls;
    const sched = mulberry32(subSeed(v.seed, "sched:" + layer));
    let next = v.ctx.currentTime + 2 + sched() * 6;
    return {
      update(now) {
        if (next < now - 0.5) next = now + 1;   // after a stall, skip rather than play late
        while (next < now + v.lookahead) {
          const when = Math.max(next, now + 0.02);
          const a = v.params.activity;
          const quiet = (4 + 20 * (1 - a)) * (0.5 + sched());
          if (sched() < rubChance) {
            const i = pool.index(layer);
            const r = eventRand(v.seed, layer, i);
            const bowl = pick(r, make, pool, when, STRIKE_GAIN * 0.25);
            const seconds = uni(r, 8, 32);
            if (bowl) {
              const q = bowl.material === "crystal";
              pool.reserve(when, RUB_SOURCES);
              rub(v, pool, layer, when, bowl, {
                seconds: q ? seconds + 8 : seconds, gain: STRIKE_GAIN * 0.8,
                rate: q ? uni(r, 0.3, 0.45) : uni(r, 1.0, 2.2) * (0.85 + 0.3 * (1 - bowl.f0 / 600)),
                depth: q ? 0.45 : uni(r, 0.7, 0.95),
                swell: q ? uni(r, 12, 20) : uni(r, 7, 12),
              });
            }
            next = when + seconds * (2 + sched()) * (1.3 - 0.6 * a) + quiet;
            continue;
          }
          const n = sched() < 0.5 ? 1 : sched() < 0.7 ? 2 : 3;
          let last = when, ringFor = 10;
          for (let k = 0; k < n; k++) {
            const i = pool.index(layer);
            const r = eventRand(v.seed, layer, i);
            const t = when + (k ? uni(r, 2, 6) * k : 0);
            const bowl = pick(r, make, pool, t, STRIKE_GAIN * 0.25);
            if (!bowl) continue;
            const mallet = clamp(v.params.tone, 0, 1) * soft;
            pool.reserve(t, bowl.modes.length * 2 + 1);
            strike(v, pool, layer, t, bowl, { angle: r() * Math.PI, mallet, gain: STRIKE_GAIN, pan: uni(r, -0.6, 0.6) });
            last = t; ringFor = Math.max(bowl.modes[0].t60[0], bowl.modes[1].t60[0]);
          }
          next = last + (30 - 10 * a) / 60 * ringFor + quiet;
        }
      },
      stop() { pool.stopLayer(layer, v.ctx.currentTime); },
    };
  };
}
