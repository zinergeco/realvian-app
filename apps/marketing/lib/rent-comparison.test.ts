import { describe, it, expect } from "vitest";
import { compareRentToArea, computePortfolioRentPoints } from "./rent-comparison";

describe("compareRentToArea", () => {
  // Didsbury (M20)'s avgRent of £1,450 and this exact +10% result were
  // both confirmed against the live production API and the live UI
  // earlier this session (a landlord test property at £1,595/month
  // showed "+10% (£1,450 avg)" on the real site). This test locks that
  // verified behaviour in rather than trusting it stays correct.
  it("matches the live-verified +10% result for Didsbury (M20) at £1,595", () => {
    const result = compareRentToArea("M20", 1595);
    expect(result).not.toBeNull();
    expect(result!.areaAvgRent).toBe(1450);
    expect(result!.diffPct).toBe(10);
  });

  it("returns a negative diffPct when rent is below the area average", () => {
    const result = compareRentToArea("M20", 1305); // 10% below 1450
    expect(result!.diffPct).toBe(-10);
  });

  it("returns null when no rent is set, rather than showing a misleading 0%", () => {
    expect(compareRentToArea("M20", null)).toBeNull();
  });

  it("returns null for a zero or negative rent", () => {
    expect(compareRentToArea("M20", 0)).toBeNull();
    expect(compareRentToArea("M20", -100)).toBeNull();
  });

  it("returns null for an outcode Realvian doesn't cover, rather than a fabricated comparison", () => {
    expect(compareRentToArea("ZZ99", 1000)).toBeNull();
  });

  it("returns null when no outcode is given", () => {
    expect(compareRentToArea(null, 1000)).toBeNull();
  });
});

describe("computePortfolioRentPoints", () => {
  it("includes only properties with a real comparison, silently dropping the rest", () => {
    const properties = [
      { nickname: "Didsbury flat", outcode: "M20", currentRent: 1595 }, // real, valid
      { nickname: "No rent set", outcode: "M20", currentRent: null }, // dropped: no rent
      { nickname: "No outcode", outcode: null, currentRent: 1000 }, // dropped: no outcode
      { nickname: "Uncovered area", outcode: "ZZ99", currentRent: 1000 }, // dropped: not a real area
    ];
    const points = computePortfolioRentPoints(properties);
    expect(points).toHaveLength(1);
    expect(points[0]!.nickname).toBe("Didsbury flat");
  });

  it("matches the exact live-verified +10% figure for the same Didsbury case used elsewhere this session", () => {
    // Same reference case as compareRentToArea's own test above —
    // confirmed live against the real production site and database
    // earlier this session (a landlord test property at £1,595/month
    // showed exactly "+10% (£1,450 avg)" on the real UI).
    const points = computePortfolioRentPoints([
      { nickname: "Test property", outcode: "M20", currentRent: 1595 },
    ]);
    expect(points[0]).toEqual({
      nickname: "Test property",
      diffPct: 10,
      currentRent: 1595,
      areaAvgRent: 1450,
    });
  });

  it("preserves order and handles a mix of above- and below-average properties correctly", () => {
    const points = computePortfolioRentPoints([
      { nickname: "Above average", outcode: "M20", currentRent: 1595 }, // +10%
      { nickname: "Below average", outcode: "M20", currentRent: 1305 }, // -10%
    ]);
    expect(points).toHaveLength(2);
    expect(points[0]!.diffPct).toBeGreaterThan(0);
    expect(points[1]!.diffPct).toBeLessThan(0);
  });

  it("returns an empty array for an empty portfolio, not a crash", () => {
    expect(computePortfolioRentPoints([])).toEqual([]);
  });
});
