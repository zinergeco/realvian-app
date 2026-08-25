import { describe, it, expect } from "vitest";
import { compareRentToArea } from "./rent-comparison";

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
