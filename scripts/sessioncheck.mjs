// Browser checks on bowl sessions, through the playground:
// 1. the same seed and spec render the same session (within rounding), at 44.1 and 48 kHz;
// 2. a dense session of both materials at full loudness with reverb at maximum stays under the ceiling
//    (0.86), and a sustained-loudness measure (90th percentile of 400 ms RMS) is reported;
// 3. a session ends in silence: the last seconds of a short Arc are at least 40 dB below its middle;
// 4. a bowl in a tuned set sounds on its note (crystal C4: the pair's combined peak within 3 cents; the
//    lower member is exact, its twin sits 0.15 to 0.3 Hz above and pulls the combined peak up slightly);
// 5. live: start, hush (silent within 150 ms, the clock held), resume, stop.
// usage: npx vite --port 5174 &  then  node scripts/sessioncheck.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5174/";
const CEIL = 0.86;
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
const errors = []; page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const r = await page.evaluate(async () => {
  const { SoundEngine } = window;
  const peakOf = (buf, from = 0, to = Infinity) => { let m = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = Math.floor(from * buf.sampleRate); i < Math.min(d.length, to * buf.sampleRate); i++) m = Math.max(m, Math.abs(d[i])); } return m; };
  const maxDiff = (p, q) => { let m = 0; for (let ch = 0; ch < 2; ch++) { const x = p.getChannelData(ch), y = q.getChannelData(ch); for (let i = 0; i < x.length; i++) m = Math.max(m, Math.abs(x[i] - y[i])); } return m; };
  const loud = (buf) => { const d = buf.getChannelData(0), e = buf.getChannelData(1), w = Math.floor(buf.sampleRate * 0.4); const v = []; for (let i = 0; i + w <= d.length; i += w) { let s = 0; for (let j = i; j < i + w; j++) s += (d[j] * d[j] + e[j] * e[j]) / 2; v.push(Math.sqrt(s / w)); } v.sort((a, b) => a - b); return v[Math.floor(v.length * 0.9)]; };
  const render = (spec, seconds, rate, params = {}) => SoundEngine.render({ seconds, seed: 5, sampleRate: rate, layers: {}, params: { volume: 0.6, reverb: 0.4, ...params }, fadeInSeconds: 0.5, setup: (e) => e.startSession(spec) });

  // 1. determinism
  const spec = { seed: 3, seconds: 120, score: "arc", material: "both", layered: true, loudness: 0.8 };
  const det = {};
  for (const rate of [44100, 48000]) { const a = await render(spec, 120, rate), b = await render(spec, 120, rate); det[rate] = { same: maxDiff(a, b), peak: peakOf(a) }; }
  const other = await render({ ...spec, seed: 4 }, 120, 44100);
  det.differs = maxDiff(await render(spec, 120, 44100), other);

  // 2. the ceiling and sustained loudness, dense
  const dense = { seed: 11, seconds: 180, score: "free", material: "both", layered: true, maxAudible: 3, combinations: "any", pauseScale: 0.5, loudness: 1, rubSeconds: [6, 12] };
  const d = await render(dense, 180, 22050, { volume: 1, reverb: 1, soften: 0 });
  const ceiling = { peak: peakOf(d), loud: loud(d) };
  // the calibration reference: the free score at its own pauses, default loudness, the measure.mjs settings
  const normal = await render({ seed: 11, seconds: 180, score: "free", material: "both", layered: true, loudness: 0.6 }, 180, 22050, { volume: 0.25, soften: 0.45, reverb: 0.5, tone: 0.45, activity: 0.4 });
  const sustained = loud(normal);

  // 3. ends in silence
  const short = await render({ seed: 2, seconds: 150, score: "arc", material: "crystal", loudness: 0.8 }, 150, 22050);
  const ending = { lastTen: peakOf(short, 140, 150), middle: peakOf(short, 30, 120) };

  // 4. tuning
  const one = await render({ seed: 1, seconds: 40, score: "single", note: "C", material: "crystal", root: "C4", reference: 440, rubs: false, loudness: 0.8 }, 40, 44100, { reverb: 0 });
  const x = one.getChannelData(0), n = 1 << 20, seg = new Float32Array(n); seg.set(x.subarray(44100 * 4, 44100 * 4 + n));
  // a plain DFT around the expected pitch, 1 Hz steps
  let bestF = 0, bestP = 0; for (let f = 250; f <= 275; f += 0.05) { let re = 0, im = 0; for (let i = 0; i < n; i += 1) { const ph = 2 * Math.PI * f * i / 44100; re += seg[i] * Math.cos(ph); im -= seg[i] * Math.sin(ph); } const p = re * re + im * im; if (p > bestP) { bestP = p; bestF = f; } }
  const tuning = { measured: bestF, nominal: 261.6256, cents: 1200 * Math.log2(bestF / 261.6256) };
  return { det, ceiling, sustained, ending, tuning };
});
console.log(`determinism: 44.1 kHz same ${r.det[44100].same.toExponential(1)}, 48 kHz same ${r.det[48000].same.toExponential(1)}, other seed differs ${r.det.differs.toExponential(1)}, peak ${r.det[44100].peak.toFixed(3)}`);
console.log(`dense session at maximum: peak ${r.ceiling.peak.toFixed(4)} (limit ${CEIL}), loudness ${r.ceiling.loud.toFixed(4)}; free score at default settings: loudness ${r.sustained.toFixed(4)} (soundscapes measure about 0.0124; set CALIBRATION.session so that they match)`);
console.log(`ending: peak in the last 10 s ${r.ending.lastTen.toExponential(2)}, in the middle ${r.ending.middle.toFixed(3)}`);
console.log(`tuning: crystal C4 measured ${r.tuning.measured.toFixed(2)} Hz, ${r.tuning.cents.toFixed(1)} cents from ${r.tuning.nominal}`);
const live = await page.evaluate(async () => {
  const e = window.engine;
  e.set({ volume: 0.6 });
  await e.start();
  e.startSession({ seed: 1, seconds: 120, score: "ascent", material: "bronze", loudness: 1, pauseScale: 0.3 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await wait(9000);
  let peakBefore = 0; for (let i = 0; i < 10; i++) { peakBefore = Math.max(peakBefore, e.peak()); await wait(100); }
  const stateBefore = e.sessionState();
  e.setStopped(true); await wait(300);
  let peakHushed = 0; for (let i = 0; i < 10; i++) { peakHushed = Math.max(peakHushed, e.peak()); await wait(100); }
  await wait(2000);
  const stateHushed = e.sessionState();
  e.setStopped(false); await wait(2000);
  const stateResumed = e.sessionState();
  e.stopSession();
  const after = e.sessionState();
  return { peakBefore, peakHushed, held: stateHushed.elapsed - stateBefore.elapsed, resumed: stateResumed.elapsed - stateHushed.elapsed, after, phase: stateBefore.phase, audible: stateBefore.audible.length };
});
console.log(`live: peak ${live.peakBefore.toFixed(3)} in phase "${live.phase}" with ${live.audible} audible; hushed peak ${live.peakHushed.toExponential(1)}; clock moved ${live.held.toFixed(1)} s while hushed and ${live.resumed.toFixed(1)} s after; state after stop: ${live.after}`);
if (errors.length) console.log("page errors:", errors.join(" | "));
const ok = r.det[44100].same < 1e-4 && r.det[48000].same < 1e-4 && r.det.differs > 1e-2 && r.det[44100].peak > 0.02
  && r.ceiling.peak <= CEIL && r.ceiling.peak > 0.3
  && r.ending.lastTen < r.ending.middle * 0.01 && r.ending.middle > 0.02
  && Math.abs(r.tuning.cents) < 3
  && live.peakBefore > 0.02 && live.peakHushed < live.peakBefore * 0.0316 && Math.abs(live.held) < 0.3 && live.resumed > 1.5 && live.after === null
  && errors.length === 0;
console.log(ok ? "PASS" : "FAIL");
await browser.close();
process.exit(ok ? 0 : 1);
