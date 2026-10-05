import { SoundEngine, LAYERS, SCALES, SOUNDSCAPES, DEFAULT_PARAMS, type TouchSound } from "../src/index";

const app = document.getElementById("app")!;
const engine = new SoundEngine({ seed: 7 });
(window as unknown as { engine: SoundEngine; SoundEngine: typeof SoundEngine }).engine = engine;
(window as unknown as { engine: SoundEngine; SoundEngine: typeof SoundEngine }).SoundEngine = SoundEngine;

const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
  const e = Object.assign(document.createElement(tag), props) as T; e.append(...kids); return e;
};
const section = (title: string, ...kids: (Node | string)[]) => el("section", {}, el("h2", {}, title), ...kids);

// transport
const startBtn = el("button", { textContent: "Start", onclick: async () => { await engine.start(); startBtn.classList.add("on"); } });
const stopBtn = el("button", { textContent: "Stop", onclick: async () => { await engine.stop(); startBtn.classList.remove("on"); } });
const meter = el("div", { className: "meter" }, el("i"));
setInterval(() => { (meter.firstChild as HTMLElement).style.width = `${Math.min(100, engine.peak() * 100)}%`; }, 100);

// soundscapes
const scapeBtns = SOUNDSCAPES.map((s) => el("button", { textContent: s.label, title: s.blurb, onclick: () => { engine.applySoundscape(s.id); sync(); } }));

// layers
const layerInputs = new Map<string, HTMLInputElement>();
const layerRows = LAYERS.map((l) => {
  const input = el<HTMLInputElement>("input", { type: "range", min: 0, max: 1, step: 0.01, value: 0, oninput: () => { engine.setLayer(l.id, Number(input.value)); sync(); } });
  layerInputs.set(l.id, input);
  return el("label", { title: l.blurb }, l.label, input, el("output", { textContent: "0" }));
});

// parameters
const paramRows: HTMLElement[] = [];
const numeric: [keyof typeof DEFAULT_PARAMS, number, number, number][] = [["volume", 0, 1, 0.01], ["soften", 0, 1, 0.01], ["reverb", 0, 1, 0.01], ["tone", 0, 1, 0.01], ["activity", 0, 1, 0.01], ["pulseRate", 40, 90, 1], ["root", 0, 11, 1], ["breath", 0, 1, 0.01]];
for (const [key, min, max, step] of numeric) {
  const input = el<HTMLInputElement>("input", { type: "range", min, max, step, value: String(engine.params[key]), oninput: () => { engine.set({ [key]: Number(input.value) }); out.textContent = input.value; } });
  const out = el("output", { textContent: String(engine.params[key]) });
  paramRows.push(el("label", {}, key, input, out));
}
const scaleSel = el<HTMLSelectElement>("select", { onchange: () => engine.set({ scale: scaleSel.value }) });
for (const [id, s] of Object.entries(SCALES)) scaleSel.append(el("option", { value: id, textContent: s.label }));

// touches
const touchBtns = (["bell", "pluck", "pop", "drop", "burst", "split", "thump"] as TouchSound[]).map((k) =>
  el("button", { textContent: k, onclick: () => engine.touch(Math.random(), Math.random(), k) }));

const sync = () => {
  const cur = engine.currentSoundscape();
  scapeBtns.forEach((b, i) => b.classList.toggle("on", SOUNDSCAPES[i].id === cur));
  for (const [id, input] of layerInputs) { const v = engine.levels.get(id) ?? 0; input.value = String(v); (input.nextSibling as HTMLElement).textContent = v.toFixed(2); }
  scaleSel.value = engine.params.scale;
};

app.append(
  section("Transport", el("div", { className: "row" }, startBtn, stopBtn), meter),
  section("Soundscapes", el("div", { className: "row" }, ...scapeBtns)),
  section("Layers", ...layerRows),
  section("Parameters", ...paramRows, el("label", {}, "scale", scaleSel, el("span"))),
  section("Touch sounds", el("div", { className: "row" }, ...touchBtns)),
);
engine.applySoundscape("shore");
sync();
