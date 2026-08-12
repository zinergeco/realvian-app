/**
 * REALVIAN DATA INGESTION
 *
 * Fetches from UK open-data sources, normalises, and writes to Postgres.
 * Runs on the server (it needs outbound internet); never in the browser.
 *
 *   pnpm --filter @realvian/db ingest -- --source=postcodes --limit=500
 *   pnpm --filter @realvian/db ingest -- --source=crime
 *   pnpm --filter @realvian/db ingest -- --source=prices
 *   pnpm --filter @realvian/db ingest -- --source=all
 *
 * ── LEGAL POSITION (non-negotiable, see CLAUDE.md) ──
 * Every source below is either Open Government Licence v3 or an explicitly
 * public API. We do NOT scrape Rightmove, Zoopla, OnTheMarket or any other
 * portal: their listings are protected by copyright and database rights and
 * this has been litigated repeatedly in UK courts. If a future data need
 * seems to require scraping a portal, the answer is to license the data or
 * do without it.
 *
 * ── SOURCES ──
 * | Source                     | Licence  | Cadence   | What it gives us       |
 * |----------------------------|----------|-----------|------------------------|
 * | postcodes.io (ONS derived) | OGL v3   | Quarterly | Geography, LSOA, coords|
 * | HM Land Registry PPD       | OGL v3   | Monthly   | Sold prices            |
 * | data.police.uk             | OGL v3   | Monthly   | Street-level crime     |
 * | ONS earnings (ASHE)        | OGL v3   | Annual    | Median local earnings  |
 * | Overpass / OpenStreetMap   | ODbL     | On demand | Amenities, green space |
 */

import { setTimeout as sleep } from "node:timers/promises";

/* ══════════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════════ */
const UA = "Realvian/1.0 (+https://realvian.co.uk; data@realvian.co.uk)";

/** Be a good citizen: these are free public services funded by taxpayers. */
const RATE_LIMIT_MS = {
  postcodes: 120,
  police: 600,
  overpass: 2000, // Overpass is heavily shared — go slowly
  landRegistry: 1000,
} as const;

const MAX_RETRIES = 3;

/* ══════════════════════════════════════════════════════
   FETCH WITH RETRY + BACKOFF
   ══════════════════════════════════════════════════════ */
async function fetchJson<T>(
  url: string,
  opts: { retries?: number; timeoutMs?: number; body?: string } = {},
): Promise<T | null> {
  const { retries = MAX_RETRIES, timeoutMs = 30_000, body } = opts;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
          "User-Agent": UA,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        },
        body,
        signal: controller.signal,
      });
      globalThis.clearTimeout(timer);

      if (res.status === 404) return null; // legitimately absent, not an error
      if (res.status === 429 || res.status >= 500) {
        // Exponential backoff — respect the service
        const wait = Math.min(30_000, 2 ** attempt * 1000);
        console.warn(`  ${res.status} on ${short(url)} — retrying in ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        console.error(`  HTTP ${res.status} on ${short(url)}`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      globalThis.clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === retries) {
        console.error(`  Failed after ${retries} attempts: ${short(url)} — ${msg}`);
        return null;
      }
      await sleep(2 ** attempt * 1000);
    }
  }
  return null;
}

const short = (u: string) => (u.length > 78 ? u.slice(0, 75) + "…" : u);

/* ══════════════════════════════════════════════════════
   1. GEOGRAPHY — postcodes.io
   ══════════════════════════════════════════════════════ */
export interface OutcodeGeography {
  outcode: string;
  latitude: number | null;
  longitude: number | null;
  admin_district: string[];
  region: string[];
  country: string[];
}

export async function fetchOutcode(outcode: string): Promise<OutcodeGeography | null> {
  const res = await fetchJson<{ status: number; result: OutcodeGeography }>(
    `https://api.postcodes.io/outcodes/${encodeURIComponent(outcode)}`,
  );
  await sleep(RATE_LIMIT_MS.postcodes);
  return res?.result ?? null;
}

/** Full outcode list — the spine of the whole dataset (~3,000 UK outcodes) */
export async function fetchAllOutcodes(limit?: number): Promise<string[]> {
  // postcodes.io has no "list all outcodes" endpoint, so we enumerate
  // area prefixes and page through. Realistically this list is generated
  // once from the ONS Postcode Directory bulk file and cached.
  const AREAS = [
    "AB","AL","B","BA","BB","BD","BH","BL","BN","BR","BS","BT","CA","CB","CF","CH",
    "CM","CO","CR","CT","CV","CW","DA","DD","DE","DG","DH","DL","DN","DT","DY","E",
    "EC","EH","EN","EX","FK","FY","G","GL","GU","HA","HD","HG","HP","HR","HS","HU",
    "HX","IG","IP","IV","KA","KT","KW","KY","L","LA","LD","LE","LL","LN","LS","LU",
    "M","ME","MK","ML","N","NE","NG","NN","NP","NR","NW","OL","OX","PA","PE","PH",
    "PL","PO","PR","RG","RH","RM","S","SA","SE","SG","SK","SL","SM","SN","SO","SP",
    "SR","SS","ST","SW","SY","TA","TD","TF","TN","TQ","TR","TS","TW","UB","W","WA",
    "WC","WD","WF","WN","WR","WS","WV","YO","ZE",
  ];
  const out: string[] = [];
  for (const a of AREAS) {
    for (let n = 1; n <= 30; n++) {
      out.push(`${a}${n}`);
      if (limit && out.length >= limit) return out;
    }
  }
  return out;
}

/* ══════════════════════════════════════════════════════
   2. CRIME — data.police.uk
   ══════════════════════════════════════════════════════ */
interface PoliceCrime {
  category: string;
  month: string;
}

/**
 * Street-level crime within ~1 mile of a point for one month.
 * The API caps results at 10,000 per request; outcode-level areas are
 * well within that.
 */
export async function fetchCrimeCount(
  lat: number,
  lng: number,
  yearMonth: string, // "2026-06"
): Promise<number | null> {
  const url = `https://data.police.uk/api/crimes-at-location?date=${yearMonth}&lat=${lat}&lng=${lng}`;
  const res = await fetchJson<PoliceCrime[]>(url);
  await sleep(RATE_LIMIT_MS.police);
  return res ? res.length : null;
}

/**
 * Trailing-12-month crime rate per 1,000 residents.
 * Twelve API calls per area, so this is the slowest ingest — run it
 * monthly on a schedule, never on demand.
 */
export async function fetchCrimeRate(
  lat: number,
  lng: number,
  population: number,
  monthsBack = 12,
): Promise<number | null> {
  if (!population || population <= 0) return null;

  let total = 0;
  let monthsWithData = 0;
  const now = new Date();

  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = await fetchCrimeCount(lat, lng, ym);
    if (count !== null) {
      total += count;
      monthsWithData++;
    }
  }

  if (monthsWithData === 0) return null;
  // Annualise from however many months actually returned data
  const annualised = (total / monthsWithData) * 12;
  return Number(((annualised / population) * 1000).toFixed(1));
}

/* ══════════════════════════════════════════════════════
   3. AMENITIES & GREEN SPACE — OpenStreetMap via Overpass
   ══════════════════════════════════════════════════════ */
interface OverpassResponse {
  elements: { type: string; tags?: Record<string, string> }[];
}

export async function fetchAmenityCount(
  lat: number,
  lng: number,
  radiusM = 1000,
): Promise<number | null> {
  // Counts the amenity classes a resident actually cares about
  const query = `
    [out:json][timeout:60];
    (
      node["shop"](around:${radiusM},${lat},${lng});
      node["amenity"~"^(restaurant|cafe|pub|bar|pharmacy|doctors|dentist|bank|post_office|library|gym|fitness_centre)$"](around:${radiusM},${lat},${lng});
      node["leisure"~"^(sports_centre|fitness_centre|swimming_pool)$"](around:${radiusM},${lat},${lng});
    );
    out count;
  `.trim();

  const res = await fetchJson<OverpassResponse & { elements: { tags?: { total?: string } }[] }>(
    "https://overpass-api.de/api/interpreter",
    { body: `data=${encodeURIComponent(query)}`, timeoutMs: 90_000 },
  );
  await sleep(RATE_LIMIT_MS.overpass);

  const total = res?.elements?.[0]?.tags?.total;
  return total ? Number(total) : null;
}

export async function fetchGreenSpaceMetres(
  lat: number,
  lng: number,
  radiusM = 1500,
): Promise<number | null> {
  const query = `
    [out:json][timeout:60];
    (
      way["leisure"~"^(park|garden|nature_reserve|recreation_ground|common)$"](around:${radiusM},${lat},${lng});
    );
    out center 1;
  `.trim();

  const res = await fetchJson<{
    elements: { center?: { lat: number; lon: number } }[];
  }>("https://overpass-api.de/api/interpreter", {
    body: `data=${encodeURIComponent(query)}`,
    timeoutMs: 90_000,
  });
  await sleep(RATE_LIMIT_MS.overpass);

  const c = res?.elements?.[0]?.center;
  if (!c) return null;
  return Math.round(haversineMetres(lat, lng, c.lat, c.lon));
}

function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ══════════════════════════════════════════════════════
   4. TRANSPORT — nearest station via Overpass
   ══════════════════════════════════════════════════════ */
export async function fetchTransport(
  lat: number,
  lng: number,
): Promise<{ minsToStation: number | null; stops: number | null }> {
  const query = `
    [out:json][timeout:60];
    (
      node["railway"~"^(station|halt|tram_stop)$"](around:3000,${lat},${lng});
      node["highway"="bus_stop"](around:1000,${lat},${lng});
    );
    out center;
  `.trim();

  const res = await fetchJson<{
    elements: { lat?: number; lon?: number; tags?: Record<string, string> }[];
  }>("https://overpass-api.de/api/interpreter", {
    body: `data=${encodeURIComponent(query)}`,
    timeoutMs: 90_000,
  });
  await sleep(RATE_LIMIT_MS.overpass);

  if (!res?.elements?.length) return { minsToStation: null, stops: null };

  const stations = res.elements.filter(
    (e) => e.tags?.railway && e.lat != null && e.lon != null,
  );
  const stops = res.elements.filter((e) => e.tags?.highway === "bus_stop").length;

  let minsToStation: number | null = null;
  if (stations.length) {
    const nearest = Math.min(
      ...stations.map((s) => haversineMetres(lat, lng, s.lat!, s.lon!)),
    );
    // 80 m/min is the standard pedestrian planning assumption
    minsToStation = Math.round(nearest / 80);
  }

  return { minsToStation, stops: stops || null };
}

/* ══════════════════════════════════════════════════════
   5. SOLD PRICES — HM Land Registry SPARQL
   ══════════════════════════════════════════════════════ */
export async function fetchMedianPrice(
  outcode: string,
  monthsBack = 12,
): Promise<{ medianPrice: number | null; transactionCount: number }> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  const sinceStr = since.toISOString().slice(0, 10);

  // Land Registry publishes Price Paid Data as linked open data (OGL v3)
  const sparql = `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
    SELECT ?price WHERE {
      ?transx lrppi:pricePaid ?price ;
              lrppi:transactionDate ?date ;
              lrppi:propertyAddress ?addr .
      ?addr lrcommon:postcode ?pc .
      FILTER(STRSTARTS(?pc, "${outcode.toUpperCase()} "))
      FILTER(?date >= "${sinceStr}"^^<http://www.w3.org/2001/XMLSchema#date>)
    }
    LIMIT 2000
  `.trim();

  const res = await fetchJson<{
    results: { bindings: { price: { value: string } }[] };
  }>(
    `https://landregistry.data.gov.uk/landregistry/query?query=${encodeURIComponent(sparql)}`,
    { timeoutMs: 120_000 },
  );
  await sleep(RATE_LIMIT_MS.landRegistry);

  const prices = (res?.results?.bindings ?? [])
    .map((b) => Number(b.price.value))
    .filter((n) => Number.isFinite(n) && n > 1000)
    .sort((a, b) => a - b);

  if (prices.length < 5) {
    // Too few transactions for a defensible median
    return { medianPrice: null, transactionCount: prices.length };
  }

  const mid = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0 ? (prices[mid - 1]! + prices[mid]!) / 2 : prices[mid]!;

  return { medianPrice: Math.round(median), transactionCount: prices.length };
}

/* ══════════════════════════════════════════════════════
   ORCHESTRATION
   ══════════════════════════════════════════════════════ */
export interface IngestResult {
  outcode: string;
  ok: boolean;
  fields: Record<string, unknown>;
  errors: string[];
}

/**
 * Full ingest for one outcode. Every source is independently fault-tolerant:
 * one failing API must not lose the data the others returned.
 */
export async function ingestOutcode(
  outcode: string,
  opts: { withCrime?: boolean; withPrices?: boolean } = {},
): Promise<IngestResult> {
  const errors: string[] = [];
  const fields: Record<string, unknown> = {};

  const geo = await fetchOutcode(outcode);
  if (!geo?.latitude || !geo?.longitude) {
    return { outcode, ok: false, fields, errors: ["no geography"] };
  }

  fields.latitude = geo.latitude;
  fields.longitude = geo.longitude;
  fields.city = geo.admin_district?.[0] ?? null;
  fields.region = geo.region?.[0] ?? geo.country?.[0] ?? null;

  const lat = geo.latitude;
  const lng = geo.longitude;

  // Amenities, green space, transport — OSM, run sequentially to be polite
  const amenity = await fetchAmenityCount(lat, lng);
  if (amenity === null) errors.push("amenities");
  else fields.amenityCount = amenity;

  const green = await fetchGreenSpaceMetres(lat, lng);
  if (green === null) errors.push("greenSpace");
  else fields.metresToPark = green;

  const transport = await fetchTransport(lat, lng);
  if (transport.minsToStation === null) errors.push("transport");
  fields.minsToStation = transport.minsToStation;
  fields.transportStops = transport.stops;

  if (opts.withPrices) {
    const { medianPrice, transactionCount } = await fetchMedianPrice(outcode);
    if (medianPrice === null) errors.push(`prices (only ${transactionCount} txns)`);
    else {
      fields.medianPrice = medianPrice;
      fields.transactionCount = transactionCount;
    }
  }

  if (opts.withCrime) {
    // Population comes from the ONS bulk load; without it we cannot rate-adjust
    const population = (fields.population as number | undefined) ?? null;
    if (population) {
      const rate = await fetchCrimeRate(lat, lng, population);
      if (rate === null) errors.push("crime");
      else fields.crimePer1000 = rate;
    } else {
      errors.push("crime (no population)");
    }
  }

  return { outcode, ok: Object.keys(fields).length > 4, fields, errors };
}

/* ══════════════════════════════════════════════════════
   CLI
   ══════════════════════════════════════════════════════ */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const get = (k: string): string | undefined =>
    args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];

  const source = get("source") ?? "geography";
  const limit = Number(get("limit") ?? "10");
  const dryRun = args.includes("--dry-run");

  console.log(`\nRealvian ingest`);
  console.log(`  source : ${source}`);
  console.log(`  limit  : ${limit}`);
  console.log(`  dry-run: ${dryRun}\n`);

  const outcodes = (await fetchAllOutcodes(limit)).slice(0, limit);
  const results: IngestResult[] = [];

  for (const [i, oc] of outcodes.entries()) {
    process.stdout.write(`[${i + 1}/${outcodes.length}] ${oc} … `);
    const r = await ingestOutcode(oc, {
      withPrices: source === "prices" || source === "all",
      withCrime: source === "crime" || source === "all",
    });
    results.push(r);
    console.log(
      r.ok
        ? `ok (${Object.keys(r.fields).length} fields${r.errors.length ? `, ${r.errors.length} gaps` : ""})`
        : `skipped — ${r.errors.join(", ")}`,
    );
  }

  const ok = results.filter((r) => r.ok).length;
  console.log(`\nComplete: ${ok}/${results.length} outcodes ingested`);

  const gapCounts = new Map<string, number>();
  for (const r of results) {
    for (const e of r.errors) {
      const key = e.split(" ")[0]!;
      gapCounts.set(key, (gapCounts.get(key) ?? 0) + 1);
    }
  }
  if (gapCounts.size) {
    console.log("\nData gaps by source:");
    for (const [k, v] of [...gapCounts].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(18)} ${v}`);
    }
  }

  if (dryRun) {
    console.log("\nDry run — nothing written to the database.");
    console.log("Sample record:");
    console.log(JSON.stringify(results.find((r) => r.ok)?.fields ?? {}, null, 2));
  } else {
    console.log("\n⚠️  DB write not yet wired — run with --dry-run for now.");
    console.log("    Set DATABASE_URL and implement upsertArea() to persist.");
  }
}

// Only run when invoked directly, not when imported
if (process.argv[1]?.includes("ingest")) {
  main().catch((err) => {
    console.error("Ingest failed:", err);
    process.exit(1);
  });
}
