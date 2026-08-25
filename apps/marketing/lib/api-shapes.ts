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

const CSV_COLUMNS: (keyof AreaSummaryResponse)[] = [
  "slug",
  "district",
  "city",
  "region",
  "outcode",
  "realvianScore",
  "investmentScore",
  "avgPrice",
  "avgRent",
  "grossYield",
  "fiveYearGrowth",
  "dataStatus",
];

function csvEscape(value: string | number): string {
  const s = String(value);
  // Only quote when necessary — a comma, quote, or newline inside the
  // value would otherwise break column alignment for a spreadsheet.
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Same data as the JSON endpoint, reshaped for a B2B/spreadsheet
 * audience that wants to open it directly in Excel or Sheets rather
 * than write code against JSON. */
export function areasToCsv(areas: AreaSummaryResponse[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = areas.map((a) => CSV_COLUMNS.map((col) => csvEscape(a[col])).join(","));
  return [header, ...rows].join("\r\n");
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

import { NextResponse } from "next/server";
import { validateApiKey } from "./api-keys";
import { checkRateLimit, rateLimitHeaders } from "./rate-limit";

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * Shared pagination for every list endpoint. One implementation means
 * one place to get the edge cases right — negative offsets, a limit
 * above the cap, a non-numeric query param — rather than each route
 * reinventing (and potentially mis-handling) the same logic.
 */
export function paginate<T>(
  items: T[],
  searchParams: URLSearchParams,
): { page: T[]; meta: PaginationMeta } {
  const rawLimit = Number(searchParams.get("limit"));
  const rawOffset = Number(searchParams.get("offset"));

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

  const page = items.slice(offset, offset + limit);

  return {
    page,
    meta: {
      limit,
      offset,
      total: items.length,
      hasMore: offset + limit < items.length,
    },
  };
}

/** CORS: deliberately public. This is read-only, non-personal data —
 * safe to allow any origin, unlike the account/admin surfaces. */
export const API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Call once at the top of every v1 route handler. Resolves the caller
 * (API key if supplied and valid, otherwise IP address), checks the
 * rate limit, and returns either the headers to attach to a normal
 * response or a ready-to-return 429. One implementation so every
 * route enforces this identically rather than seven near-copies
 * drifting apart over time.
 */
export async function enforceRateLimit(
  request: Request,
): Promise<{ ok: true; headers: Record<string, string> } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get("authorization");
  const suppliedKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  const hasApiKey = suppliedKey ? await validateApiKey(suppliedKey) : false;

  // x-forwarded-for can carry a comma-separated chain through
  // multiple proxies; the first entry is the original client.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const identifier = hasApiKey ? `key:${suppliedKey}` : `ip:${ip}`;

  const result = checkRateLimit(identifier, hasApiKey);
  const headers = { ...API_CORS_HEADERS, ...rateLimitHeaders(result) };

  if (!result.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "rate_limited",
          message: hasApiKey
            ? `Rate limit exceeded: ${result.limit} requests/minute for this API key.`
            : `Rate limit exceeded: ${result.limit} requests/minute for unauthenticated callers. Generate a free API key from your account for a higher limit.`,
        },
        { status: 429, headers: { ...headers, "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } },
      ),
    };
  }

  return { ok: true, headers };
}
