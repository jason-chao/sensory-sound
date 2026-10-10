/** Bowl sessions: a tuned set of bowls played to a score, the way practitioner guides describe a
 *  session (docs/research_notes/.../sessions_in_practice.md). The arc, the combinations and the
 *  tunings are selectable conventions from those guides and approximations of the instruments;
 *  nothing here is a claim about what a session does. */
import { mulberry32, subSeed, type Rand } from "./prng";
import { bronze, crystal, strike, rub, RUB_SOURCES, type Bowl, type BowlPool, type Material } from "./bowls";
import type { VoiceCtx } from "./engine";

export type Note = "C" | "D" | "E" | "F" | "G" | "A" | "B" | "C'";
export const NOTES: Note[] = ["C", "D", "E", "F", "G", "A", "B", "C'"];
const SEMITONES: Record<Note, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, "C'": 12 };

/** The traditional labels practitioners attach to the seven notes, for display only. */
export const NOTE_LABELS: Record<Note, string> = {
  C: "root", D: "sacral", E: "solar plexus", F: "heart", G: "throat", A: "third eye", B: "crown", "C'": "root, an octave up",
};

export interface SetSpec {
  material: Material;
  /** the lowest bowl's octave: C3 is about 131 Hz, C4 about 262 Hz at 440 */
  root: "C3" | "C4";
  /** the pitch standard the set is tuned to; both are sold */
  reference: 440 | 432;
  /** for bronze: how far each bowl may sit from its note, as a fraction (0.03 = ±3 %); 0 for exact */
  spread: number;
  /** add an eighth bowl, C an octave above the root */
  octaveBowl: boolean;
  seed: number;
}

export interface TunedBowl { note: Note; nominal: number; bowl: Bowl }

/** The nominal frequency of a note in a set. */
export function nominal(note: Note, root: "C3" | "C4", reference: 440 | 432): number {
  const c4 = 261.6256 * reference / 440;
  return (root === "C3" ? c4 / 2 : c4) * Math.pow(2, SEMITONES[note] / 12);
}

/** Build a tuned set. Crystal bowls are exact at their note; bronze bowls sit a seeded distance
 *  from it within `spread`, approximating a set sorted from hand-made bowls. The same seed gives
 *  the same set. */
export function makeSet(spec: SetSpec): TunedBowl[] {
  const r = mulberry32(subSeed(spec.seed, "set:" + spec.material));
  const notes = spec.octaveBowl ? NOTES : NOTES.slice(0, 7);
  return notes.map((note) => {
    const f = nominal(note, spec.root, spec.reference);
    const offset = spec.material === "bronze" ? (r() * 2 - 1) * spec.spread : (r(), 0);
    const bowl = spec.material === "bronze" ? bronze(r, f * (1 + offset)) : crystal(r, f);
    return { note, nominal: f, bowl };
  });
}

export type Gesture = "strike" | "rub" | "strikeRub";
export type Combination = "unison" | "fifth" | "third" | "triad" | "any";

export interface Phase {
  name: string;
  /** share of the phase time; shares are normalised */
  share: number;
  notes: Note[];
  /** gestures and their weights; a zero or missing weight is never chosen */
  gestures: Partial<Record<Gesture, number>>;
  /** most bowls audible at once, counting any still above about 30 dB below its peak */
  maxAudible: 1 | 2 | 3;
  combinations: Combination[];
  /** seconds between one gesture's end and the next, drawn uniformly */
  pause: [number, number];
  /** 0..1, how hard and how loud */
  dynamics: number;
  /** which set plays when both are present */
  material?: "bronze" | "crystal" | "alternate";
}

export interface Score {
  id: string;
  label: string;
  blurb: string;
  phases: Phase[];
  /** strike each bowl from the lowest up before the phases */
  opening: boolean;
  /** strike each bowl from the highest down after the phases, then the lowest once more */
  closing: boolean;
}

const all7: Note[] = ["C", "D", "E", "F", "G", "A", "B"];

/** The scores supplied. `arc` follows the five-phase shape and proportions of one practitioner
 *  guide; `ascent` is the plainest form; `single` is for judging one bowl; `free` is the random
 *  layer's behaviour on a tuned set. */
export const SCORES: Score[] = [
  {
    id: "arc", label: "Arc", blurb: "arrival, descent, depth, expansion, return", opening: true, closing: true,
    phases: [
      { name: "arrival", share: 10, notes: ["C", "D", "G"], gestures: { strike: 3, strikeRub: 1 }, maxAudible: 1, combinations: ["unison", "fifth"], pause: [10, 20], dynamics: 0.5, material: "bronze" },
      { name: "descent", share: 15, notes: ["C", "D", "E", "F", "A"], gestures: { strike: 2, rub: 1, strikeRub: 1 }, maxAudible: 2, combinations: ["unison", "third", "fifth", "triad"], pause: [5, 10], dynamics: 0.6, material: "bronze" },
      { name: "depth", share: 15, notes: ["E", "F", "A", "C"], gestures: { rub: 3, strike: 1 }, maxAudible: 3, combinations: ["unison", "third", "fifth", "triad"], pause: [15, 30], dynamics: 0.5, material: "crystal" },
      { name: "expansion", share: 12, notes: ["G", "B", "A", "C", "E", "F"], gestures: { strike: 2, rub: 2 }, maxAudible: 3, combinations: ["third", "fifth", "triad"], pause: [5, 10], dynamics: 0.6, material: "crystal" },
      { name: "return", share: 8, notes: ["C", "E", "G"], gestures: { strike: 3, rub: 1 }, maxAudible: 2, combinations: ["unison", "fifth", "triad"], pause: [10, 20], dynamics: 0.4, material: "bronze" },
    ],
  },
  {
    id: "ascent", label: "Ascent", blurb: "lowest to highest and back, one bowl at a time", opening: false, closing: false,
    phases: [
      { name: "up", share: 1, notes: all7, gestures: { strikeRub: 1 }, maxAudible: 1, combinations: ["unison"], pause: [8, 15], dynamics: 0.5 },
      { name: "down", share: 1, notes: [...all7].reverse(), gestures: { strikeRub: 1 }, maxAudible: 1, combinations: ["unison"], pause: [8, 15], dynamics: 0.45 },
    ],
  },
  {
    id: "single", label: "Single bowl", blurb: "one note, struck and rubbed in turn", opening: false, closing: false,
    phases: [{ name: "single", share: 1, notes: ["C"], gestures: { strike: 1, rub: 1 }, maxAudible: 1, combinations: ["unison"], pause: [10, 20], dynamics: 0.5 }],
  },
  {
    id: "free", label: "Free", blurb: "any bowl, any time, as the layers do", opening: false, closing: false,
    phases: [{ name: "free", share: 1, notes: all7, gestures: { strike: 2, rub: 1, strikeRub: 1 }, maxAudible: 3, combinations: ["any"], pause: [4, 24], dynamics: 0.5, material: "alternate" }],
  },
];

export interface SessionSpec {
  seed: number;
  /** total length in seconds, silences included */
  seconds: number;
  score: string;
  /** which sets are in play */
  material: "bronze" | "crystal" | "both";
  /** with both: let a crystal bowl ring over a bronze one on the same note or its fifth */
  layered: boolean;
  root: "C3" | "C4";
  reference: 440 | 432;
  spread: number;
  octaveBowl: boolean;
  /** the note for the single score, and notes left out of every score */
  note: Note;
  exclude: Note[];
  strikes: boolean;
  rubs: boolean;
  /** overrides the score's limit when set */
  maxAudible?: 1 | 2 | 3;
  /** "score" keeps each phase's combinations; "any" lifts them */
  combinations: "score" | "any";
  opening: boolean;
  closing: boolean;
  /** scales the score's pauses: 0.5 is twice as dense, 2 twice as sparse */
  pauseScale: number;
  /** seconds a rub lasts, as a range */
  rubSeconds: [number, number];
  /** scales the rub's rise and fall depth and its rate */
  depthScale: number;
  rateScale: number;
  stereo: boolean;
  /** 0 padded mallet .. 1 hard striker */
  mallet: number;
  /** 0..1 session loudness */
  loudness: number;
  /** only the named phase, for a preview; seconds then applies to that phase alone */
  onlyPhase?: string;
}

export const DEFAULT_SESSION: SessionSpec = {
  seed: 1, seconds: 600, score: "arc", material: "crystal", layered: false, root: "C4", reference: 440, spread: 0.03, octaveBowl: false,
  note: "C", exclude: [], strikes: true, rubs: true, combinations: "score", opening: true, closing: true, pauseScale: 1,
  rubSeconds: [10, 24], depthScale: 1, rateScale: 1, stereo: true, mallet: 0.3, loudness: 0.6,
};

export interface SessionEvent {
  kind: "phase" | "strike" | "rub" | "end";
  /** session time, seconds */
  at: number;
  phase: string;
  note?: Note;
  material?: Material;
}

export interface SessionState {
  running: boolean;
  hushed: boolean;
  phase: string;
  elapsed: number;
  remaining: number;
  audible: { note: Note; material: Material; gesture: Gesture }[];
}

/** A bowl the session has started and how long it counts as audible. */
interface Sounding { note: Note; material: Material; gesture: Gesture; from: number; until: number }

const uni = (r: Rand, lo: number, hi: number) => lo + (hi - lo) * r();
const OPENING_GAP = 6, CLOSING_GAP = 6, FINAL_SILENCE = 75, LAST_TONE_BEFORE_END = 60;

/** Is this group of notes (what is audible plus the candidate) an allowed combination? */
export function allowed(notes: Note[], combos: Combination[]): boolean {
  if (combos.includes("any") || notes.length <= 1) return true;
  const distinct = [...new Set(notes)];
  if (distinct.length === 1) return combos.includes("unison");
  if (distinct.length === 2) {
    const d = Math.abs(SEMITONES[distinct[0]] - SEMITONES[distinct[1]]);
    if ((d === 7 || d === 12) && combos.includes("fifth")) return true;
    if ((d === 3 || d === 4) && combos.includes("third")) return true;
    return false;
  }
  if (distinct.length === 3 && combos.includes("triad")) {
    const s = distinct.map((n) => SEMITONES[n] % 12).sort((a, b) => a - b);
    const triads = [[0, 4, 7], [2, 5, 9], [4, 7, 11], [5, 9, 0], [7, 11, 2], [9, 0, 4]];   // C E G, D F A, E G B, F A C, G B D, A C E
    return triads.some((t) => [...t].sort((a, b) => a - b).every((x, i) => x === s[i]));
  }
  return false;
}

/** Runs one session on an engine's voice context. Created by the engine; drive it from update(). */
export class Session {
  readonly spec: SessionSpec;
  private readonly score: Score;
  private readonly sets: Partial<Record<Material, TunedBowl[]>> = {};
  private readonly rand: Rand;
  private readonly started: number;
  private shift = 0;                        // seconds the clock has been held by hush
  private pausedAt: number | null = null;
  private next = 0;                         // session time of the next decision
  private plan: { name: string; from: number; to: number; phase: Phase | null }[] = [];
  private planned = 0;
  private sounding: Sounding[] = [];
  private alternate = 0;
  private ended = false;
  private phaseName = "";
  onEvent?: (e: SessionEvent) => void;

  constructor(private readonly v: VoiceCtx, private readonly pool: BowlPool, spec: SessionSpec, now: number) {
    this.spec = { ...spec };
    const score = SCORES.find((s) => s.id === spec.score);
    if (!score) throw new Error(`unknown score ${spec.score}`);
    this.score = score;
    this.rand = mulberry32(subSeed(spec.seed, "session"));
    this.started = now;
    const setSpec = { root: spec.root, reference: spec.reference, spread: spec.spread, octaveBowl: spec.octaveBowl, seed: spec.seed };
    if (spec.material !== "crystal") this.sets.bronze = makeSet({ ...setSpec, material: "bronze" });
    if (spec.material !== "bronze") this.sets.crystal = makeSet({ ...setSpec, material: "crystal" });
    this.layout();
  }

  /** Lay the phases out in session time, with the opening, the closing and the silence at the end. */
  private layout(): void {
    const s = this.spec, notes = this.notesIn();
    let t = 0;
    const phases = s.onlyPhase ? this.score.phases.filter((p) => p.name === s.onlyPhase) : this.score.phases;
    if (!phases.length) throw new Error(`no phase ${s.onlyPhase}`);
    const opening = !s.onlyPhase && s.opening && this.score.opening ? notes.length * OPENING_GAP : 0;
    const closing = !s.onlyPhase && s.closing && this.score.closing ? (notes.length + 1) * CLOSING_GAP : 0;
    const silence = s.onlyPhase ? 10 : FINAL_SILENCE;
    const budget = Math.max(30, s.seconds - opening - closing - silence - (s.onlyPhase ? 0 : LAST_TONE_BEFORE_END));
    const shares = phases.reduce((a, p) => a + p.share, 0);
    if (opening) { this.plan.push({ name: "opening", from: t, to: t + opening, phase: null }); t += opening; }
    for (const p of phases) { const len = budget * p.share / shares; this.plan.push({ name: p.name, from: t, to: t + len, phase: p }); t += len; }
    if (closing) { this.plan.push({ name: "closing", from: t, to: t + closing, phase: null }); t += closing; }
    this.plan.push({ name: "silence", from: t, to: s.seconds, phase: null });
  }

  /** the notes in play, in ascending order */
  private notesIn(): Note[] {
    return NOTES.filter((n) => (n !== "C'" || this.spec.octaveBowl) && !this.spec.exclude.includes(n));
  }

  /** session time now */
  private time(now: number): number { return now - this.started - this.shift; }

  /** Called from the engine's update(). `hushed` holds the clock. */
  update(now: number, lookahead: number, hushed: boolean): void {
    if (this.ended) return;
    if (hushed) { if (this.pausedAt === null) this.pausedAt = now; return; }
    if (this.pausedAt !== null) { this.shift += now - this.pausedAt; this.pausedAt = null; }
    const t = this.time(now);
    this.sounding = this.sounding.filter((x) => x.until > t);
    if (this.next < t - 0.5) this.next = t + 0.5;      // after a stall, skip rather than play late
    while (this.next < t + lookahead) {
      if (this.next >= this.spec.seconds) { this.ended = true; this.emit({ kind: "end", at: this.spec.seconds, phase: "silence" }); return; }
      const seg = this.plan[this.planned];
      if (!seg) { this.ended = true; return; }
      if (this.next >= seg.to) { this.planned++; continue; }
      if (seg.name !== this.phaseName) { this.phaseName = seg.name; this.emit({ kind: "phase", at: this.next, phase: seg.name }); }
      const when = this.started + this.shift + Math.max(this.next, t + 0.05);
      if (seg.name === "opening") this.sequence(seg, when, this.notesIn(), 0.45);
      else if (seg.name === "closing") this.sequence(seg, when, [...this.notesIn()].reverse().concat([this.notesIn()[0]]), 0.35);
      else if (seg.phase) this.step(seg, seg.phase, when);
      else { this.next = seg.to; }
    }
  }

  /** The opening or closing: one strike per bowl, evenly spaced. */
  private sequence(seg: { from: number; to: number }, when: number, notes: Note[], dynamics: number): void {
    const i = Math.round((this.next - seg.from) / OPENING_GAP);
    const note = notes[i];
    if (note === undefined) { this.next = seg.to; return; }
    const material = this.materialFor(undefined);
    const bowl = this.bowl(material, note);
    if (bowl) this.play("strike", bowl, material, when, dynamics, 0);
    this.next = seg.from + (i + 1) * OPENING_GAP;
  }

  /** One decision inside a phase: a gesture on an allowed bowl, or a short wait. */
  private step(seg: { to: number }, p: Phase, when: number): void {
    const s = this.spec, t = this.next;
    const limit = s.maxAudible ?? p.maxAudible;
    const r = this.rand;
    const gestures = (Object.entries(p.gestures) as [Gesture, number][]).filter(([g, w]) => w > 0 && (g === "strike" ? s.strikes : g === "rub" ? s.rubs : s.strikes || s.rubs));
    if (!gestures.length) { this.next = seg.to; return; }
    let gesture = gestures[0][0];
    { const total = gestures.reduce((a, [, w]) => a + w, 0); let x = r() * total; for (const [g, w] of gestures) { x -= w; if (x <= 0) { gesture = g; break; } } }
    if (gesture === "strikeRub" && !s.rubs) gesture = "strike"; else if (gesture === "strikeRub" && !s.strikes) gesture = "rub";
    const combos = s.combinations === "any" ? (["any"] as Combination[]) : p.combinations;
    const audible = this.sounding.map((x) => x.note);
    const candidates = p.notes.filter((n) => this.notesIn().includes(n) || (n === "C" && s.note === "C'"));
    const notes = this.score.id === "single" ? [s.note] : candidates;
    const fits = this.sounding.length < limit ? notes.filter((n) => allowed([...audible, n], combos)) : [];
    if (!fits.length) { this.next = t + 2; return; }           // wait, deterministically, until something fits
    const note = fits[Math.floor(r() * fits.length)];
    const material = this.materialFor(p.material);
    const bowl = this.bowl(material, note);
    if (!bowl) { this.next = t + 2; return; }
    const dyn = p.dynamics * (0.85 + 0.3 * r());
    const length = this.play(gesture, bowl, material, when, dyn, r());
    if (s.layered && s.material === "both" && material === "bronze" && this.sets.crystal && r() < 0.5 && this.sounding.length < limit) {
      const fifth = NOTES.find((n) => SEMITONES[n] === SEMITONES[note] + 7 && this.notesIn().includes(n));
      const over = this.bowl("crystal", r() < 0.5 && fifth ? fifth : note);
      if (over) this.play("rub", over, "crystal", when + 1.5, dyn * 0.8, r());
    }
    this.next = t + length + uni(r, p.pause[0], p.pause[1]) * s.pauseScale;
  }

  private materialFor(pref: Phase["material"]): Material {
    const s = this.spec;
    if (s.material !== "both") return s.material;
    if (pref === "bronze" || pref === "crystal") return pref;
    return (this.alternate++ % 2) ? "crystal" : "bronze";
  }

  private bowl(material: Material, note: Note): TunedBowl | null {
    return this.sets[material]?.find((b) => b.note === note) ?? null;
  }

  /** Play one gesture; returns how long it occupies before the pause. */
  private play(gesture: Gesture, tb: TunedBowl, material: Material, when: number, dynamics: number, pan: number): number {
    const s = this.spec, r = this.rand, q = material === "crystal", bowl = tb.bowl;
    const t = when - this.started - this.shift;
    const gain = 0.1 * (0.5 + 0.5 * dynamics);
    const stereoPan = s.stereo ? pan * 1.2 - 0.6 : 0;
    let length = 0;
    if (gesture === "strike" || gesture === "strikeRub") {
      this.pool.reserve(when, bowl.modes.length * 2 + 1);
      strike(this.v, this.pool, "session", when, bowl, { angle: r() * Math.PI, mallet: s.mallet * (q ? 0.5 : 1), gain, pan: stereoPan });
      const t60 = Math.max(bowl.modes[0].t60[0], bowl.modes[1].t60[0]);
      this.sounding.push({ note: tb.note, material, gesture: "strike", from: t, until: t + t60 / 2 });
      this.emit({ kind: "strike", at: t, phase: this.phaseName, note: tb.note, material });
      length = 1.5;
    }
    if (gesture === "rub" || gesture === "strikeRub") {
      const at = gesture === "strikeRub" ? when + 1.5 : when;
      const seconds = uni(r, s.rubSeconds[0], s.rubSeconds[1]);
      this.pool.reserve(at, RUB_SOURCES);
      rub(this.v, this.pool, "session", at, bowl, {
        seconds, gain: gain * 0.8,
        rate: (q ? uni(r, 0.3, 0.45) : uni(r, 1.0, 2.2) * (0.85 + 0.3 * (1 - bowl.f0 / 600))) * s.rateScale,
        depth: Math.min(1, (q ? 0.45 : uni(r, 0.7, 0.9)) * s.depthScale),
        swell: q ? uni(r, 12, 20) : uni(r, 7, 12),
        stereo: s.stereo,
      });
      const ta = at - this.started - this.shift;
      this.sounding.push({ note: tb.note, material, gesture: "rub", from: ta, until: ta + seconds + bowl.modes[0].t60[0] / 2 });
      this.emit({ kind: "rub", at: ta, phase: this.phaseName, note: tb.note, material });
      length = (at - when) + seconds;
    }
    return length;
  }

  private emit(e: SessionEvent): void { this.onEvent?.(e); }

  state(now: number, hushed: boolean): SessionState {
    const t = this.pausedAt !== null ? this.pausedAt - this.started - this.shift : this.time(now);
    return {
      running: !this.ended, hushed, phase: this.phaseName, elapsed: Math.max(0, t), remaining: Math.max(0, this.spec.seconds - t),
      audible: this.sounding.filter((x) => x.from <= t && x.until > t).map((x) => ({ note: x.note, material: x.material, gesture: x.gesture })),
    };
  }

  /** Stop scheduling; what is sounding rings out (or is hushed by the engine). */
  stop(now: number): void {
    this.ended = true;
    this.pool.stopLayer("session", now);
    this.emit({ kind: "end", at: this.time(now), phase: this.phaseName });
  }

  get done(): boolean { return this.ended; }
}
