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

export interface PortfolioRentPoint {
  nickname: string;
  diffPct: number;
  currentRent: number;
  areaAvgRent: number;
}

/**
 * Extracted as its own pure function, rather than left as inline page
 * logic, specifically so it can be unit tested with synthetic
 * property data — this feature has no way to be verified against a
 * real database from this environment (no DATABASE_URL locally), so
 * the data-transformation logic itself is what's actually testable
 * here; the live end-to-end flow needs verifying against the real
 * site once deployed.
 */
export function computePortfolioRentPoints(
  properties: { nickname: string; outcode: string | null; currentRent: number | null }[],
): PortfolioRentPoint[] {
  return properties
    .map((p) => {
      const comparison = compareRentToArea(p.outcode, p.currentRent);
      if (!comparison) return null;
      return {
        nickname: p.nickname,
        diffPct: comparison.diffPct,
        currentRent: p.currentRent!,
        areaAvgRent: comparison.areaAvgRent,
      };
    })
    .filter((p): p is PortfolioRentPoint => p !== null);
}
