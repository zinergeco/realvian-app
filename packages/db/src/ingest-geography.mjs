/**
 * REALVIAN GEOGRAPHY INGEST — postcodes.io only
 *
 * ── WHY THIS EXISTS SEPARATELY FROM ingest-run.mjs ──
 *
 * The original ingest-run.mjs also queried OpenStreetMap Overpass for
 * amenities, green space and transport. Diagnosed on 2026-08-16: the
 * public Overpass API (both overpass-api.de and the kumi.systems mirror)
 * actively rejects or throttles requests from this server's IP —
 * confirmed via direct HTTP tests, not assumed:
 *
 *   overpass-api.de        → HTTP 406 (even with correct headers)
 *   overpass.kumi.systems  → HTTP 429 "include a meaningful User-Agent",
 *                             then HTTP 504 once one was added
 *
 * The free public Overpass API is built for occasional interactive
 * queries from OSM contributors, not automated production ingestion from
 * a datacenter IP. Building a pipeline on top of it was the wrong call;
 * this script narrows scope to the one source that has been verified
 * working twice: postcodes.io.
 *
 * WHAT THIS GIVES US: real ONS-derived coordinates, admin district and
 * region for every outcode — replacing invented lat/lng with real ones,
 * and letting `isLiveData()` on the area pages honestly say "yes" for
 * geography specifically.
 *
 * WHAT IT DOES NOT GIVE US: amenities, green space, transport, schools,
 * safety, price, rent, yield. Those dimensions stay on seed values.
 * `areas-live-data.ts`'s merge only overwrites fields this script
 * actually populates — see the LiveAreaOverride shape.
 *
 * NEXT SOURCE TO WIRE (not this script): a paid geodata API (Geoapify,
 * TravelTime) or a self-hosted Overpass instance for amenities/transport.
 */

const OUTCODES = [
  "M20","M21","M4","M33","M19","WA14",
  "LS6","LS7","LS8","LS2",
  "B15","B5","B17","B13","B14",
  "BS8","BS3","BS9","BS6",
  "SW11","E17","SE15","TW9","N8",
  "EH3","EH6","EH4","EH15",
  "G3","G12","G41",
  "NE2","NE6","NE7",
  "L17","CF11","CF5","KY16",
];

const UA = "Realvian/1.0 (+https://realvian.co.uk; data@realvian.co.uk)";
const sl = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOutcode(oc) {
  for (let a = 1; a <= 3; a++) {
    try {
      const r = await fetch(`https://api.postcodes.io/outcodes/${oc}`, {
        headers: { "User-Agent": UA },
      });
      if (r.status === 404) return null;
      if (!r.ok) { await sl(a * 1000); continue; }
      const j = await r.json();
      return j?.result ?? null;
    } catch {
      if (a === 3) return null;
      await sl(a * 1000);
    }
  }
  return null;
}

const q = (s) => (s === null || s === undefined ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");

async function main() {
  const results = [];
  console.error(`\nGeography ingest — ${OUTCODES.length} outcodes\n`);

  for (const oc of OUTCODES) {
    const g = await fetchOutcode(oc);
    await sl(120); // postcodes.io has no documented hard limit; be a good citizen anyway
    if (!g?.latitude) {
      console.error(`${oc.padEnd(6)} FAILED — no geography returned`);
      continue;
    }
    const city = g.admin_district?.[0] ?? null;
    const region = g.region?.[0] ?? g.country?.[0] ?? null;
    results.push({ oc, lat: g.latitude, lng: g.longitude, city, region });
    console.error(`${oc.padEnd(6)} ${(city ?? "?").padEnd(18)} ${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`);
  }

  console.error(`\n${results.length}/${OUTCODES.length} succeeded\n`);

  if (!results.length) {
    console.error("Nothing fetched — aborting without writing SQL.");
    process.exit(1);
  }

  console.log("BEGIN;");
  for (const r of results) {
    console.log(
      `INSERT INTO areas (outcode, district, city, region, slug, centroid, ` +
      `scoring_version, score_confidence, last_refreshed_at) ` +
      `VALUES (${q(r.oc)}, ${q(r.oc)}, ${q(r.city)}, ${q(r.region)}, ` +
      `${q(`${(r.city || "uk").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${r.oc.toLowerCase()}`)}, ` +
      `ST_GeogFromText('POINT(${r.lng} ${r.lat})'), 'geo-only-1.0', 0.0, now()) ` +
      `ON CONFLICT (outcode) DO UPDATE SET ` +
      `city = EXCLUDED.city, region = EXCLUDED.region, centroid = EXCLUDED.centroid, ` +
      `last_refreshed_at = now();`
    );
  }
  console.log("COMMIT;");
}

main().catch((e) => { console.error("Ingest failed:", e); process.exit(1); });
