// Renders every soundscape offline and compares the samples with fixtures captured from an earlier
// version, so that a change to the engine cannot alter an existing soundscape unnoticed.
// Fixtures live in fixtures/ (not in git): 40 s at 22050 Hz, both channels, as raw float32.
// usage: npx vite --port 5174 &  then  node scripts/regress.mjs capture|check [baseUrl]
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
const mode = process.argv[2] ?? "check";
const base = process.argv[3] || "http://localhost:5174/";
const TOL = 1e-4;   // same as scripts/soundcheck.mjs: float rounding, nothing audible
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const scapes = await page.evaluate(() => window.SOUNDSCAPES.map((s) => s.id));
let fail = 0;
for (const id of scapes) {
  const data = await page.evaluate(async (id) => {
    const buf = await window.SoundEngine.render({ seconds: 40, seed: 11, sampleRate: 22050, soundscape: id, params: { activity: 0.8, volume: 0.6, breath: 0.5 }, fadeInSeconds: 1 });
    const out = new Float32Array(buf.length * 2);
    out.set(buf.getChannelData(0), 0); out.set(buf.getChannelData(1), buf.length);
    return Array.from(out);
  }, id);
  const cur = Float32Array.from(data);
  const file = `fixtures/${id}.f32`;
  if (mode === "capture") { writeFileSync(file, Buffer.from(cur.buffer)); console.log(`${id}: captured ${cur.length} samples`); continue; }
  if (!existsSync(file)) { console.log(`${id}: no fixture`); fail++; continue; }
  const ref = new Float32Array(readFileSync(file).buffer.slice(0));
  let m = 0, peak = 0;
  for (let i = 0; i < Math.min(ref.length, cur.length); i++) { m = Math.max(m, Math.abs(ref[i] - cur[i])); peak = Math.max(peak, Math.abs(ref[i])); }
  const ok = ref.length === cur.length && m <= TOL;
  if (!ok) fail++;
  console.log(`${id}: max difference ${m.toExponential(2)} (peak ${peak.toFixed(3)}) ${ok ? "ok" : "CHANGED"}`);
}
await browser.close();
console.log(fail ? "FAIL" : "PASS");
process.exit(fail ? 1 : 0);
