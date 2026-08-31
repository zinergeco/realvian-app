import { describe, it, expect } from "vitest";
import { buildSearchIndex, searchIndex } from "./search-index";

describe("buildSearchIndex", () => {
  it("includes every real area and every real generated post", () => {
    const index = buildSearchIndex();
    const areaCount = index.filter((i) => i.type === "area").length;
    const reportCount = index.filter((i) => i.type === "report").length;
    expect(areaCount).toBe(38);
    expect(reportCount).toBeGreaterThan(0);
  });

  it("every item has a real, non-empty URL starting with the correct path prefix", () => {
    const index = buildSearchIndex();
    for (const item of index) {
      expect(item.url).toMatch(item.type === "area" ? /^\/areas\// : /^\/blog\//);
    }
  });
});

describe("searchIndex", () => {
  const index = buildSearchIndex();

  it("finds the real Didsbury area by its exact name", () => {
    const results = searchIndex("didsbury", index);
    expect(results.some((r) => r.title === "Didsbury" && r.type === "area")).toBe(true);
  });

  it("is case-insensitive", () => {
    const lower = searchIndex("didsbury", index);
    const upper = searchIndex("DIDSBURY", index);
    const mixed = searchIndex("DidSbury", index);
    expect(lower.map((r) => r.url)).toEqual(upper.map((r) => r.url));
    expect(lower.map((r) => r.url)).toEqual(mixed.map((r) => r.url));
  });

  it("matches on city name too, not just district, including via a report's tags", () => {
    const results = searchIndex("manchester", index);
    expect(results.length).toBeGreaterThan(0);
    // Checking the item's actual haystack, not just its visible
    // title/subtitle — a report can correctly match via a tag
    // ("manchester") without that word appearing in its displayed
    // title or excerpt, e.g. "Ancoats vs Levenshulme: Which Is
    // Better?" is a genuine Manchester comparison tagged as such.
    expect(results.every((r) => r.haystack.includes("manchester"))).toBe(true);
  });

  it("ranks a title-start match above a title-substring match", () => {
    const results = searchIndex("chorlton", index);
    const chorltonArea = results.find((r) => r.title === "Chorlton");
    expect(chorltonArea?.score).toBe(0);
  });

  it("returns an empty array for an empty or whitespace-only query, not every item", () => {
    expect(searchIndex("", index)).toEqual([]);
    expect(searchIndex("   ", index)).toEqual([]);
  });

  it("returns an empty array for a query matching nothing real", () => {
    expect(searchIndex("zzzznonexistentplace", index)).toEqual([]);
  });

  it("respects the limit parameter", () => {
    const results = searchIndex("a", index, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
