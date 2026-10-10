import { SoundEngine } from "../src/index";
import type { VoiceCtx } from "../src/engine";
import { mulberry32, newSeed } from "../src/prng";
import * as bowls from "../src/bowls";
import { footer } from "./footer";
import clipData from "./clips.json";

// the reference clips, trimmed from recordings; the audio files are served at the site root as /clips/<id>.mp3
type Kind = "struck-bronze" | "rubbed-bronze" | "struck-crystal" | "rubbed-crystal";
interface Clip { id: string; kind: Kind; title: string; author: string; licence: string; source: string; file: string; start: number; seconds: number; note: string }
const CLIPS = clipData as Clip[];

const KINDS: { id: Kind; label: string; seeds: number[] }[] = [
  { id: "struck-bronze", label: "Struck bronze", seeds: [101, 102, 103] },
  { id: "rubbed-bronze", label: "Rubbed bronze", seeds: [201, 202, 203] },
  { id: "struck-crystal", label: "Struck crystal", seeds: [301, 302, 303] },
  { id: "rubbed-crystal", label: "Rubbed crystal", seeds: [401, 402, 403] },
];
const kindLabel = (k: Kind) => KINDS.find((x) => x.id === k)?.label ?? k;

const SECONDS = 25;
const TARGET_RMS = Math.pow(10, -23 / 20);   // -23 dBFS
const PEAK_CEILING = Math.pow(10, -3 / 20);  // -3 dBFS

const app = document.getElementById("app")!;
const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
  const e = Object.assign(document.createElement(tag), props) as T; e.append(...kids); return e;
};
const section = (title: string, ...kids: (Node | string)[]) => el("section", {}, el("h2", {}, title), ...kids);

// the trials: every synthesised seed of a kind against the reference clips of that kind, in a seeded order
type Side = "A" | "B";
interface Trial { n: number; kind: Kind; seed: number; ref: Clip; synth: Side }
type Real = Side | "cannot tell";
type Prefer = Side | "no preference";
interface Result { trial: Trial; status: "answered" | "skipped" | "unavailable"; real?: Real; prefer?: Prefer; note: string }

const sessionSeed = newSeed();
const rand = mulberry32(sessionSeed);
const trials: Trial[] = (() => {
  const list: Omit<Trial, "n" | "synth">[] = [];
  for (const k of KINDS) {
    const refs = CLIPS.filter((c) => c.kind === k.id);
    if (!refs.length) continue;
    k.seeds.forEach((seed, i) => list.push({ kind: k.id, seed, ref: refs[i % refs.length] }));
  }
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.map((t, i) => ({ ...t, n: i + 1, synth: rand() < 0.5 ? "A" : "B" }));
})();
const results: Result[] = [];

// audio: one context made on the first tap; clip gain -> hush -> master -> speakers
let ac: AudioContext | null = null;
let master: GainNode | null = null;
let hushGain: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let hushed = false;

function audio(): AudioContext {
  if (!ac) {
    ac = new AudioContext();
    master = ac.createGain(); master.gain.value = Number(volume.value);
    hushGain = ac.createGain(); hushGain.gain.value = hushed ? 0 : 1;
    analyser = ac.createAnalyser(); analyser.fftSize = 1024;
    hushGain.connect(master).connect(analyser).connect(ac.destination);
  }
  if (ac.state !== "running") void ac.resume();
  return ac;
}

const peak = (): number => {
  if (!analyser) return 0;
  const d = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(d);
  let m = 0;
  for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
  return m;
};
// for checking from a script
(window as unknown as { ab: unknown }).ab = { peak, context: () => ac, trials };

/** The gain that brings a buffer to -23 dBFS RMS over the whole clip, over all channels, unless
 *  that would push its peak above -3 dBFS, in which case the peak is held there instead. */
function loudnessScale(buffer: AudioBuffer): number {
  let sq = 0, pk = 0, n = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < d.length; i++) { sq += d[i] * d[i]; if (Math.abs(d[i]) > pk) pk = Math.abs(d[i]); }
    n += d.length;
  }
  const rms = n ? Math.sqrt(sq / n) : 0;
  if (!rms || !pk) return 1;
  const s = TARGET_RMS / rms;
  return pk * s > PEAK_CEILING ? PEAK_CEILING / pk : s;
}

interface Prepared { buffer: AudioBuffer; scale: number }
const cache = new Map<string, Promise<Prepared | null>>();

// decoding does not need the playback context, so clips can be prepared before the first tap
const decoder = () => new OfflineAudioContext(1, 1, 44100);

function loadReference(clip: Clip): Promise<Prepared | null> {
  const key = `ref:${clip.id}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch("/" + clip.file);
        if (!res.ok) return null;
        const buffer = await decoder().decodeAudioData(await res.arrayBuffer());
        return { buffer, scale: loudnessScale(buffer) };
      } catch { return null; }
    })();
    cache.set(key, p);
  }
  return p;
}

/** Strike or rub one seeded bowl on the offline engine, 0.2 s in. */
function setupBowl(kind: Kind, seed: number): (e: SoundEngine) => void {
  return (e) => {
    const v = (e as unknown as { vctx: VoiceCtx }).vctx;   // a private field; this test page reaches it through a cast
    const r = mulberry32(seed);
    const crystal = kind.endsWith("crystal");
    const bowl = crystal ? bowls.crystal(r) : bowls.bronze(r);
    if (kind.startsWith("struck")) bowls.strike(v, v.bowls, "ab", 0.2, bowl, { angle: r() * Math.PI, mallet: crystal ? 0.15 : 0.3, gain: 0.1, pan: 0 });
    else if (crystal) bowls.rub(v, v.bowls, "ab", 0.2, bowl, { seconds: 16, rate: 0.3 + r() * 0.2, depth: 0.3, swell: 8 + r() * 7, gain: 0.08 });
    else bowls.rub(v, v.bowls, "ab", 0.2, bowl, { seconds: 14, rate: 1.2 + r() * 1.8, depth: 0.3 + r() * 0.3, swell: 5 + r() * 5, gain: 0.08 });
  };
}

function renderSynth(kind: Kind, seed: number): Promise<Prepared | null> {
  const key = `synth:${kind}:${seed}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      try {
        const buffer = await SoundEngine.render({
          seconds: SECONDS, seed, sampleRate: 44100, layers: {},
          params: { volume: 1, reverb: 0.15, soften: 0.3 }, fadeInSeconds: 0.01,
          setup: setupBowl(kind, seed),
        });
        return { buffer, scale: loudnessScale(buffer) };
      } catch { return null; }
    })();
    cache.set(key, p);
  }
  return p;
}

// playback of the current pair
let current: { trial: Trial; a: Prepared; b: Prepared } | null = null;
let playing: { side: Side; src: AudioBufferSourceNode; gain: GainNode; started: number; seconds: number } | null = null;

function stop(): void {
  if (!playing || !ac) { playing = null; return; }
  const { src, gain } = playing;
  const t = ac.currentTime;
  gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + 0.02);
  try { src.stop(t + 0.03); } catch { /* already stopped */ }
  playing = null;
  showPlaying();
}

function play(side: Side): void {
  if (!current) return;
  const ctx = audio();
  if (!hushGain) return;
  stop();
  const p = side === "A" ? current.a : current.b;
  const gain = ctx.createGain(); gain.gain.value = p.scale;
  const src = ctx.createBufferSource(); src.buffer = p.buffer;
  src.connect(gain).connect(hushGain);
  src.onended = () => { if (playing?.src === src) { playing = null; showPlaying(); } };
  src.start();
  playing = { side, src, gain, started: ctx.currentTime, seconds: p.buffer.duration };
  showPlaying();
}

// controls
const volume = el<HTMLInputElement>("input", { type: "range", min: 0, max: 1, step: 0.01, value: 0.3, oninput: () => {
  volumeOut.textContent = volume.value;
  if (master && ac) master.gain.setTargetAtTime(Number(volume.value), ac.currentTime, 0.02);
} });
const volumeOut = el("output", { textContent: "0.3" });
const hushBtn = el("button", { className: "big hush", textContent: "Hush", onclick: () => {
  hushed = !hushed;
  hushBtn.classList.toggle("on", hushed); hushBtn.textContent = hushed ? "Hushed: press to resume" : "Hush";
  if (hushGain && ac) {
    const t = ac.currentTime, g = hushGain.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(hushed ? 0 : 1, t + (hushed ? 0.025 : 1));
  }
} });

const status = el("div", { className: "status" });
const playA = el<HTMLButtonElement>("button", { textContent: "Play A", disabled: true, onclick: () => play("A") });
const playB = el<HTMLButtonElement>("button", { textContent: "Play B", disabled: true, onclick: () => play("B") });
const meter = el("div", { className: "meter" }, el("i"));
const meterBar = meter.firstChild as HTMLElement;

const showPlaying = () => {
  playA.classList.toggle("on", playing?.side === "A");
  playB.classList.toggle("on", playing?.side === "B");
  if (!playing) meterBar.style.width = "0";
};
setInterval(() => {
  if (playing && ac) meterBar.style.width = `${Math.min(100, 100 * (ac.currentTime - playing.started) / playing.seconds)}%`;
}, 100);

// the questions
const choice = <T extends string>(options: T[], labels: string[], onPick: (v: T) => void) => {
  const btns = options.map((o, i) => el<HTMLButtonElement>("button", { textContent: labels[i], onclick: () => { pick(o); onPick(o); } }));
  const pick = (v: T | null) => btns.forEach((b, i) => b.classList.toggle("on", options[i] === v));
  return { row: el("div", { className: "row" }, ...btns), pick, btns };
};
let real: Real | null = null, prefer: Prefer | null = null;
const realQ = choice<Real>(["A", "B", "cannot tell"], ["A", "B", "Cannot tell"], (v) => { real = v; showNext(); });
const preferQ = choice<Prefer>(["A", "B", "no preference"], ["A", "B", "No preference"], (v) => { prefer = v; showNext(); });
const noteIn = el<HTMLInputElement>("input", { type: "text", placeholder: "optional note", maxLength: 200 });
const nextBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Next", disabled: true, onclick: () => answer() });
const skipBtn = el<HTMLButtonElement>("button", { textContent: "Skip", onclick: () => skip() });
const continueBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Continue", onclick: () => advance() });
const questions = el("div", {},
  el("h3", { textContent: "Which sounds more like a real singing bowl?" }), realQ.row,
  el("h3", { textContent: "Which would you rather listen to?" }), preferQ.row,
  el("h3", { textContent: "Note" }), noteIn,
  nextBtn,
);
const reveal = el("div", { className: "reveal" });
const showNext = () => { nextBtn.disabled = !(real && prefer); };

const setQuestions = (on: boolean) => {
  [...realQ.btns, ...preferQ.btns].forEach((b) => { b.disabled = !on; });
  noteIn.disabled = !on;
  nextBtn.disabled = !on || !(real && prefer);
};

// moving through the trials
let index = 0;
let token = 0;
const trialBox = el("div");

function describeRef(c: Clip): HTMLElement {
  return el("span", {}, `${c.title} by ${c.author}, ${c.licence}, `, el("a", { href: c.source, target: "_blank", rel: "noopener noreferrer", textContent: "source" }), c.note ? ` (${c.note})` : "");
}

async function begin(i: number): Promise<void> {
  stop();
  current = null;
  real = null; prefer = null; noteIn.value = "";
  realQ.pick(null); preferQ.pick(null);
  playA.disabled = true; playB.disabled = true;
  reveal.replaceChildren(); reveal.hidden = true;
  questions.hidden = false; continueBtn.hidden = true; skipBtn.hidden = false;
  setQuestions(false);
  if (i >= trials.length) { finish(); return; }
  const t = trials[i];
  const my = ++token;
  status.replaceChildren(el("div", {}, el("b", { textContent: `Trial ${t.n} of ${trials.length}` })), el("div", { className: "note", textContent: "Preparing the two clips." }));
  const [synth, ref] = await Promise.all([renderSynth(t.kind, t.seed), loadReference(t.ref)]);
  if (my !== token) return;
  if (!synth || !ref) {
    status.replaceChildren(el("div", {}, el("b", { textContent: `Trial ${t.n} of ${trials.length}` })), el("div", { className: "note", textContent: `Clip not available${ref ? "" : ` (${t.ref.id})`}. Skipping this trial.` }));
    results.push({ trial: t, status: "unavailable", note: "" });
    skipBtn.hidden = true;
    setTimeout(() => { if (my === token) { index = i + 1; void begin(index); } }, 1500);
    return;
  }
  current = { trial: t, a: t.synth === "A" ? synth : ref, b: t.synth === "B" ? synth : ref };
  status.replaceChildren(el("div", {}, el("b", { textContent: `Trial ${t.n} of ${trials.length}` })), el("div", { className: "note", textContent: `${kindLabel(t.kind)}. Play each as often as you like, then answer.` }));
  playA.disabled = false; playB.disabled = false;
  setQuestions(true);
}

function answer(): void {
  if (!current || !real || !prefer) return;
  const t = current.trial;
  results.push({ trial: t, status: "answered", real, prefer, note: noteIn.value.trim() });
  const other: Side = t.synth === "A" ? "B" : "A";
  reveal.replaceChildren(
    el("div", {}, el("b", { textContent: `${t.synth} was the synthesised bowl` }), ` (${kindLabel(t.kind)}, seed ${t.seed}).`),
    el("div", {}, `${other} was a recording: `, describeRef(t.ref)),
  );
  reveal.hidden = false;
  questions.hidden = true; skipBtn.hidden = true; continueBtn.hidden = false;
}

function skip(): void {
  if (index >= trials.length) return;
  results.push({ trial: trials[index], status: "skipped", note: noteIn.value.trim() });
  advance();
}

function advance(): void {
  index++;
  void begin(index);
}

// the end: a summary, the results to copy, and the credits
const summary = el("div");
const resultsBox = el<HTMLTextAreaElement>("textarea", { className: "results", spellcheck: false, readOnly: true });
const copyBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Copy results", onclick: () => void copyResults() });
const credits = el("div");

interface Totals { kind: Kind; answered: number; synthReal: number; cannotTell: number; synthPreferred: number; noPreference: number }
const totals = (): Totals[] => KINDS.map((k) => {
  const mine = results.filter((r) => r.trial.kind === k.id && r.status === "answered");
  return {
    kind: k.id, answered: mine.length,
    synthReal: mine.filter((r) => r.real === r.trial.synth).length,
    cannotTell: mine.filter((r) => r.real === "cannot tell").length,
    synthPreferred: mine.filter((r) => r.prefer === r.trial.synth).length,
    noPreference: mine.filter((r) => r.prefer === "no preference").length,
  };
}).filter((t) => results.some((r) => r.trial.kind === t.kind));

const COLUMNS = ["trial", "kind", "seed", "synthesised", "reference", "status", "more real", "preferred", "note"];
const rowOf = (r: Result): string[] => [
  String(r.trial.n), r.trial.kind, String(r.trial.seed), r.trial.synth, r.trial.ref.id, r.status,
  r.real ?? "", r.prefer ?? "", r.note.replace(/[\t\n\r]+/g, " "),
];

const fullText = (): string => {
  const head = [
    "sensory-sound blind listening test",
    `date: ${new Date().toISOString()}`,
    `session seed: ${sessionSeed}`,
    `sample rate: ${ac?.sampleRate ?? "unknown"}`,
    `user agent: ${navigator.userAgent}`,
    `trials: ${trials.length}, answered ${results.filter((r) => r.status === "answered").length}, skipped ${results.filter((r) => r.status === "skipped").length}, unavailable ${results.filter((r) => r.status === "unavailable").length}`,
  ];
  const tot = ["kind\tanswered\tsynthesised judged more real\tcannot tell\tsynthesised preferred\tno preference",
    ...totals().map((t) => [t.kind, t.answered, t.synthReal, t.cannotTell, t.synthPreferred, t.noPreference].join("\t"))];
  return [...head, "", ...tot, "", COLUMNS.join("\t"), ...results.map((r) => rowOf(r).join("\t"))].join("\n");
};

function finish(): void {
  status.replaceChildren(el("div", {}, el("b", { textContent: "Finished" })), el("div", { className: "note", textContent: `${results.filter((r) => r.status === "answered").length} of ${trials.length} trials answered. The results are below.` }));
  skipBtn.hidden = true; questions.hidden = true;
  resultsBox.value = fullText();
  const table = el("table", {},
    el("thead", {}, el("tr", {}, ...COLUMNS.map((c) => el("th", { textContent: c })))),
    el("tbody", {}, ...results.map((r) => el("tr", {}, ...rowOf(r).map((v) => el("td", { textContent: v }))))),
  );
  const totalRows = totals().map((t) => el("li", {}, `${kindLabel(t.kind)}: ${t.answered} answered; the synthesised bowl was judged more real ${t.synthReal} times (cannot tell ${t.cannotTell}) and preferred ${t.synthPreferred} times (no preference ${t.noPreference}).`));
  summary.replaceChildren(
    el("div", { className: "scroll" }, table),
    el("h3", { textContent: "Totals" }),
    totalRows.length ? el("ul", {}, ...totalRows) : el("p", { className: "note", textContent: "No trials were answered." }),
    copyBtn,
    el("p", { className: "note", textContent: "The text below is what Copy results copies. If copying fails, select it here and copy it yourself." }),
    resultsBox,
  );
  const used = [...new Map(results.map((r) => [r.trial.ref.id, r.trial.ref])).values()];
  credits.replaceChildren(
    el("ul", {}, ...used.map((c) => el("li", {}, describeRef(c)))),
    el("p", { className: "note", textContent: "The trimmed clips are shared under the same licences as their sources." }),
  );
  summarySection.hidden = false; creditsSection.hidden = false;
}

async function copyResults(): Promise<void> {
  const text = fullText();
  resultsBox.value = text;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
  if (!ok) {
    resultsBox.focus(); resultsBox.select(); resultsBox.setSelectionRange(0, text.length);
    try { ok = document.execCommand("copy"); } catch { ok = false; }
  }
  copyBtn.textContent = ok ? "Copied" : "Could not copy: select the text below";
  setTimeout(() => { copyBtn.textContent = "Copy results"; }, 2500);
}

const summarySection = section("Results", summary);
const creditsSection = section("Recordings used", credits);
summarySection.hidden = true; creditsSection.hidden = true;

trialBox.append(
  status,
  el("div", { className: "pair" }, playA, playB),
  meter,
  questions,
  reveal,
  continueBtn,
  el("div", { className: "row" }, skipBtn),
);
continueBtn.hidden = true; reveal.hidden = true;

app.append(
  section("Sound", hushBtn, el("label", {}, "volume", volume, volumeOut)),
  section("Trial", trialBox),
  summarySection,
  creditsSection,
  footer(),
);

if (!trials.length) status.replaceChildren(el("div", {}, el("b", { textContent: "No trials" })), el("div", { className: "note", textContent: "There are no reference clips to test against." }));
else void begin(0);
