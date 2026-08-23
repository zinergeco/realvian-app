/**
 * Deliberately its own file, not part of lib/properties.ts.
 *
 * lib/properties.ts contains a db() function that dynamically imports
 * `postgres` — a Node-only package. A client component that imports
 * anything as a VALUE (not `import type`) from that file pulls the
 * whole module into the browser bundle and the build fails on missing
 * Node built-ins. This is the same bug already found and fixed once
 * this session for the watchlist feature — same fix here, applied
 * before it became a build failure rather than after.
 */

import { getAreaByOutcode, isLiveData } from "./areas";

export interface RentComparison {
  areaAvgRent: number;
  diffPct: number; // positive = above area average
  dataStatus: "live" | "illustrative";
}

export function compareRentToArea(
  outcode: string | null,
  currentRent: number | null,
): RentComparison | null {
  if (!outcode || currentRent === null || currentRent <= 0) return null;
  const area = getAreaByOutcode(outcode);
  if (!area || !area.avgRent) return null;

  const diffPct = ((currentRent - area.avgRent) / area.avgRent) * 100;
  return {
    areaAvgRent: area.avgRent,
    diffPct: Math.round(diffPct * 10) / 10,
    dataStatus: isLiveData(outcode) ? "live" : "illustrative",
  };
}
