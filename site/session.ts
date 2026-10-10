// A bowl session with every option on screen, for trying them on a phone and saying which to keep.
// Nothing is sent or stored: copy the settings or the results and send them yourself.
import { SoundEngine, SCORES, NOTES, NOTE_LABELS, DEFAULT_SESSION } from "../src/index";
import type { SessionSpec, SessionEvent, SessionState, Note } from "../src/index";
import { footer } from "./footer";

/** the library version, as in package.json */
const LIBRARY = "sensory-sound 0.2.0";

const app = document.getElementById("app")!;
const engine = new SoundEngine({ seed: 7, lookahead: 2 });
// for checking from the console or a script
(window as unknown as { engine: SoundEngine }).engine = engine;

const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
  const e = Object.assign(document.createElement(tag), props) as T; e.append(...kids); return e;
};
const section = (title: string, ...kids: (Node | string)[]) => el("section", {}, el("h2", {}, title), ...kids);
const fmt = (seconds: number) => { const s = Math.max(0, Math.round(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const noteName = (n: Note) => `${n} (${NOTE_LABELS[n]})`;

// the choices on the page; buildSpec() turns them into a SessionSpec
const RUB_RANGES: Record<string, [number, number]> = { short: [6, 12], medium: [10, 24], long: [18, 36] };
const choices = {
  material: DEFAULT_SESSION.material as SessionSpec["material"],
  layered: DEFAULT_SESSION.layered,
  root: DEFAULT_SESSION.root as SessionSpec["root"],
  reference: DEFAULT_SESSION.reference as SessionSpec["reference"],
  octaveBowl: DEFAULT_SESSION.octaveBowl,
  score: DEFAULT_SESSION.score,
  note: DEFAULT_SESSION.note as Note,
  exclude: new Set<Note>(),
  minutes: 10,
  strikes: true, rubs: true,
  maxAudible: undefined as 1 | 2 | 3 | undefined,
  combinations: DEFAULT_SESSION.combinations as SessionSpec["combinations"],
  opening: DEFAULT_SESSION.opening, closing: DEFAULT_SESSION.closing,
  pauseScale: 1, rub: "medium", depthScale: 1, rateScale: 1,
  stereo: true, mallet: DEFAULT_SESSION.mallet, loudness: DEFAULT_SESSION.loudness,
  seed: DEFAULT_SESSION.seed,
  volume: 0.3, reverb: 0.4, soften: 0.45,
};
engine.set({ volume: choices.volume, reverb: choices.reverb, soften: choices.soften });

const notesInPlay = (): Note[] => NOTES.filter((n) => (n !== "C'" || choices.octaveBowl) && !choices.exclude.has(n));

const buildSpec = (): SessionSpec => ({
  ...DEFAULT_SESSION,
  seed: choices.seed, seconds: choices.minutes * 60, score: choices.score,
  material: choices.material, layered: choices.material === "both" && choices.layered,
  root: choices.root, reference: choices.reference, octaveBowl: choices.octaveBowl,
  note: choices.note, exclude: NOTES.filter((n) => choices.exclude.has(n)),
  strikes: choices.strikes, rubs: choices.rubs,
  maxAudible: choices.maxAudible, combinations: choices.combinations,
  opening: choices.opening, closing: choices.closing,
  pauseScale: choices.pauseScale, rubSeconds: RUB_RANGES[choices.rub] ?? RUB_RANGES.medium,
  depthScale: choices.depthScale, rateScale: choices.rateScale,
  stereo: choices.stereo, mallet: choices.mallet, loudness: choices.loudness,
});

const labelLine = (spec: SessionSpec): string => {
  const parts = [
    spec.material, spec.root, String(spec.reference), spec.score, `${Math.round(spec.seconds / 60)}min`,
    spec.strikes && spec.rubs ? "strikes+rubs" : spec.strikes ? "strikes" : "rubs",
    `max:${spec.maxAudible ?? "score"}`, `combos:${spec.combinations}`,
  ];
  if (spec.opening) parts.push("open");
  if (spec.closing) parts.push("close");
  if (spec.layered) parts.push("layered");
  if (spec.octaveBowl) parts.push("octave");
  if (spec.exclude.length) parts.push(`without:${spec.exclude.join(",")}`);
  if (spec.score === "single") parts.push(`note:${spec.note}`);
  if (spec.pauseScale !== 1) parts.push(`pause:x${spec.pauseScale}`);
  if (choices.rub !== "medium") parts.push(`rub:${spec.rubSeconds[0]}-${spec.rubSeconds[1]}s`);
  if (spec.depthScale !== 1) parts.push(`depth:x${spec.depthScale}`);
  if (spec.rateScale !== 1) parts.push(`rate:x${spec.rateScale}`);
  if (!spec.stereo) parts.push("centred");
  parts.push(`mallet:${spec.mallet}`, `loud:${spec.loudness}`, `seed:${spec.seed}`);
  if (spec.onlyPhase) parts.push(`preview:${spec.onlyPhase}`);
  return parts.join(" ");
};

const settingsText = (spec: SessionSpec): string => {
  const full = { ...spec, maxAudible: spec.maxAudible ?? null, onlyPhase: spec.onlyPhase ?? null, volume: choices.volume, reverb: choices.reverb, soften: choices.soften, library: LIBRARY };
  return `${labelLine(spec)}\n${JSON.stringify(full, null, 2)}`;
};

// control helpers
interface Option<T> { value: T; label: string; blurb?: string }
const choiceRow = <T,>(options: Option<T>[], get: () => T, set: (v: T) => void) => {
  const btns = options.map((o) => el<HTMLButtonElement>("button", { onclick: () => { set(o.value); refresh(); changed(); } }, o.label, ...(o.blurb ? [el("small", { textContent: o.blurb })] : [])));
  const refresh = () => btns.forEach((b, i) => b.classList.toggle("on", options[i].value === get()));
  refresh();
  return { node: el("div", { className: "row" }, ...btns), refresh, btns };
};
const check = (text: string, get: () => boolean, set: (v: boolean) => void) => {
  const input = el<HTMLInputElement>("input", { type: "checkbox", checked: get(), onchange: () => { set(input.checked); changed(); } });
  return { node: el("label", { className: "check" }, input, text), input };
};
const slider = (title: string, min: number, max: number, step: number, get: () => number, set: (v: number) => void, ends?: [string, string], show: (v: number) => string = (v) => String(v)) => {
  const out = el("output", { textContent: show(get()) });
  const input = el<HTMLInputElement>("input", { type: "range", min, max, step, value: get(), oninput: () => { set(Number(input.value)); out.textContent = show(get()); changed(); } });
  const kids: Node[] = [el("div", { className: "title" }, el("span", { textContent: title }), out), input];
  if (ends) kids.push(el("div", { className: "ends" }, el("span", { textContent: ends[0] }), el("span", { textContent: ends[1] })));
  return { node: el("div", { className: "ctl" }, ...kids), input };
};
const times = (v: number) => `x${v.toFixed(2).replace(/0$/, "")}`;

// what to refresh when a choice changes
const pending = el("div", { className: "pending" });
const settingsBox = el<HTMLTextAreaElement>("textarea", { className: "results", spellcheck: false, readOnly: true });
function changed() {
  settingsBox.value = settingsText(buildSpec());
  const s = engine.sessionState();
  pending.textContent = s?.running ? "Changes apply to the next start." : "";
  if (!s) drawBowls(notesInPlay());
}

// the set
const material = choiceRow<SessionSpec["material"]>([{ value: "crystal", label: "Crystal" }, { value: "bronze", label: "Bronze" }, { value: "both", label: "Both" }], () => choices.material, (v) => { choices.material = v; layered.node.hidden = v !== "both"; });
const layered = check("Layer crystal over bronze", () => choices.layered, (v) => { choices.layered = v; });
layered.node.hidden = choices.material !== "both";
const root = choiceRow<SessionSpec["root"]>([{ value: "C3", label: "C3", blurb: "large bowls" }, { value: "C4", label: "C4", blurb: "medium bowls" }], () => choices.root, (v) => { choices.root = v; });
const reference = choiceRow<SessionSpec["reference"]>([{ value: 440, label: "440 Hz" }, { value: 432, label: "432 Hz" }], () => choices.reference, (v) => { choices.reference = v; });
const octave = check("Octave bowl: adds C' above the set", () => choices.octaveBowl, (v) => { choices.octaveBowl = v; drawExclude(); });

// the score
const score = choiceRow<string>(SCORES.map((s) => ({ value: s.id, label: s.label, blurb: s.blurb })), () => choices.score, (v) => { choices.score = v; drawPhases(); });
const noteSelect = el<HTMLSelectElement>("select", { onchange: () => { choices.note = noteSelect.value as Note; changed(); } }, ...NOTES.map((n) => el("option", { value: n, textContent: noteName(n) })));
noteSelect.value = choices.note;
const excludeRow = el("div", { className: "row" });
function drawExclude() {
  const notes = choices.octaveBowl ? NOTES : NOTES.slice(0, 7);
  excludeRow.replaceChildren(...notes.map((n) => {
    const b = el<HTMLButtonElement>("button", { textContent: noteName(n), className: choices.exclude.has(n) ? "on" : "" });
    b.onclick = () => { if (choices.exclude.has(n)) choices.exclude.delete(n); else choices.exclude.add(n); b.classList.toggle("on", choices.exclude.has(n)); changed(); };
    return b;
  }));
}
const length = choiceRow<number>([10, 20, 30, 45, 60].map((m) => ({ value: m, label: `${m} min` })), () => choices.minutes, (v) => { choices.minutes = v; });

// the playing
const strikes = check("Strikes", () => choices.strikes, (v) => { choices.strikes = v; gestures(); });
const rubs = check("Rubs", () => choices.rubs, (v) => { choices.rubs = v; gestures(); });
const gestures = () => { strikes.input.disabled = !choices.rubs; rubs.input.disabled = !choices.strikes; };   // never both off
const maxAudible = choiceRow<1 | 2 | 3 | undefined>([{ value: undefined, label: "Score's own" }, { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }], () => choices.maxAudible, (v) => { choices.maxAudible = v; });
const combinations = choiceRow<SessionSpec["combinations"]>([{ value: "score", label: "Score's own" }, { value: "any", label: "Any" }], () => choices.combinations, (v) => { choices.combinations = v; });
const opening = check("Opening sequence: each bowl once, lowest up", () => choices.opening, (v) => { choices.opening = v; });
const closing = check("Closing sequence: each bowl once, highest down", () => choices.closing, (v) => { choices.closing = v; });
const pause = slider("Pause density", 0.5, 2, 0.05, () => choices.pauseScale, (v) => { choices.pauseScale = v; }, ["denser", "sparser"], times);
const rubLength = el<HTMLSelectElement>("select", { onchange: () => { choices.rub = rubLength.value; changed(); } },
  el("option", { value: "short", textContent: "short, 6 to 12 s" }), el("option", { value: "medium", textContent: "medium, 10 to 24 s" }), el("option", { value: "long", textContent: "long, 18 to 36 s" }));
rubLength.value = choices.rub;
const depth = slider("Rub depth", 0.5, 1.3, 0.05, () => choices.depthScale, (v) => { choices.depthScale = v; }, ["shallower", "deeper"], times);
const rate = slider("Rub rate", 0.6, 1.5, 0.05, () => choices.rateScale, (v) => { choices.rateScale = v; }, ["slower", "faster"], times);
const stereo = choiceRow<boolean>([{ value: true, label: "Moving" }, { value: false, label: "Centred" }], () => choices.stereo, (v) => { choices.stereo = v; });
const mallet = slider("Mallet", 0, 1, 0.05, () => choices.mallet, (v) => { choices.mallet = v; }, ["padded", "hard"]);
const loudness = slider("Session loudness", 0.2, 1, 0.05, () => choices.loudness, (v) => { choices.loudness = v; });

// the room, the engine and the seed
const reverb = slider("Room", 0, 1, 0.05, () => choices.reverb, (v) => { choices.reverb = v; engine.set({ reverb: v }); }, ["dry", "wet"]);
const soften = slider("Soften", 0, 1, 0.05, () => choices.soften, (v) => { choices.soften = v; engine.set({ soften: v }); }, ["bright", "soft"]);
const seedInput = el<HTMLInputElement>("input", { type: "number", min: 1, step: 1, value: String(choices.seed), inputMode: "numeric", onchange: () => { choices.seed = Math.max(1, Math.floor(Number(seedInput.value) || 1)); seedInput.value = String(choices.seed); changed(); } });
const newSeed = el<HTMLButtonElement>("button", { textContent: "New seed", onclick: () => { choices.seed = 1 + Math.floor(Math.random() * 999_999); seedInput.value = String(choices.seed); changed(); } });

// running
let hushed = false;
const volume = slider("Volume", 0, 1, 0.01, () => choices.volume, (v) => { choices.volume = v; engine.set({ volume: v }); });
const hushBtn = el<HTMLButtonElement>("button", { className: "big hush", textContent: "Hush", onclick: () => setHush(!hushed) });
const setHush = (on: boolean) => {
  hushed = on; engine.setStopped(hushed);
  hushBtn.classList.toggle("on", hushed); hushBtn.textContent = hushed ? "Hushed: press to resume" : "Hush";
};
const meter = el("div", { className: "meter" }, el("i"));
setInterval(() => { (meter.firstChild as HTMLElement).style.width = `${Math.min(100, engine.peak() * 100)}%`; }, 100);

const phaseSelect = el<HTMLSelectElement>("select");
function drawPhases() {
  const s = SCORES.find((x) => x.id === choices.score) ?? SCORES[0];
  phaseSelect.replaceChildren(...s.phases.map((p) => el("option", { value: p.name, textContent: p.name })));
}
const startBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Start session", onclick: () => void startSession(buildSpec()) });
const stopBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Stop session", disabled: true, onclick: stopSession });
const previewBtn = el<HTMLButtonElement>("button", { className: "wide", textContent: "Preview phase (2 min)", onclick: () => void startSession({ ...buildSpec(), onlyPhase: phaseSelect.value, seconds: 120 }) });

let activeSpec: SessionSpec | null = null;
let ended = false;
async function startSession(spec: SessionSpec) {
  startBtn.disabled = true; previewBtn.disabled = true;
  try {
    await engine.start();
    engine.set({ volume: choices.volume, reverb: choices.reverb, soften: choices.soften });
    if (hushed) setHush(false);
    engine.stopSession();                     // so the old session's end does not land in the new log
    log.replaceChildren(); lines.length = 0;
    activeSpec = spec; ended = false;
    drawBowls(NOTES.filter((n) => (n !== "C'" || spec.octaveBowl) && !spec.exclude.includes(n)));
    engine.startSession(spec);
    settingsBox.value = settingsText(spec);
    pending.textContent = "";
    stopBtn.disabled = false;
  } finally { startBtn.disabled = false; previewBtn.disabled = false; }
  showState();
}
function stopSession() {
  engine.stopSession();
  activeSpec = null; ended = false;
  stopBtn.disabled = true;
  pending.textContent = "";
  drawBowls(notesInPlay());
  showState();
}

// the timeline
const status = el("div", { className: "status", textContent: "No session running." });
const bowls = el("div", { className: "bowls" });
const bowlEls = new Map<Note, HTMLElement>();
function drawBowls(notes: Note[]) {
  bowlEls.clear();
  bowls.replaceChildren(...notes.map((n) => {
    const b = el("div", { className: "bowl" }, el("div", { className: "circle" }), el("b", { textContent: n }), NOTE_LABELS[n]);
    bowlEls.set(n, b);
    return b;
  }));
}
function light(state: SessionState | null) {
  for (const [n, b] of bowlEls) {
    const mine = state?.audible.filter((a) => a.note === n) ?? [];
    const mats = new Set(mine.map((a) => a.material));
    b.className = mine.length ? `bowl lit ${mats.size > 1 ? "both" : [...mats][0]}` : "bowl";
    (b.firstChild as HTMLElement).textContent = mine.length ? (mine.some((a) => a.gesture !== "strike") ? "~" : "•") : "";
  }
}
function showState() {
  const s = engine.sessionState();
  light(s);
  if (!s) { status.textContent = ended ? "Session ended." : "No session running."; return; }
  if (!s.running) { status.replaceChildren(el("div", {}, "Session ended."), el("div", { className: "note", textContent: labelLine(activeSpec ?? buildSpec()) })); return; }
  status.replaceChildren(
    el("div", {}, `Phase: ${s.phase || "about to begin"}${s.hushed ? " (held)" : ""}`),
    el("div", {}, el("b", { textContent: fmt(s.remaining) }), " left", el("span", { className: "note", textContent: ` · ${fmt(s.elapsed)} elapsed` })),
  );
}
setInterval(showState, 250);

const log = el("div", { className: "log" });
const lines: string[][] = [];
engine.onSessionEvent = (e: SessionEvent) => {
  const line = [fmt(e.at), e.phase, e.kind, e.note ?? "", e.material ?? ""];
  lines.push(line);
  if (lines.length > 200) lines.shift();
  log.append(el("div", { textContent: `${line[0].padStart(5)}  ${line[1].padEnd(9)} ${line[2].padEnd(6)} ${line[3].padEnd(2)} ${line[4]}` }));
  while (log.childElementCount > 200) log.firstElementChild?.remove();
  log.scrollTop = log.scrollHeight;
  if (e.kind === "end") { ended = true; stopBtn.disabled = true; }
};

// copying
const heard = el<HTMLTextAreaElement>("textarea", { placeholder: "for example: the rubs are too long; the crystal set sits well over the bronze" });
const results = el<HTMLTextAreaElement>("textarea", { className: "results", spellcheck: false, readOnly: true });
const copySettingsBtn = el<HTMLButtonElement>("button", { className: "wide", textContent: "Copy settings", onclick: () => { changed(); void copy(settingsBox.value, copySettingsBtn, settingsBox, "Copy settings"); } });
const copyResultsBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Copy results", onclick: () => { results.value = resultsText(); void copy(results.value, copyResultsBtn, results, "Copy results"); } });
const resultsText = (): string => [
  settingsText(activeSpec ?? buildSpec()), "",
  "what you heard:", heard.value.trim() || "(nothing written)", "",
  ["time", "phase", "event", "note", "material"].join("\t"), ...lines.map((l) => l.join("\t")),
].join("\n");
heard.oninput = () => { results.value = resultsText(); };

async function copy(text: string, btn: HTMLButtonElement, area: HTMLTextAreaElement, idle: string) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
  if (!ok) {
    area.focus(); area.select(); area.setSelectionRange(0, text.length);
    try { ok = document.execCommand("copy"); } catch { ok = false; }
  }
  btn.textContent = ok ? "Copied" : "Could not copy: select the text and copy it yourself";
  setTimeout(() => { btn.textContent = idle; }, 2500);
}

app.append(
  section("Run",
    startBtn, stopBtn, hushBtn,
    volume.node,
    meter,
    status,
    pending,
    el("label", {}, "preview", phaseSelect, el("span")),
    previewBtn,
    el("p", { className: "note", textContent: "Preview plays the chosen phase alone for two minutes with the current settings." }),
  ),
  section("Now playing",
    bowls,
    el("div", { className: "legend" }, el("span", {}, el("i", { className: "bronze" }), "bronze"), el("span", {}, el("i", { className: "crystal" }), "crystal"), el("span", { textContent: "• struck   ~ rubbed" })),
    log,
  ),
  section("The set",
    el("div", { className: "note", textContent: "Material" }), material.node, layered.node,
    el("div", { className: "note", textContent: "Lowest bowl" }), root.node,
    el("div", { className: "note", textContent: "Tuning reference" }), reference.node,
    el("p", { className: "note", textContent: "Both tunings are sold; no claim is made for either." }),
    octave.node,
  ),
  section("The score",
    score.node,
    el("label", { className: "field" }, el("span", { className: "note", textContent: "Note for the Single bowl score" }), noteSelect),
    el("div", { className: "note", textContent: "Notes to leave out" }), excludeRow,
    el("div", { className: "note", textContent: "Length" }), length.node,
  ),
  section("The playing",
    strikes.node, rubs.node,
    el("div", { className: "note", textContent: "Most bowls at once" }), maxAudible.node,
    el("div", { className: "note", textContent: "Combinations" }), combinations.node,
    opening.node, closing.node,
    pause.node,
    el("label", { className: "field" }, el("span", { className: "note", textContent: "Rub length" }), rubLength),
    depth.node, rate.node,
    el("div", { className: "note", textContent: "Stereo" }), stereo.node,
    mallet.node, loudness.node,
  ),
  section("Room and seed",
    reverb.node, soften.node,
    el("label", {}, "seed", seedInput, newSeed),
  ),
  section("Settings",
    el("p", { className: "note", textContent: "The label line and the JSON below are what Copy settings copies." }),
    copySettingsBtn,
    settingsBox,
  ),
  section("Results",
    el("h2", { textContent: "What you heard" }),
    heard,
    copyResultsBtn,
    el("p", { className: "note", textContent: "The text below is what Copy results copies: the settings, your notes and the event log. If copying fails, select it here and copy it yourself." }),
    results,
  ),
  footer(),
);
drawExclude(); drawPhases(); gestures(); drawBowls(notesInPlay()); changed();
results.value = resultsText();
