// Measures the loudness of every layer at full level and every soundscape, by offline render.
// Loudness here is the 90th percentile of 400 ms RMS windows, which treats steady layers and
// sparse ones (chimes, bowls) alike: it follows the level of the events, not of the gaps.
// usage: npx vite --port 5174 &  then  node scripts/measure.mjs [baseUrl]
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:5174/";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(base);
await page.waitForFunction(() => window.SoundEngine);
const out = await page.evaluate(async () => {
  const { SoundEngine } = window;
  const params = { volume: 0.25, soften: 0.45, reverb: 0.5, tone: 0.45, activity: 0.4 };
  const loud = (buf) => {
    const d = buf.getChannelData(0), e = buf.getChannelData(1), w = Math.floor(buf.sampleRate * 0.4), start = buf.sampleRate * 4;
    const v = [];
    for (let i = start; i + w <= d.length; i += w) { let s = 0; for (let j = i; j < i + w; j++) s += (d[j] * d[j] + e[j] * e[j]) / 2; v.push(Math.sqrt(s / w)); }
    v.sort((a, b) => a - b); return v[Math.floor(v.length * 0.9)];
  };
  const layers = {}, scapes = {};
  for (const id of window.LAYERS.map((l) => l.id)) {
    const buf = await SoundEngine.render({ seconds: 60, seed: 11, sampleRate: 22050, layers: { [id]: 1 }, params: { ...params, breath: 0.5 }, fadeInSeconds: 1 });
    layers[id] = loud(buf);
  }
  for (const id of window.SOUNDSCAPES.map((s) => s.id)) {
    const buf = await SoundEngine.render({ seconds: 60, seed: 11, sampleRate: 22050, soundscape: id, params: { ...params, breath: 0.5 }, fadeInSeconds: 1 });
    scapes[id] = loud(buf);
  }
  return { layers, scapes };
});
console.log(JSON.stringify(out));
await browser.close();
