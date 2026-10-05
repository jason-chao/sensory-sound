// Browser checks on the real engine, through the playground:
// 1. an offline render is repeatable: the same seed and settings give the same samples (within rounding);
// 2. with every layer at full level and volume at maximum, the output peak stays under the ceiling
//    of the master chain (0.85 of full scale), and the first half second is near silence.
// usage: npx vite --port 5174 &  then  node scripts/soundcheck.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5174/";
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const det = await page.evaluate(async () => {
  // the same seed must give the same sound: samples equal within floating-point rounding
  const maxDiff = (p, q) => { const x = p.getChannelData(0), y = q.getChannelData(0); let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i] - y[i])); return m; };
  const opts = { seconds: 6, seed: 42, soundscape: "temple", sampleRate: 22050, params: { activity: 1, volume: 0.8 } };
  const a = await window.SoundEngine.render(opts), b = await window.SoundEngine.render(opts), c = await window.SoundEngine.render({ ...opts, seed: 43 });
  let peak = 0; const d = a.getChannelData(0); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  return { same: maxDiff(a, b) < 1e-4, differs: maxDiff(a, c) > 1e-2, peak, length: a.length };
});
console.log(`render: deterministic ${det.same}, different seed differs ${det.differs}, peak ${det.peak.toFixed(3)}, samples ${det.length}`);
const live = await page.evaluate(async () => {
  const e = window.engine;
  for (const l of ["drone", "chimes", "bowls", "koto", "ocean", "rain", "wind", "stream", "noise", "pulse", "breath"]) e.setLayer(l, 1);
  e.set({ volume: 1, activity: 1, soften: 0, tone: 1, breath: 0.8 });
  await e.start();
  const t0 = performance.now(); let peak = 0, early = 0;
  while (performance.now() - t0 < 15000) {
    if (Math.random() < 0.2) e.touch(Math.random(), Math.random(), ["bell", "pluck", "pop", "drop", "burst", "split", "thump"][Math.floor(Math.random() * 7)]);
    const p = e.peak(); peak = Math.max(peak, p); if (performance.now() - t0 < 500) early = Math.max(early, p);
    await new Promise((r) => setTimeout(r, 100));
  }
  return { peak, early, state: e.ctx.state };
});
console.log(`live: context ${live.state}; peak in first 0.5 s ${live.early.toFixed(3)}; peak over 15 s at maximum ${live.peak.toFixed(3)}`);
const ok = det.same && det.differs && det.peak > 0.02 && det.peak <= 0.86 && live.state === "running" && live.peak > 0.02 && live.peak <= 0.86 && live.early < 0.2;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
