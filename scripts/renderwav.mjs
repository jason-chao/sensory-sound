// Renders a soundscape or a set of layers offline and writes a 16-bit stereo WAV, for listening
// and for measuring with the analysis scripts.
// usage: npx vite --port 5174 &  then  node scripts/renderwav.mjs out.wav seconds '{"soundscape":"singing"}' [seed] [baseUrl]
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const [out, secs, json, seedArg, baseArg] = process.argv.slice(2);
const base = baseArg || "http://localhost:5174/";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const rate = 44100;
const data = await page.evaluate(async ({ secs, json, seed, rate }) => {
  const opts = JSON.parse(json);
  const buf = await window.SoundEngine.render({ seconds: Number(secs), seed, sampleRate: rate, fadeInSeconds: 0.5, ...opts });
  const l = buf.getChannelData(0), r = buf.getChannelData(1), n = buf.length;
  const pcm = new Int16Array(n * 2);
  let peak = 0;
  for (let i = 0; i < n; i++) { peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i])); pcm[2 * i] = Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))); pcm[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))); }
  return { pcm: Array.from(pcm), peak };
}, { secs, json, seed: Number(seedArg ?? 11), rate });
const pcm = Int16Array.from(data.pcm);
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.byteLength, 4); header.write("WAVE", 8);
header.write("fmt ", 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(2, 22);
header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 4, 28); header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
header.write("data", 36); header.writeUInt32LE(pcm.byteLength, 40);
writeFileSync(out, Buffer.concat([header, Buffer.from(pcm.buffer)]));
console.log(`${out}: ${secs} s, peak ${data.peak.toFixed(3)}${errors.length ? `, ERRORS: ${errors.join(" | ")}` : ""}`);
await browser.close();
