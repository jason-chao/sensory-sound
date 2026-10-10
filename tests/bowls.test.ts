import { describe, expect, it } from "vitest";
import { BowlPool, bronze, crystal } from "../src/bowls";
import { mulberry32 } from "../src/prng";

describe("bowl models", () => {
  it("the same seed gives the same bowl, another seed a different one", () => {
    const a = bronze(mulberry32(5)), b = bronze(mulberry32(5)), c = bronze(mulberry32(6));
    expect(a).toEqual(b);
    expect(a.f0).not.toBe(c.f0);
  });
  it("bronze follows the measured series and rings for tens of seconds", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const b = bronze(mulberry32(seed));
      expect(b.f0).toBeGreaterThanOrEqual(180); expect(b.f0).toBeLessThanOrEqual(600);
      const ratios = b.modes.map((m) => m.f / b.f0);
      [1, 2.85, 5.46, 8.4, 11.8].forEach((r, i) => { expect(ratios[i]).toBeGreaterThan(r * 0.95); expect(ratios[i]).toBeLessThan(r * 1.05); });
      expect(b.modes[0].t60[0]).toBeGreaterThanOrEqual(19); expect(b.modes[0].t60[0]).toBeLessThanOrEqual(83);
      expect(b.modes[0].split).toBeGreaterThanOrEqual(0.5); expect(b.modes[0].split).toBeLessThanOrEqual(6);
      for (const m of b.modes) expect(m.split).toBeLessThanOrEqual(8);
      // the second partial is loud: within 2 dB below to 4 dB above the fundamental
      expect(b.modes[1].level).toBeGreaterThan(0.79); expect(b.modes[1].level).toBeLessThan(1.59);
    }
  });
  it("crystal is lower, purer and beats slowly", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const c = crystal(mulberry32(seed));
      expect(c.f0).toBeGreaterThanOrEqual(130); expect(c.f0).toBeLessThanOrEqual(350);
      expect(c.modes[1].f / c.f0).toBeCloseTo(2.556, 0);
      expect(c.modes[1].level).toBeLessThan(0.16);          // 16 dB or more down
      expect(c.modes[0].split).toBeLessThanOrEqual(0.3);
    }
  });
});

describe("roughness guard", () => {
  const pool = (steady: number[]) => new BowlPool(64, () => steady);
  it("rejects a tone within a critical band of a steady one, but not a near unison or a distant one", () => {
    expect(pool([320]).rough([300], 0, 0.01)).toBe(true);     // 20 Hz apart at 300 Hz: rough
    expect(pool([305]).rough([300], 0, 0.01)).toBe(false);    // 5 Hz: a slow beat
    expect(pool([500]).rough([300], 0, 0.01)).toBe(false);    // far apart
    expect(pool([]).rough([300, 855], 0, 0.01)).toBe(false);
  });
  it("widens with frequency, as the ear's bands do", () => {
    expect(pool([2100]).rough([2000], 0, 0.01)).toBe(true);   // 100 Hz apart at 2 kHz is still inside a band
    expect(pool([400]).rough([300], 0, 0.01)).toBe(false);    // 100 Hz apart at 300 Hz is not
  });
});
