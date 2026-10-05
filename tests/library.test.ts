import { describe, expect, it } from "vitest";
import { LAYERS, SCALES, SOUNDSCAPES } from "../src/layers";
import { mulberry32, subSeed } from "../src/prng";

describe("catalogue", () => {
  it("every soundscape names only real layers and a real scale, with levels in 0..1", () => {
    const ids = new Set(LAYERS.map((l) => l.id));
    for (const s of SOUNDSCAPES) {
      expect(SCALES[s.scale], s.id).toBeDefined();
      for (const [layer, level] of Object.entries(s.layers)) {
        expect(ids.has(layer), `${s.id}: ${layer}`).toBe(true);
        expect(level).toBeGreaterThan(0); expect(level).toBeLessThanOrEqual(1);
      }
    }
  });
  it("ids are unique", () => {
    expect(new Set(LAYERS.map((l) => l.id)).size).toBe(LAYERS.length);
    expect(new Set(SOUNDSCAPES.map((s) => s.id)).size).toBe(SOUNDSCAPES.length);
  });
  it("scales are ascending semitone steps within an octave", () => {
    for (const s of Object.values(SCALES)) {
      expect(s.steps[0]).toBe(0);
      for (let i = 1; i < s.steps.length; i++) expect(s.steps[i]).toBeGreaterThan(s.steps[i - 1]);
      expect(s.steps[s.steps.length - 1]).toBeLessThan(12);
    }
  });
});

describe("seeded randomness", () => {
  it("repeats for the same seed and differs between labels", () => {
    const a = mulberry32(5), b = mulberry32(5);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(subSeed(5, "audio")).not.toBe(subSeed(5, "other"));
  });
});
