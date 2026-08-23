/**
 * PUBLIC API — response shaping
 *
 * Kept separate from lib/areas.ts so the public API's response shape can
 * evolve independently of the internal Area type used by the site's own
 * pages — a field rename inside the app shouldn't silently become a
 * breaking API change for external consumers, and vice versa.
 */

import { type Area, isLiveData, hasLiveGeography } from "./areas";
import type { BlogPost } from "./blog";

export type DataStatus = "dimensions-live" | "geography-live" | "illustrative";

function dataStatusFor(outcode: string): DataStatus {
  if (isLiveData(outcode)) return "dimensions-live";
  if (hasLiveGeography(outcode)) return "geography-live";
  return "illustrative";
}

export interface AreaSummaryResponse {
  slug: string;
  district: string;
  city: string;
  region: string;
  outcode: string;
  realvianScore: number;
  investmentScore: number;
  avgPrice: number;
  avgRent: number;
  grossYield: number;
  fiveYearGrowth: number;
  dataStatus: DataStatus;
}

export interface AreaDetailResponse extends AreaSummaryResponse {
  lat: number;
  lng: number;
  timeOnMarket: number;
  dimensions: { key: string; label: string; value: number; detail: string }[];
  summary: string;
  highlights: string[];
  watchouts: string[];
  lastRefreshedAt: string;
}

export function toAreaSummary(area: Area): AreaSummaryResponse {
  return {
    slug: area.slug,
    district: area.district,
    city: area.city,
    region: area.region,
    outcode: area.outcode,
    realvianScore: area.realvianScore,
    investmentScore: area.investmentScore,
    avgPrice: area.avgPrice,
    avgRent: area.avgRent,
    grossYield: area.grossYield,
    fiveYearGrowth: area.fiveYearGrowth,
    dataStatus: dataStatusFor(area.outcode),
  };
}

export function toAreaDetail(area: Area): AreaDetailResponse {
  return {
    ...toAreaSummary(area),
    lat: area.lat,
    lng: area.lng,
    timeOnMarket: area.timeOnMarket,
    dimensions: area.dimensions,
    summary: area.summary,
    highlights: area.highlights,
    watchouts: area.watchouts,
    lastRefreshedAt: area.lastRefreshedAt,
  };
}

export interface PostSummaryResponse {
  slug: string;
  kind: string;
  title: string;
  description: string;
  excerpt: string;
  dataDate: string;
  readMinutes: number;
  tags: string[];
  areaSlugs: string[];
}

export function toPostSummary(post: BlogPost): PostSummaryResponse {
  return {
    slug: post.slug,
    kind: post.kind,
    title: post.title,
    description: post.description,
    excerpt: post.excerpt,
    dataDate: post.dataDate,
    readMinutes: post.readMinutes,
    tags: post.tags,
    areaSlugs: post.areaSlugs,
  };
}

/** CORS: deliberately public. This is read-only, non-personal data —
 * safe to allow any origin, unlike the account/admin surfaces. */
export const API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
