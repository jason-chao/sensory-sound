// A comfort session: a few short sounds, played one at a time in person, with a word or two
// after each about how it felt. Nothing is sent or stored; the answers live on the closing screen
// until the page is closed.
import { SoundEngine } from "../src/index";
import { mulberry32 } from "../src/prng";
import { footer } from "./footer";

const app = document.getElementById("app")!;

const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
  const e = Object.assign(document.createElement(tag), props) as T; e.append(...kids); return e;
};

// the sounds, every one 40 s; the seeds are fixed so that every listener hears the same thing
const SECONDS = 40;
const FADE_OUT = 2;
const PARAMS = { volume: 1, reverb: 0.4, soften: 0.5, activity: 0.7 };
interface Sound { name: string; seed: number; layers?: Record<string, number>; soundscape?: string; silence?: boolean }
const SOUNDS: Sound[] = [
  { name: "Bronze bowls, struck", seed: 202, layers: { bronze: 0.8 } },
  { name: "A bowl rubbed", seed: 208, layers: { rubbed: 0.8 } },
  { name: "Crystal bowls", seed: 210, layers: { crystal: 0.8 } },
  { name: "Singing bowls soundscape", seed: 204, soundscape: "singing" },
  { name: "Crystal bowls soundscape", seed: 205, soundscape: "crystal" },
  { name: "The older bowls", seed: 206, layers: { bowls: 0.6 } },
  { name: "Silence", seed: 0, silence: true },
];

// a rendered clip, scaled to -23 dBFS RMS with peaks at or below -3 dBFS; null for the silence
interface Clip { buffer: AudioBuffer; gain: number }
const TARGET_RMS = 10 ** (-23 / 20);
const TARGET_PEAK = 10 ** (-3 / 20);
const clips = new Map<number, Promise<Clip | null>>();

const measure = (buffer: AudioBuffer): number => {
  let sum = 0, n = 0, peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); }
    n += d.length;
  }
  const rms = Math.sqrt(sum / Math.max(1, n));
  if (rms === 0 || peak === 0) return 1;
  return Math.min(TARGET_RMS / rms, TARGET_PEAK / peak);
};

const prepare = (which: number): Promise<Clip | null> => {
  const s = SOUNDS[which];
  if (s.silence) return Promise.resolve(null);
  let p = clips.get(which);
  if (!p) {
    p = SoundEngine.render({ seconds: SECONDS, seed: s.seed, sampleRate: 44100, layers: s.layers, soundscape: s.soundscape, params: PARAMS, fadeInSeconds: 2 })
      .then((buffer) => ({ buffer, gain: measure(buffer) }));
    clips.set(which, p);
  }
  return p;
};

// the order, from the session seed
const shuffle = (seed: number): number[] => {
  const r = mulberry32(seed);
  const a = SOUNDS.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// the answers, in play order
interface Answer { which: number; heard: boolean; feel: string; stop: string; note: string }
let order: number[] = [];
let answers: Answer[] = [];
let sessionSeed = 1;
let position = 0;

// audio: one context, created on the first tap; master (volume) then hush, then the speakers
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let hushGain: GainNode | null = null;
let hushed = false;

const volume = el<HTMLInputElement>("input", { type: "range", min: 0, max: 1, step: 0.01, value: 0.25, oninput: () => {
  volumeOut.textContent = volume.value;
  if (ctx && master) master.gain.setTargetAtTime(Number(volume.value), ctx.currentTime, 0.05);
} });
const volumeOut = el("output", { textContent: "0.25" });
const volumeRow = el("label", {}, "Volume", volume, volumeOut);

// for checking from the console or a script
(window as unknown as { comfort: unknown }).comfort = { clips, prepare: (i: number) => prepare(i), audio: () => ({ ctx, master, hushGain }) };

const ensureAudio = () => {
  if (ctx) { void ctx.resume(); return; }
  ctx = new AudioContext({ latencyHint: "playback" });
  master = ctx.createGain(); master.gain.value = Number(volume.value);
  hushGain = ctx.createGain(); hushGain.gain.value = hushed ? 0 : 1;
  master.connect(hushGain); hushGain.connect(ctx.destination);
  void ctx.resume();
};

const applyHush = () => {
  hushBtn.classList.toggle("on", hushed);
  hushBtn.textContent = hushed ? "Hushed. Press to resume" : "Hush";
  if (ctx && hushGain) hushGain.gain.setTargetAtTime(hushed ? 0 : 1, ctx.currentTime, hushed ? 0.03 : 0.15);
};
const hushBtn = el<HTMLButtonElement>("button", { className: "big hush", textContent: "Hush", onclick: () => { hushed = !hushed; applyHush(); } });

// playback of the current sound
interface Playing { startAt: number; source: AudioBufferSourceNode | null; clip: GainNode | null; done: boolean }
let playing: Playing | null = null;
let ticker: ReturnType<typeof setInterval> | undefined;

const stopPlayback = (fade: number) => {
  const p = playing;
  if (!p || !ctx) { playing = null; return; }
  p.done = true;
  if (p.source && p.clip) {
    const now = ctx.currentTime;
    p.clip.gain.cancelScheduledValues(now);
    p.clip.gain.setValueAtTime(p.clip.gain.value, now);
    p.clip.gain.linearRampToValueAtTime(0, now + fade);
    try { p.source.stop(now + fade + 0.05); } catch { /* already stopped */ }
  }
  playing = null;
  clearInterval(ticker);
};

const stopSession = () => {
  hushed = true; applyHush();
  stopPlayback(0.2);
  if (ctx?.state === "suspended") void ctx.resume();
  saveAnswers();
  showClosing();
};
const stopBtn = el<HTMLButtonElement>("button", { className: "wide", textContent: "Stop the session", onclick: stopSession });

// what is on screen
const content = el("div");
const controls = el("div", { className: "controls" });
let savePending: (() => void) | null = null;
const saveAnswers = () => { savePending?.(); savePending = null; };

const show = (...kids: (Node | string)[]) => {
  content.replaceChildren(...kids);
  window.scrollTo(0, 0);
};

function showOpening() {
  const seedInput = el<HTMLInputElement>("input", { type: "number", min: 1, step: 1, value: String(sessionSeed), inputMode: "numeric" });
  const begin = el<HTMLButtonElement>("button", { className: "big", textContent: "Begin", onclick: () => {
    sessionSeed = Math.max(1, Math.floor(Number(seedInput.value) || 1));
    order = shuffle(sessionSeed);
    answers = order.map((which) => ({ which, heard: false, feel: "", stop: "", note: "" }));
    position = 0;
    ensureAudio();
    controls.replaceChildren(volumeRow, hushBtn, stopBtn);
    showSound();
  } });
  controls.replaceChildren(volumeRow, hushBtn);
  show(
    el("h1", { textContent: "A few sounds" }),
    el("p", { textContent: "You will hear a few short sounds, one at a time. After each one, say how it felt. You can stop at any time, for any reason. You do not have to answer anything." }),
    el("p", { textContent: "Set the volume low before you begin." }),
    begin,
    el("label", { className: "text" }, el("span", { className: "quiet", textContent: "Session seed" }), seedInput),
  );
}

function showSound() {
  const which = order[position];
  const title = el("h1", { textContent: `Sound ${position + 1} of ${order.length}` });
  const playBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Preparing", disabled: true });
  const status = el("p", { className: "quiet status", textContent: "Preparing the sound. It will be ready in a moment." });
  const shown = position;
  void prepare(which).then((clip) => {
    if (position !== shown || !content.contains(playBtn)) return;
    playBtn.disabled = false; playBtn.textContent = "Play";
    status.textContent = "Press Play when you are ready.";
    playBtn.onclick = () => startSound(clip);
  }).catch(() => { status.textContent = "This sound could not be prepared. You can skip it."; });
  const skip = el<HTMLButtonElement>("button", { className: "wide", textContent: "Skip", onclick: () => { stopPlayback(0.2); showQuestions(); } });
  show(title, playBtn, status, skip);
}

function startSound(clip: Clip | null) {
  ensureAudio();
  if (!ctx || !master) return;
  answers[position].heard = true;
  const startAt = ctx.currentTime + 0.1;
  let source: AudioBufferSourceNode | null = null, clipGain: GainNode | null = null;
  if (clip) {
    source = ctx.createBufferSource(); source.buffer = clip.buffer;
    clipGain = ctx.createGain();
    clipGain.gain.setValueAtTime(clip.gain, startAt);
    clipGain.gain.setValueAtTime(clip.gain, startAt + SECONDS - FADE_OUT);
    clipGain.gain.linearRampToValueAtTime(0, startAt + SECONDS);
    source.connect(clipGain); clipGain.connect(master);
    source.start(startAt);
    source.stop(startAt + SECONDS);
  }
  const me: Playing = { startAt, source, clip: clipGain, done: false };
  playing = me;
  const finish = () => { if (me.done) return; stopPlayback(0.05); showQuestions(); };
  if (source) source.onended = finish;
  // the next sound can be prepared while this one plays
  if (position + 1 < order.length) void prepare(order[position + 1]);

  const bar = el("div", { className: "meter" }, el("i"));
  const fill = bar.firstChild as HTMLElement;
  const status = el("p", { className: "quiet status", textContent: "Playing." });
  const pauseBtn = el<HTMLButtonElement>("button", { textContent: "Pause", onclick: () => {
    if (!ctx) return;
    if (ctx.state === "running") { void ctx.suspend(); pauseBtn.textContent = "Resume"; status.textContent = "Paused."; }
    else { void ctx.resume(); pauseBtn.textContent = "Pause"; status.textContent = "Playing."; }
  } });
  const skipBtn = el<HTMLButtonElement>("button", { textContent: "Skip", onclick: () => { if (ctx?.state === "suspended") void ctx.resume(); finish(); } });
  clearInterval(ticker);
  ticker = setInterval(() => {
    if (!ctx || me.done) return;
    const elapsed = ctx.currentTime - startAt;
    fill.style.width = `${Math.max(0, Math.min(100, (elapsed / SECONDS) * 100))}%`;
    if (elapsed >= SECONDS + (source ? 0.5 : 0)) finish();
  }, 100);
  show(
    el("h1", { textContent: `Sound ${position + 1} of ${order.length}` }),
    status,
    bar,
    el("div", { className: "row" }, skipBtn, pauseBtn),
  );
}

function showQuestions() {
  const a = answers[position];
  const choiceRow = (options: string[], get: () => string, set: (v: string) => void) => {
    const btns = options.map((o) => el<HTMLButtonElement>("button", { textContent: o, className: get() === o ? "on" : "", onclick: () => {
      set(get() === o ? "" : o);
      btns.forEach((b) => b.classList.toggle("on", get() === b.textContent));
    } }));
    return el("div", { className: "choices" }, ...btns);
  };
  const note = el<HTMLInputElement>("input", { type: "text", value: a.note, autocomplete: "off", enterKeyHint: "done" });
  savePending = () => { a.note = note.value.trim(); };
  const next = el<HTMLButtonElement>("button", { className: "big", textContent: "Next sound", onclick: () => {
    saveAnswers();
    position++;
    if (position < order.length) showSound(); else showClosing();
  } });
  const rest = el<HTMLButtonElement>("button", { className: "wide", textContent: "Take a break", onclick: () => { saveAnswers(); showBreak(); } });
  show(
    el("h1", { textContent: `Sound ${position + 1} of ${order.length}` }),
    el("h2", { textContent: "How did that feel?" }),
    choiceRow(["Comfortable", "Neutral", "Uncomfortable"], () => a.feel, (v) => { a.feel = v; }),
    el("h2", { textContent: "Would you have stopped it if you could?" }),
    choiceRow(["Yes", "No", "Not sure"], () => a.stop, (v) => { a.stop = v; }),
    el("label", { className: "text" }, el("span", { textContent: "Anything to add?" }), note),
    next,
    rest,
  );
}

function showBreak() {
  show(
    el("h1", { textContent: "Taking a break" }),
    el("p", { textContent: "Taking a break. Press Continue when ready." }),
    el("button", { className: "big", textContent: "Continue", onclick: showQuestions }),
  );
}

const resultLines = (): string[][] => [
  ["Sound", "What it was", "How it felt", "Would have stopped", "Note"],
  ...answers.map((a, i) => [String(i + 1), SOUNDS[a.which].name, a.heard ? a.feel || "no answer" : "not heard", a.heard ? a.stop || "no answer" : "", a.note]),
];
const resultText = (): string => [`Session seed\t${sessionSeed}`, ...resultLines().map((r) => r.join("\t"))].join("\n");

function showClosing() {
  stopPlayback(0.2);
  controls.replaceChildren(volumeRow, hushBtn);
  const lines = resultLines();
  const table = el("table", {},
    el("thead", {}, el("tr", {}, ...lines[0].map((c) => el("th", { textContent: c })))),
    el("tbody", {}, ...lines.slice(1).map((r) => el("tr", {}, ...r.map((c) => el("td", { textContent: c }))))),
  );
  const results = el<HTMLTextAreaElement>("textarea", { value: resultText(), spellcheck: false, readOnly: true });
  const copyBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Copy results", onclick: async () => {
    const text = resultText();
    results.value = text;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
    if (!ok) {
      results.focus(); results.select(); results.setSelectionRange(0, text.length);
      try { ok = document.execCommand("copy"); } catch { ok = false; }
    }
    copyBtn.textContent = ok ? "Copied" : "Could not copy: select the text below";
    setTimeout(() => { copyBtn.textContent = "Copy results"; }, 2500);
  } });
  show(
    el("h1", { textContent: "Thank you" }),
    el("p", { textContent: "That is all. Nothing has been sent anywhere; the answers below are only on this screen." }),
    el("div", { className: "scroll" }, table),
    el("p", { className: "quiet", textContent: `Session seed ${sessionSeed}` }),
    copyBtn,
    el("p", { className: "quiet", textContent: "The text below is what Copy results copies. If copying fails, select it here and copy it yourself." }),
    results,
  );
}

app.append(content, controls, footer());
showOpening();
