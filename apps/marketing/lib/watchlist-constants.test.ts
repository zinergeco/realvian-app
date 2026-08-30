import { describe, it, expect } from "vitest";
import { groupByStatus, WATCHLIST_STATUSES } from "./watchlist-constants";

interface TestItem {
  id: string;
  status: (typeof WATCHLIST_STATUSES)[number];
}

describe("groupByStatus", () => {
  it("groups items into the correct status buckets", () => {
    const items: TestItem[] = [
      { id: "a", status: "researching" },
      { id: "b", status: "offer_made" },
      { id: "c", status: "researching" },
    ];
    const groups = groupByStatus(items);
    expect(groups.researching.map((i) => i.id)).toEqual(["a", "c"]);
    expect(groups.offer_made.map((i) => i.id)).toEqual(["b"]);
  });

  it("includes every real status as a key, even with zero items in it", () => {
    // A genuinely useful property for a Kanban board specifically —
    // an empty column still needs to render (with a 0 count and an
    // empty state), not silently disappear because no item happened
    // to be in that status.
    const groups = groupByStatus<TestItem>([]);
    expect(Object.keys(groups).sort()).toEqual([...WATCHLIST_STATUSES].sort());
    for (const status of WATCHLIST_STATUSES) {
      expect(groups[status]).toEqual([]);
    }
  });

  it("preserves the original relative order of items within each column", () => {
    const items: TestItem[] = [
      { id: "first", status: "viewed" },
      { id: "second", status: "viewed" },
      { id: "third", status: "viewed" },
    ];
    const groups = groupByStatus(items);
    expect(groups.viewed.map((i) => i.id)).toEqual(["first", "second", "third"]);
  });

  it("never drops or duplicates an item — total count across all groups equals the input length", () => {
    const items: TestItem[] = WATCHLIST_STATUSES.flatMap((status, i) =>
      Array.from({ length: i + 1 }, (_, j) => ({ id: `${status}-${j}`, status })),
    );
    const groups = groupByStatus(items);
    const total = Object.values(groups).reduce((sum, g) => sum + g.length, 0);
    expect(total).toBe(items.length);
  });
});
