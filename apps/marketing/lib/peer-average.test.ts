import { describe, it, expect } from "vitest";
import { getAllAreas, getAreaBySlug, getPeerAverage } from "./areas";

describe("getPeerAverage", () => {
  it("uses the city average for a city with enough peers (Manchester has 4)", () => {
    const didsbury = getAreaBySlug("didsbury-m20")!;
    const result = getPeerAverage(didsbury);
    expect(result.label).toBe("Manchester average");
  });

  it("falls back to national average for a city with only one covered area", () => {
    // st-andrews-ky16 is the only area in Fife — confirmed by
    // executing getAllAreas() directly, not assumed. A "city average"
    // here would be mathematically identical to the area itself, so
    // this must fall back rather than show a fake comparison.
    const stAndrews = getAreaBySlug("st-andrews-ky16")!;
    const result = getPeerAverage(stAndrews);
    expect(result.label).toBe("National average");
  });

  it("falls back to national average for Liverpool too, the other single-area city", () => {
    const seftonPark = getAreaBySlug("sefton-park-l17")!;
    const result = getPeerAverage(seftonPark);
    expect(result.label).toBe("National average");
  });

  it("returns one averaged value per real dimension, matching the area's own dimension keys", () => {
    const didsbury = getAreaBySlug("didsbury-m20")!;
    const result = getPeerAverage(didsbury);
    expect(result.dimensions).toHaveLength(didsbury.dimensions.length);
    expect(result.dimensions.map((d) => d.key).sort()).toEqual(
      didsbury.dimensions.map((d) => d.key).sort(),
    );
  });

  it("the city average is a genuine average, not just copying the area's own values", () => {
    // A real, meaningful check: compute Manchester's average by hand
    // from the actual dataset and confirm the function's output
    // matches it exactly, not just "some plausible-looking number".
    const didsbury = getAreaBySlug("didsbury-m20")!;
    const manchesterAreas = getAllAreas().filter((a) => a.city === "Manchester");
    const schoolsKey = didsbury.dimensions[0]!.key;

    const expectedAvg = Math.round(
      manchesterAreas.reduce((sum, a) => sum + a.dimensions.find((d) => d.key === schoolsKey)!.value, 0) /
        manchesterAreas.length,
    );

    const result = getPeerAverage(didsbury);
    expect(result.dimensions.find((d) => d.key === schoolsKey)!.value).toBe(expectedAvg);
  });

  it("every dimension value is a valid 0-100 score, never NaN or out of range", () => {
    // Runs across every real area in the dataset — a good, cheap way
    // to catch a division-by-zero or missing-key edge case that a
    // single hand-picked example might not happen to expose.
    for (const area of getAllAreas()) {
      const result = getPeerAverage(area);
      for (const dim of result.dimensions) {
        expect(Number.isFinite(dim.value)).toBe(true);
        expect(dim.value).toBeGreaterThanOrEqual(0);
        expect(dim.value).toBeLessThanOrEqual(100);
      }
    }
  });
});
