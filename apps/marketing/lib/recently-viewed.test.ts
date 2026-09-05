import { describe, it, expect } from "vitest";
import { addRecentView, type RecentAreaEntry } from "./recently-viewed";

const entry = (slug: string) => ({
  slug,
  district: slug,
  city: "Manchester",
  outcode: "M20",
  realvianScore: 87,
});

describe("addRecentView", () => {
  it("adds a new entry to the front of the list", () => {
    const result = addRecentView([], entry("didsbury-m20"));
    expect(result).toHaveLength(1);
    expect(result[0]!.slug).toBe("didsbury-m20");
  });

  it("moves a re-viewed area to the front rather than duplicating it", () => {
    const existing: RecentAreaEntry[] = [
      { ...entry("chorlton-m21"), viewedAt: "2026-01-01T00:00:00.000Z" },
      { ...entry("didsbury-m20"), viewedAt: "2026-01-01T00:00:00.000Z" },
    ];
    const result = addRecentView(existing, entry("didsbury-m20"));
    expect(result).toHaveLength(2);
    expect(result[0]!.slug).toBe("didsbury-m20");
    expect(result[1]!.slug).toBe("chorlton-m21");
  });

  it("caps the list at 6 entries, dropping the oldest", () => {
    let list: RecentAreaEntry[] = [];
    for (let i = 0; i < 8; i++) {
      list = addRecentView(list, entry(`area-${i}`));
    }
    expect(list).toHaveLength(6);
    expect(list[0]!.slug).toBe("area-7");
    expect(list.some((e) => e.slug === "area-0")).toBe(false);
    expect(list.some((e) => e.slug === "area-1")).toBe(false);
  });

  it("stamps a real, parseable ISO viewedAt timestamp", () => {
    const result = addRecentView([], entry("didsbury-m20"));
    expect(() => new Date(result[0]!.viewedAt).toISOString()).not.toThrow();
  });
});
