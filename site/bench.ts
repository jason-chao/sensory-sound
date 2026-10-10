import { SoundEngine, LAYERS, DEFAULT_PARAMS } from "../src/index";
import type { VoiceCtx } from "../src/engine";
import { footer } from "./footer";

const app = document.getElementById("app")!;
const engine = new SoundEngine({ seed: 7, lookahead: 2 });
// for checking from the console or a script
(window as unknown as { engine: SoundEngine }).engine = engine;

const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
  const e = Object.assign(document.createElement(tag), props) as T; e.append(...kids); return e;
};
const section = (title: string, ...kids: (Node | string)[]) => el("section", {}, el("h2", {}, title), ...kids);

// the stages
interface Stage { id: string; label: string; apply(): void }
const calm = () => engine.set({ activity: DEFAULT_PARAMS.activity, reverb: DEFAULT_PARAMS.reverb, tone: DEFAULT_PARAMS.tone, breath: DEFAULT_PARAMS.breath });
const STAGES: Stage[] = [
  { id: "singing", label: "Singing bowls", apply: () => { calm(); engine.applySoundscape("singing"); } },
  { id: "crystal", label: "Crystal bowls", apply: () => { calm(); engine.applySoundscape("crystal"); } },
  { id: "all", label: "Everything at once", apply: () => {
    engine.setLayers(Object.fromEntries(LAYERS.map((l) => [l.id, 1])));
    engine.set({ activity: 1, reverb: 1, tone: 1, breath: 0.8 });
  } },
];
let plan: Stage[] = [STAGES[0]];

// one row every 15 seconds
interface Row {
  t: number; stage: string; visibility: string; state: string;
  peak: number; bowls: number; baseLatency?: number; outputLatency?: number;
  averageLoad?: number; peakLoad?: number; underrunRatio?: number; battery?: number;
}
const COLUMNS: (keyof Row)[] = ["t", "stage", "visibility", "state", "peak", "bowls", "baseLatency", "outputLatency", "averageLoad", "peakLoad", "underrunRatio", "battery"];
const NUMERIC: (keyof Row)[] = ["peak", "bowls", "baseLatency", "outputLatency", "averageLoad", "peakLoad", "underrunRatio", "battery"];
const rows: Row[] = [];

// what the browser offers beyond the standard types
interface RenderCapacity extends EventTarget { start(opts: { updateInterval: number }): void; stop(): void }
interface CapacityUpdate extends Event { averageLoad: number; peakLoad: number; underrunRatio: number }
let load: { averageLoad: number; peakLoad: number; underrunRatio: number } | null = null;
let capacity: RenderCapacity | null = null;
let battery: { level: number } | null = null;
(navigator as unknown as { getBattery?: () => Promise<{ level: number }> }).getBattery?.().then((b) => { battery = b; }).catch(() => { battery = null; });

// vctx is a private field of SoundEngine; this development page reads it through a cast to count the sounding bowls
const bowlsAlive = (): number => {
  const v = (engine as unknown as { vctx?: VoiceCtx }).vctx;
  return v && engine.ctx ? v.bowls.alive(engine.ctx.currentTime) : 0;
};

// run state
let running = false;
let testStart = 0, stageIndex = 0, stageStart = 0;
let visChanges = 0, stateChanges = 0;
let sampler: ReturnType<typeof setInterval> | undefined, ticker: ReturnType<typeof setInterval> | undefined;
let wake: WakeLockSentinel | null = null;
let hushed = false;

const durationMs = () => Math.max(1, Math.floor(Number(duration.value) || 10)) * 60_000;
const fmt = (ms: number) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const num = (v: number | undefined, d = 3) => v === undefined || Number.isNaN(v) ? "" : v.toFixed(d);

// controls
const volume = el<HTMLInputElement>("input", { type: "range", min: 0, max: 1, step: 0.01, value: 0.3, oninput: () => { engine.set({ volume: Number(volume.value) }); volumeOut.textContent = volume.value; } });
const volumeOut = el("output", { textContent: "0.3" });
const duration = el<HTMLInputElement>("input", { type: "number", min: 1, step: 1, value: 10, inputMode: "numeric", onchange: () => { if (Number(duration.value) < 1) duration.value = "1"; showPlan(); } });
const keepOn = el<HTMLInputElement>("input", { type: "checkbox", checked: true, onchange: () => { if (keepOn.checked && running) void keepAwake(); else void wake?.release(); } });

const planBtns = [...STAGES.map((s) => el<HTMLButtonElement>("button", { textContent: s.label, onclick: () => { plan = [s]; showPlan(); } })),
  el<HTMLButtonElement>("button", { textContent: "Run all three", onclick: () => { plan = [...STAGES]; showPlan(); } })];
const planList = el("ol");
const showPlan = () => {
  const chosen = plan.length === STAGES.length ? "all" : plan[0].id;
  planBtns.forEach((b, i) => b.classList.toggle("on", i < STAGES.length ? plan.length === 1 && STAGES[i].id === chosen : chosen === "all"));
  planList.replaceChildren(...plan.map((s) => el("li", { textContent: `${s.label}, ${Math.max(1, Math.floor(Number(duration.value) || 10))} min` })));
};

const startBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Start", onclick: () => void startTest() });
const stopBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Stop test", disabled: true, onclick: () => endTest("stopped early") });
const hushBtn = el("button", { className: "big hush", textContent: "Hush", onclick: () => {
  hushed = !hushed; engine.setStopped(hushed); hushBtn.classList.toggle("on", hushed); hushBtn.textContent = hushed ? "Hushed: press to resume" : "Hush";
} });
const meter = el("div", { className: "meter" }, el("i"));
setInterval(() => { (meter.firstChild as HTMLElement).style.width = `${Math.min(100, engine.peak() * 100)}%`; }, 100);

const status = el("div", { className: "status", textContent: "Not running." });
const showStatus = () => {
  if (!running) return;
  const stage = plan[stageIndex];
  const left = durationMs() - (Date.now() - stageStart);
  const ctxState = engine.ctx?.state ?? "none";
  status.replaceChildren(
    el("div", {}, `Stage ${stageIndex + 1} of ${plan.length}: ${stage.label}`),
    el("div", {}, el("b", { textContent: fmt(left) }), " left in this stage"),
    el("div", { className: "note", textContent: `elapsed ${fmt(Date.now() - testStart)} · audio ${ctxState} · page ${document.visibilityState} · ${rows.length} rows` }),
  );
};

// the table
const thead = el("tr", {}, ...COLUMNS.map((c) => el("th", { textContent: c })));
const tbody = el("tbody");
const table = el("table", {}, el("thead", {}, thead), tbody);

const record = () => {
  const ctx = engine.ctx as AudioContext | null;
  const row: Row = {
    t: Math.round((Date.now() - testStart) / 1000), stage: plan[stageIndex].id,
    visibility: document.visibilityState, state: ctx?.state ?? "none",
    peak: engine.peak(), bowls: bowlsAlive(),
    baseLatency: ctx?.baseLatency, outputLatency: ctx?.outputLatency,
    averageLoad: load?.averageLoad, peakLoad: load?.peakLoad, underrunRatio: load?.underrunRatio,
    battery: battery?.level,
  };
  rows.push(row);
  tbody.append(el("tr", {}, ...COLUMNS.map((c) => el("td", { textContent: typeof row[c] === "number" ? num(row[c] as number, c === "t" || c === "bowls" ? 0 : 3) : String(row[c] ?? "") }))));
  showStatus();
};

async function keepAwake() {
  if (!keepOn.checked || !("wakeLock" in navigator)) return;
  try {
    wake = await navigator.wakeLock.request("screen");
    wake.addEventListener("release", () => { wake = null; });
  } catch { wake = null; }
}

document.addEventListener("visibilitychange", () => {
  if (!running) return;
  visChanges++;
  if (document.visibilityState === "visible") void keepAwake();
  showStatus();
});

const beginStage = (i: number) => {
  stageIndex = i; stageStart = Date.now();
  plan[i].apply();
  record();
};

const tick = () => {
  if (!running) return;
  if (Date.now() - stageStart >= durationMs()) {
    if (stageIndex + 1 < plan.length) beginStage(stageIndex + 1);
    else { endTest("finished"); return; }
  }
  showStatus();
};

async function startTest() {
  if (running) return;
  rows.length = 0; tbody.replaceChildren(); summary.replaceChildren();
  visChanges = 0; stateChanges = 0; load = null;
  startBtn.disabled = true; planBtns.forEach((b) => { b.disabled = true; }); duration.disabled = true;
  await engine.start();
  engine.set({ volume: Number(volume.value) });
  const ctx = engine.ctx as AudioContext;
  ctx.onstatechange = () => { stateChanges++; showStatus(); };
  capacity = (ctx as unknown as { renderCapacity?: RenderCapacity }).renderCapacity ?? null;
  if (capacity) {
    capacity.addEventListener("update", (e) => { const u = e as CapacityUpdate; load = { averageLoad: u.averageLoad, peakLoad: u.peakLoad, underrunRatio: u.underrunRatio }; });
    try { capacity.start({ updateInterval: 1 }); } catch { capacity = null; }
  }
  running = true;
  stopBtn.disabled = false;
  await keepAwake();
  testStart = Date.now();
  beginStage(0);
  sampler = setInterval(record, 15_000);
  ticker = setInterval(tick, 1000);
}

function endTest(how: string) {
  if (!running) return;
  running = false;
  clearInterval(sampler); clearInterval(ticker);
  record();
  try { capacity?.stop(); } catch { /* not every browser lets it stop */ }
  void wake?.release();
  engine.setStopped(true);
  setTimeout(() => { void engine.stop(); hushed = false; hushBtn.classList.remove("on"); hushBtn.textContent = "Hush"; }, 1500);
  status.textContent = `Test ${how} after ${fmt(Date.now() - testStart)}. Results are below.`;
  startBtn.disabled = false; stopBtn.disabled = true; planBtns.forEach((b) => { b.disabled = false; }); duration.disabled = false;
  showSummary(how);
}

// the summary
const summary = el("div");
const heard = el<HTMLTextAreaElement>("textarea", { placeholder: "for example: faint crackle at 3:20 while the screen was locked" });
const results = el<HTMLTextAreaElement>("textarea", { className: "results", spellcheck: false });
const copyBtn = el<HTMLButtonElement>("button", { className: "big", textContent: "Copy results", onclick: () => void copyResults() });

const stats = (): string[] => {
  const lines: string[] = [];
  for (const s of plan) {
    const mine = rows.filter((r) => r.stage === s.id);
    if (!mine.length) continue;
    lines.push(`${s.label} (${mine.length} rows)`);
    for (const c of NUMERIC) {
      const vals = mine.map((r) => r[c]).filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
      if (!vals.length) continue;
      const max = Math.max(...vals), mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      lines.push(`  ${c}: max ${num(max)}, mean ${num(mean)}`);
    }
  }
  return lines;
};

const deviceLines = (how: string): string[] => {
  const ctx = engine.ctx as AudioContext | null;
  return [
    "sensory-sound phone benchmark",
    `date: ${new Date().toISOString()}`,
    `outcome: ${how}`,
    `user agent: ${navigator.userAgent}`,
    `screen: ${screen.width} x ${screen.height}, device pixel ratio ${devicePixelRatio}, cores ${navigator.hardwareConcurrency ?? "unknown"}`,
    `sample rate: ${ctx?.sampleRate ?? sampleRateSeen ?? "unknown"}`,
    `plan: ${plan.map((s) => s.label).join(", ")} at ${Math.max(1, Math.floor(Number(duration.value) || 10))} min each`,
    `keep the screen on: ${keepOn.checked ? "yes" : "no"}`,
    `render capacity available: ${capacity ? "yes" : "no"}`,
    `visibility changes: ${visChanges}`,
    `audio context state changes: ${stateChanges}`,
    `rows: ${rows.length}`,
  ];
};
let sampleRateSeen: number | undefined;

const fullText = (how: string): string => {
  const tsv = [COLUMNS.join("\t"), ...rows.map((r) => COLUMNS.map((c) => typeof r[c] === "number" ? num(r[c] as number, c === "t" || c === "bowls" ? 0 : 4) : String(r[c] ?? "")).join("\t"))];
  return [...deviceLines(how), "", ...stats(), "", "what you heard:", heard.value.trim() || "(nothing written)", "", ...tsv].join("\n");
};

let lastHow = "finished";
function showSummary(how: string) {
  lastHow = how;
  sampleRateSeen = (engine.ctx as AudioContext | null)?.sampleRate ?? sampleRateSeen;
  const refresh = () => { results.value = fullText(lastHow); };
  heard.oninput = refresh;
  refresh();
  summary.replaceChildren(
    el("pre", { textContent: deviceLines(how).join("\n") }),
    el("pre", { textContent: stats().join("\n") || "no rows" }),
    el("h2", { textContent: "What you heard (crackles, gaps, drop-outs, when)" }),
    heard,
    copyBtn,
    el("p", { className: "note", textContent: "The text below is what Copy results copies. If copying fails, select it here and copy it yourself." }),
    results,
  );
}

async function copyResults() {
  const text = fullText(lastHow);
  results.value = text;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = false; }
  if (!ok) {
    results.focus(); results.select(); results.setSelectionRange(0, text.length);
    try { ok = document.execCommand("copy"); } catch { ok = false; }
  }
  copyBtn.textContent = ok ? "Copied" : "Could not copy: select the text below";
  setTimeout(() => { copyBtn.textContent = "Copy results"; }, 2500);
}

app.append(
  section("Test plan",
    el("div", { className: "row" }, ...planBtns),
    planList,
    el("label", {}, "minutes each", duration, el("span")),
    el("label", { className: "check" }, keepOn, "Keep the screen on"),
    el("p", { className: "note", textContent: "To test with the screen locked, untick this and lock the phone once the sound has started. With the screen locked, audio may stop on iOS unless the page is kept in the foreground; if it does, that is itself a result worth recording." }),
  ),
  section("Run",
    startBtn, stopBtn, hushBtn,
    el("label", {}, "volume", volume, volumeOut),
    meter,
    status,
  ),
  section("Rows (every 15 s)", el("div", { className: "scroll" }, table)),
  section("Results", summary),
  footer(),
);
showPlan();
