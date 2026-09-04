import { describe, it, expect } from "vitest";
import { getAllPosts, getPostCities } from "./blog";
import { getAllAreas } from "./areas";

describe("getPostCities", () => {
  const allAreas = getAllAreas();
  const allPosts = getAllPosts();

  it("finds the real city for a city-report post", () => {
    const post = allPosts.find((p) => p.slug === "manchester-property-market-report");
    expect(post).toBeDefined();
    expect(getPostCities(post!, allAreas)).toEqual(["Manchester"]);
  });

  it("finds the real city for a same-city comparison post, even though this works via tags too", () => {
    const post = allPosts.find((p) => p.slug === "didsbury-vs-chorlton");
    expect(post).toBeDefined();
    expect(getPostCities(post!, allAreas)).toEqual(["Manchester"]);
  });

  it("finds real cities for a ranking post, which tags alone cannot do (rankings only carry generic topic tags)", () => {
    const post = allPosts.find((p) => p.slug === "highest-rental-yield-areas-uk");
    expect(post).toBeDefined();
    // Confirms the underlying premise directly: tags carry no city at
    // all for this post, so a tags-only filter would incorrectly
    // exclude it from every city filter.
    expect(post!.tags.some((t) => /^[A-Z]/.test(t) && getAllAreas().some((a) => a.city === t))).toBe(false);

    const cities = getPostCities(post!, allAreas);
    // A UK-wide ranking should reference areas from multiple different
    // cities, not just one.
    expect(cities.length).toBeGreaterThan(1);
    expect(cities).toContain("Leeds"); // the real leader in this ranking, confirmed elsewhere this session
  });

  it("returns an empty array for a post with no real, resolvable area references", () => {
    const fakePost = { areaSlugs: ["not-a-real-slug"] } as Parameters<typeof getPostCities>[0];
    expect(getPostCities(fakePost, allAreas)).toEqual([]);
  });

  it("never returns duplicate cities, even if multiple referenced areas share one", () => {
    // Every post's cities list should have no repeats.
    for (const post of allPosts) {
      const cities = getPostCities(post, allAreas);
      expect(new Set(cities).size).toBe(cities.length);
    }
  });
});
