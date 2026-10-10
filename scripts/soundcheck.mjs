// Browser checks on the real engine, through the playground:
// 1. an offline render is repeatable: the same seed and settings give the same samples (within rounding);
// 2. the ceiling: with every layer at full level, volume, reverb and brightness at maximum, sixteen
//    bowls struck at once and a bowl rubbed on top, both channels of the rendered output stay under
//    the master chain's ceiling: the clip curve peaks at 0.85, and its oversampling can overshoot by
//    under 1 %, so the limit is 0.86;
// 3. the hush: after setStopped(true) the output is 30 dB down within 150 ms and 50 dB down within
//    half a second, with no new sharp edge;
// 4. live: the same maximum settings through a real AudioContext, with touches, stay under the ceiling,
//    and the first half second is near silence.
// usage: npx vite --port 5174 &  then  node scripts/soundcheck.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5174/";
const CEIL = 0.86;
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const r = await page.evaluate(async () => {
  const { SoundEngine, LAYERS, CALIBRATION, bowls, mulberry32 } = window;
  const peakOf = (buf, from = 0, to = Infinity) => { let m = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = Math.floor(from * buf.sampleRate); i < Math.min(d.length, to * buf.sampleRate); i++) m = Math.max(m, Math.abs(d[i])); } return m; };
  const edgeOf = (buf, from, to) => { let m = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = Math.floor(from * buf.sampleRate) + 1; i < Math.min(d.length, to * buf.sampleRate); i++) m = Math.max(m, Math.abs(d[i] - d[i - 1])); } return m; };
  const maxDiff = (p, q) => { const x = p.getChannelData(0), y = q.getChannelData(0); let m = 0; for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i] - y[i])); return m; };
  const all = Object.fromEntries(LAYERS.map((l) => [l.id, 1]));
  const loud = { volume: 1, activity: 1, soften: 0, tone: 1, reverb: 1, breath: 0.8 };

  // 1. determinism, on the new soundscape as well as an old one
  const det = {};
  for (const sc of ["temple", "singing"]) {
    const opts = { seconds: 6, seed: 42, soundscape: sc, sampleRate: 22050, params: { activity: 1, volume: 0.8 } };
    const a = await SoundEngine.render(opts), b = await SoundEngine.render(opts), c = await SoundEngine.render({ ...opts, seed: 43 });
    det[sc] = { same: maxDiff(a, b), differs: maxDiff(a, c), peak: peakOf(a) };
  }

  // 2. the ceiling under the worst load
  const stress = (e) => {
    const v = e.vctx, r = mulberry32(99), when = 1.0;
    for (let i = 0; i < 16; i++) bowls.strike(v, v.bowls, "stress", when + i * 0.005, bowls.bronze(r), { angle: r() * Math.PI, mallet: 1, gain: 0.1 * CALIBRATION.bronze, pan: i % 2 ? 0.9 : -0.9 });
    bowls.rub(v, v.bowls, "stress", 0.5, bowls.bronze(r), { seconds: 6, rate: 3, depth: 0.9, swell: 1, gain: 0.08 * CALIBRATION.rubbed });
    for (let i = 0; i < 6; i++) e.touch(i / 6, 0.8, ["bell", "pluck", "pop", "drop", "burst", "split", "thump"][i]);
  };
  const s = await SoundEngine.render({ seconds: 8, seed: 5, sampleRate: 22050, layers: all, params: loud, fadeInSeconds: 0.1, setup: stress });
  const ceiling = { peak: peakOf(s), alive: 0 };

  // 3. the hush
  const h = await SoundEngine.render({ seconds: 5, seed: 5, sampleRate: 22050, layers: all, params: loud, fadeInSeconds: 0.1, setup: (e) => { const ctx = e.ctx; void ctx.suspend(2.025).then(() => { e.setStopped(true); void ctx.resume(); }); stress(e); } });
  const hush = { before: peakOf(h, 1.5, 2.0), after150: peakOf(h, 2.175, 2.525), after500: peakOf(h, 2.525, 5), edgeBefore: edgeOf(h, 1.5, 2.025), edgeAfter: edgeOf(h, 2.025, 2.5) };
  return { det, ceiling, hush };
});
for (const [sc, d] of Object.entries(r.det)) console.log(`render ${sc}: same seed differs by ${d.same.toExponential(1)}, other seed by ${d.differs.toExponential(1)}, peak ${d.peak.toFixed(3)}`);
console.log(`ceiling under stress: peak ${r.ceiling.peak.toFixed(4)} (limit ${CEIL})`);
const dB = (x) => (20 * Math.log10(x / r.hush.before)).toFixed(1);
console.log(`hush: peak before ${r.hush.before.toFixed(3)}; after 150 ms ${dB(r.hush.after150)} dB, after 500 ms ${dB(r.hush.after500)} dB; sharpest edge before ${r.hush.edgeBefore.toFixed(3)}, during the fade ${r.hush.edgeAfter.toFixed(3)}`);
const live = await page.evaluate(async () => {
  const e = window.engine;
  for (const l of window.LAYERS) e.setLayer(l.id, 1);
  e.set({ volume: 1, activity: 1, soften: 0, tone: 1, reverb: 1, breath: 0.8 });
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
if (errors.length) console.log("page errors:", errors.join(" | "));
const ok = Object.values(r.det).every((d) => d.same < 1e-4 && d.differs > 1e-2 && d.peak > 0.02)
  && r.ceiling.peak <= CEIL && r.ceiling.peak > 0.5
  && r.hush.before > 0.05 && r.hush.after150 < r.hush.before * 0.0316 && r.hush.after500 < r.hush.before * 0.00316 && r.hush.edgeAfter <= r.hush.edgeBefore
  && live.state === "running" && live.peak > 0.02 && live.peak <= CEIL && live.early < 0.2 && errors.length === 0;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
