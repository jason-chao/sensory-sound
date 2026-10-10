import { describe, expect, it } from "vitest";
import { makeSet, nominal, SCORES, NOTES, allowed, DEFAULT_SESSION } from "../src/session";

const cents = (a: number, b: number) => 1200 * Math.log2(a / b);

describe("tuned sets", () => {
  it("crystal bowls sit on their notes within a cent, at both references and octaves", () => {
    for (const reference of [440, 432] as const) for (const root of ["C3", "C4"] as const) {
      const set = makeSet({ material: "crystal", root, reference, spread: 0.03, octaveBowl: true, seed: 3 });
      expect(set.map((b) => b.note)).toEqual(NOTES);
      for (const b of set) expect(Math.abs(cents(b.bowl.modes[0].f, nominal(b.note, root, reference)))).toBeLessThan(1);
    }
    expect(nominal("A", "C4", 440)).toBeCloseTo(440, 1);
    expect(nominal("A", "C4", 432)).toBeCloseTo(432, 1);
    expect(nominal("C", "C3", 440)).toBeCloseTo(130.81, 1);
  });
  it("bronze bowls sit within the spread of their notes, exactly when the spread is 0, and repeat for a seed", () => {
    const a = makeSet({ material: "bronze", root: "C4", reference: 440, spread: 0.03, octaveBowl: false, seed: 9 });
    const b = makeSet({ material: "bronze", root: "C4", reference: 440, spread: 0.03, octaveBowl: false, seed: 9 });
    expect(a).toEqual(b);
    expect(a.length).toBe(7);
    for (const x of a) expect(Math.abs(x.bowl.f0 / x.nominal - 1)).toBeLessThanOrEqual(0.03);
    const exact = makeSet({ material: "bronze", root: "C4", reference: 440, spread: 0, octaveBowl: false, seed: 9 });
    for (const x of exact) expect(Math.abs(cents(x.bowl.modes[0].f, x.nominal))).toBeLessThan(1);
  });
});

describe("scores", () => {
  it("are valid: ids unique, shares positive, notes real, gestures weighted, limits in range", () => {
    expect(new Set(SCORES.map((s) => s.id)).size).toBe(SCORES.length);
    for (const s of SCORES) for (const p of s.phases) {
      expect(p.share).toBeGreaterThan(0);
      for (const n of p.notes) expect(NOTES).toContain(n);
      expect(Object.values(p.gestures).some((w) => (w ?? 0) > 0)).toBe(true);
      expect([1, 2, 3]).toContain(p.maxAudible);
      expect(p.pause[0]).toBeLessThanOrEqual(p.pause[1]);
    }
    expect(SCORES.find((s) => s.id === DEFAULT_SESSION.score)).toBeDefined();
  });
});

describe("combinations", () => {
  it("names the intervals as defined", () => {
    expect(allowed(["C", "G"], ["fifth"])).toBe(true);
    expect(allowed(["C", "C'"], ["fifth"])).toBe(true);     // the octave counts with the open consonances
    expect(allowed(["C", "E"], ["fifth"])).toBe(false);
    expect(allowed(["C", "E"], ["third"])).toBe(true);
    expect(allowed(["D", "F"], ["third"])).toBe(true);
    expect(allowed(["C", "D"], ["third", "fifth", "triad"])).toBe(false);
    expect(allowed(["C", "C"], ["unison"])).toBe(true);
    expect(allowed(["C", "E", "G"], ["triad"])).toBe(true);
    expect(allowed(["D", "F", "A"], ["triad"])).toBe(true);
    expect(allowed(["C", "D", "E"], ["triad"])).toBe(false);
    expect(allowed(["C", "D", "E", "F"], ["triad", "fifth"])).toBe(false);
    expect(allowed(["C", "D", "E", "F"], ["any"])).toBe(true);
  });
});
